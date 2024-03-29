import * as core from '@actions/core'
import {Octokit} from '@octokit/rest'
import axios from 'axios'
import moment from 'moment-timezone'
import {createMessageCard} from './message-card'

enum JobStatus {
  FAILURE = 'failure',
  SUCCESS = 'success'
}

type Job = {
  status: JobStatus
}

const DEFAULT_TIMEOUT = 5000
const escapeMarkdownTokens = (text: string) =>
  text
    .replace(/\n\ {1,}/g, '\n ')
    .replace(/\_/g, '\\_')
    .replace(/\*/g, '\\*')
    .replace(/\|/g, '\\|')
    .replace(/#/g, '\\#')
    .replace(/-/g, '\\-')
    .replace(/>/g, '\\>')

const basicConfig = {
  success: {
    title: 'Workflow succedeed 🚀🥷🏼'
  },
  failure: {
    title: 'Workflow failed 😵🫠'
  },
  noStatus: {
    title: 'GitHub Action Notification'
  }
}

class TimeoutError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'TimeoutError'
  }
}

async function run(): Promise<void> {
  try {
    const githubToken = core.getInput('github-token', {required: true})
    const msTeamsWebhookUri: string = core.getInput('ms-teams-webhook-uri', {
      required: true
    })
    const timeout = core.getInput('timeout')
      ? core.getInput('timeout')
      : DEFAULT_TIMEOUT

    if (isNaN(Number(timeout))) {
      throw Error('Timeout should be a number')
    }

    let defaultConfig = basicConfig.noStatus

    try {
      const job = JSON.parse(core.getInput('job')) as Job

      defaultConfig =
        job.status == JobStatus.FAILURE
          ? basicConfig.failure
          : basicConfig.success
    } catch (error) {
      console.log('Job was not provided')
    }

    const notificationSummary =
      core.getInput('notification-summary') || defaultConfig.title
    const timezone = core.getInput('timezone') || 'UTC'

    const timestamp = moment()
      .tz(timezone)
      .format('dddd, MMMM Do YYYY, h:mm:ss a z')

    const [owner, repo] = (process.env.GITHUB_REPOSITORY || '').split('/')
    const sha = process.env.GITHUB_SHA || ''
    const runId = process.env.GITHUB_RUN_ID || ''
    const runNum = process.env.GITHUB_RUN_NUMBER || ''
    const params = {owner, repo, ref: sha}
    const repoName = params.owner + '/' + params.repo
    const repoUrl = `https://github.com/${repoName}`

    const octokit = new Octokit({auth: `token ${githubToken}`})
    const commit = await octokit.repos.getCommit(params)
    const author = commit.data.author

    const messageCard = await createMessageCard(
      notificationSummary,
      commit,
      author,
      runNum,
      runId,
      repoName,
      sha,
      repoUrl,
      timestamp
    )

    const timeoutPromise = new Promise((resolve, reject) => {
      setTimeout(() => {
        reject(new TimeoutError(`Timeout exceeded: ${timeout}ms`))
      }, +timeout)
    })

    const webhook = axios.post(msTeamsWebhookUri, messageCard)

    await Promise.race([timeoutPromise, webhook])
  } catch (error) {
    if (error instanceof TimeoutError) {
      core.warning(error.message)
      process.exit()
    }
  }
}

run()
