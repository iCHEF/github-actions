const path = require('node:path');

const packageJsonPath = path.resolve('./package.json');
const packageJson = require(packageJsonPath);

const version = packageJson.version;
console.log(`version: ${version}`);
console.log(`::set-output name=version::${version}`);
