# Discover the organization and configure Dataverse MCP

These are **development-time** authenticated discovery/administration calls,
not requests to run in the hosted browser app. App data access remains
connector-backed. This workflow does not require Agency or the Dataverse
Python SDK.

## Resolve an authoritative target

1. Read the app's `environmentId` and `cloud` from `ms.config.json`. Treat
   memory-bank URLs and Dataverse connection-reference `dataSets` keys as hints
   only: an API URL is not necessarily the organization's MCP URL.
2. Verify the Managed Runtime account with `ms auth status`. Use an existing
   authenticated discovery client, such as PAC or Azure CLI, only after
   checking its account and tenant (`pac auth list` / `pac org who`, or
   `az account show`). Different tools have independent sign-ins. If the
   intended account/tenant cannot be established, ask rather than assuming.
3. Use the documented
   [Dataverse Global Discovery service](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/discovery-service)
   for that cloud. The commercial-cloud read is:

   ```http
   GET https://globaldisco.crm.dynamics.com/api/discovery/v2.0/Instances?$select=EnvironmentId,TenantId,Id,FriendlyName,Url,ApiUrl,State
   Authorization: Bearer <discovery-audience-token>
   Accept: application/json
   ```

   Acquire the token with the existing client's OAuth flow for the discovery
   resource. With an already authenticated Azure CLI, capture
   `az account get-access-token --resource https://globaldisco.crm.dynamics.com/ --output json`
   **inside a local process variable**, check its exit status, and use the
   `accessToken` only in the request header. Never run token acquisition as a
   standalone command whose output is printed, put tokens in command arguments
   or persist them in project files. Use the cloud-specific resource/endpoint
   from the discovery documentation; do not substitute the commercial cloud
   for government, China, test or preproduction environments.
4. Follow any returned pagination links only within the authenticated
   discovery origin, never forwarding a bearer token to another host.
   Match `EnvironmentId` exactly to `ms.config.json.environmentId` (GUID casing
   is immaterial), `TenantId` to the verified tenant and require an enabled
   organization (`State = 0`). Do not match by display name or organization `Id`.
5. Require one unambiguous organization and retain both `Url` (organization
   URL) and `ApiUrl` (Web API URL). The MCP endpoint is the authoritative
   organization `Url`, without a trailing slash, plus `/api/mcp`.
   Preserve the returned hostname: do not remove or add `.api` heuristically.

If an existing MCP registration or an affected table binding identifies another
organization, stop before metadata changes and surface the mismatch. Align
the selected MCP server/binding with the app's configured environment through
the supported workflows, with approval for replacing existing configuration.
Do not overwrite unrelated connections or re-target the registered app by
editing its local environment ID.

No match is not proof that the app needs a new environment: discovery can
omit inaccessible organizations and delegated-admin access. Explain whether
discovery failed, access was denied or no linked Dataverse organization was
found. An administrator can supply authoritative environment details, but
verify that their environment ID, tenant and URL agree before continuing.
Never provision Dataverse or choose another environment as a fallback.

## Persist and check the environment lock

The app and MCP configuration must describe **one authoritative environment**.
Keep that environment in the supported fields of `ms.config.json`, not only in
MCP settings, the memory bank or session variables:

| Location | Required agreement |
| --- | --- |
| `ms.config.json.environmentId` | Equals the discovered organization `EnvironmentId`; tenant and cloud also match the verified target. |
| Effective MCP registration | Its organization URL and `/api/mcp` endpoint map to that same discovery result. |
| Selected `connectionReferences` entry | Uses `shared_commondataserviceforapps`; the CLI-written table binding targets that same environment and the intended logical table. |

