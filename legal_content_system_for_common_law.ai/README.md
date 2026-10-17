# Common-Law.ai — AI Legal Content Automation System

A production-ready, autonomous n8n automation ecosystem engineered for **common-law.ai**.

The system automates the complete legal content pipeline across 7 modular, decoupled workflows:
```text
Common-Law.ai Website & SEO Data
             │
             ▼
WF1 — Website Content Gap Analysis (01:00 AM Cron)
             │
             ▼ (Structured JSON Gap Report via Webhook)
WF2 — Legal Topic Research & Ranking
             │ (SERP Evidence, CourtListener Authority, Intent Analysis)
             ▼
Google Sheets Master Database (Topic_Bank)
             │
             ▼ (Select Approved Topic)
WF3 — SEO Legal Article Generation
             │ (Outline, Synthesis, Citation Whitelist, Schema.org, Attorney CTA)
             ▼
Legal Safeguard Review (Passed vs Requires Human Review Alert)
             │
             ▼
WF4 — AI Featured Image & WordPress Draft
             │ (DALL-E 3 16:9, Media Library Upload, Rank Math Meta Sync)
             ▼
Google Sheets Publishing Queue (Publishing_Queue)
             │
             ▼ (Daily 09:00 AM Cron)
WF5 — Scheduled Publishing
             │ (Approval Check, WP REST Status -> Publish, HTTP 200 Verification)
             ▼
WF6 — Social Media Distribution
             │ (LinkedIn, X / Twitter, Facebook, Bluesky, Threads)
             ▼
Public Channels & Status Tracking (DISTRIBUTED)

─────────────────────────────────────────────────────────────────────────────
* WF7 (Monitoring, Logging & Error Handling) acts as the global n8n Error Trigger,
  logging incidents to Execution_Logs, retrying transient errors, and alerting team.
```

---

## The 7 Production Workflows

