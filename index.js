const fs = require('fs');
const core = require('@actions/core');
const exec = require('@actions/exec');
const github = require('@actions/github');
const { Storage } = require('@google-cloud/storage');

const GCS_KEY_PATH = '/tmp/gcp_key'

function getPath(appName, commitSha) {
  return `/bundle/${appName}/COMMIT-${commitSha}`
}

function decodeBase64(data) {
  const buff = Buffer.from(data, 'base64')
  return buff.toString('ascii')
}

function saveKeyFile() {
  fs.writeFileSync(GCS_KEY_PATH, decodeBase64(core.getInput("storage_auth_token")))
}

async function upload(filePath, destPath) {
  // logic for uploading to gcs/s3
  const storage = new Storage({
    projectId: core.getInput("storage_project_id"),
    keyFilename: GCS_KEY_PATH
  });
  const options = {
    destination: destPath,
    gzip: true
  }
  const bucket = storage.bucket(core.getInput("storage_bucket"))
  console.log('uploading...')
  await bucket.upload(filePath, options)
}

async function generateUrl() {
  // logic to generate deep url and QR code
}

async function main() {
  saveKeyFile()
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
  const appName = core.getInput('app_name')
  const destPath = getPath(appName, commitSha)
  await upload(core.getInput('dist_path'), destPath)
  console.log(`Commit path: ${path}`)
  const url = await generateUrl()
  return url
}

main().catch(function(error) {
  core.setFailed(error.message)
})
