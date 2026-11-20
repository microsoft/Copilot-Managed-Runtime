---
name: report-issue
description: Prepares and files a privacy-reviewed public Copilot Managed Runtime bug or plugin-instruction report after evidence-based troubleshooting, reproducible steps and explicit user approval.
allowed-tools: Read Grep Glob Bash AskUserQuestion Write
---

**Shared Instructions: [shared-instructions.md](../../shared/shared-instructions.md)**

# Report Issue

Uses existing `@microsoft/cmr-cli` **1.0.0** evidence; no new CLI or SDK capability
is required. This is an instruction-only workflow with no report-export script.

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

## 2. Prepare and review the public draft

Warn that the destination is public and that personal/customer information,
credentials, internal URLs, full logs/transcripts and proprietary code must not
be included. Confirm the destination. Check its applicable issue template; for
the default repo, use `.github/ISSUE_TEMPLATE/bug_report.md` when available or
retrieve that template from the destination repository.

Draft Markdown directly from the curated diagnosis using the destination's
template. Preserve its headings, sections and HTML comments. Include the likely
cause with evidence/uncertainty, versions and provenance, attempted fixes, and
numbered reproduction steps with frequency and verification status. Mark
unavailable fields unknown/N/A rather than inventing evidence.

Before presenting the draft, perform this privacy-review checklist:

- Exclude credentials, tokens, cookies, authorization headers, connection
  strings and secrets from all text, command arguments and examples.
- Remove personal/customer/business data, account/tenant/app/session/request
  identifiers, user paths, private URLs, proprietary code and full transcripts.
  Keep approved private evidence in separate notes, not in the public draft.
- Review Markdown links, image URLs and attachments as well as visible prose.
  Do not attach raw HARs, logs, screenshots or the memory bank by default.
- Replace sensitive reproduction values with descriptive placeholders; explain
  which inputs maintainers must supply and whether the example was tested with
  synthetic data. Preserve safe commands and useful error codes.
- Recheck the entire title/body for overlooked information. There is no
  automated sanitizer or privacy guarantee; both agent and user review matter.

If a detail cannot be safely shared, omit it and state the resulting evidence or
reproduction limitation. Update the diagnosis when correcting factual details.

Show the exact privacy-reviewed title (`[Bug] <non-sensitive summary>`), body,
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
If publishing is unavailable, retain the privacy-reviewed draft in the approved
location and clearly state that no issue was created.

Return the issue URL on success. A diagnosis summary or draft is not a filed
issue. Do not upload private evidence or invent a private support channel.
