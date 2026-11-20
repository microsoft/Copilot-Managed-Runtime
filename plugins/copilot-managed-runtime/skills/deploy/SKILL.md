---
name: deploy
description: Ships a Microsoft App to the cloud via `ms app deploy`. Use when the user asks to deploy; standalone build/status commands are only for explicit requests or diagnostics.
allowed-tools: Read Edit Write Grep Glob Bash AskUserQuestion Skill
---

**📋 Shared Instructions: [shared-instructions.md](../../shared/shared-instructions.md)** — Cross-cutting concerns. **Always confirm before deploy.**

# Deploy

Builds and deploys the app in the current directory.

Before any deploy, sync source control first: stage all changes, create a commit, and push to remote.

## Workflow

1. Memory Bank → 2. Verify Project + Env → 3. Use Default Deploy Flow → 4. Shared Connection Policy Preflight → 5. Build Verification → 6. Git Sync (Add + Commit + Push) → 7. Confirm + Deploy → 8. Update Memory Bank

---

### Step 1: Check Memory Bank

Read `memory-bank.md` for app slug, GUID, and environment.

### Step 2: Verify Project + Env

Locate the existing app root first. If it has application code but no CMR
configuration, invoke [/init-app](../init-app/SKILL.md) to onboard it with native
Git, forwarding the original deployment request. Resume this workflow after
onboarding and verification; the deployment confirmation below still applies.
Do not use `ms app create` to replace existing code or delete an existing config
to rerun init. If another CMR config layout exists, verify CLI support rather
than registering a duplicate app.

```bash
test -f ms.config.json || { echo "Not in a Microsoft App workspace."; exit 1; }
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || { echo "Not in a git repository."; exit 1; }
BIN=ms
$BIN auth status                                         # must report the expected UPN
```

If auth is stale or the wrong account, stop and have the user run `$BIN auth login`.

### Step 3: Use the Default Deploy Flow

Default to `ms app deploy`, which builds and deploys the pushed commit. Do not ask the user to
choose between standard and traced deployment. Run standalone `ms app build` or
`ms app build-status` only when explicitly requested or needed for diagnostics; they are not
prerequisites for normal deployment. The local build verification in Step 5 still applies.

### Step 4: Shared Connection Policy Preflight

`ms app deploy` validates that every **shared** connection reference declares `allowedActions`,
and fails the deploy when one doesn't. Catch it here — before spending a build and a push on a
deploy that can't succeed.

```bash
node -e '
const fs = require("fs");
const refs = JSON.parse(fs.readFileSync("ms.config.json", "utf8")).connectionReferences || {};
const ok = (a) => Array.isArray(a) && a.length > 0 &&
  a.every((x) => typeof x === "string" && /\S/.test(x));
let bad = 0;
for (const [name, r] of Object.entries(refs)) {
  if (!String(r.sharedConnectionId || "").trim()) continue;
  const t = Object.entries(r.dataSets || {}).flatMap(([d, s]) =>
    Object.entries(s.dataSources || {}).map(([k, v]) => [d + "/" + k, v]));
  if (r.allowedActions !== undefined && !ok(r.allowedActions)) {
    bad++;
    console.log("INVALID connector-level allowedActions: " + name);
  }
  if (t.length) {
    for (const [p, v] of t) if (!ok(v.allowedActions)) { bad++; console.log("MISSING per-table allowedActions: " + name + " -> " + p); }
  } else if (r.allowedActions === undefined) { bad++; console.log("MISSING connector-level allowedActions: " + name); }
}
if (bad) { console.log(bad + " issue(s): fix before deploy"); process.exitCode = 1; } else console.log("OK: all shared references declare allowedActions");
'
```

This mirrors the CLI's own validation and works in bash and PowerShell alike (Node 24.11.0+ is a
project prerequisite; `jq` is not).

Any `MISSING` or `INVALID` line means the deploy will fail. **Stop and fix it** rather than proceeding:

- `per-table` → the reference has dataset tables. Every table needs its own non-empty list
  from `"get"` / `"post"` / `"patch"` / `"delete"`.
- `connector-level` → no dataset tables. Declare Action IDs from
  `ms connector list-actions --connector <api-id> --json`.

Infer the least-privilege set from what `src/` actually calls, propose it, and confirm with the
user before writing. Do **not** grant everything to get past the gate, and do **not** delete
`sharedConnectionId`. See [allowed-actions.md](../../shared/allowed-actions.md).

