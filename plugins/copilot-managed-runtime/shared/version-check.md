# Version Check

**Run this check at the start of every skill execution, but at most once per day.**

## Instructions

### Step 1: Check if a version check is needed

Look for the file `~/.copilot-managed-runtime-last-version-check`. Read it if it exists.

- If the file exists and contains today's date (YYYY-MM-DD format), **skip the entire check** and continue with the skill silently.
- If the file does not exist, or the date is older than today, proceed to Step 2.

### Step 2: Read the local version

Read [the canonical plugin manifest](../plugin.json) and extract the `version` field.
Resolve this path relative to this instruction file, not the user's project.

### Step 3: Fetch the latest version from the marketplace

Fetch the remote marketplace manifest:
```
https://raw.githubusercontent.com/microsoft/Copilot-Managed-Runtime/main/.claude-plugin/marketplace.json
```
Use the `WebFetch` tool with the prompt: "Return only the version string for the plugin whose name is 'copilot-managed-runtime'."

### Step 4: Compare versions

Compare the local version against the remote version using semver rules — split on `.`, compare major, then minor, then patch as integers.

### Step 5: Display result

**If a newer version is available**, print this banner **before any other output**:

```
╔══════════════════════════════════════════════════════════════╗
║  UPDATE AVAILABLE: v{local} → v{remote}                      ║
║  Run your CLI's plugin update command for copilot-managed-runtime ║
╚══════════════════════════════════════════════════════════════╝
```

**If versions match or the local version is newer**, print nothing.

### Step 6: Update the timestamp

Write today's date (YYYY-MM-DD) to `~/.copilot-managed-runtime-last-version-check` so subsequent skill runs today skip the check.

## Error Handling

If anything in Steps 2-4 fails (network error, file not found, malformed JSON), skip the check silently and continue with the skill. **Never block skill execution over a version check failure.**

## Diagnostic Version Comparison

For `/troubleshoot`, bypass the once-daily skip and perform a fresh comparison.
Do not update the daily timestamp or install anything as part of diagnosis.

1. Preserve the installed version from the canonical manifest and any available
   session-loaded/app-generation provenance before recommending changes. Mark
   unavailable historical versions unknown; the current manifest does not prove
   what an earlier session loaded.
2. Fetch the marketplace above. If a newer version exists, inspect the relevant
   changed workflow/reference at an identifiable published commit/release and
   compare it with the actual failing action and local instructions.
3. Record the source/revision, affected/fixed versions if verified, and why the
   change applies. A higher version or an unrelated public-doc change is not
   evidence of a fix. Do not promise an update resolves the issue without it.
4. Explain any observed installed-versus-loaded mismatch. Recommend the host's
   supported update/reload/new-session procedure with approval; do not restart,
   update dependencies or claim a successful reload automatically.
5. If comparison fails, state which evidence is unavailable and continue with
   local diagnosis. Unlike the routine daily check, diagnostic failures must be
   visible and recorded; never report "up to date" after a failed fetch.
