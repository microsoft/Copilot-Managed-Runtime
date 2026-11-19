# Development Standards

Standards that apply to all Copilot Managed Runtime skills.

## Theme

- Default to dark theme (`backgroundColor: '#1e1e1e'`, `color: '#fff'`).
- User can override theme preference.

## Node.js

- **Node.js 24.11.0+ is required** by the CMR package engine baseline. The CLI warns on unsupported versions; do not treat a successful version probe as proof of compatibility.
- Check with `node --version` before starting.
- If the user has multiple versions, suggest `nvm use 24` and verify the selected patch is at least 24.11.0. Honor any stricter installed package requirement.

## CMR package baseline

The published GA baseline is **1.0.0** for `@microsoft/cmr-cli`,
`@microsoft/cmr-apps`, `@microsoft/cmr-apps-common` and
`@microsoft/cmr-apps-vite-plugin` (verified against the public npm registry on
2026-11-16). These are CMR package versions, not Rayfin package versions.
The CLI's Fabric scaffold uses compatible Rayfin `^2.0.0` app dependencies.

Skills state their required versions where used. Check the installed version and
the configured registry before changing dependencies; do not assume an old
`@latest` result meets a skill's minimum. If the registry cannot resolve the
required release, report the mismatch and stop the affected workflow rather than
silently using an older release. Keep the CLI global and let the scaffold/SDK
resolve `cmr-apps-common`; do not add it directly unless app code imports it.
Do not downgrade newer compatible versions.

## CLI Install

- **Install `@microsoft/cmr-cli` globally**, never manually per-workspace, so the `ms` binary is on PATH. Preserve the project-local CLI pin that `ms app create` / `ms app init` writes automatically; it is not a request for a second manual installation.
- Install command:
  ```bash
  npm install -g @microsoft/cmr-cli@latest
  ```
- Install from the public npm registry once the renamed CLI package is available: https://www.npmjs.com/package/@microsoft/cmr-cli
- Pin to the `@latest` tag.
- After install, probe the binary name (`ms` (single supported binary)).

### CLI freshness gate

Run this gate once per top-level workflow, before its first operational `ms` command. The `ms --version` probe is part of the gate:

1. Read the installed version with `ms --version`.
2. Read the latest stable version with `npm view @microsoft/cmr-cli@latest version`.
3. Compare the versions using semver rules. Do not treat an installed version newer than `@latest` as outdated.
4. If `@latest` is newer, tell the user both versions and ask: _"`@microsoft/cmr-cli` {installed} is installed, but {latest} is available. Update the global CLI before proceeding?"_ Wait for the answer.
   - If approved, run `npm install -g @microsoft/cmr-cli@latest`, then verify `ms --version` reports the expected version before continuing.
   - If declined, acknowledge the choice and continue with the installed version for the rest of the workflow.
5. If the registry lookup fails, report that the latest version could not be checked and continue with the installed CLI. Do not silently claim it is current.

Record the gate outcome in workflow context (`current`, `updated`, `declined`, or `unavailable`) together with the installed and latest versions when known. Forward that context to every nested skill. A nested skill that receives an outcome must reuse it and skip both the registry check and upgrade prompt. A separately invoked skill starts a new top-level workflow and runs the gate again.

The upgrade prompt satisfies the global-install confirmation requirement; do not ask for a second confirmation.

## Build & Deploy

- **Default loop is `ms app dev`**, not deploy. Apps on Copilot Managed Runtime run locally against the App Player with hot reload; deploy only when the user asks.
- When the user does want to ship:
  - Local-built (primary): `npm run build`, then `git add -A && git commit && git push`, then `ms app deploy`.
  - Cloud-built: `git add -A && git commit && git push`, then `ms app deploy [--commit <sha>]`.
- **Always** run `npm run build` before `ms app deploy` — never skip the build.
- **Always** deploy from a pushed commit — never deploy uncommitted or unpushed local changes.
- Verify the build output directory (`./dist` by default, or whatever `--build-path` resolves to) is populated before deploy.
- When adding multiple data sources: do NOT push after each one. Run `npm run build` to verify, then deploy once at the end (or skip and rely on local dev).

## TypeScript

- The template uses strict mode — unused imports cause build failures (TS6133).
- Remove any imports you don't use before building.
- Don't edit generated codegen output in `generated/` (the layout is owned by `@microsoft/apps-actions`).