`OK` means every shared reference is covered — continue.

### Step 5: Build Verification

```bash
npm run build
```

Failure handling per [shared-instructions.md](../../shared/shared-instructions.md):

- TS6133 (unused import): remove and retry once.
- Other TS errors: report file:line, STOP.
- Module not found: `npm install` and retry once.
- Other non-zero exit: report verbatim, STOP.

Verify the build output directory (`./dist` by default, or the app's configured `buildPath`) is populated before continuing.

### Step 6: Git Sync (Add + Commit + Push)

Deploy must use a pushed commit. Always sync local changes first.

```bash
if [ -n "$(git status --porcelain)" ]; then
	git add -A
	git commit -m "$COMMIT_MESSAGE"
fi

# Ensure the deployment commit exists on remote.
git push -u origin HEAD
DEPLOY_SHA="$(git rev-parse HEAD)"
```

If there are local changes, ask for a commit message before running `git commit`. If the user does not provide one, use:

```text
chore: prepare deploy
```

If `git commit` reports "nothing to commit", continue to push/verify the current `HEAD`.

### Step 7: Confirm + Deploy

**Always ask explicitly before deploy** — there is no baseline-deploy exemption in this plugin:

> "Ready to deploy `<app-name>` to `<environment-name>` (`<env-id>`)? This will update the live app."

Wait for explicit user yes.

Only for explicit requests or diagnostics, run the relevant standalone command before
deployment:

```bash
$BIN app build --commit "$DEPLOY_SHA"
$BIN app build-status --commit "$DEPLOY_SHA"
```

`ms app build` waits for a terminal build status by default; `ms app build-status` checks the
status for the specified commit. Neither command deploys the app or replaces the deployment
confirmation above. Surface failures and do not proceed to deploy a failed build.

Deploy the pushed commit:

```bash
$BIN app deploy --commit "$DEPLOY_SHA"
```

Capture and surface URLs and any build/deployment identifiers reported by the CLI.

After a successful deploy, return the live URL as a markdown link without asking whether to
open it. If the deploy output does not include the live URL, obtain it with
`$BIN app play --no-browser`. Run `$BIN app play` to open the browser only when the user
requested it or automatic opening is the host's established behavior. Otherwise, do not
launch the browser or add a follow-up question.

Before verifying published changes, follow the
[live app refresh guidance](../../shared/shared-instructions.md#live-app-refresh-after-redeployment);
the browser may initially display a cached version.

If the user wants to verify the code before making it live, remind them they can preview without deploying:

```bash
$BIN app play --mode preview   # opens the latest code on main (no deploy needed)
```

### Step 8: Update Memory Bank

If `memory-bank.md` exists:

- Update "Last deployed" timestamp.
- Record any standalone build/status commands used for an explicit request or diagnostics.
- Capture the commit SHA at deploy time.

If no memory bank exists, create one per [memory-bank.md](../../shared/memory-bank.md) so subsequent skills have context.

---

## Failure Recovery

| Error                                                  | Fix                                                                                                                                       |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `ms app deploy`: 401 / token expired                     | `$BIN auth login` and retry.                                                                                                              |
| `ms app deploy`: `Invalid ms.config.json for shared connection policy enforcement` | A shared connection reference is missing `allowedActions`. The listed issues name the reference (and dataset/table) at fault. Declare them per [allowed-actions.md](../../shared/allowed-actions.md) and retry. Never remove `sharedConnectionId` to bypass this. |
| `ms app deploy`: env mismatch                            | Active CLI env doesn't match `ms.config.json`. Either re-create/redeploy against the matching environment, or update `ms.config.json`. |
| `git push`: no upstream configured                      | Run `git push -u origin HEAD`, then retry deploy.                                                                                         |
| `git commit`: author identity unknown                   | Configure Git identity (`git config --global user.name` / `git config --global user.email`) and retry commit.                            |
| `ms app deploy`: commit not in remote                  | Ensure Step 6 (Git Sync) completed and push succeeded, then retry.                                                                        |
| `ms app build-status`: 404                             | Build was submitted to a different cluster than you're querying. Verify the `--cloud` value matches the cluster used at build time.    |
| `ms app deploy`: 403 / not authorized on environment     | The account lacks Maker permissions in the target env. Confirm with `$BIN app list --json` — if the app doesn't appear, you're not authorized. |