All workflow definitions are located in [`workflows/`](file:///home/softvence/Projects_Hub/n8n-automation-projects-workflows/legal_content_system_for_common_law.ai/workflows/):

| # | Workflow File | Trigger | Core Functionality |
| :-: | :--- | :--- | :--- |
| **01** | [`01_WF1_Website_Content_Gap_Analysis.json`](file:///home/softvence/Projects_Hub/n8n-automation-projects-workflows/legal_content_system_for_common_law.ai/workflows/01_WF1_Website_Content_Gap_Analysis.json) | Cron (01:00 AM) | Audits existing WordPress articles across legal practice areas and US jurisdictions, discovers deficits, builds structured gap report, and posts to WF2 webhook. |
| **02** | [`02_WF2_Legal_Topic_Research_and_Ranking.json`](file:///home/softvence/Projects_Hub/n8n-automation-projects-workflows/legal_content_system_for_common_law.ai/workflows/02_WF2_Legal_Topic_Research_and_Ranking.json) | Webhook (`/wf2-gap-report`) | Normalizes candidates, queries Serper & CourtListener, evaluates search intent & jurisdiction, scores priority (1–100), and appends vetted records to `Topic_Bank`. |
| **03** | [`03_WF3_SEO_Legal_Article_Generation.json`](file:///home/softvence/Projects_Hub/n8n-automation-projects-workflows/legal_content_system_for_common_law.ai/workflows/03_WF3_SEO_Legal_Article_Generation.json) | Editorial Ingestion / Manual | Researches legal authorities, drafts full article, verifies citations against primary court/statutory domains, generates Rank Math SEO metadata, injects dynamic attorney directory CTAs and Schema.org JSON-LD, flags unverified claims for review. |
| **04** | [`04_WF4_AI_Featured_Image_and_WordPress_Draft.json`](file:///home/softvence/Projects_Hub/n8n-automation-projects-workflows/legal_content_system_for_common_law.ai/workflows/04_WF4_AI_Featured_Image_and_WordPress_Draft.json) | Sub-workflow Trigger | Generates photorealistic editorial image via DALL-E 3 (1792×1024, text-free), uploads binary to WP Media Library, creates WordPress draft via REST API with Rank Math custom meta, and logs to `Publishing_Queue`. |
| **05** | [`05_WF5_Scheduled_Publishing.json`](file:///home/softvence/Projects_Hub/n8n-automation-projects-workflows/legal_content_system_for_common_law.ai/workflows/05_WF5_Scheduled_Publishing.json) | Cron (09:00 AM) | Fetches due articles from `Publishing_Queue`, validates approvals, sets post status to `publish`, verifies live HTTP 200 URL, updates database, and triggers WF6. |
| **06** | [`06_WF6_Social_Media_Distribution.json`](file:///home/softvence/Projects_Hub/n8n-automation-projects-workflows/legal_content_system_for_common_law.ai/workflows/06_WF6_Social_Media_Distribution.json) | Webhook (`/wf6-published-article`) | Generates tailored copy for LinkedIn, X (Twitter), Facebook, Bluesky, and Threads, syndicates updates, and records distribution status in `Publishing_Queue`. |
| **07** | [`07_WF7_Monitoring_Logging_and_Error_Handling.json`](file:///home/softvence/Projects_Hub/n8n-automation-projects-workflows/legal_content_system_for_common_law.ai/workflows/07_WF7_Monitoring_Logging_and_Error_Handling.json) | Error Trigger | Global error catcher for all workflows. Logs execution context to `Execution_Logs`, applies exponential backoff on transient errors (429, 502, timeouts), and dispatches urgent alerts to Slack/Discord if manual recovery is required. |

---

## Master Database & Google Sheets Templates

Templates are provided in [`google_sheets_templates/`](file:///home/softvence/Projects_Hub/n8n-automation-projects-workflows/legal_content_system_for_common_law.ai/google_sheets_templates/):

1. **`Topic_Bank.csv`**: Researched legal topics, primary keywords, target jurisdictions, practice areas, editorial scores, and status lifecycle (`NEW` → `PUBLISHED`).
2. **`Publishing_Queue.csv`**: Post queue management, WordPress post IDs, live URLs, scheduled publish dates, and social syndication tracking (`PENDING` → `DISTRIBUTED`).
3. **`Directory_Lookup.csv`**: State codes, practice areas, custom directory URLs, and dynamic CTA copy.
4. **`Execution_Logs.csv`**: System audit trail, error logging, and retry queue tracking.

---

## Detailed Documentation Suite

Complete documentation is organized in [`docs/`](file:///home/softvence/Projects_Hub/n8n-automation-projects-workflows/legal_content_system_for_common_law.ai/docs/):
- [`docs/01_ARCHITECTURE_AND_MERMAID_DIAGRAMS.md`](file:///home/softvence/Projects_Hub/n8n-automation-projects-workflows/legal_content_system_for_common_law.ai/docs/01_ARCHITECTURE_AND_MERMAID_DIAGRAMS.md): Full Mermaid diagram architecture and individual diagrams for WF1–WF7.
- [`docs/02_DATABASE_AND_SHEETS_SCHEMA.md`](file:///home/softvence/Projects_Hub/n8n-automation-projects-workflows/legal_content_system_for_common_law.ai/docs/02_DATABASE_AND_SHEETS_SCHEMA.md): Complete field-by-field schema for all 4 tables.
- [`docs/03_CREDENTIALS_AND_ENV_CHECKLIST.md`](file:///home/softvence/Projects_Hub/n8n-automation-projects-workflows/legal_content_system_for_common_law.ai/docs/03_CREDENTIALS_AND_ENV_CHECKLIST.md): Checklist of all API keys, OAuth tokens, and environment variables.
- [`docs/04_SETUP_AND_CONNECTION_GUIDE.md`](file:///home/softvence/Projects_Hub/n8n-automation-projects-workflows/legal_content_system_for_common_law.ai/docs/04_SETUP_AND_CONNECTION_GUIDE.md): Step-by-step import, credential binding, and webhook connection instructions.
- [`docs/05_TEST_CASES_AND_VALIDATION.md`](file:///home/softvence/Projects_Hub/n8n-automation-projects-workflows/legal_content_system_for_common_law.ai/docs/05_TEST_CASES_AND_VALIDATION.md): 12 end-to-end test cases covering success, missing data, and failure paths.
- [`docs/06_DEPLOYMENT_AND_MAINTENANCE.md`](file:///home/softvence/Projects_Hub/n8n-automation-projects-workflows/legal_content_system_for_common_law.ai/docs/06_DEPLOYMENT_AND_MAINTENANCE.md): Production scheduling, quotas, troubleshooting, and maintenance routines.
