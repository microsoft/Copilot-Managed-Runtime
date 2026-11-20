import { readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const MAX_BYTES = 128 * 1024;
const categories = ['agent-action', 'outdated-guidance', 'configuration', 'instruction-gap', 'product-bug', 'unknown'];
const versionFields = ['installedPlugin', 'sessionLoadedPlugin', 'generationPlugin', 'cli', 'sdk', 'runtime', 'node'];
const privateFields = ['agentSessionId', 'cliExecutionId', 'runtimeSessionId', 'backendRequestId'];

function object(value, required, optional, path) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${path}: expected an object`);
  }
  if (Object.keys(value).some(key => !required.includes(key) && !optional.includes(key))) {
    throw new Error(`${path}: unexpected field; only curated diagnosis fields are allowed`);
  }
  if (required.some(key => !Object.hasOwn(value, key))) {
    throw new Error(`${path}: missing required field`);
  }
}

function text(value, path, max = 2000, allowEmpty = false) {
  if (typeof value !== 'string' || (!allowEmpty && !value.trim()) || value.length > max) {
    throw new Error(`${path}: expected ${allowEmpty ? 'a' : 'a non-empty'} string of at most ${max} characters`);
  }
}

function choice(value, choices, path) {
  if (!choices.includes(value)) throw new Error(`${path}: invalid classification/status`);
}

function list(value, path, min, max, validate) {
  if (!Array.isArray(value) || value.length < min || value.length > max) {
    throw new Error(`${path}: expected ${min}-${max} entries`);
  }
  value.forEach((entry, index) => validate(entry, `${path}[${index}]`));
}

export function validateRecord(record) {
  object(record, ['schemaVersion', 'symptom', 'category', 'versions', 'provenance',
    'evidence', 'attempts', 'reproduction', 'recommendation'], ['privateEvidence'], 'record');
  if (record.schemaVersion !== 1) throw new Error('record.schemaVersion: unsupported schema version');
  text(record.symptom, 'record.symptom');
  text(record.recommendation, 'record.recommendation');
  choice(record.category, categories, 'record.category');
  object(record.versions, versionFields, [], 'record.versions');
  for (const field of versionFields) text(record.versions[field], `record.versions.${field}`, 80);
  list(record.provenance, 'record.provenance', 0, 30, (entry, path) => {
    object(entry, ['subject', 'status', 'detail'], [], path);
    text(entry.subject, `${path}.subject`);
    choice(entry.status, ['observed', 'agent-reported', 'unknown'], `${path}.status`);
    text(entry.detail, `${path}.detail`);
  });
  list(record.evidence, 'record.evidence', 1, 30, text);
  list(record.attempts, 'record.attempts', 0, 10, (entry, path) => {
    object(entry, ['action', 'result'], [], path);
    text(entry.action, `${path}.action`);
    text(entry.result, `${path}.result`);
  });
  object(record.reproduction, ['prerequisites', 'steps', 'expected', 'actual',
    'frequency', 'verification'], [], 'record.reproduction');
  for (const field of ['prerequisites', 'steps']) {
    list(record.reproduction[field], `record.reproduction.${field}`, 1, 30, text);
  }
  text(record.reproduction.expected, 'record.reproduction.expected');
  text(record.reproduction.actual, 'record.reproduction.actual');
  choice(record.reproduction.frequency, ['consistent', 'intermittent', 'once', 'unknown'],
    'record.reproduction.frequency');
  choice(record.reproduction.verification,
    ['agent-verified', 'customer-reported', 'proposed', 'not-reproduced'],
    'record.reproduction.verification');
  if (Object.hasOwn(record, 'privateEvidence')) {
    object(record.privateEvidence, [], privateFields, 'record.privateEvidence');
    for (const field of Object.keys(record.privateEvidence)) {
      text(record.privateEvidence[field], `record.privateEvidence.${field}`, 2000, true);
    }
  }
}

function redact(value, privateIds) {
  let result = value;
  for (const id of privateIds) result = result.replaceAll(id, '[REDACTED ID]');
  return result
    .replace(/\b(?:authorization|proxy-authorization|cookie|set-cookie)\s*:[^\r\n]*/gi, '[REDACTED HEADER]')
    .replace(/\b(?:bearer|basic)\s+\S+/gi, '[REDACTED CREDENTIAL]')
    .replace(/(?:--)?(?:password|passwd|secret|client[-_]?secret|token|access[-_]?token|api[-_]?key|connection[-_]?string)\b\s*(?:=|:|\s)\s*(?:"[^"]*"|'[^']*'|[^\s;,]+)/gi, '[REDACTED CREDENTIAL]')
    .replace(/\b[a-z][a-z0-9+.-]*:\/\/[^\s<>"']+/gi, '[REDACTED URL]')
    .replace(/\bwww\.[^\s<>"']+/gi, '[REDACTED URL]')
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[REDACTED EMAIL]')
    .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, '[REDACTED ID]')
    .replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, '[REDACTED ADDRESS]')
    .replace(/(["'])(?:[a-z]:\\|\\\\)[^\r\n"'<>|]*\1/gi, '$1[REDACTED PATH]$1')
    .replace(/(?:[a-z]:\\|\\\\)[^\s"'<>|;&]+/gi, '[REDACTED PATH]')
    .replace(/(^|[\s"'=])\/(?:[^\s/"'<>]+\/)+[^\s"'<>]*/g, '$1[REDACTED PATH]')
    .replace(/\b(?:eyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+|(?:gh[pousr]_|github_pat_|npm_)[A-Za-z0-9_]+)\b/g, '[REDACTED TOKEN]')
    .replace(/\b(?=[A-Za-z0-9_+/=-]{32,}\b)(?=[A-Za-z0-9_+/=-]*[A-Za-z])(?=[A-Za-z0-9_+/=-]*\d)[A-Za-z0-9_+/=-]{32,}/g, '[REDACTED TOKEN]')
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f\u202a-\u202e\u2066-\u2069]/g, '');
}

function markdown(value, privateIds) {
  return redact(value, privateIds)
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('@', '&#64;')
    .replace(/([\\`*_{}\[\]()#+.!|~-])/g, '\\$1')
    .split(/\r?\n/).join('\n> ');
}

