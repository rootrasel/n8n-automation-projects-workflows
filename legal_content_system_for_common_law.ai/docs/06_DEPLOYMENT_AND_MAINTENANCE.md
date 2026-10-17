# Deployment & Maintenance Guide

This document outlines best practices for deploying, monitoring, scaling, and maintaining the Common-Law.ai legal automation pipeline.

---

## 1. Production Execution Schedule

| Workflow | Execution Mode | Schedule / Interval | Purpose |
| :--- | :--- | :--- | :--- |
| **WF1 — Website Content Gap Analysis** | Cron Trigger | Daily at 01:00 AM (`0 1 * * *`) | Audits published content during low site traffic; finds topic gaps. |
| **WF2 — Legal Topic Research & Ranking** | Webhook Trigger | Triggered by WF1 or Manual | Evaluates SERP, legal sources, scores topics, appends to `Topic_Bank`. |
| **WF3 — SEO Legal Article Generation** | Sub-workflow / Manual | Triggered upon editorial approval | Ingests approved topic, verifies authorities, drafts article. |
| **WF4 — AI Featured Image & WP Draft** | Sub-workflow | Triggered by WF3 | Generates DALL-E 3 image, uploads media, creates WP draft. |
| **WF5 — Scheduled Publishing** | Cron Trigger | Daily at 09:00 AM (`0 9 * * *`) | Enforces 1-per-day publishing pace; verifies live URL. |
| **WF6 — Social Media Distribution** | Webhook Trigger | Triggered by WF5 upon publish | Dispatches platform-tailored social copy to channels. |
| **WF7 — Monitoring & Error Handling** | Error Trigger | Immediate (on any node failure) | Captures error, handles transient retries, alerts team on Slack. |

---

## 2. Maintenance & Routine Operations

### Weekly Review Routine
1. **Audit `Execution_Logs`**: Check for recurring errors or transient API timeouts from external search providers or WordPress.
2. **Review `Topic_Bank`**: Inspect new topics scored between 70–90 for approval or priority re-ranking.
3. **Check `Publishing_Queue`**: Ensure at least 3–5 approved articles are buffered in `draft` status to guarantee uninterrupted daily publishing.

### API Key & Quota Management
- **OpenAI**: Monitor token consumption across GPT-4o and DALL-E 3. Set monthly spending limits in OpenAI platform dashboard.
- **Serper / Search APIs**: Serper free tier provides 2,500 credits. WF2 consumes ~1 credit per candidate topic.
- **CourtListener**: Free Law Project API is rate-limited to 5,000 requests per hour with an authenticated token.

### WordPress REST API Health Checks
- Verify WordPress Application Passwords do not expire.
- If migrating servers or enabling Cloudflare / WAF, whitelist the n8n IP address to prevent REST API requests to `/wp-json/wp/v2/*` from being blocked by Cloudflare bot protection.
- Ensure Rank Math REST API integration remains active after plugin updates.

---

## 3. Disaster Recovery & Troubleshooting

### Scenario A: WordPress REST API Returns 401 Unauthorized
- **Cause**: Application password revoked or user role downgraded from Administrator/Editor to Author.
- **Resolution**: Re-generate an Application Password under the target user profile; verify user has `publish_posts` and `upload_files` capabilities.

### Scenario B: DALL-E 3 Rejects Prompt (Content Policy Flag)
- **Cause**: Legal terms such as "crime scene", "blood test", or "weapon" triggered OpenAI safety filters.
- **Resolution**: WF4 includes sanitized prompt formatting: prompts focus exclusively on professional legal offices, courtroom architecture, law libraries, and consultation settings without sensitive terminology.

### Scenario C: Social Media Token Expired
- **Resolution**: WF6 flags `social_status = FAILED` in `Publishing_Queue` without failing the published post on WordPress. Once tokens are renewed, re-trigger WF6 manually using the post ID.
