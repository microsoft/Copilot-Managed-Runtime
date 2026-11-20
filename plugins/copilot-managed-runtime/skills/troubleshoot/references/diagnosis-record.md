# Diagnosis Record (schema version 1)

The exporter enforces a closed record shape: unknown fields, invalid enums,
oversized input and missing required evidence are errors, not silently dropped
successes. All fields below are required except `privateEvidence`. Arrays may be
empty only for `provenance` and `attempts`.

```json
{
  "schemaVersion": 1,
  "symptom": "App fails to load after local dev starts.",
  "category": "unknown",
  "versions": {
    "installedPlugin": "unknown",
    "sessionLoadedPlugin": "unknown",
    "generationPlugin": "unknown",
    "cli": "unknown",
    "sdk": "unknown",
    "runtime": "unknown",
    "node": "unknown"
  },
  "provenance": [
    {
      "subject": "session-loaded instructions",
      "status": "unknown",
      "detail": "The host does not expose the resources loaded by the earlier session."
    }
  ],
  "evidence": [
    "Customer reported a blank page; no console or request error is available yet."
  ],
  "attempts": [],
  "reproduction": {
    "prerequisites": ["Existing app; authenticated local development session."],
    "steps": ["Run ms app dev.", "Open the printed App Player URL."],
    "expected": "The app renders.",
    "actual": "Customer reported a blank page.",
    "frequency": "unknown",
    "verification": "customer-reported"
  },
  "recommendation": "Collect the relevant console error before classifying the cause.",
  "privateEvidence": {
    "agentSessionId": "",
    "cliExecutionId": "",
    "runtimeSessionId": "",
    "backendRequestId": ""
  }
}
```

- `category`: `agent-action`, `outdated-guidance`, `configuration`,
  `instruction-gap`, `product-bug`, or `unknown`.
- `versions`: exact observed version strings (maximum 80 characters), otherwise
  `unknown`. Put evidence/status for each known value in `provenance`; reading the
  installed manifest cannot establish session-loaded/generation versions.
- `provenance`: up to 30 entries with `subject`, `status` (`observed`,
  `agent-reported`, `unknown`) and `detail`.
- `evidence`: 1-30 curated factual summaries, not raw output, payloads or code.
- `attempts`: up to 10 entries containing `action` and `result`.
- `reproduction`: 1-30 `prerequisites` and `steps`, `expected`, `actual`,
  `frequency` (`consistent`, `intermittent`, `once`, `unknown`) and `verification`
  (`agent-verified`, `customer-reported`, `proposed`, `not-reproduced`).
- `privateEvidence`: optional closed object with the four distinct ID fields
  above; omit unavailable fields or use an empty string. Never put their values
  in public text. No raw logs, transcript or HAR field is supported.
- All other strings: non-empty, maximum 2,000 characters.
- Input: at most 128 KiB UTF-8 JSON. Output is Markdown on stdout; the exporter
  does not write, upload, file an issue, execute reproduction steps or read the
  machine's environment.

Only use curated, user-approved text. Unknown fields are rejected to avoid an
accidental log/config dump. The exporter omits private IDs, scrubs common
credential/identifier/path/URL patterns, and quotes free text as inert Markdown.
Manual review is still required for customer names, business data, proprietary
content, unusual secrets and sensitive reproduction values.

The public output follows this repository's
[bug report template](https://github.com/microsoft/Copilot-Managed-Runtime/blob/main/.github/ISSUE_TEMPLATE/bug_report.md).
Check the live destination/template before filing; if it changed, preserve its
sections and comments while transferring the already sanitized evidence.
