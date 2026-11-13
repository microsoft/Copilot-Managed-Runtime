---
name: add-backend
description: Add a Fabric backend (preview) with `ms app add backend --provider fabric`. Covers database entities and client integration using the Rayfin runtime. Use only when the user explicitly requests a database, /add-backend, Fabric, or Rayfin.
---

**Shared instructions: [shared-instructions.md](../../shared/shared-instructions.md)**

# Add a Fabric app backend (preview)

**Minimum versions:** backend scaffolding and packing require `@microsoft/cmr-cli`
**0.32.3**; `@microsoft/cmr-apps` (SDK) **0.6.5** supports `initializeRayfin()`
without the removed backend-availability precheck. The Fabric provider spelling
additionally requires a CLI build containing
[bic/PowerPlatform-Managed-Host#2237](https://microsoft.ghe.com/bic/PowerPlatform-Managed-Host/pull/2237);
the CLI must also support the `fabric` feature key. The baseline CLI minimum alone
does not establish either capability. Verify them below rather than assuming an
unreleased version number.

**Required first:** pass the [Fabric feature gate](../../shared/shared-instructions.md#fabric-feature-gate).

## 1. Set up the database

Before scaffolding, run `ms app add backend --help` and confirm that it lists
`fabric` as the supported provider with a preview label. If not, report the CLI
compatibility gap and stop; do not fall back to the old provider spelling.

If `rayfin/rayfin.yml` exists, use the existing configuration. Otherwise, run:

```bash
ms app add backend --provider fabric --json
```

This creates the backend configuration, TypeScript configuration and `rayfin/data/`.
Keep the existing app layout and exclude `rayfin/.temp/` from version control.

This prepares the app's backend definitions; it does not provision a database.
Fabric is the app backend, not an existing database to select or connect to.
The CLI provider and feature key are `fabric`, but this does not rename `rayfin/`, `rayfin.yml`,
`@microsoft/rayfin-*` packages or `initializeRayfin()`. Do not migrate those contracts.

## 2. Install dependencies

Run from the app root before continuing so the declared dependencies and their
version-matched docs are available in `node_modules`:

```bash
npm install
```

Use the app's existing package manager and lockfile if it does not use npm.
Report installation or peer-dependency errors; do not force-install or downgrade
the app to bypass them. Add missing direct dependencies only as required by the
implementation described in the references.

## 3. Implement and check the app

Read the installed package docs identified in these references, then follow them
in order:

- [Data modeling](./references/rayfin-data-modeling.md): entities, permissions and required [Copilot Managed Runtime host initialization](./references/rayfin-data-modeling.md#step-4-initialize-through-copilot-managed-runtime).
- [CRUD UI](./references/rayfin-crud-ui.md): lists, forms, mutations and persistence checks.

When invoked from `/create-app`, complete data modeling in Step 9 and return the
entity/client paths; that workflow handles UI implementation and checks in
Steps 10-11. Standalone use continues through both references.

## 4. Follow the app lifecycle

**Wait until Rayfin configuration is set up before starting the dev server.**
Complete scaffolding, dependency installation and entity/client implementation,
and verify `rayfin/rayfin.yml` exists before running `ms app dev` or starting
Vite separately. Do not start a server in parallel with backend setup. If setup is
still running, wait for it; if it fails or configuration is missing, report the
error and finish setup before continuing. Apply this prerequisite when returning
to `/create-app` or `/dev` as well.

Use the normal [app build and deploy workflow](../../shared/development-standards.md#build--deploy),
not a separate Rayfin provisioning workflow. Local configuration readiness is
not proof of cloud provisioning; let `ms app dev` / `ms app deploy` handle their
normal backend provisioning and report actual failures.