"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMessageCard = void 0;
function createMessageCard(notificationSummary, commit, author, runNum, runId, repoName, sha, repoUrl, timestamp) {
    let avatar_url = 'https://www.gravatar.com/avatar/05b6d8cc7c662bf81e01b39254f88a48?d=identicon';
    if (author) {
        if (author.avatar_url) {
            avatar_url = author.avatar_url;
        }
    }
    const messageCard = {
        '@type': 'MessageCard',
        '@context': 'https://schema.org/extensions',
        summary: notificationSummary,
        title: notificationSummary,
        sections: [
            {
                activityTitle: `**CI #${runNum} (commit ${sha.substr(0, 7)})** on [${repoName}](${repoUrl})`,
                activityImage: avatar_url,
                activitySubtitle: `by ${commit.data.commit.author.name} [(@${author.login})](${author.html_url}) on ${timestamp}`
            }
        ],
        potentialAction: [
            {
                '@context': 'http://schema.org',
                target: [`${repoUrl}/actions/runs/${runId}`],
                '@type': 'ViewAction',
                name: 'View Workflow Run'
            },
            {
                '@context': 'http://schema.org',
                target: [commit.data.html_url],
                '@type': 'ViewAction',
                name: 'View Commit Changes'
            }
        ]
    };
    return messageCard;
}
exports.createMessageCard = createMessageCard;
