// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { describe, test } = require('node:test');

const credentials = {
    'app-id': 'input-client',
    'client-secret': 'input-secret',
    'tenant-id': 'input-tenant',
};
const inheritedCredentials = {
    MS_CLI_USE_SP_AUTH: 'true',
    MS_CLI_SP_CLIENT_ID: 'cached-client',
    MS_CLI_SP_CLIENT_SECRET: 'cached-secret',
    MS_CLI_SP_TENANT_ID: 'cached-tenant',
};
const inputNames = Object.keys(credentials);
const partialInputsError =
    'Partial Service Principal inputs supplied. Provide all of app-id, client-secret, tenant-id, or omit all three. Deployment was not started.';

function runAction(t, inputs = {}, inherited = {}, repoType = 'none') {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'cmr-deploy-test-'));
    t.after(() => fs.rmSync(cwd, { recursive: true, force: true }));
    fs.writeFileSync(path.join(cwd, 'ms.config.json'), JSON.stringify({
        appId: 'target-app',
        environmentId: 'target-environment',
        repoType,
    }));
    fs.writeFileSync(path.join(cwd, process.platform === 'win32' ? 'ms.exe' : 'ms'), '', { mode: 0o755 });
    const callsPath = path.join(cwd, 'calls.jsonl');
    const env = Object.fromEntries(Object.entries(process.env).filter(([key]) =>
        !/^(INPUT_|MS_CLI_|MS_MANAGED_APPS_|GITHUB_|CI$|NODE_OPTIONS$|PATH$|TEST_)/i.test(key)
    ));
    Object.assign(env, {
        HOME: cwd,
        USERPROFILE: cwd,
        PATH: cwd,
        GITHUB_ACTIONS: 'true',
        GITHUB_WORKSPACE: cwd,
        GITHUB_SHA: 'checkout-commit',
        CI: 'true',
        MS_MANAGED_APPS_INSTALLED: 'true',
        TEST_DEPLOY_CALLS: callsPath,
        TEST_PASSTHROUGH: 'preserved',
    }, inherited);
    for (const [key, value] of Object.entries(inputs)) {
        env[`INPUT_${key.toUpperCase()}`] = value;
    }

    const result = spawnSync(process.execPath, [
        '--require', path.join(__dirname, 'fixtures', 'deploy-process.cjs'),
        path.resolve(__dirname, '..', 'dist', 'actions', 'ms-app-deploy', 'index.js'),
    ], { env, encoding: 'utf8', timeout: 10000 });
    assert.ifError(result.error);
    assert.equal(result.signal, null);
    const calls = fs.existsSync(callsPath)
        ? fs.readFileSync(callsPath, 'utf8').trim().split('\n').map(line => JSON.parse(line))
        : [];
    for (const call of calls) {
        assert.deepEqual(call.parentEnv, {
            ...inherited,
            TEST_PASSTHROUGH: 'preserved',
        }, 'action must not mutate its own inherited identity environment');
    }
    // The Actions SDK must emit the masking command, but diagnostics must not
    // contain input or inherited credential values.
    const diagnostics = (result.stdout + result.stderr)
        .split(/\r?\n/).filter(line => !line.startsWith('::add-mask::')).join('\n');
    for (const value of [...Object.values(credentials), ...Object.values(inheritedCredentials)]) {
        if (value !== 'true') assert.ok(!diagnostics.includes(value), 'credential value in diagnostics');
    }
    return { ...result, calls, diagnostics };
}

