# Copilot Managed Runtime GitHub Actions

GitHub Actions for building and deploying apps on [Copilot Managed Runtime](https://www.npmjs.com/package/@microsoft/cmr-cli) from CI.

## Actions

| Action | What it does | Ref |
|---|---|---|
| [`install-ms-cli`](./install-ms-cli) | Installs `@microsoft/cmr-cli` (binary: `ms`) on the runner. | `microsoft/Copilot-Managed-Runtime/github-actions/install-ms-cli@main` |
| [`ms-app-pack`](./ms-app-pack) | Runs `ms app pack` — builds and packs the app into a deployable artifact. | `microsoft/Copilot-Managed-Runtime/github-actions/ms-app-pack@main` |
| [`ms-app-deploy`](./ms-app-deploy) | Runs `ms app deploy` — uploads the artifact and deploys to the target environment. | `microsoft/Copilot-Managed-Runtime/github-actions/ms-app-deploy@main` |

## Quick start

```yaml
name: Deploy Managed App

on:
  push:
    branches: [main]
    paths:
      - 'apps/my-app/**'
      - '.github/workflows/deploy-managed-app.yml'
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v5
    - uses: actions/setup-node@v5
      with: { node-version: '24' }
    - run: npm install
      working-directory: apps/my-app
    - uses: microsoft/Copilot-Managed-Runtime/github-actions/install-ms-cli@main
    - uses: microsoft/Copilot-Managed-Runtime/github-actions/ms-app-pack@main
      with:
        working-directory: 'apps/my-app'
        app-id:        ${{ secrets.PP_SP_CLIENT_ID }}
        client-secret: ${{ secrets.PP_SP_CLIENT_SECRET }}
        tenant-id:     ${{ secrets.PP_SP_TENANT_ID }}
    - uses: microsoft/Copilot-Managed-Runtime/github-actions/ms-app-deploy@main
      with:
        working-directory: 'apps/my-app'
        app-id:        ${{ secrets.PP_SP_CLIENT_ID }}
        client-secret: ${{ secrets.PP_SP_CLIENT_SECRET }}
        tenant-id:     ${{ secrets.PP_SP_TENANT_ID }}
```

See each action's `action.yml` for the full input/output reference.

### Deployment authentication

For `ms-app-deploy`, provide `app-id` (the Service Principal client ID, not the
deployed app ID), `client-secret`, and `tenant-id` together. If only some inputs
are supplied, the action fails before launching the CLI, even when inherited
credentials or a cached CLI identity are available. Input values are trimmed;
whitespace-only values count as missing. The error names the required inputs,
not their values.

Omitting all three inputs preserves the inherited environment and delegates
authentication to the CLI, including any cached identity. Three empty secrets
are indistinguishable from intentionally omitted inputs; workflows requiring
Service Principal authentication should ensure all three secrets are configured.
Complete inputs override inherited `MS_CLI_USE_SP_AUTH` and `MS_CLI_SP_*` values.
They also disable `MS_CLI_USE_HTTP_FORWARD` and `MS_CLI_USE_NOOP_AUTH` in the
deployment subprocess so those higher-priority providers cannot replace the
requested Service Principal. The action's own environment is not modified.
Credential validity and authentication failures are handled by the CLI.

## Agent skills

Step-by-step guides any operator — or coding-agent CLI (GitHub Copilot CLI, Claude Code, etc.) — can follow. See [`AGENTS.md`](AGENTS.md) for the index.

- [Architecture & Flow](agent-skills/architecture.md) — the end-to-end Copilot Managed Runtime lifecycle (setup, local dev, CI loops), the `ms-app-deploy` sequence with service rejection points, and the release/versioning flow, with diagrams.
- [Release guide](agent-skills/release-guide.md) — how to cut a release PR (version bump + changelog + dist rebuild).

## Prerequisites

- A **Service Principal** in Microsoft Entra ID with the right role on your target environment (System Administrator + System Customizer for Dataverse-enabled environments; Environment Admin for non-Dataverse environments via the Power Apps API).
- **`AllowExternalArtifactDeployment`** enabled on the target environment by your tenant administrator.
- A Managed App created with `ms app create --repo none` (BYOB mode), `ms.config.json` committed in the repo.

## Building the actions

```pwsh
cd github-actions
npm install
npm run build
npm run dist
npm test
```

This compiles the TypeScript sources under `src/actions/` and bundles each action into a single JS file under `dist/actions/<action-name>/index.js` via esbuild.

Each action's `action.yml` references the bundled `dist/actions/<name>/index.js` as its entry point.
`npm test` rebuilds the actions and runs isolated deployment-action tests with
Node's built-in test runner. The tests intercept the CLI subprocess boundary;
they do not sign in or deploy to a service.

## Versioning

The initial publication uses `@main`; pin a commit SHA for reproducible workflows.
Release tags from the original repository are not published in this new repository.
After a release is published here, consumers can pin to:

- `@v1` — major version, gets new features + non-breaking changes
- `@v1.x.y` — specific immutable version, never moves

## License

[MIT](../LICENSE)
