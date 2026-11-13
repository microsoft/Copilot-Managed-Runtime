// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

const assert = require('node:assert/strict');
const childProcess = require('node:child_process');
const fs = require('node:fs');

const spawn = childProcess.spawn;
const cliEnv = env => Object.fromEntries(Object.entries(env).filter(([key]) =>
    key.startsWith('MS_CLI_') || key === 'TEST_PASSTHROUGH'
));
childProcess.spawn = (command, args, options) => {
    assert.match(command, /(?:^|[/\\])ms(?:\.cmd|\.exe)?$/i);
    assert.notEqual(options.env, process.env);
    fs.appendFileSync(process.env.TEST_DEPLOY_CALLS, JSON.stringify({
        args,
        env: cliEnv(options.env),
        parentEnv: cliEnv(process.env),
    }) + '\n');
    return spawn(process.execPath, [
        '-e',
        'console.log(JSON.stringify({appId:"deployed-app",commitHash:"deployed-commit"}))',
    ], options);
};
