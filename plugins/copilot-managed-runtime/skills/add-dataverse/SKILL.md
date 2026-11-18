---
name: add-dataverse
description: Adds Microsoft Dataverse through `/add-data-source` with `api-id=shared_commondataserviceforapps`. Use for existing table bindings or Dataverse actions.
allowed-tools: Read AskUserQuestion Skill
---

**📋 Shared Instructions: [shared-instructions.md](../../shared/shared-instructions.md)** — Cross-cutting concerns.

# Add Dataverse (Wrapper)

This skill is a thin wrapper. Use `/add-data-source` as the single implementation path.

For an explicit request to create or change Dataverse tables or columns, use
[/add-dataverse-backend](../add-dataverse-backend/SKILL.md) first. It manages
development-time metadata through MCP and returns here for app data access.
Do not invoke schema authoring for a request that only binds existing tables.
If `/add-dataverse-backend` invokes this wrapper after verifying metadata,
continue with binding; do not delegate back.

## Delegation contract

Invoke `/add-data-source` with:

- `api-id`: `shared_commondataserviceforapps`
- `mode`: `table` for a fixed, existing table. Use `action` when users choose the organization URL or entity-set name inside the app.
- Pass through known table logical names, `connection-id`, and `dataverse-environment-id`.

In table mode, ask for missing table logical names before delegation. A logical name identifies the table, such as `account`.
In action mode, do not ask for a fixed table. The entity-set name identifies the API collection, such as `accounts`.
This skill binds existing tables. Do not create tables.

Use the exact connector ID. Both connectors have the display name "Microsoft Dataverse".
Do not substitute the older `shared_commondataservice` connector unless the user explicitly requests it.
