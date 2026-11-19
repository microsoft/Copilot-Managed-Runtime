---
name: init-app
description: Onboards an existing web app to Copilot Managed Runtime with `ms app init` and a platform-managed native Git repository. Use when bringing existing code, a cloned sample, or an exported app to the platform, including first-time deployment when ms.config.json is missing. Does not scaffold a new app.
allowed-tools: Read Edit Write Grep Glob Bash AskUserQuestion EnterPlanMode ExitPlanMode Skill
---

**Shared Instructions: [shared-instructions.md](../../shared/shared-instructions.md)** - Cross-cutting concerns.

# Initialize an Existing App

**Minimum CLI version:** `@microsoft/cmr-cli` **1.0.0**, which supports
`ms app init --repo native` and the build/local URL flags used here.
That release requires **Node.js 24.11.0+** and **Git 2.27.0+**, plus Git Credential
Manager for native Git authentication. If runtime integration is needed, use
`@microsoft/cmr-apps` and `@microsoft/cmr-apps-vite-plugin` **1.0.0** or later;
see the [CMR package baseline](../../shared/development-standards.md#cmr-package-baseline).

Use this skill for **existing application code**, not a new template. Register it
in place with `ms app init --repo native`, preserving its UI, source, framework,
and build tooling. Native Git is the recommended onboarding path in this plugin.
Do not use `ms app create` as a workaround: it scaffolds a template rather than
onboarding existing code.

The default outcome is a registered app verified in local development, **not a
cloud deployment**. If the original request includes deployment, continue to
`/deploy` only after onboarding and local verification, retaining its explicit
deployment confirmation.

## Workflow

1. Inspect project -> 2. Prerequisites and auth -> 3. Approve onboarding plan ->
4. Initialize -> 5. Verify integration -> 6. Local dev or deploy handoff

### 1. Inspect the Existing Project

Locate the app root from the user's path or the current workspace, including
hidden files. Read `memory-bank.md` if present. Inspect `package.json`, lockfiles,
build/dev scripts, framework configuration, output directory, HTML entry point,
and any existing CMR or Power Apps configuration. Ask for the root only when
multiple app candidates remain ambiguous.

- If `ms.config.json` already exists, read it and resume `/dev` or `/deploy` as
  requested. Do **not** delete it or rerun init to repair a failed build or Git
  setup. If configuration is incomplete, report the specific problem.
- If another CMR config layout is present, inspect the installed CLI's support
  before proceeding; do not create a second app registration alongside it.
- If there is no existing app and the user wants a new one, use `/create-app`.
- If `power.config.json` or a different platform SDK is present, treat conversion
  as migration, not just registration. Include the required SDK, Vite integration,
  connector and configuration changes in the plan; do not delete the old config
  or assume init migrates its bindings.
- Verify that the app can produce browser-hostable assets. SSR-only apps or apps
  requiring an arbitrary server backend need an agreed adaptation first; do not
  promise that init converts them or silently replace their architecture.

Inspect Git status, repository root, current branch and remotes. If the app is
inside a parent repository or a linked worktree, agree on a standalone copy
before initializing; do not create a nested repository or change shared remotes.
Preserve uncommitted changes and Git history.

### 2. Validate Prerequisites and Auth

```bash
node --version
git --version
git credential-manager --version
ms --version
```

Enforce the minimum versions above and any stricter installed CLI engine
requirement. If Node, Git or GCM is missing or incompatible, report the required
tool and stop. If `ms` is missing, ask for approval before installing
`npm install -g @microsoft/cmr-cli@latest`, then verify its version.

Run the [CLI freshness gate](../../shared/development-standards.md#cli-freshness-gate)
once, or reuse its outcome from the calling skill. If the installed CLI remains
below the minimum, stop rather than substituting `create`. Do not manually add a
project-local CLI dependency or use `npx ms`.

```bash
ms auth status
ms app init --help
```

Use auth status as the source of truth. If signed out, run `ms auth login`; ask
before switching an existing signed-in account. Verify the installed command
supports the planned flags.

### 3. Approve the Onboarding Plan

Follow the [planning policy](../../shared/planning-policy.md). Infer the display
name and build settings from the existing app and the request, rather than asking
the user to repeat discoverable information. The plan must include:

- The existing app root and the application behavior to preserve.
- The new app registration and **native platform-managed Git repository**.
- Build command, output directory, HTML entry point and local development URL,
  derived from the app's actual scripts/configuration, not assumed Vite defaults.
- Any necessary runtime integration or migration, dependency installation,
  local build, and the `/dev` handoff (or `/deploy` for an explicit deploy request).

**Explain Git changes before running init.** `--repo native` deliberately skips
existing-remote detection and configures the platform repository as `origin`.
If `origin` already exists, obtain explicit approval to preserve it under an
unused remote name (for example, `source`) before init replaces it. Do not silently
discard the old URL, overwrite another remote, or change the user's branch.
If the user does not approve native Git onboarding, stop and clarify the desired
workflow rather than choosing another repository mode automatically.

Let the CLI resolve the environment. Pass `--environment-id` only when explicitly
provided by the user; never infer one from a memory bank or another app.

### 4. Initialize in the App Root

After approval, preserve any existing `origin` as agreed, then run in the
**existing app root**, not a new child directory:

```bash
ms app init --display-name "<existing-app-name>" --repo native --non-interactive --build-command "<existing-build-command>" --build-path "<existing-output-directory>" --build-entry-point "<entry-html>" --local-app-url "<existing-local-dev-url>"
```

Replace placeholders with the inspected values and quote them for the active
shell. The build entry point is relative to the build output directory.
Append `--environment-id <id>` only for a user-provided ID. Do not pass a template
or scaffold replacement source files.

Init creates the app record and writes `ms.config.json`; it also pins the CLI in
`package.json` for build-based projects and configures native Git credentials and
the remote. The CLI-managed pin is expected: preserve it rather than adding a
second CLI dependency manually.

Read `ms.config.json` back. Verify `appId`, `environmentId`, `repoType: "native"`,
`repositoryId`, and the agreed build/local URL settings. Check the actual Git
root, branch and `origin`; do not infer successful Git setup solely from a zero
exit code, because init can warn about a local Git setup failure after creating
the app.

If registration succeeded but local setup failed, keep the app and config.
Surface the warning and repair only that setup against the returned native
remote; do not rerun init, delete the config, or create a second app. If the first
Git authentication fails, use the existing
[GCM recovery guidance](../create-app/references/troubleshooting.md#first-run-git-credential-manager-trap)
(`git fetch origin`) and retry the failed Git operation, not app registration.
Surface environment-routing errors instead of guessing another environment.

Create or update `memory-bank.md` with the app identity, CLI-resolved environment,
native remote, preserved source remote, current branch, build settings and any
remaining setup issues.

### 5. Verify Existing-App Integration

Registration is **not** application migration: init does not rewrite SDK imports,
configure Vite, add connectors, migrate connection references or implement a
backend. Make only the approved compatibility changes:

- Preserve existing scripts, lockfiles, styling, routes and business logic. Ensure
  the app has a working `build` script and, for `/dev`, a `dev` script. Reuse its
  package manager and existing build command; do not replace them with a template.
- For a Vite app needing CMR runtime integration, follow the installed
  `@microsoft/cmr-apps-vite-plugin` documentation and use `copilotManagedRuntime()`
  alongside existing plugins. Add the SDK only when required by app features.
  Do not force a non-Vite app into Vite just to initialize it.
- For required external data, use the matching `/add-*` skill and generated
  services. Pass the app root, approved identifiers and CLI freshness outcome;
  preserve existing bindings and verify migrated calls. Apply shared-connection
  `allowedActions` before any cloud preview or deploy.
- For an explicitly requested Fabric/Rayfin backend, use `/add-backend` and
  complete its startup prerequisites before starting local development.

Install/restore dependencies using the project's package manager after init's
manifest change. Run the existing build and verify that the configured output
directory contains the configured HTML entry point. Surface failures; do not
claim the app is ready or deploy while integration/build work remains incomplete.

### 6. Continue the Requested Workflow

Update the memory bank with actual results and any unresolved issues. If called
from `/dev`, return the app root, build results and CLI freshness outcome so that
caller can start local development once and verify the existing app.

Otherwise invoke `/dev` with that context for local App Player verification.
Check that the existing app loads and its required interactions still work; a
successful registration alone does not prove runtime compatibility. If called
from `/deploy`, return to the paused deploy workflow after verification rather
than invoking `/deploy` recursively.

For a standalone invocation with an explicit deployment request, hand off to `/deploy` after verification,
forwarding the app identity, native Git setup, build settings and original intent.
It must sync the native repository and obtain its explicit deployment confirmation.
Otherwise keep the default local loop and follow the shared Ready-to-Ship Gate
only when the user signals readiness.

Report the app identity, existing project path, verified local App Player URL,
and any blockers. State clearly when nothing has been deployed. Do not label
onboarding complete if Git setup, build, or runtime verification is still blocked.
