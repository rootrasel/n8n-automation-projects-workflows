# Common-Law.ai — Legal Content Automation System
## Complete Architecture & Implementation Plan (Unified 7-Workflow Architecture)

---

## 1. Project Overview & Scope Alignment

The objective is to design, implement, and maintain a robust, enterprise-grade automated legal content pipeline for **common-law.ai** powered by **n8n**, **OpenAI (GPT-4o, GPT-4o-mini, DALL-E 3)**, **WordPress REST API (Rank Math SEO)**, **Google Sheets**, and multi-channel **Social Media APIs**.

### Master Architecture Pipeline
```text
Common-Law.ai Website & SEO Data
             │
             ▼
WF1: Website Content Gap Analysis (Daily 01:00 AM Cron)
             │ (Structured JSON Gap Report via Webhook)
             ▼
WF2: Legal Topic Research & Ranking (SERP Evidence, CourtListener Authority, Intent)
             │ (Scores Topics 1–100, Assigns Unique Topic ID)
             ▼
Google Sheets Master Database (Topic_Bank)
             │ (Select Approved Topic: Status = NEW / APPROVED)
             ▼
WF3: SEO Legal Article Generation (Outline, Draft, Primary Citation Verification)
             │
             ├──► Legal Safeguard Review (Passed vs Requires Human Review Alert)
             ▼
WF4: AI Featured Image & WordPress Draft (DALL-E 3, Media Upload, Rank Math Meta)
             │ (Creates Post Draft & Saves to Publishing_Queue)
             ▼
Google Sheets Publishing Queue (Publishing_Queue)
             │ (Daily 09:00 AM Cron Buffer Check)
             ▼
WF5: Scheduled Publishing (Approval Verification, REST API Publish, HTTP 200 Verify)
             │ (Triggers WF6 via Webhook)
             ▼
WF6: Social Media Distribution (LinkedIn, X / Twitter, Facebook, Bluesky, Threads)
             │ (Broadcasts Tailored Copy, Updates Social Status)
             ▼
Public Distribution & Status Logged (DISTRIBUTED)

─────────────────────────────────────────────────────────────────────────────
* WF7: Monitoring, Logging & Error Handling serves as the centralized Error Trigger
  across all workflows, logging execution contexts to Execution_Logs, retrying
  transient errors (429, 502, timeouts), and alerting administrators if manual recovery is required.
```

---

## 2. The 7 Production Workflows Breakdown

