const core = require('@actions/core');
const exec = require('@actions/exec')
const github = require('@actions/github');

try {
  // input defined in action metadata file
  const appName = core.getInput('app-name');
  const storageType = core.getInput('storage-type');
    
  // Get the JSON webhook payload for the event that triggered the workflow
  const payload = JSON.stringify(github.context.payload, undefined, 2)
  console.log(`The event payload: ${payload}`);
} catch (error) {
  
}

async function build() {
  const setupCommand = core.getInput('setup-command')
  const buildCommand = core.getInput('buildCommand')
}

async function upload() {

}

async function generateUrl() {

}

async function main() {
  await build();
  const appName = core.getInput('app-name');
  const storageType = core.getInput('storage-type');
  const url = await generateUrl();
  return url
}

try {
  main();
} catch (error) {
  core.setFailed(error.message);
}
