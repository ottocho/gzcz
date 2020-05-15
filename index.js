const core = require('@actions/core');
const exec = require('@actions/exec')
const github = require('@actions/github');

async function build() {
  const setupCommand = core.getInput('setup_command')
  const buildCommand = core.getInput('build_command')
  console.log('Running setup...')
  await exec.exec(setupCommand)
  console.log('Building...')
  await exec.exec(buildCommand)
  console.log("Finished building.")
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
  const prNumber = core.getInput("pr_number")
  const octokit = new github.GitHub(token)
  const {
    GITHUB_SHA: commitSha,
    GITHUB_ACTOR: actor,
    GITHUB_REPOSITORY: repository
  } = process.env
  const [repoOwner, repoName] = repository.split('/')
  console.log(`repository: ${repository}`)
  console.log(`PR #${prNumber}`)
  console.log(`Actor: ${actor}`)
  const pr = await octokit.pulls.get({
    pull_number: prNumber,
    owner: repoOwner,
    repo: repoName
  })
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
