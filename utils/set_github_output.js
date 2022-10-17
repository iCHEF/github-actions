const { appendFileSync } = require('node:fs');
const { EOL } = require('node:os');

// to support Github's latest method for setting output
// ref: https://github.com/actions/toolkit/pull/1178
const setOutput = (key, value) => {
  const GITHUB_OUTPUT = process.env.GITHUB_OUTPUT;
  if (!GITHUB_OUTPUT) {
    console.warn('Warning: $GITHUB_OUTPUT not exist.');
    console.log('key:', key);
    console.log('value:', value);
    return;
  }

  appendFileSync(
    GITHUB_OUTPUT,
    `${key}=${value}${EOL}`,
    { encoding: 'utf-8' }
  );
};

module.exports = setOutput;
