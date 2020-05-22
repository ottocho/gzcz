const fs = require('fs');
const core = require('@actions/core');
const exec = require('@actions/exec');
const glob = require('@actions/glob');
const github = require('@actions/github');
const { Storage } = require('@google-cloud/storage');

const GCS_KEY_PATH = '/tmp/gcp_key.json'

function getPath(appName, commitSha) {
  return `bundle/${appName}/commit-${commitSha}`
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
  await exec.exec(`zip -r /tmp/jsbundle.zip ${filePath}`)
  const storage = new Storage({
    projectId: core.getInput("storage_project_id"),
    keyFilename: GCS_KEY_PATH
  });
  const options = {
    destination: `${destPath}/jsbundle.zip`
  }
  const bucket = storage.bucket(core.getInput("storage_bucket"))
  console.log('uploading...')
  return bucket.upload('/tmp/jsbundle.zip', options).catch(e => {
    console.log('error uploading files...')
    console.log(e)
    throw(e)
  })
}

function generateUrl(destPath) {
  // logic to generate deep url and QR code
  return `rn-tophat://${destPath}`
}

async function main() {
  saveKeyFile()
  const token = core.getInput("github_token");
  const octokit = new github.GitHub(token)
  const {
    GITHUB_ACTOR: actor,
    GITHUB_REPOSITORY: repository,
    GITHUB_WORKSPACE: workspacePath,
    GITHUB_EVENT_PATH: eventPath
  } = process.env
  const event = JSON.parse(fs.readFileSync(eventPath))
  const pr = event.pull_request
  const prNumber = pr.number
  const [repoOwner, repoName] = repository.split('/')
  console.log(pr._links.comments)
  console.log(`repository: ${repository}`)
  console.log(`PR #${prNumber}`)
  console.log(`Actor: ${actor}`)
  const commitSha = pr.head.sha;
  const appName = core.getInput('app_name')
  const destPath = getPath(appName, commitSha)
  const jsbundlePath = `${workspacePath}/${core.getInput('dist_path')}`
  console.log(`jsbundle path: ${jsbundlePath}`)
  await upload(jsbundlePath, destPath)
  const url = generateUrl(destPath)
  const body = `
Use this QR code to load commit ${commitSha.slice(0,7)}\n
![](https://api.qrserver.com/v1/create-qr-code/?size=300&data=${url})\n
Or copy and paste this url:\n
${url}
`
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
