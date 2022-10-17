const path = require('node:path');
const setOutput = require('../utils/set_github_output');

const packageJsonPath = path.resolve('./package.json');
const packageJson = require(packageJsonPath);

const version = packageJson.version;
console.log(`version: ${version}`);
setOutput('version', version);
