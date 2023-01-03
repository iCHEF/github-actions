const core = require('@actions/core');
const setOutput = require('../utils/set_github_output');

const description = core.getInput("pr-description")

if(description.includes("https://app.asana.com")){
    setOutput('created', true);
}
else{
    setOutput('created', false);
}
