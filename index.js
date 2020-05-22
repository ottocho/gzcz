const fs = require('fs');
const core = require('@actions/core');
const exec = require('@actions/exec');
const glob = require('@actions/glob');
const github = require('@actions/github');
const { Storage } = require('@google-cloud/storage');

const GCS_KEY_PATH = '/tmp/gcp_key.json'

function getPath(appName, commitSha) {
  return `bundle/${appName}/COMMIT-${commitSha}`
}

function decodeBase64(data) {
  const buff = Buffer.from(data, 'base64')
  return buff.toString('ascii')
}

function saveKeyFile() {
  fs.writeFileSync(GCS_KEY_PATH, decodeBase64(core.getInput("storage_auth_token")))
}

async function getJsbundlePath(path) {
  const globber = await glob.create(path)
  const files = await globber.glob()
  return files[0]
}

async function upload(filePath, destPath) {
  // logic for uploading to gcs/s3
  await exec.exec(`zip -r /tmp/jsbundle.zip ${filePath}`)
  const storage = new Storage({
    projectId: core.getInput("storage_project_id"),
    keyFilename: GCS_KEY_PATH
  });
  const options = {
    destination: destPath
  }
  const bucket = storage.bucket(core.getInput("storage_bucket"))
  console.log('uploading...')
  return bucket.upload('/tmp/jsbundle.zip', options).catch(e => {
    console.log('error uploading files...')
    console.log(e)
    throw(e)
  })
}

async function generateUrl(destPath) {
  // logic to generate deep url and QR code
  return `rn-tophat://${destPath}`
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
  const jsbundlePath = await getJsbundlePath(core.getInput('dist_path'))
  console.log(`jsbundle path: ${jsbundlePath}`)
  await upload(jsbundlePath, destPath)
  console.log(`Commit path: ${path}`)
  const url = generateUrl(destPath)
  const body = `[](https://api.qrserver.com/v1/create-qr-code/?size=300&data=${url})`
  const { data: comment } = await octokit.issues.createComment({
    owner: repoOwner,
    repo: repoName,
    issue_number: prNumber,
    body
  })
  return comment.id
}

main().catch(function(error) {
  core.setFailed(error.message)
})
