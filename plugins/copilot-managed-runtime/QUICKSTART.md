# Quick Start Guide

Build and run a Microsoft App using just your coding copilot. No prior Copilot Managed Runtime knowledge needed.

---

## Step 1 — Install Prerequisites

You need two tools installed before starting:

**Node.js v22 or higher**
Download from [nodejs.org](https://nodejs.org). After installing, verify:
```
node --version   # should print v22.x.x or higher
```

**Git**
Apps on Copilot Managed Runtime store app code in a remote git repository, and `ms app create` initializes the local repo. Install from [git-scm.com](https://git-scm.com). Git for Windows includes Git Credential Manager, which the first `ms app create` will exercise.

That's it for now — `/create-app` installs the `ms` CLI itself globally on its first run.

---

## Step 2 — Install the Plugin

This plugin works with GitHub Copilot CLI and Claude Code. Commands are the same for both. You only need to install once; the plugin is then available in every project folder.

Run `copilot` or `claude` in any folder, then:

```
/plugin marketplace add microsoft/Copilot-Managed-Runtime
/plugin install copilot-managed-runtime@Copilot-Managed-Runtime
```

---

## Step 3 — Create Your First App

Navigate to an **empty** folder where you want your project. `/create-app` treats your current folder as the project root:

```
/create-app
```

Your copilot will:

1. Install `@microsoft/cmr-cli@latest` globally (with your confirmation) from the public npm registry.
2. Ask you what you want to build, plain English.
3. Run `ms app create` to scaffold the project.
4. Start `ms app dev` so you can play the app locally in the App Player.

If the folder is not empty, the skill will create the app in an inferred subfolder and tell you which folder it selected. If you run it from inside an existing Microsoft App, it creates the new app alongside that app instead of nested inside it.

Nothing deploys to the cloud at this point — local dev only.

### Already Have an App?

Open the existing web app's root instead of an empty folder and run:

```
/init-app
```

This registers your existing code with `ms app init --repo native`, configures a
platform-managed Git repository, verifies integration and the build, and starts
local development without replacing your app with a template. It asks for approval
before changing an existing `origin`. This workflow requires Node.js **24.11.0+**,
Git **2.27.0+** and Git Credential Manager. It does not deploy.
If the app already has CMR configuration, use `/dev` or `/deploy` instead.

---

## Dive Deeper

### Iterate Locally

Once an app exists, restart the local dev server anytime:

```
/dev
```

### Connect Data Sources

Your copilot will recommend data sources based on what your app needs to do. To be explicit, run any of these from inside the project folder:

| What you want to do                  | Command            |
| ------------------------------------ | ------------------ |
| Store custom business data           | `/add-dataverse`   |
| Read/write SharePoint lists          | `/add-sharepoint`  |
| Read/write an Excel workbook         | `/add-excel`       |
| Upload or download files             | `/add-onedrive`    |
| Send emails or manage calendar       | `/add-office365`   |
| Read user profiles or profile photos | `/add-office365-users` |
| Send Teams messages                  | `/add-teams`       |
| Query Azure DevOps work items        | `/add-azuredevops` |
| Invoke a Copilot Studio agent        | `/add-mcscopilot`  |
| Search M365 knowledge with Work IQ   | `/add-workiq`      |
| Something else (any other connector) | `/add-data-source` |

Each command runs `ms app add data-source --connector <api-id>` against the right connector, regenerates typed TypeScript services under `src/`, and verifies the build. Your local `ms app dev` hot-reloads the new services.

### Ship to the Cloud

```
/deploy
```

Your copilot verifies the local build with `npm run build`, commits and pushes the changes,
then runs `ms app deploy --commit <sha>` to build and deploy the pushed commit. There is no
deploy-path selection question. Standalone `ms app build` / `ms app build-status` commands
are used only when explicitly requested or needed for diagnostics.

Always confirms before deploying, and always syncs changes to git before deploy.
After deployment, it returns the live URL without asking whether to open it.

### Resuming a Session

After `/create-app` or `/init-app`, the project folder gets a `memory-bank.md`. Open a new copilot session in the same folder and your copilot reads it to pick up where you left off (including which environment + cluster).

### Troubleshooting

| Problem                                                       | Fix                                                                                                                       |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `ms` command not found after install        | Verify `npm config get prefix` directory's `bin` is on PATH. On Windows that's `%APPDATA%\npm`.                           |
| First `ms app create` fails with `Authentication failed for '...d.environment.api...'` | Git Credential Manager hasn't done the interactive flow yet. Your copilot will walk you through the recovery automatically. |
| Build errors                                                  | Run `npm install` in the project folder, then retry.                                                                       |
| Node.js version error                                         | Run `node --version` — must be v22+. Upgrade if needed.                                                                    |

### Telemetry

The plugin defaults `MS_CLI_ORIGIN` to `plugin` for commands that invoke `ms`.
It preserves existing origin values.
The native Copilot hook separately sets `MS_PLUGIN_REPORT_AGENT=github-copilot`.
Shared hooks remove inherited agent reports.
An origin override does not disable telemetry.
See the [Telemetry section in the README](./README.md#telemetry) for details.

### Uninstall

```
/plugin uninstall copilot-managed-runtime
```
