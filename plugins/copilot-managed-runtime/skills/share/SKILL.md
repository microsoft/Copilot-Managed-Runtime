---
name: share
description: Shares (or unshares) a Microsoft App with users via `ms app share` / `ms app unshare`. Use when updating app access control.
allowed-tools: Read Grep Glob Bash AskUserQuestion
---

**📋 Shared Instructions: [shared-instructions.md](../../shared/shared-instructions.md)** — Cross-cutting concerns. **Always confirm before share/unshare.**

# Share / Unshare

Adds or removes user access to the app in the current directory. The CLI resolves emails via Microsoft Graph; entries that don't resolve are returned as warnings (the RP call still succeeds for the resolved entries).

## Workflow

1. Memory Bank → 2. Verify Project + Env → 3. Infer Mode → 4. Resolve Recipients → 5. Confirm Once → 6. Run → 7. Surface Partial-Success Envelope

---

### Step 1: Check Memory Bank

Read `memory-bank.md` for app slug, GUID, and environment.

### Step 2: Verify Project + Env

```bash
test -f ms.config.json || { echo "Not in a Microsoft App workspace."; exit 1; }
BIN=ms
$BIN auth status                                         # must report the expected UPN
```

### Step 3: Infer Mode

Infer **share** (add access) or **unshare** (remove access) from the user's request or
caller-provided context. Use share for an unqualified `/share` invocation. Do not ask the user
to choose a mode when their intent is clear. Ask only when the request contains contradictory
instructions about adding versus removing access; never guess in that case.

### Step 4: Resolve Recipients

Reuse emails or object IDs already supplied in the request or caller-provided context.
Ask once for recipients only when they are missing or ambiguous, and ask only about unresolved
entries rather than making the user retype the known list.

Accept a comma-separated recipient list. Validate basic email shape (`user@domain`) before
passing through; don't try to resolve identities yourself — `ms` handles Graph resolution and
will return warnings for unresolved entries.

If the user passes Object GUIDs (already-resolved principals), pass them through as-is — the CLI accepts both forms.

### Step 5: Confirm Once

Show the selected operation, app, complete recipient list and exact command in one approval.
Use wording that matches the operation:

> "About to **share** `<app-name>` with: `alice@contoso.com, bob@contoso.com`. Confirm?"

Or:

> "About to **remove access** to `<app-name>` for: `alice@contoso.com, bob@contoso.com`. Confirm?"

Wait for explicit yes. Never auto-proceed — ACL changes affect production users. Confirm the
whole list once, not each recipient separately. Do not ask again if this exact operation,
app and recipient list were already explicitly approved in the current workflow. If any of
them changes, obtain a new approval for the changed scope.

### Step 6: Run

**Share:**

```bash
$BIN app share "alice@contoso.com,bob@contoso.com"
```

**Unshare:**

```bash
$BIN app unshare "alice@contoso.com,bob@contoso.com"
```

The command reads the app ID from `ms.config.json`.

### Step 7: Surface Partial-Success Envelope

The CLI returns a JSON envelope with `partialFailure: boolean` and `warnings: []`. When `partialFailure: true`:

- The RP call succeeded — share state is updated for resolved users.
- Warnings list the unresolved entries (typo'd email, account doesn't exist in the tenant, Graph couldn't find them, etc.).

Print warnings verbatim, identify the recipients whose access was successfully added or
removed, and list the unresolved entries. Use wording that matches share or unshare.
If a retry is wanted, ask directly for corrected emails or object IDs instead of first
asking a yes/no retry question:

```
Share completed with warnings:
  - 'bob@contso.com' could not be resolved (Graph returned 404).
  - 'charlie@partner.com' is not a member of this tenant.

Share state updated for: alice@contoso.com (1 of 3 resolved).

If you'd like to retry, provide corrected emails or object IDs for the 2 unresolved entries.
```

When the user supplies corrections, return to Step 4 with only the corrected entries,
preserving the operation and app. Confirm that corrected retry list once in Step 5 before
running it; do not include recipients that already succeeded. Do not retry automatically
or ask an additional preliminary retry question — typos and tenant-membership issues need
human resolution.

---

## Edge Cases

| Situation                                                       | Action                                                                                                         |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| User passes a single email                                       | Run as-is; the envelope still applies (just with one entry).                                                   |
| User passes a mix of emails and Object GUIDs                     | Pass through as one comma-separated list — the CLI accepts both.                                               |
| `ms app share` returns non-zero (not a partial-failure envelope) | A hard error (auth, env, app-not-found). Surface verbatim and STOP. Do not retry.                              |
| User says "share with everyone"                                  | Explain that named-recipient sharing requires an explicit email/object-ID list and ask for it. Mention `/share-link` as a different, tenant-wide redemption model when appropriate, but never silently create a link or substitute broader access. |
