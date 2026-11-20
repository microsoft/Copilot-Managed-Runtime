---
name: report-issue
description: Reports issues only for Copilot Managed Runtime, @microsoft/cmr-cli or this plugin's app-generation instructions. Not a general-purpose product issue reporter.
allowed-tools: Read Grep Glob Bash WebFetch AskUserQuestion Write
---

**Shared Instructions: [shared-instructions.md](../../shared/shared-instructions.md)**

# Report Issue

Use only for Copilot Managed Runtime, `@microsoft/cmr-cli`, or this plugin's
instructions. Installation alone does not establish relevance. If the affected
product is unclear, ask before collecting evidence or selecting a repository.
For unrelated products, leave this workflow and use their normal support path;
do not apply CMR checks or route their reports to this repository.

## 1. Reuse evidence and confirm the destination

Reuse [/troubleshoot](../troubleshoot/SKILL.md) evidence; if none exists, diagnose
first unless the user wants to report without recovery. Ask only for missing
facts, not another interview. Do not collect environment/log details without
scoped consent or require a successful reproduction to allow reporting.

Default destination: the PUBLIC
[microsoft/Copilot-Managed-Runtime](https://github.com/microsoft/Copilot-Managed-Runtime)
repository. Warn against sharing sensitive information and confirm the target.
Retrieve its current issue template from that repository; for the default use
[bug_report.md](https://raw.githubusercontent.com/microsoft/Copilot-Managed-Runtime/main/.github/ISSUE_TEMPLATE/bug_report.md).
A customer's local `.github/ISSUE_TEMPLATE` is not this repository's template.
If retrieval fails, disclose it and prepare a freeform draft with the fields below.

## 2. Draft and review

Use the destination template's headings, sections and HTML comments. Include
symptom, evidence-backed likely cause/uncertainty, relevant versions/provenance,
prerequisites, numbered repro steps, expected/actual results, frequency,
reproduction status and attempted fixes. Mark missing information unknown/N/A.
Keep the draft in the conversation; save it only if requested and in an approved
location. Do not modify the memory bank solely to record the report.

Review the entire title/body, links, command arguments and any attachments:

- Remove secrets/tokens, cookies, authorization headers, connection strings,
  personal/customer data, proprietary code, user paths and private URLs.
- Keep account/tenant/app/session/request identifiers in private notes, not the
  public issue. Do not attach raw logs, HARs, transcripts, screenshots or the
  memory bank by default.
- Replace sensitive inputs with descriptive placeholders, preserve safe commands
  and error codes, and disclose missing inputs or untested synthetic data.

There is no automated sanitizer or anonymity guarantee. Omit anything that
cannot be safely shared and explain resulting reproduction limitations. Share
private evidence only through an established authenticated support channel with
separate approval; never invent an upload endpoint or publish it to a gist.

Show the exact non-sensitive title, body, destination and attachments. Obtain
explicit approval to publish that content; any edit requires another preview.

## 3. Publish after approval

Use the available host issue-creation tool, or authenticated `gh issue create`
with the approved body and explicit repository when no host tool is available.
Follow host/template requirements and check labels before adding them. Do not
display tokens, switch accounts/repositories silently, or use creation to probe
access. Check whether an uncertain submission succeeded before retrying.

Return the confirmed issue URL. If publishing fails, state that no issue was
created (or that the outcome is uncertain) and retain the reviewed draft;
save it only with approval. Do not report a draft as a filed issue.
