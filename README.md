# Microsoft Teams Notification

![Build Status](https://github.com/Graffino/Graffino-Teams-Notification/workflows/graffino-teams-notification-test/badge.svg)

A GitHub Action that sends customizable notifications to a dedicated Microsoft Teams channel.

## Usage

1. Add `MS_TEAMS_WEBHOOK_URI` on your repository's configs on Settings > Secrets. It is the [Webhook URI](https://docs.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors/how-to/add-incoming-webhook) of the dedicated Microsoft Teams channel for notification.

2. Add a new `step` on your workflow code below `actions/checkout@v2`:

```yaml
name: Graffino Teams Notification

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4
      - name: Notify dedicated teams channel
        uses: Graffino/Graffino-Teams-Notification@v2
        with:
          github-token: ${{ github.token }} 
          ms-teams-webhook-uri: ${{ secrets.MS_TEAMS_WEBHOOK_URI }}
          notification-summary: Your custom notification message 
          notification-color: 17a2b8
          timezone: Europe/Bucharest
```

3. Make it your own with the following configurations.
   - `github-token` - (required), set to the following:
     - `${{ github.token }}`
   - `webhook-uri` - (required), setup a new secret to store your Microsoft Teams Webhook URI (ex. `MS_TEAMS_WEBHOOK_URI`). Learn more about setting up [GitHub Secrets](https://help.github.com/en/actions/configuring-and-managing-workflows/creating-and-storing-encrypted-secrets) or [Microsoft Teams Incoming Webhook](https://docs.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors/how-to/add-incoming-webhook).
   - `notification-summary` (required), Your custom notification message (ex. Deployment Started or Build Successful)
   - `notification-color` (optional), Custom color to help distinguish type of notification. Can be any [HEX color](https://html-color.codes/). (ex. **007bff** or **17a2b8** for info, **28a745** success, **ffc107** warning, **dc3545** error, etc.)
   - `timezone` - (optional, defaults to `UTC`), a [valid database timezone name](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones), (ex. Australia/Sydney or America/Denver, etc.)
   - `timeout` - (optional, defaults to 5s), this prevents action from getting stuck when Teams WebHooks misbehave.
   - `job` - (automatically pulled from GitHub Actions), contains the stringified object for the current job, used to get the job status and display notification accordingly.

## Examples

As you can see below, the `notification-summary` and `notification-color` are being used to customize the appearance of the message. Use bright vibrant colors to notify your Microsoft Teams channel of warnings or errors in your GitHub Actions workflow.

![Notification screenshot](notification-color-screenshots.png)

### Emojis

Emoji support isn't great for incoming webhooks on Microsoft Teams yet. You can hack your way through it using HEX codes. For example, in `notification-summary` I used `Emojify! &#x1F6A2​​ &#x2705;` for the following screenshot. HEX codes for emojis [here](https://apps.timwhitlock.info/emoji/tables/unicode).

![Notification screenshot](notification-emoji-screenshot.png)
