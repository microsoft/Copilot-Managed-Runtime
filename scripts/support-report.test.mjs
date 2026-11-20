import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { exportReport } from '../plugins/copilot-managed-runtime/skills/report-issue/scripts/export-report.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const exporter = join(root, 'plugins', 'copilot-managed-runtime', 'skills', 'report-issue', 'scripts', 'export-report.mjs');

function record() {
  return {
    schemaVersion: 1,
    symptom: 'App renders a blank page.',
    category: 'unknown',
    versions: {
      installedPlugin: '2.1.17', sessionLoadedPlugin: 'unknown', generationPlugin: 'unknown',
      cli: '1.0.0', sdk: 'unknown', runtime: 'unknown', node: '22.0.0',
    },
    provenance: [{ subject: 'Installed manifest', status: 'observed', detail: 'Read current manifest; session-loaded version is unknown.' }],
    evidence: ['Console reported a render failure.'],
    attempts: [],
    reproduction: {
      prerequisites: ['Existing app with local dependencies.'],
      steps: ['Run ms app dev.', 'Open the printed URL.'],
      expected: 'App renders.',
      actual: 'Blank page.',
      frequency: 'intermittent',
      verification: 'customer-reported',
    },
    recommendation: 'Collect the failing request status before attributing a cause.',
  };
}

test('preserves template sections/comments and ordered repro with honest verification', () => {
  const body = exportReport(record());
  const template = readFileSync(join(root, '.github', 'ISSUE_TEMPLATE', 'bug_report.md'), 'utf8');
  for (const heading of template.match(/^## .+$/gm)) assert.ok(body.includes(heading), heading);
  for (const comment of template.match(/<!--.*?-->/g)) assert.ok(body.includes(comment), comment);
  assert.match(body, /1\. Run ms app dev\\\./);
  assert.match(body, /2\. Open the printed URL\\\./);
  assert.match(body, /intermittent\. Verification: customer-reported/);
  assert.match(body, /sessionLoadedPlugin: unknown/);
});

test('supports agent mistakes, stale guidance, instruction gaps and product failures without changing evidence', () => {
  for (const [category, detail] of [
    ['agent-action', 'The agent invoked npx ms, which is not the CMR CLI.'],
    ['outdated-guidance', 'A verified instruction change applies; recovery is not yet tested.'],
    ['configuration', 'The project configuration is missing.'],
    ['instruction-gap', 'The applicable instruction omitted a startup prerequisite; a workaround succeeded.'],
    ['product-bug', 'A supported command failed after prerequisites were verified.'],
    ['unknown', 'The failure is intermittent and was not reproduced locally.'],
  ]) {
    const input = record();
    input.category = category;
    input.evidence = [detail];
    assert.ok(exportReport(input).includes(`Likely cause: ${category}`));
    assert.match(exportReport(input), /customer-reported/);
  }
});

test('omits private evidence and removes exact IDs from every public field', () => {
  const input = record();
  const ids = ['agent-opaque-123', 'execution-opaque-456', 'runtime-opaque-789', 'request-opaque-012'];
  input.privateEvidence = Object.fromEntries(
    ['agentSessionId', 'cliExecutionId', 'runtimeSessionId', 'backendRequestId'].map((key, index) => [key, ids[index]]));
  input.symptom = ids.join(' ');
  input.versions.cli = ids[0];
  input.provenance[0].detail = ids[1];
  input.reproduction.steps = [ids[2]];
  input.attempts = [{ action: ids[3], result: ids[0] }];
  const body = exportReport(input);
  for (const id of ids) assert.ok(!body.includes(id));
  assert.ok(!body.includes('privateEvidence'));
});

test('redacts headers, credentials, URLs, email, GUIDs, tokens and local paths', () => {
  const input = record();
  const secrets = [
    'Authorization: Bearer secret-value',
    'Cookie: session=private-value',
    '--token "quoted secret"',
    'client_secret=private-secret',
    'https://private.example/path?secret=value',
    'person@example.com',
    '12345678-abcd-abcd-abcd-123456789abc',
    'C:\\Users\\person\\project',
    '/home/person/project',
    '192.168.1.12',
    'ghp_abcdefghijk1234567890',
    'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyIn0.signature',
  ];
  input.evidence = secrets;
  const body = exportReport(input);
  for (const secret of secrets) assert.ok(!body.includes(secret), secret);
  for (const leaked of ['secret-value', 'private-value', 'quoted secret', 'private-secret', 'person@example']) {
    assert.ok(!body.includes(leaked), leaked);
  }
  assert.match(body, /REDACTED/);
});

test('renders untrusted text inert instead of executable markup or mentions', () => {
  const input = record();
  input.symptom = '<img src=x onerror=alert(1)> @someone\n# heading\n```sh\nrun-secret\n```';
  const body = exportReport(input);
  assert.ok(!body.includes('<img'));
  assert.ok(!body.includes('@someone'));
  assert.ok(!body.includes('```'));
  assert.match(body, /&lt;img/);
  assert.match(body, /\n> \\# heading/);
});

test('path redaction preserves the subsequent reproduction command', () => {
  const input = record();
  input.reproduction.steps = [
    'cd C:\\Users\\person\\project; ms app dev',
    'cd "C:\\Users\\person\\My App"; ms app dev',
  ];
  const body = exportReport(input);
  assert.ok(!body.includes('person'));
  assert.ok(!body.includes('My App'));
  assert.equal(body.match(/; ms app dev/g).length, 2);
});

test('rejects unknown fields, invalid statuses, missing and oversized reproduction', () => {
  const cases = [
    input => { input.logs = 'raw logs'; },
    input => { input.versions.tenantId = 'private'; },
    input => { input.privateEvidence = { transcript: 'raw transcript' }; },
    input => { input.schemaVersion = 2; },
    input => { input.category = 'definitely-hallucinated'; },
    input => { input.provenance[0].status = 'inferred-as-fact'; },
    input => { input.reproduction.verification = 'verified'; },
    input => { input.reproduction.steps = []; },
    input => { input.reproduction.steps = Array(31).fill('step'); },
    input => { input.symptom = 'x'.repeat(2001); },
    input => { delete input.reproduction.expected; },
  ];
  for (const mutate of cases) {
    const input = record();
    mutate(input);
    assert.throws(() => exportReport(input));
  }
});

test('CLI exports valid input but fails closed without stdout for malformed or oversized input', () => {
  const directory = mkdtempSync(join(tmpdir(), 'cmr-support-report-'));
  try {
    const path = join(directory, 'diagnosis.json');
    writeFileSync(path, JSON.stringify(record()));
    let result = spawnSync(process.execPath, [exporter, path], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /## Steps to Reproduce/);
    for (const content of [
      '{"secret":"do-not-echo",',
      JSON.stringify({ ...record(), logs: 'do-not-echo' }),
      'x'.repeat(128 * 1024 + 1),
    ]) {
      writeFileSync(path, content);
      result = spawnSync(process.execPath, [exporter, path], { encoding: 'utf8' });
      assert.equal(result.status, 1);
      assert.equal(result.stdout, '');
      assert.match(result.stderr, /Report export failed/);
      assert.ok(!result.stderr.includes('do-not-echo'));
    }
  } finally {
    rmSync(directory, { recursive: true });
  }
});