describe('bundled ms-app-deploy', () => {
    for (let mask = 1; mask < 7; mask++) {
        const inputs = Object.fromEntries(inputNames.filter((_, i) => mask & (1 << i))
            .map(name => [name, credentials[name]]));
        for (const [context, inherited] of [
            ['clean environment', {}],
            ['cached SP environment', inheritedCredentials],
        ]) {
            test(`rejects ${Object.keys(inputs).join(' + ')} with ${context}`, t => {
                const result = runAction(t, inputs, inherited);
                assert.equal(result.calls.length, 0, 'invalid inputs must not spawn deploy');
                assert.equal(result.status, 1);
                assert.ok(result.diagnostics.includes(partialInputsError));
            });
        }
    }

    for (const blankInput of inputNames) {
        test(`whitespace-only ${blankInput} is missing, even with cached credentials`, t => {
            const result = runAction(t, {
                ...credentials,
                [blankInput]: ' \t\n ',
            }, inheritedCredentials);
            assert.equal(result.calls.length, 0, 'invalid inputs must not spawn deploy');
            assert.equal(result.status, 1);
            assert.ok(result.diagnostics.includes(partialInputsError));
        });
    }

    for (const [context, inherited] of [
        ['clean environment', {}],
        ['cached environment with SP auth disabled', {
            ...inheritedCredentials,
            MS_CLI_USE_SP_AUTH: 'false',
        }],
    ]) {
        test(`complete inputs override ${context}`, t => {
            const result = runAction(t, Object.fromEntries(inputNames
                .map(name => [name, ` \t${credentials[name]} \n`])), inherited);
            assert.equal(result.status, 0, result.diagnostics);
            assert.equal(result.calls.length, 1);
            assert.deepEqual(result.calls[0].args, ['app', 'deploy', '--non-interactive', '--json']);
            assert.deepEqual(result.calls[0].env, {
                MS_CLI_USE_SP_AUTH: 'true',
                MS_CLI_USE_HTTP_FORWARD: 'false',
                MS_CLI_USE_NOOP_AUTH: 'false',
                MS_CLI_SP_CLIENT_ID: credentials['app-id'],
                MS_CLI_SP_CLIENT_SECRET: credentials['client-secret'],
                MS_CLI_SP_TENANT_ID: credentials['tenant-id'],
                MS_CLI_CLOUD_INSTANCE: 'test',
                TEST_PASSTHROUGH: 'preserved',
            });
            assert.ok(result.stdout.includes('::add-mask::input-secret'));
            assert.ok(result.stdout.includes('::set-output name=app-id::deployed-app'));
        });
    }

    for (const [context, inherited] of [
        ['clean environment', {}],
        ['cached SP environment', inheritedCredentials],
        ['incomplete inherited environment', { MS_CLI_SP_CLIENT_ID: 'cached-client' }],
        ['alternate provider flags', {
            MS_CLI_USE_HTTP_FORWARD: ' yes ',
            MS_CLI_USE_NOOP_AUTH: 'ON',
        }],
    ]) {
        test(`no inputs preserve ${context} for CLI identity selection`, t => {
            const result = runAction(t, {}, inherited);
            assert.equal(result.status, 0, result.diagnostics);
            assert.equal(result.calls.length, 1);
            assert.deepEqual(result.calls[0].env, {
                ...inherited,
                MS_CLI_CLOUD_INSTANCE: 'test',
                TEST_PASSTHROUGH: 'preserved',
            });
        });
    }

    test('three whitespace-only inputs behave as omitted inputs', t => {
        const result = runAction(t, Object.fromEntries(inputNames
            .map(name => [name, ' \t\n '])), inheritedCredentials);
        assert.equal(result.status, 0, result.diagnostics);
        assert.equal(result.calls.length, 1);
        assert.deepEqual(result.calls[0].env, {
            ...inheritedCredentials,
            MS_CLI_CLOUD_INSTANCE: 'test',
            TEST_PASSTHROUGH: 'preserved',
        });
    });

    for (const flag of ['MS_CLI_USE_HTTP_FORWARD', 'MS_CLI_USE_NOOP_AUTH']) {
        for (const enabled of ['true', '1', 'yes', 'on', ' TrUe ']) {
            test(`complete inputs disable inherited ${flag}=${JSON.stringify(enabled)} in child only`, t => {
                const result = runAction(t, credentials, {
                    ...inheritedCredentials,
                    [flag]: enabled,
                });
                assert.equal(result.status, 0, result.diagnostics);
                assert.equal(result.calls.length, 1);
                assert.equal(result.calls[0].env.MS_CLI_USE_SP_AUTH, 'true');
                assert.equal(result.calls[0].env.MS_CLI_USE_HTTP_FORWARD, 'false');
                assert.equal(result.calls[0].env.MS_CLI_USE_NOOP_AUTH, 'false');
            });
        }
    }

    for (const [mode, repoType, inputs, extraArgs] of [
        ['artifact', 'none', { 'artifact-path': 'app.zip' }, ['--artifact']],
        ['commit', 'github', { 'commit-sha': 'requested-commit' }, ['--commit', 'requested-commit']],
        ['default commit', 'native', {}, ['--commit', 'checkout-commit']],
    ]) {
        test(`partial credentials cannot launch ${mode} deployment`, t => {
            const result = runAction(t, { ...inputs, 'app-id': credentials['app-id'] },
                inheritedCredentials, repoType);
            assert.equal(result.calls.length, 0, 'invalid inputs must not spawn deploy');
            assert.equal(result.status, 1);
            assert.ok(result.diagnostics.includes(partialInputsError));
        });

        test(`complete credentials preserve ${mode} deployment`, t => {
            const result = runAction(t, { ...inputs, ...credentials }, {}, repoType);
            assert.equal(result.status, 0, result.diagnostics);
            assert.equal(result.calls.length, 1);
            const args = result.calls[0].args;
            assert.deepEqual(args.slice(0, 4), ['app', 'deploy', '--non-interactive', '--json']);
            assert.deepEqual(args.slice(4, 4 + extraArgs.length), extraArgs);
            if (mode === 'artifact') assert.ok(path.isAbsolute(args[5]));
        });
    }
});
