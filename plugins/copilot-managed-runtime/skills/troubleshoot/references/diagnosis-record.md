# Diagnosis Record

Use this structured Markdown template in the conversation or a user-approved
artifact. It is a checklist for the agent, not a machine-validated schema.
Use curated factual summaries, not raw logs/configuration dumps. Mark missing
information unknown; preserve the original failure before attempting recovery.

```markdown
# Support Diagnosis

## Symptom
[What failed, where, and when; no personal/customer identifiers.]

## Likely cause
Category: [agent-action / outdated-guidance / configuration / instruction-gap / product-bug / unknown]
Supporting evidence: [Observed actions and applicable instructions.]
Uncertainty or coexisting causes: [What is inferred or still unknown.]

## Versions and provenance
| Component | Version | Evidence status | Source |
| --- | --- | --- | --- |
| Installed plugin | unknown | unknown | unknown |
| Session-loaded plugin | unknown | unknown | unknown |
| App-generation plugin | unknown | unknown | unknown |
| CLI | unknown | unknown | unknown |
| SDK | unknown | unknown | unknown |
| Runtime | unknown | unknown | unknown |
| Node.js | unknown | unknown | unknown |

## Relevant evidence
[Curated error codes, safe command summaries, timestamps, and instruction sources.]

## Attempted fixes
[Action, observed result, and before/after versions if changed; or none.]

## Minimal reproduction
Prerequisites: [Relevant configuration/dependencies and placeholder inputs.]
1. [Command or UI action.]
2. [Command or UI action.]

Expected: [Expected result.]
Actual: [Observed result.]
Frequency: [consistent / intermittent / once / unknown]
Verification: [agent-verified / customer-reported / proposed / not-reproduced]
Limitations: [Missing dependencies, unexecuted steps, or untested synthetic data.]

## Outcome
[Verified recovery, remaining blocker, or suggested report with supporting evidence.]
```

For versions and instruction sources, use `observed`, `agent-reported`, or
`unknown`. Reading the installed manifest cannot establish what an earlier
session loaded or what generated the app. Add relevant CLI/client/framework
versions only with collection consent; do not fabricate historical provenance.

Keep CLI execution, agent-session, runtime-session and backend-request IDs in
separately approved private notes, not this template or public free text. Do not
append raw logs, HARs, credentials, proprietary code or transcripts.

When reporting, transfer the reviewed evidence into the destination's live issue
template rather than submitting this diagnosis as an attachment. The default is
the repository's
[bug report template](https://github.com/microsoft/Copilot-Managed-Runtime/blob/main/.github/ISSUE_TEMPLATE/bug_report.md).
Preserve its headings, sections and HTML comments. Follow the
[/report-issue privacy checklist](../../report-issue/SKILL.md#2-prepare-and-review-the-public-draft)
and obtain approval of the exact public title/body. No automated sanitization
or anonymity guarantee is provided.
