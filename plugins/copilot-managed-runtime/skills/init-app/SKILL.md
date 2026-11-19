---
name: init-app
description: Initializes an existing app on Copilot Managed Runtime using `ms app init` and native Git. Use when bringing existing code, a cloned sample or an exported app to the platform, including first-time deployment when ms.config.json is missing.
allowed-tools: Read Edit Write Grep Glob Bash AskUserQuestion EnterPlanMode ExitPlanMode Skill
---

**📋 Shared Instructions: [shared-instructions.md](../../shared/shared-instructions.md)** — Cross-cutting concerns.

**References:**

- [prerequisites-reference.md](../create-app/references/prerequisites-reference.md) — Node, Git and CLI installation.
- [troubleshooting.md](../create-app/references/troubleshooting.md) — First-run Git Credential Manager recovery.

# Initialize a Microsoft App

**Package baseline:** this workflow targets `@microsoft/cmr-cli` **1.0.0** and the CMR
**1.0.0** app package baseline. Backend apps also require `@microsoft/cmr-apps`
**1.0.0** or later. See [CMR package baseline](../../shared/development-standards.md#cmr-package-baseline);
verify installed versions before continuing if registry tags lag behind the release.
This is the package baseline, not the version that introduced `init`.

This skill registers an existing web app without scaffolding over its source.
The default outcome is a **running local dev server**, not a deployed cloud app.
Deploying is a separate, explicit user choice via `/deploy`.

## Workflow

1. Memory Bank → 2. Prerequisites → 3. Inspect App → 4. Plan → 5. Auth → 6. Environment → 7. Initialize → 8. Verify Integration → 9. Local Dev → 10. Summary → 11. Memory Bank Update

### Step 1: Check Memory Bank

Check for `memory-bank.md` per [shared-instructions.md](../../shared/shared-instructions.md).
Use the known project path or discover the existing app root. If CMR configuration
already exists, resume `/dev` or `/deploy` as requested; do not delete configuration
or rerun init. Inspect unfamiliar config layouts before creating another registration.
Use `/create-app` only when the user wants a new app from a template.

### Step 2: Validate Prerequisites

Run prerequisite checks **first**, following the shared
[prerequisites reference](../create-app/references/prerequisites-reference.md).
Node.js **24.11.0+**, Git **2.27.0+** and Git Credential Manager are required.

```bash
node --version
git --version
ms --version
```

If Node or Git is missing or unsupported, report the requirement and STOP.
If `ms` is missing, ask before installing `npm install -g @microsoft/cmr-cli@latest`,
then re-probe it. Otherwise run the shared
[CLI freshness gate](../../shared/development-standards.md#cli-freshness-gate);
reuse a calling skill's outcome rather than checking or prompting again.
Let the CLI's native-flow preflight validate GCM installation and configured
helpers: it supports both `manager` and `manager-core`. Do not reject an
installation based on a single `git credential-manager --version` probe.

### Step 3: Inspect the App

Infer the display name and build settings from existing source, `package.json`,
lockfiles and framework configuration. Preserve the UI, scripts, package manager
and business logic. Inspect Git root, branch, status and remotes, including hidden
entries. Ask only when the app root or a required setting remains ambiguous.
For an app inside a parent repository or linked worktree, agree on a standalone
copy before init rather than nesting repositories or changing shared remotes.

Confirm the app produces browser-hostable assets. SSR/server-dependent apps need
an agreed adaptation; init does not convert them. For Power Apps or another
platform's SDK/configuration, identify the necessary migration and connector
bindings instead of assuming registration migrates them.

### Step 4: Plan

Follow the [planning policy](../../shared/planning-policy.md). Present one plan:
existing app root/name, build command/output/HTML entry point, local dev URL,
native Git setup, necessary integration changes, build verification and local dev.
Include a `/deploy` handoff only if requested. Do not redesign the app.

Native platform-managed Git is the recommended path. When no `origin` is detected,
plain `ms app init` selects native. With an existing `origin`, omission follows
remote detection and accepts that remote in non-interactive mode. Obtain approval
to preserve the old remote under an unused name and use `--repo native` for this
native-rebinding case. Never discard an existing URL or change branches silently.
If native onboarding is not approved, clarify rather than choosing another mode.

### Step 5: Auth

```bash
ms auth status
```

Use auth status as the source of truth. If signed out, run `ms auth login`.
Ask before switching a signed-in account; otherwise continue.

### Step 6: Environment

Run `ms app init` with no environment flags and let the CLI resolve the environment
automatically. Pass `--environment-id <id>` only when explicitly provided by the
user; never infer one from a memory bank or another app. Surface routing errors
rather than attempting an environment workaround.

### Step 7: Initialize

From the **existing app root**, run with the inspected values, quoted for the
active shell. Do not create a child/sibling template or substitute `ms app create`.

```bash
ms app init --display-name "<name>" --non-interactive --build-command "<build-command>" --build-path "<output-directory>" --build-entry-point "<entry-html>" --local-app-url "<local-dev-url>"
```

For approved native rebinding, first preserve the old remote as agreed and append
`--repo native`. Otherwise omit `--repo` when no `origin` is detected.
The HTML entry point is relative to the output directory.

Read `ms.config.json` back and verify app/environment IDs, `repoType: "native"`,
repository ID and build/dev settings. Verify actual Git root, branch, `origin`
and preserved source remote: init can warn about Git setup failure after creating
the app. Preserve its automatic CLI pin in `package.json`.

If registration succeeded but local setup failed, keep the app/config and repair
only that setup using the returned native remote. Do not rerun init or create a
duplicate app. For first-run Git authentication failure, use `git fetch origin`
per the shared troubleshooting reference, then retry the failed Git operation.
Record the app identity and setup results in the memory bank.

### Step 8: Verify Integration

Init does not rewrite SDK imports, configure Vite, add connectors or migrate
connection references. Make only the approved compatibility changes. For Vite
runtime integration, follow installed `@microsoft/cmr-apps-vite-plugin` docs and
use `copilotManagedRuntime()` alongside existing plugins; do not force a framework
rewrite. Add the SDK only when app features require it.

Use matching `/add-*` skills for required data sources and `/add-backend` only
when explicitly requested. Forward approved identifiers, project root and CLI
freshness outcome. Preserve migrated bindings, resolve shared-connection policies
before cloud preview/deploy, and complete backend startup prerequisites.

### Step 9: Build and Start Local Dev

Restore dependencies with the existing package manager after init's manifest
change. Run the existing build and verify the configured output/HTML entry point;
fix or report failures before starting local dev.

Invoke `/dev` with the app root and CLI freshness outcome; verify the existing app
loads and required interactions work. If called from `/dev`, return that context
so the caller starts it once. If called from `/deploy`, return after verification
instead of invoking deploy recursively.

### Step 10: Summary

Report app name/GUID, project path, verified local App Player URL and blockers.
State that **nothing has been deployed to the cloud**. Follow the shared
Ready-to-Ship Gate when the user signals readiness, or resume `/deploy` for an
explicit deployment request, retaining its confirmation. Do not claim completion
while Git setup, build or runtime verification is blocked.

### Step 11: Update Memory Bank

Create/update `memory-bank.md` per the shared template. Record app identity,
CLI-resolved environment, native and preserved source remotes, branch, build/dev
settings, integration changes and actual verification results.