export function exportReport(record) {
  validateRecord(record);
  const privateIds = Object.values(record.privateEvidence ?? {}).filter(value => value.trim());
  const safe = value => markdown(value, privateIds);
  const lines = values => values.map(value => `> ${safe(value)}`).join('\n>\n');
  const { reproduction } = record;
  return [
    '## Describe the bug',
    '<!-- A clear and concise description of what the bug is. -->',
    `> ${safe(record.symptom)}`,
    '',
    '## Steps to Reproduce',
    '<!-- Steps to reproduce the behavior. Please be as detailed as possible. -->',
    '**Prerequisites:**',
    lines(reproduction.prerequisites),
    '',
    ...reproduction.steps.map((step, index) => `${index + 1}. ${safe(step)}`),
    '',
    `Frequency: ${reproduction.frequency}. Verification: ${reproduction.verification}.`,
    '',
    '## Expected behavior',
    '<!-- A clear and concise description of what you expected to happen. -->',
    `> ${safe(reproduction.expected)}`,
    '',
    '## Actual behavior',
    '<!-- What actually happens instead of the expected behavior. -->',
    `> ${safe(reproduction.actual)}`,
    '',
    '## Screenshots or Error Messages',
    '<!-- If applicable, add screenshots or copy-paste error messages to help explain your problem. -->',
    lines(record.evidence),
    '',
    '## Environment information',
    ...versionFields.map(field => `- ${field}: ${safe(record.versions[field])}`),
    '- npm version / enterprise network / framework / connections: not collected unless stated in approved evidence.',
    '',
    '## Additional context',
    '<!-- Add any other context about the problem here. -->',
    `Likely cause: ${record.category} (evidence-based assessment, not proof).`,
    '',
    '**Instruction/version provenance:**',
    record.provenance.length
      ? lines(record.provenance.map(entry => `${entry.subject} [${entry.status}]: ${entry.detail}`))
      : '> Unknown; no instruction-loading history was available.',
    '',
    '**Attempted fixes and results:**',
    record.attempts.length
      ? lines(record.attempts.map(entry => `${entry.action}: ${entry.result}`))
      : '> No recovery attempts recorded.',
    '',
    `> ${safe(record.recommendation)}`,
    '',
    'Private evidence is excluded. Automated redaction is best-effort; manual review and explicit approval are required before publication.',
    '',
  ].join('\n');
}

export function readRecord(path) {
  const stat = statSync(path);
  if (!stat.isFile() || stat.size > MAX_BYTES) {
    throw new Error('Diagnosis input must be a regular JSON file of at most 128 KiB');
  }
  const bytes = readFileSync(path);
  if (bytes.length > MAX_BYTES) throw new Error('Diagnosis input exceeds 128 KiB');
  try {
    return JSON.parse(bytes.toString('utf8'));
  } catch {
    throw new Error('Diagnosis input is not valid JSON; no report was generated');
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (process.argv.length !== 3) throw new Error('Usage: node export-report.mjs <diagnosis-record.json>');
    process.stdout.write(exportReport(readRecord(process.argv[2])));
  } catch (error) {
    process.stderr.write(`Report export failed: ${error.message}\n`);
    process.exitCode = 1;
  }
}
