---
name: troubleshoot
description: Diagnoses failures only in Copilot Managed Runtime apps, @microsoft/cmr-cli or this plugin's instructions. Not general troubleshooting for other products, ms-named tools or agents.
allowed-tools: Read Grep Glob Bash WebFetch AskUserQuestion Edit Write
---

**Shared Instructions: [shared-instructions.md](../../shared/shared-instructions.md)**

# Troubleshoot

Use only when the failure relates to Copilot Managed Runtime, its
`@microsoft/cmr-cli`, or this plugin's instructions. Installation alone, an `ms`
command name, or a generic agent error does not establish relevance. If unclear,
ask which product is affected before collecting diagnostics. For unrelated
products, leave this workflow without running CMR checks or recommending our
issue repository; use the product's normal troubleshooting path.

## 1. Preserve relevant evidence

Reuse the conversation and calling skill's context; ask only for missing facts.
Obtain scoped consent before collecting environment details, historical logs or
network traces. Use available project/CLI/host evidence, not invented diagnostic
commands, UI features or transcript APIs. Keep a concise evidence summary:

| Failure | Relevant evidence |
| --- | --- |
| Agent/code generation | Actual actions, relevant prompt/diff, instruction sources |
| CLI | Command/arguments, CLI version, timestamp, exit/error code, returned execution ID |
| App load/runtime | Local/deployed mode, build/runtime version, console error, failed request status, timestamp, available runtime/request IDs |
| Build/deploy | Source commit, stage, build/deployment ID, error excerpt |

Preserve original errors and versions before changes. Installed plugin,
session-loaded instructions and app-generation versions are different facts;
mark each observed, agent-reported or unknown. A manifest/hash read now does not
prove what an earlier session loaded. Do not infer agents from environment
markers or change attribution variables while hooks are active.

Keep distinct agent-session, CLI-execution, runtime-session and backend-request
IDs private. Do not publish evidence from this skill; apply the
[/report-issue privacy review](../report-issue/SKILL.md#2-draft-and-review) before
sharing a handoff. Keep notes in the conversation unless the user requests a
saved artifact; ask for its location/approval and do not write private evidence
to tracked source. Do not modify the memory bank solely to record diagnostics.

## 2. Identify the likely cause

Compare the actual action with the applicable packaged workflow and supported
CLI/API behavior. Reuse existing [create troubleshooting](../create-app/references/troubleshooting.md)
or [/dev recovery](../dev/SKILL.md) when relevant.
Explain the likely cause with evidence and uncertainty: incorrect agent action,
outdated/unrelated guidance, configuration, instruction gap, product defect, or
unknown. Describe observed actions, not hidden reasoning; causes can coexist.

Only when stale guidance or version compatibility is plausible, fetch the
[plugin marketplace](https://raw.githubusercontent.com/microsoft/Copilot-Managed-Runtime/main/.claude-plugin/marketplace.json)
and compare the relevant instructions at an identifiable published revision with
the failing action. A higher version is not proof of a fix. Cite the applicable
change before recommending an update; do not substitute unrelated public docs.
If lookup fails, record the limitation and continue locally.

## 3. Correct safely and verify

Explain a targeted correction and follow existing approval gates. Read-only
collection is not permission to update/restart, recreate resources, change
permissions, push or deploy. An approved corrective action may include a
dependency/plugin update; preserve before/after versions and honor install gates.
Do not run destructive or billable reproductions without explicit approval.
Verify the original symptom, record each action/result, and stop repeating
unsuccessful fixes without new evidence. If a new session is needed, provide a
privacy-reviewed handoff; do not claim this session reloaded instructions.

## 4. Resolve or prepare escalation

Explain verified recovery. Suggest reporting a supported behavior that still
fails or a concrete instruction gap, even if a workaround succeeds. Unknown or
intermittent failures remain reportable; the user may report without recovery.

For escalation, summarize prerequisites/versions, numbered commands or UI steps,
expected/actual results, frequency, attempted fixes and reproduction status
(`agent-verified`, `customer-reported`, `proposed`, or `not-reproduced`). For agent
failures, distinguish a prompt that sometimes produces bad actions from commands
that reliably fail. Prefer a minimal local example with safe placeholders; state
missing dependencies and whether synthetic inputs were actually tested.

If the user wants a support handoff (for example, Teams), prepare a concise
copyable summary of this evidence, likely cause/uncertainty and remaining blocker;
no GitHub issue is required. Apply the linked privacy review even for internal
chat. Keep IDs separate unless approved for the intended recipients; never include
credentials or raw customer data. Prepare text only, not an automatic message.
For GitHub reporting, pass the evidence to
[/report-issue](../report-issue/SKILL.md) without another interview.