Use the existing
[configuration schema](https://github.com/microsoft/Copilot-Managed-Runtime/blob/main/schemas/ms.config.schema.json)
and the CLI to persist bindings. Do not invent top-level `orgUrl`, `mcpUrl` or
environment properties, or manually add binding fields to pretend a connection
was created.

After adding or refreshing each affected table, require at least one verifiable
fixed binding and check every representation of that table in the actual config:

- A `dataverseTables` entry's `environmentId`
  must equal the app's `environmentId`; verify `logicalName` and, when present,
  `entitySetName` against the schema read through MCP.
- A `dataSets` mapping's dataset URL must identify the
  discovered organization's `ApiUrl`, and the table mapping must match the
  verified logical/entity-set names. Organization and API hostnames can differ;
  compare their authoritative discovery association, not raw hostname equality.
- When both forms are present, both must agree. Resolve active stage/overlay
  values and `datasetOverride.environmentVariableName` before comparison.
  An override selecting another organization or an unresolved target is a
  blocker even when the base JSON appears correct.

A new table does not need an existing binding for discovery/creation, but the
workflow is incomplete until its CLI-written fixed binding is present and
verified. An action-only reference with empty `dataSets` and a runtime-supplied
organization URL is not persisted proof of this invariant. Do not silently use
that action to read from another environment.

Repeat these checks before metadata mutations, after bind/refresh, on resuming
the workflow and before app verification. If the config, active server or
identity changes, discard the previous check and revalidate. Report the two
targets and the required correction on a mismatch; do not continue on a warning.
Leave unrelated bindings untouched.

## Check enablement without changing permissions

For native GitHub Copilot HTTP access, the documented client application ID is
`aebc6443-996d-45c2-90f0-388ff96faa56` (Microsoft GitHub Copilot).
This is not the Managed Runtime CLI's authentication client ID.

With an existing authorized developer identity and a Dataverse-audience token,
read the selected organization's Web API:

```http
GET <ApiUrl>/api/data/v9.2/allowedmcpclients?$select=name,applicationid,isenabled,statecode&$filter=applicationid eq 'aebc6443-996d-45c2-90f0-388ff96faa56'
Authorization: Bearer <dataverse-audience-token>
Accept: application/json
```

An unambiguous matching row must have `isenabled = true` and `statecode = 0`.
No matching row, disabled/inactive rows, denied reads or a failed request are
not an enabled result. Do not reuse the discovery token for this audience.
If permission to inspect the allow-list is unavailable, report the unknown
status and request administrator confirmation; do not infer "disabled".

The environment MCP setting, client allow-list, tenant consent and user
metadata privileges are separate requirements. Follow the
[administrator setup guide](https://learn.microsoft.com/en-us/power-apps/maker/data-platform/data-platform-mcp-disable)
for remediation by an authorized administrator. Do **not** run
`dataverse mcp allow`, enablement scripts, consent grants or environment
updates as part of this skill.

## Register with the active host

### GitHub Copilot CLI

Use native HTTP authentication, as documented in
[Connect Dataverse MCP with GitHub Copilot](https://learn.microsoft.com/en-us/power-apps/maker/data-platform/data-platform-mcp-vscode).
No local Dataverse CLI, Python packages or stdio proxy are needed for this path.

Check the installed Copilot CLI's MCP help for supported scopes.
Copilot CLI 1.0.112 supports project `.mcp.json` (or `.github/mcp.json`) and
user `$COPILOT_HOME/mcp-config.json`, defaulting to `~/.copilot/mcp-config.json`.
Prefer the existing project file; do not create a nearer file that silently
shadows an existing workspace configuration. User scope requires approval.

Read and parse the existing strict JSON first. Stop on malformed or unexpected
structure rather than replacing it with an empty object. Merge **one** uniquely
named server into `mcpServers`, preserving sibling entries and other settings.
For example, after substituting the verified organization URL and a unique name:

```json
{
  "mcpServers": {
    "dataverse-schema-example": {
      "type": "http",
      "url": "https://example.crm.dynamics.com/api/mcp",
      "tools": ["search", "describe", "create_table", "update_table", "delete_table"]
    }
  }
}
```

This is a fragment to merge, not a replacement file. Do not save an
`Authorization` header. The host manages OAuth sign-in and its credential cache.
Use an existing equivalent entry when possible; ask before replacing an entry
with a different target or changing its tool restrictions. A legacy `servers`
key is not a valid Copilot CLI `mcpServers` container; do not silently preserve
it as a supposedly working registration.

In the interactive Copilot session, have the user run `/mcp reload` and, when
needed, `/mcp auth <server-name>`, completing sign-in for the verified tenant.
Use `/mcp get <server-name>` to inspect tools and live status. If the installed
version requires a restart, pause and resume after it. Shell
`copilot mcp list` shows configuration, not a live authenticated connection.

### Claude Code and other hosts

Do not copy the Copilot HTTP registration to a host without supported Dataverse
OAuth handling. Read the current
[official Dataverse MCP configuration reference](https://github.com/microsoft/Dataverse-skills/blob/main/.github/plugins/dataverse/skills/dv-connect/references/mcp-configuration.md)
and the active host's help. Claude Code uses the official
`@microsoft/dataverse` stdio proxy through `npx`, not unauthenticated direct HTTP.
That proxy uses a **different client identity** by default; check the actual
transport's documented client ID and its own allow-list status, not just the
Copilot HTTP row above.

Use the reference's host-specific registration procedure only. The optional
Dataverse plugin is not a prerequisite, and its full `dv-connect` flow can
install tools or modify allow-lists; do not delegate that flow unchecked.
Apply this skill's approvals and read-only enablement rules even when consulting
the external reference. Do not claim a host is supported merely because a
configuration file was written.

## Verify the actual MCP connection

Initialize the registered server and inspect `tools/list` through the host.
Require the tools for the approved operation; then perform a harmless
`describe` of a known table, such as `tables/account`, or one selected through
metadata `search`. A missing sample table is not proof of broken authentication;
use an accessible existing schema, not record queries or test mutations.

Verify the actual connected target agrees with discovery. Keep record CRUD,
file tools and unrestricted `invoke_api` out of this metadata workflow.
Tool availability does not establish mutation privileges. Report authentication,
policy and privilege errors without bypassing them. MCP calls can consume
[Copilot Credits](https://learn.microsoft.com/en-us/power-apps/maker/data-platform/data-platform-mcp);
configuration and verification do not authorize unrelated exploration.
