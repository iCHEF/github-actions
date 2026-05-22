import * as core from '@actions/core';

const description = core.getInput('pr-description');

if (description.includes('https://app.asana.com')) {
  core.setOutput('created', true);
} else {
  core.setOutput('created', false);
}
