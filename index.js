const core = require('@actions/core');
const exec = require('@actions/exec')
const github = require('@actions/github');

async function build() {
  const setupCommand = core.getInput('setup-command')
  const buildCommand = core.getInput('build_command')
  await exec.exec(setupCommand)
  await exec.exec(buildCommand)
  core.setOutput("Finished building.")
}

function getPath(appName, commitSha) {
  return `${appName}/${commitSha}`
}

async function upload() {
  // logic for uploading to gcs/s3
}

async function generateUrl() {
  // logic to generate deep url and QR code
}

async function main() {
  const token = core.getInput("github_token");
  const octokit = new github.GitHub(token);
  console.log(octokit.context)
  const { sha: commitSha } = octokit.context
  await build()
  const appName = core.getInput('app_name')
  const storageType = core.getInput('storage_type')
  const path = getPath(appName, commitSha)
  console.log(`Commit path: ${path}`)
  const url = await generateUrl()
  return url
}

main().catch(function(error) {
  core.setFailed(error.message)
})
