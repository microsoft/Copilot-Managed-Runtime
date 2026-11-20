---
name: troubleshoot
description: Diagnoses Copilot Managed Runtime app, ms CLI, build and agent-guidance failures before reporting. Use when an app fails to load, commands error, generated code is incorrect, or plugin instructions appear stale.
allowed-tools: Read Grep Glob Bash WebFetch AskUserQuestion Write
---

**Shared Instructions: [shared-instructions.md](../../shared/shared-instructions.md)**

# Troubleshoot

Uses existing `@microsoft/cmr-cli` **1.0.0** output and project evidence.
This workflow adds no CLI command or SDK requirement. Do not invent diagnostic
export commands, App Player support buttons, or host transcript APIs.

Follow the [support policy](../../shared/support-policy.md). Diagnose first;
reporting is an optional, approval-gated outcome, not the starting point.

## 1. Establish scope and preserve evidence

Ask what failed and what the user expected only if not already known. Reuse the
calling skill's command/error/version context and relevant memory-bank context;
do not copy the memory bank into a report. Obtain collection consent as described
in the support policy. Ask only for missing evidence.

Choose the relevant evidence:

| Failure | Evidence |
| --- | --- |
| Wrong generated code or agent guidance | Relevant prompt, actual tool actions/small approved diff, skill/resources referenced, available version provenance |
| CLI error | Sanitized command/arguments, actual CLI version, UTC timestamp, exit/error code, IDs actually returned by execution |
| App load/runtime error | Local versus deployed mode, runtime/build version if available, UTC timestamp, console error, failed request status, session/request IDs provided by the UI/network |
| Build/deploy error | Source commit, stage, build/deployment ID and relevant error excerpt |

Use supported read-only commands and existing output. Never run auth/login,
deployment or data-mutating commands just to collect details. If the host cannot
expose loaded resources or session history, mark them unknown. If a CLI failure
returned no ID, record that rather than guessing. Runtime version is not the
desktop coding-client version. Do not collect full HARs/transcripts by default.

Create/update a [diagnosis record](./references/diagnosis-record.md) only with
artifact consent. Otherwise keep the same structured evidence in the conversation.

## 2. Check guidance and likely cause

Read relevant packaged workflow/reference sections and verify the actual command
or API against the applicable version's supported behavior. Perform the
[fresh diagnostic version comparison](../../shared/version-check.md#diagnostic-version-comparison),
even if the daily check already ran. Consult
[known issues](./references/known-issues.md); it is evidence, not an exhaustive
classifier. Do not follow unrelated public docs merely because they rank in search.

Compare installed, session-loaded and generation versions separately. Explain
any known mismatch; recommend the client's supported update/reload/new-session
procedure only after identifying an applicable instruction fix. Do not assert
that old instructions were used without evidence.

Classify a likely cause and cite the action/instruction/error evidence:

- `agent-action`: unsupported/invented action contradicted by applicable guidance.
- `outdated-guidance`: a concrete stale or unrelated instruction source.
- `configuration`: a verified prerequisite/configuration problem.
- `instruction-gap`: missing, ambiguous or misleading applicable plugin guidance.
- `product-bug`: supported behavior fails with verified prerequisites.
- `unknown`: evidence is missing, conflicting or insufficient.

State uncertainty and alternative/coexisting causes in the evidence summary.
Describe observed actions, not hidden model reasoning.

## 3. Correct and verify

Explain the finding, propose a targeted fix, and respect existing confirmation
gates. Preserve the original error/version evidence. Verify the original symptom
after the approved correction, not just whether a command exited successfully.
Stop after two unsuccessful targeted attempts unless new evidence changes the
diagnosis. Record each attempted fix and its observed result.

If updated instructions require a fresh session, present a sanitized handoff
with the unresolved symptom and reproduction; do not pretend the current
session reloaded instructions.

## 4. Prepare a minimal reproduction

Record prerequisites, numbered commands/UI actions, expected and actual results,
frequency, and one of `agent-verified`, `customer-reported`, `proposed`, or
`not-reproduced`. Retain before/after versions when a fix involved an update.
Include sanitized prompt/source context for agent-related failures; distinguish
stochastic prompting from deterministic command failures.

Prefer a minimal local example with placeholder values. State any missing
customer-specific dependency and whether replacement with synthetic data was
actually tested. Do not run destructive/billable reproductions without approval.

## 5. Resolve or escalate

Explain verified recovery without automatically filing. Suggest a plugin issue
for a concrete instruction gap (even after recovery), or a product report for
supported behavior that still fails. Unknown/intermittent failures can also be
reported, with missing evidence explicitly stated.

If the user wants to report, hand the existing record to
[/report-issue](../report-issue/SKILL.md). Do not duplicate the interview, change
the diagnosis to sound certain, or publish anything from this skill.
