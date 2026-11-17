# Data modeling

Reference for [/add-backend](../SKILL.md).

## Read the docs first

Rayfin's data rules belong to the installed packages. Read decorators, permissions, query APIs and
platform constraints from disk. Paths are relative to the app root.
Complete the entry skill's `npm install` step first.
This workflow requires `@microsoft/cmr-apps` **1.0.0** or later and the CLI's
Rayfin **`^2.0.0`** app dependency baseline.

For each underlying Rayfin package, read `node_modules/@microsoft/<package>/package.json`, follow
`rayfinDocs.dir`, and start with `index.md`. Then read only the relevant pages.
The paths below are documentation entry points, not a version-independent API
contract. Use the installed package's declared docs directory if it differs.

| Topic | Installed documentation |
| --- | --- |
| Copilot Managed Runtime initialization and authentication | `node_modules/@microsoft/cmr-apps/package.json`: follow the `./rayfin` export to its declarations. |
| Entities, fields and relationships | `node_modules/@microsoft/rayfin-core/assets/docs/decorators.md` |
| Permissions, owner stamping and authentication shorthands | `node_modules/@microsoft/rayfin-core/assets/docs/permissions.md` |
| Paging, cursors and text-field nullability | `node_modules/@microsoft/rayfin-data/assets/docs/index.md` |
| Client data operations | `node_modules/@microsoft/rayfin-client/assets/docs/index.md` |
| Session contract | `node_modules/@microsoft/rayfin-auth/assets/docs/index.md` |

If `@microsoft/rayfin-guide` is already installed, also use these walkthroughs:

| Topic | Installed documentation |
| --- | --- |
| Entity authoring and relationships | `node_modules/@microsoft/rayfin-guide/assets/docs/data/overview.md` |
| Policies, claims and field visibility | `node_modules/@microsoft/rayfin-guide/assets/docs/data/permissions.md` |
| Queries, mutations and relationship writes | `node_modules/@microsoft/rayfin-guide/assets/docs/data/graphql.md` |
| Platform constraints | `node_modules/@microsoft/rayfin-guide/assets/docs/known-limitations.md` |

Read `known-limitations.md` before designing entities when available.

Some client/auth indexes are stubs. Follow the installed package's `types` or
`exports` entry to its declarations for missing API signatures. If the installed
docs and declarations do not establish the required behavior, report the gap
rather than guessing. Do not install the Rayfin CLI or guide just to read docs.

## Step 1: Reuse the backend scaffold

Reuse `rayfin/rayfin.yml` and the installed dependencies from Steps 1-2 of
[/add-backend](../SKILL.md). If setup is missing, complete only those steps.
Keep the existing managed app layout, authentication and transport boundary.

Declare `@microsoft/rayfin-core` directly when entity code imports it.
Preserve the scaffolded SDK dependencies. Match direct Rayfin dependencies to the
installed packages' compatible ranges and peer requirements, and rerun the app's
package-manager install after changing its manifest. The CLI 1.0.0 scaffold adds
`rayfin-client`, `rayfin-auth`, `rayfin-auth-provider-fabric` and `rayfin-core` in
the `@microsoft` scope with `^2.0.0` ranges. Add any service-owning package used by
app code (such as `@microsoft/rayfin-data`) as a direct compatible dependency.
Do not force all packages to an identical resolved version or mix preserved 1.x
dependencies with the Rayfin 2 helper; report and resolve compatibility gaps first.

## Step 2: Write entity files

Write one named exported entity class per file in `rayfin/data/`, following the
installed decorator, permissions and platform-limit docs. Re-export nested
entities from a top-level file.

Keep the scaffold's NodeNext build wiring and `.js` extensions for backend
imports. Read field options, relationship syntax and constraints from the docs
above rather than copying a fixed set of SDK rules.

## Step 3: Map entities into the client schema

App packaging discovers the named entity exports; no runtime registry is required.
Maintain a type map for the entities used by the client, for example:

```typescript
// rayfin/data/schema.ts
import type { Todo } from './Todo.js';

export type AppSchema = {
  Todo: Todo;
};
```

Include relationship and join entities used by the app. Browser code must use
`import type` for backend definitions.

## Step 4: Initialize through Copilot Managed Runtime

Use `initializeRayfin({ services: { ... } })` from `@microsoft/cmr-apps/rayfin`,
following the installed **1.0.0 or later** adapter docs and declarations.
Register the required service factories from their owning Rayfin 2 packages in
`services`; pass `AppSchema` to the data service factory as its installed
declarations require, not as the generic argument to `initializeRayfin`.
Read the installed `@microsoft/rayfin-data` docs for the factory name and signature;
do not reuse a Rayfin 1.x client example. Calling the helper without services
creates an auth-only client, not a data client.

The helper selects `browserSession` from `@microsoft/rayfin-auth` and installs the
host-brokered token through `@microsoft/rayfin-auth-provider-fabric`.
Reuse the resulting client
for data operations and authentication; do not use standalone Rayfin configuration
or a separate Fabric sign-in flow.

Verify initialization in the App Player before diagnosing backend availability.
Report actual errors; missing local configuration is not evidence that the
backend is absent. If the installed SDK lacks the adapter, report the compatibility
gap rather than substituting standalone initialization.

Continue with [CRUD UI](./rayfin-crud-ui.md) for lists, forms and UI state.

## Notes

Use the shared [app build and deploy workflow](../../../shared/development-standards.md#build--deploy).
