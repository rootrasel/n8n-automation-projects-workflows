# Credentials & Environment Variables Checklist

This document details all API credentials, OAuth tokens, and environment variables required to run the 7 Common-Law.ai workflows in n8n.

---

## 1. Environment Variables (`.env`)

Add these variables to your n8n environment (e.g., Docker container environment, `.env` file, or system environment):

| Variable Name | Required By | Description | Example / Default |
| :--- | :--- | :--- | :--- |
| `WORDPRESS_BASE_URL` | WF1, WF3, WF4, WF5, WF6 | Base URL of WordPress site without trailing slash. | `https://common-law.ai` |
| `WORDPRESS_DEFAULT_POST_STATUS` | WF4 | Default status for created articles (`draft` or `publish`). | `draft` |
| `GOOGLE_SHEETS_SPREADSHEET_ID` | WF2, WF3, WF4, WF5, WF6, WF7 | ID from Google Spreadsheet URL. | `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms` |
| `WF2_WEBHOOK_URL` | WF1 | URL of the WF2 webhook trigger in n8n. | `http://localhost:5678/webhook/wf2-gap-report` |
| `WF6_WEBHOOK_URL` | WF5 | URL of the WF6 webhook trigger in n8n. | `http://localhost:5678/webhook/wf6-published-article` |
| `SERPER_API_KEY` | WF2 | API Key for Serper Google Search. | `serper_live_...` |
| `COURTLISTENER_API_TOKEN` | WF2, WF3 | Free Judicial opinion search token from Free Law Project. | `Token 8374...` |
| `ALERT_WEBHOOK_URL` | WF3, WF6, WF7 | Discord / Slack Webhook for team alerts. | `https://discord.com/api/webhooks/...` |
| `SLACK_WEBHOOK_URL` | WF3, WF6, WF7 | Dedicated Slack incoming webhook. | `https://hooks.slack.com/services/...` |

---

## 2. n8n Saved Credentials

The workflows use named n8n credentials for secure authentication without leaking secrets into JSON exports.

### 1. OpenAI API (`openAiApi`)
- **Credential Name**: `OpenAI CommonLaw API Key`
- **Internal ID**: `openai-commonlaw-creds`
- **Used by**: WF1, WF2, WF3, WF6
- **Requirements**: Access to models `gpt-4o` and `gpt-4o-mini`.

### 2. OpenAI Bearer Header Auth (`httpHeaderAuth`)
- **Credential Name**: `OpenAI Bearer Auth CommonLaw`
- **Internal ID**: `openai-bearer-token-creds`
- **Used by**: WF4 (DALL-E 3 image generation)
- **Header Name**: `Authorization`
- **Value**: `Bearer sk-proj-...`

### 3. Google Sheets OAuth2 API (`googleSheetsOAuth2Api`)
- **Credential Name**: `Google Sheets OAuth CommonLaw`
- **Internal ID**: `googlesheets-commonlaw-creds`
- **Used by**: WF2, WF3, WF4, WF5, WF6, WF7
- **Requirements**: Read and Write access to Google Sheets via Google Cloud Console OAuth 2.0 Client.

### 4. WordPress Application Password (`httpBasicAuth`)
- **Credential Name**: `WordPress Application Password CommonLaw`
- **Internal ID**: `wordpress-app-password-creds`
- **Used by**: WF4 (Media upload, post draft creation), WF5 (Publishing)
- **Username**: Your WordPress administrator / editor username.
- **Password**: An **Application Password** generated under `Users -> Profile -> Application Passwords`.
- > [!IMPORTANT]
  > The user MUST have **Administrator** or **Editor** role. Standard Author roles cannot modify Rank Math post meta or upload unrestricted media.

### 5. DataForSEO API (`httpBasicAuth`)
- **Credential Name**: `DataForSEO API Credentials`
- **Internal ID**: `dataforseo-creds`
- **Used by**: WF2 (Real SEO search volume and metrics)
- **Username**: DataForSEO account login.
- **Password**: DataForSEO API password.

---

## 3. Social Media Channel Credentials (WF6)

When enabling live social media broadcast, configure credentials for your target platforms:
- **LinkedIn**: Organization OAuth 2.0 Bearer Token with `w_member_social` or `w_organization_social` scope.
- **X (Twitter)**: Twitter API v2 Bearer Token / OAuth 1.0a User Context.
- **Facebook Pages**: Permanent Page Access Token with `pages_manage_posts` permission.
- **Bluesky**: App Password generated under Bluesky Settings -> App Passwords.
- **Threads**: Threads Graph API Access Token.
