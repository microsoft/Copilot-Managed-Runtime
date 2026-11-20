---
name: report-issue
description: Prepares and files a sanitized public Copilot Managed Runtime bug or plugin-instruction report after evidence-based troubleshooting, reproducible steps and explicit user approval.
allowed-tools: Read Grep Glob Bash AskUserQuestion Write
---

**Shared Instructions: [shared-instructions.md](../../shared/shared-instructions.md)**

# Report Issue

Uses existing `@microsoft/cmr-cli` **1.0.0** evidence; no new CLI or SDK capability
is required. The packaged exporter requires Node.js **22+**, already a plugin
prerequisite.

Follow the [support policy](../../shared/support-policy.md). Default destination:
[microsoft/Copilot-Managed-Runtime](https://github.com/microsoft/Copilot-Managed-Runtime).
This is a PUBLIC repository. Do not inherit another plugin's reporting target.

## 1. Reuse the diagnosis

If no diagnosis exists, follow [/troubleshoot](../troubleshoot/SKILL.md) first.
If the user explicitly wants to report without recovery/reproduction, honor it:
record the available facts, unknown cause and unverified reproduction without
forcing fixes. Do not classify every agent mistake as a product bug.

Reuse the [diagnosis record](../troubleshoot/references/diagnosis-record.md),
including original failure, fixes and reproduction status. Ask only for missing
information and collection/artifact consent. Do not collect environment/logs
without consent or invent execution IDs. An intermittent or unverified failure
is reportable if its limitations are clearly disclosed.

## 2. Generate and review the public draft

Warn that the destination is public and that personal/customer information,
credentials, internal URLs, full logs/transcripts and proprietary code must not
be included. Confirm the destination. Check its applicable issue template; for
the default repo, use `.github/ISSUE_TEMPLATE/bug_report.md` when available or
retrieve that template from the destination repository.

Resolve [export-report.mjs](./scripts/export-report.mjs) relative to this skill
file, not the customer's project. Do not assume a fixed plugin installation
path. With the approved record path and resolved exporter path, run:

```text
node "<resolved-exporter-path>" "<approved-diagnosis-record-path>"
```

The exporter prints the sanitized body; it does not file or upload anything.
On failure, surface the validation error and correct the record; never bypass
validation or fall back to publishing raw evidence.

Review the entire output manually, especially free text and command arguments.
Remove personal/business data, proprietary content, secret formats the exporter
cannot recognize, and identifiers accidentally embedded in prose. Private
evidence stays private; do not attach it, raw HARs, logs or screenshots by default.
Use synthetic placeholders and disclose any resulting reproduction limitations.
If changes are needed, update the curated record and regenerate.

Show the exact sanitized title (`[Bug] <non-sensitive summary>`), body,
destination and any separately approved attachments. Keep template headings,
sections and HTML comments; mark missing evidence as unknown/N/A. Obtain explicit
approval to publish THIS content. Any later edit requires another preview.

## 3. File only after approval

Use the host's issue-creation tool when available, honoring any required template
and destination rules. Otherwise use authenticated `gh issue create` with the
approved body file and explicit repository. Verify authentication first; do not
collect/display tokens. Check labels before adding them; do not assume a
`copilot-managed-runtime` or instruction-improvement label exists.

Never issue a create call merely to probe access, retry an uncertain submission
without checking whether it succeeded, or silently switch repositories/accounts.
If publishing is unavailable, retain the sanitized draft in the approved
location and clearly state that no issue was created.

Return the issue URL on success. A diagnosis summary or draft is not a filed
issue. Do not upload private evidence or invent a private support channel.
