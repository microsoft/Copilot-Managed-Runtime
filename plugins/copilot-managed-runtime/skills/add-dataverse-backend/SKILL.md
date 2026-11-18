---
name: add-dataverse-backend
description: Configure Dataverse MCP for development-time table and column metadata CRUD, then use /add-dataverse and ms app add data-source for connector-backed app data access. Use when the user explicitly requests creating or changing a Dataverse schema, not just binding existing tables.
---

**Shared instructions: [shared-instructions.md](../../shared/shared-instructions.md)**

# Add a Dataverse app backend

**Minimum versions:** `@microsoft/cmr-cli` **1.0.0** and
`@microsoft/cmr-apps` **1.0.0** for the connector-backed app, following the
[CMR package baseline](../../shared/development-standards.md#cmr-package-baseline).
Check the installed CLI's `ms app add data-source --help` and
`ms app refresh data-source --help` before using their flags. An unavailable
release or command is a compatibility gap, not permission to invent a command.

This is an agent workflow, **not** a new CLI backend provider.
Do not run `ms app add backend --provider dataverse`.
The Fabric feature gate and Rayfin packages do not apply to this workflow.

| Phase | Access path |
| --- | --- |
| Development-time schema inspection and changes | Authenticated Dataverse MCP server |
| App record reads, creates, updates and deletes | Existing Dataverse connector and generated services |

Never put MCP credentials, developer tokens, direct Dataverse Web API calls or
an MCP client in browser app code. Configuring MCP does not grant app users
Dataverse privileges or establish a runtime connection.

For existing tables with no schema changes, use
[/add-dataverse](../add-dataverse/SKILL.md) instead.

## 1. Resolve the app's Dataverse environment

Read `ms.config.json` and the memory bank, if present. Require an existing app;
otherwise return to `/create-app` first. Run the shared CLI freshness gate once,
then `ms auth status`. Do not change the app's `environmentId`.

Follow [environment discovery and MCP setup](./references/mcp-setup.md).
Match the app's `environmentId` to authoritative discovery results, including
the tenant and cloud. Do not select the active PAC profile, a previous MCP
registration or the first accessible organization merely because it exists.
A connector-only reference can have empty `dataSets`; no table binding is
required to discover the organization.

**One environment for metadata and records:** the MCP organization must resolve
to the app's configured `environmentId`, and the CLI-written Dataverse binding
must persist that same target in `ms.config.json`. Follow the
[environment lock checks](./references/mcp-setup.md#persist-and-check-the-environment-lock).
An existing MCP registration for another environment is a conflict, not a new
source of truth. Stop and ask to align MCP with this app or use an app configured
for the intended environment. Never hand-edit `environmentId` to make the check
pass; changing a local ID does not move the registered app.
Stop on missing Dataverse, conflicting targets, inaccessible discovery or an
ambiguous match. Do not provision a database or guess a URL.

## 2. Configure and verify development-time MCP

Use the host-specific configuration in the
[setup reference](./references/mcp-setup.md). Reuse an equivalent registration;
preserve unrelated servers and ask before replacing a conflicting entry.
Prefer project scope. Global installs, user-scoped configuration and other
writes outside the app require approval under the shared safety rules.

Check client enablement read-only, then authenticate in the actual MCP host,
initialize the server, inspect its live tools and perform a harmless metadata
read. A saved config, successful sign-in, allow-list row or validation of a
different client's identity is not proof of working MCP access.
Check the host's effective loaded server, including configuration overrides,
against the environment lock; inspecting only the file just written is insufficient.

Do not enable clients, grant admin consent, modify environment settings or
install another plugin's entire toolchain automatically. A 401/403 or policy
denial is a blocker to report, not a reason to bypass MCP through another API.
If the host needs reload/restart or user sign-in, pause and resume this step;
do not claim its tools are already callable.

## 3. Agree and apply the metadata plan

Recheck the environment lock before every metadata mutation, including after
a reload, sign-in or config change. Validate any existing affected table
bindings before changing their schema. A new table may not have a binding yet,
but its MCP target must still match the app's configured environment.

Before any mutation, show the target organization and proposed tables,
columns, types, required fields, relationships, publisher prefix and solution
expectations. Obtain approval for that scope. A publisher prefix is permanent;
it does not itself select a solution. If a specific solution is required and
the exposed MCP tools cannot select or associate it, stop and explain the
limitation before creating components. Do not claim unverified membership.

Inspect the **live input schemas** before calling tools. The
[Dataverse MCP tool catalog](https://learn.microsoft.com/en-us/power-apps/maker/data-platform/data-platform-mcp#list-of-tools)
documents these operations, but the connected server determines availability:

| Intent | MCP operation and required checks |
| --- | --- |
| Read metadata | `search` to discover schemas, then `describe` for the selected table, for example `tables/account`. Do not read business records for a schema check. |
| Create a table | Check for an existing matching table, then `create_table` with the approved columns and the tool's current schema. |
| Add/change/remove columns or other supported table metadata | Describe first, compare with the approved plan, then `update_table` only if its live schema supports the requested change. |
| Delete a table | Describe dependencies and data-loss impact, obtain explicit confirmation identifying the target, then `delete_table`. |

Column deletion, narrowing types and required-field changes can also destroy
data or break consumers: obtain specific impact approval, not just the initial
"add a backend" request. Never delete or recreate a table to implement an
unsupported update. Stop and report unsupported operations; do not silently
switch to SDK scripts, raw Web API, `invoke_api` or record CRUD tools.

Execute dependent metadata changes sequentially. After each change, describe
the schema again and compare it with the approved result. On a timeout or
uncertain response, **reconcile by reading metadata before retrying**:
`create_table` is not idempotent. Allow bounded read retries for propagation;
do not blindly repeat mutations.

Capture the actual table logical name, entity-set name and column logical
names returned by metadata. Do not derive them from display names, pluralize
them yourself or assume the publisher prefix was applied exactly as requested.
Report partial completion and remaining changes explicitly.

## 4. Bind the schema for app data access

After metadata verification, invoke
[/add-dataverse](../add-dataverse/SKILL.md), which delegates to the canonical
[/add-data-source](../add-data-source/SKILL.md) workflow. Pass:

- `api-id=shared_commondataserviceforapps`;
- `mode=table` and the verified table logical names for a fixed schema;
- the caller's connection selection and
  `dataverse-environment-id=<environmentId from ms.config.json>`, explicitly
  fixing the binding to the same environment used by MCP.

The resulting CLI command for each fixed table is:

```bash
ms app add data-source --connector shared_commondataserviceforapps --as table --table "<actual-logical-name>" --dataverse-environment-id "<app-environment-id>"
```

Do not pass `--dataset`. Use a fixed table binding for this environment-locked
backend. An action-only reference with a runtime-selected organization does not
establish that lock; the generic `/add-dataverse` action workflow remains
available separately, without this same-environment guarantee.

Read `ms.config.json` back after binding and after every refresh. Verify the
selected reference's persisted environment/table metadata and effective dataset
URL using the environment lock checks. Stop on a missing or mismatched binding;
do not report app data access as configured or repair generated config by hand.

For an existing binding affected by schema edits, run
`ms app refresh data-source --help`, select the affected reference using its
documented options, and regenerate before changing app calls. Do not edit
generated output by hand. Report refresh failures or stale metadata instead
of claiming the TypeScript services reflect the new schema.

Use the generated signatures for record CRUD. Check required operations and
policy with `ms connector list-actions --connector shared_commondataserviceforapps --json`.
Do not use the older connector or MCP record tools to evade a blocked action.
Preserve the canonical workflow's connection validation and least-privilege
[shared `allowedActions`](../../shared/allowed-actions.md) checks.

## 5. Verify and hand back

Run the app's normal build. Verify the requested UI/data behavior using the
generated services; live writes need an approved test-data scope.
Development-time MCP success does not prove runtime connector permissions.
Recheck the effective configuration before `/dev` and again before handoff.
Use `/dev` for local iteration, not an automatic deploy. Once the app is running,
perform a minimal read through the selected generated service as the intended app user
or approved connection identity. Verify access to the locked environment
separately from MCP; never grant permissions or substitute a different identity
to make the check pass.

Report the shared environment ID, matching MCP organization URL and persisted
Dataverse binding paths in `ms.config.json`, MCP scope and actual verification,
schema changes, logical names, generated service paths and remaining blockers.
If `memory-bank.md` exists, record these non-secret facts and pending shared
connection policy. Never store tokens. Distinguish configuration saved,
MCP verified, schema changed and app data access verified.
