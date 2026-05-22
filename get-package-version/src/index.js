import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import * as core from '@actions/core';

const packageJsonPath = resolve('./package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

const version = packageJson.version;
console.log(`version: ${version}`);
core.setOutput('version', version);
