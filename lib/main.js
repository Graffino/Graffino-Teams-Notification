"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const rest_1 = require("@octokit/rest");
const axios_1 = __importDefault(require("axios"));
const moment_timezone_1 = __importDefault(require("moment-timezone"));
const message_card_1 = require("./message-card");
var JobStatus;
(function (JobStatus) {
    JobStatus["FAILURE"] = "failure";
    JobStatus["SUCCESS"] = "success";
})(JobStatus || (JobStatus = {}));
const DEFAULT_TIMEOUT = 5000;
const escapeMarkdownTokens = (text) => text
    .replace(/\n\ {1,}/g, '\n ')
    .replace(/\_/g, '\\_')
    .replace(/\*/g, '\\*')
    .replace(/\|/g, '\\|')
    .replace(/#/g, '\\#')
    .replace(/-/g, '\\-')
    .replace(/>/g, '\\>');
const basicConfig = {
    success: {
        title: 'Workflow succedeed 🚀 🥷🏼',
    },
    failure: {
        title: 'Workflow failed 😵🫠',
    },
    noStatus: {
        title: 'GitHub Action Notification'
    }
};
class TimeoutError extends Error {
    constructor(message) {
        super(message);
        this.name = 'TimeoutError';
    }
}
async function run() {
    try {
        const githubToken = core.getInput('github-token', { required: true });
        const msTeamsWebhookUri = core.getInput('ms-teams-webhook-uri', {
            required: true
        });
        const timeout = core.getInput('timeout')
            ? core.getInput('timeout')
            : DEFAULT_TIMEOUT;
        if (isNaN(Number(timeout))) {
            throw Error('Timeout should be a number');
        }
        let defaultConfig = basicConfig.noStatus;
        try {
            const job = JSON.parse(core.getInput('job'));
            defaultConfig =
                job.status == JobStatus.FAILURE
                    ? basicConfig.failure
                    : basicConfig.success;
        }
        catch (error) {
            console.log('Job was not provided');
        }
        const notificationSummary = core.getInput('notification-summary') || defaultConfig.title;
        const timezone = core.getInput('timezone') || 'UTC';
        const timestamp = (0, moment_timezone_1.default)()
            .tz(timezone)
            .format('dddd, MMMM Do YYYY, h:mm:ss a z');
        const [owner, repo] = (process.env.GITHUB_REPOSITORY || '').split('/');
        const sha = process.env.GITHUB_SHA || '';
        const runId = process.env.GITHUB_RUN_ID || '';
        const runNum = process.env.GITHUB_RUN_NUMBER || '';
        const params = { owner, repo, ref: sha };
        const repoName = params.owner + '/' + params.repo;
        const repoUrl = `https://github.com/${repoName}`;
        const octokit = new rest_1.Octokit({ auth: `token ${githubToken}` });
        const commit = await octokit.repos.getCommit(params);
        const author = commit.data.author;
        const messageCard = await (0, message_card_1.createMessageCard)(notificationSummary, commit, author, runNum, runId, repoName, sha, repoUrl, timestamp);
        const timeoutPromise = new Promise((resolve, reject) => {
            setTimeout(() => {
                reject(new TimeoutError(`Timeout exceeded: ${timeout}ms`));
            }, +timeout);
        });
        const webhook = axios_1.default.post(msTeamsWebhookUri, messageCard);
        await Promise.race([timeoutPromise, webhook]);
    }
    catch (error) {
        if (error instanceof TimeoutError) {
            core.warning(error.message);
            process.exit();
        }
    }
}
run();