### WF1 — Website Content Gap Analysis
- **File**: [`01_WF1_Website_Content_Gap_Analysis.json`](file:///home/softvence/Projects_Hub/n8n-automation-projects-workflows/legal_content_system_for_common_law.ai/workflows/01_WF1_Website_Content_Gap_Analysis.json)
- **Trigger**: Schedule Trigger (`0 1 * * *` - Daily 01:00 AM)
- **Function**: Queries all existing published WordPress posts, extracts titles, slugs, and categories. Compares coverage against target legal practice areas (Family Law, Estate Planning, Corporate, Criminal Defense, Personal Injury, Real Estate, Employment, Immigration, Bankruptcy, Constitutional Rights). Generates a structured JSON gap report and dispatches it to the WF2 webhook.

### WF2 — Legal Topic Research and Ranking
- **File**: [`02_WF2_Legal_Topic_Research_and_Ranking.json`](file:///home/softvence/Projects_Hub/n8n-automation-projects-workflows/legal_content_system_for_common_law.ai/workflows/02_WF2_Legal_Topic_Research_and_Ranking.json)
- **Trigger**: Webhook (`POST /webhook/wf2-gap-report`)
- **Function**: Normalizes incoming candidates, deduplicates, queries Google SERP evidence via Serper, verifies legal authority via CourtListener opinions API, analyzes jurisdiction & search intent, fetches SEO metrics when available (strictly without fabricating metrics), calculates priority score (1–100), and records vetted topics in `Topic_Bank` with status `NEW`.

### WF3 — SEO Legal Article Generation
- **File**: [`03_WF3_SEO_Legal_Article_Generation.json`](file:///home/softvence/Projects_Hub/n8n-automation-projects-workflows/legal_content_system_for_common_law.ai/workflows/03_WF3_SEO_Legal_Article_Generation.json)
- **Trigger**: Google Sheets (Select approved topic where `status = "NEW"`)
- **Function**: Performs deep authority research, creates an outline, synthesizes a complete 1,500-word legal article with strict citation whitelisting (`law.cornell.edu`, `justia.com`, `courtlistener.com`, `.gov`). Injects 5 structured FAQs, dynamic state- and practice-specific attorney directory CTAs (`/attorneys/?state=...`), legal disclaimers, and Schema.org JSON-LD (`Article` + `FAQPage`). Flags unverified claims for human legal review.

### WF4 — AI Featured Image and WordPress Draft
- **File**: [`04_WF4_AI_Featured_Image_and_WordPress_Draft.json`](file:///home/softvence/Projects_Hub/n8n-automation-projects-workflows/legal_content_system_for_common_law.ai/workflows/04_WF4_AI_Featured_Image_and_WordPress_Draft.json)
- **Trigger**: Sub-workflow Execution Trigger
- **Function**: Creates a high-fidelity image prompt (photorealistic, modern legal setting, zero text/letters), generates a 1792×1024 image via DALL-E 3, downloads the binary, uploads it to the WordPress Media Library (`/wp/v2/media`), creates the WordPress draft with Rank Math SEO custom meta (`rank_math_title`, `rank_math_description`, `rank_math_focus_keyword`), attaches media/taxonomies, and logs to `Publishing_Queue`.

### WF5 — Scheduled Publishing
- **File**: [`05_WF5_Scheduled_Publishing.json`](file:///home/softvence/Projects_Hub/n8n-automation-projects-workflows/legal_content_system_for_common_law.ai/workflows/05_WF5_Scheduled_Publishing.json)
- **Trigger**: Schedule Trigger (`0 9 * * *` - Daily 09:00 AM)
- **Function**: Fetches due drafts from `Publishing_Queue`, verifies required fields and approval, transitions the WordPress post to `publish`, verifies the live HTTP 200 URL, updates Google Sheets status, and triggers WF6 social distribution.

### WF6 — Social Media Distribution
- **File**: [`06_WF6_Social_Media_Distribution.json`](file:///home/softvence/Projects_Hub/n8n-automation-projects-workflows/legal_content_system_for_common_law.ai/workflows/06_WF6_Social_Media_Distribution.json)
- **Trigger**: Webhook (`POST /webhook/wf6-published-article`)
- **Function**: Fetches live post details from WordPress, generates tailored copy for LinkedIn, X (Twitter), Facebook, Bluesky, and Threads, broadcasts updates through configured channels, and records syndication status in `Publishing_Queue`.

### WF7 — Monitoring, Logging and Error Handling
- **File**: [`07_WF7_Monitoring_Logging_and_Error_Handling.json`](file:///home/softvence/Projects_Hub/n8n-automation-projects-workflows/legal_content_system_for_common_law.ai/workflows/07_WF7_Monitoring_Logging_and_Error_Handling.json)
- **Trigger**: Error Trigger (Centralized n8n Error Trigger)
- **Function**: Traps all uncaught exceptions across WF1–WF6, logs execution details to `Execution_Logs`, applies exponential backoff for transient HTTP errors (429, 502, timeouts), and sends instant notifications to Slack/Discord if manual recovery is required.

---

## 3. Implementation Status Checklist

- [x] **WF1 Workflow JSON**: Built, verified, and saved to [`01_WF1_Website_Content_Gap_Analysis.json`](file:///home/softvence/Projects_Hub/n8n-automation-projects-workflows/legal_content_system_for_common_law.ai/workflows/01_WF1_Website_Content_Gap_Analysis.json).
- [x] **WF2 Workflow JSON**: Built, verified, and saved to [`02_WF2_Legal_Topic_Research_and_Ranking.json`](file:///home/softvence/Projects_Hub/n8n-automation-projects-workflows/legal_content_system_for_common_law.ai/workflows/02_WF2_Legal_Topic_Research_and_Ranking.json).
- [x] **WF3 Workflow JSON**: Built, verified, and saved to [`03_WF3_SEO_Legal_Article_Generation.json`](file:///home/softvence/Projects_Hub/n8n-automation-projects-workflows/legal_content_system_for_common_law.ai/workflows/03_WF3_SEO_Legal_Article_Generation.json).
- [x] **WF4 Workflow JSON**: Built, verified, and saved to [`04_WF4_AI_Featured_Image_and_WordPress_Draft.json`](file:///home/softvence/Projects_Hub/n8n-automation-projects-workflows/legal_content_system_for_common_law.ai/workflows/04_WF4_AI_Featured_Image_and_WordPress_Draft.json).
- [x] **WF5 Workflow JSON**: Built, verified, and saved to [`05_WF5_Scheduled_Publishing.json`](file:///home/softvence/Projects_Hub/n8n-automation-projects-workflows/legal_content_system_for_common_law.ai/workflows/05_WF5_Scheduled_Publishing.json).
- [x] **WF6 Workflow JSON**: Built, verified, and saved to [`06_WF6_Social_Media_Distribution.json`](file:///home/softvence/Projects_Hub/n8n-automation-projects-workflows/legal_content_system_for_common_law.ai/workflows/06_WF6_Social_Media_Distribution.json).
- [x] **WF7 Workflow JSON**: Built, verified, and saved to [`07_WF7_Monitoring_Logging_and_Error_Handling.json`](file:///home/softvence/Projects_Hub/n8n-automation-projects-workflows/legal_content_system_for_common_law.ai/workflows/07_WF7_Monitoring_Logging_and_Error_Handling.json).
- [x] **Database Schema & Templates**: Complete CSV templates for `Topic_Bank`, `Publishing_Queue`, `Directory_Lookup`, and `Execution_Logs`.
- [x] **Environment Configuration**: Complete [`.env.example`](file:///home/softvence/Projects_Hub/n8n-automation-projects-workflows/legal_content_system_for_common_law.ai/.env.example) configuration file created.
- [x] **Mermaid Diagrams**: Master architecture & 7 individual workflow diagrams documented in [`docs/01_ARCHITECTURE_AND_MERMAID_DIAGRAMS.md`](file:///home/softvence/Projects_Hub/n8n-automation-projects-workflows/legal_content_system_for_common_law.ai/docs/01_ARCHITECTURE_AND_MERMAID_DIAGRAMS.md).
- [x] **Validation & Testing Suite**: 12 detailed test scenarios documented in [`docs/05_TEST_CASES_AND_VALIDATION.md`](file:///home/softvence/Projects_Hub/n8n-automation-projects-workflows/legal_content_system_for_common_law.ai/docs/05_TEST_CASES_AND_VALIDATION.md).
