const core = require('@actions/core');
const exec = require('@actions/exec')
const github = require('@actions/github');

async function build() {
  const setupCommand = core.getInput('setup_command')
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
  const prNumber = core.getInput("pr_number")
  const octokit = new github.GitHub(token)
  console.log(process.env)
  const repository = process.env.GITHUB_REPOSITORY.split("/")
  core.debug(`repository: ${repository}`)
  core.debug(`PR #${prNumber}`)
  const pr = await octokit.pulls.get({
    pull_number: prNumber,
    owner: repository[0],
    repo: repository[1]
  })
  console.log(pr.data)
  const commitSha = pr.data.sha
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
