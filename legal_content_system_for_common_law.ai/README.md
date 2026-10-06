# Common-Law.ai — AI Legal Content Automation System

A production-ready, autonomous n8n automation ecosystem engineered for **common-law.ai**.

The system automates the entire legal content lifecycle:
```text
Legal Research & Signals (08:00 AM)
           │
           ▼
AI Scoring & Topic Ranking (1–100) ──────► Google Sheets (Topic_Bank)
                                                    │
                                                    ▼
Strategic Feedback Loop ◄──────────────── Topic Ingestion & Outline Engine
          │                                         │
          ▼                                         ▼
Content Gap Audit (01:00 AM)             Full AI Legal Article Generation
          │                              (H2/H3, FAQ, Rank Math SEO, JSON-LD)
          ▼                                         │
State x Practice Gap Matrix                         ▼
                                         DALL-E 3 Featured Image (16:9 1600x900)
                                         & WordPress Media Upload
                                                    │
                                                    ▼
                                         Dynamic Directory CTA & Internal Links
                                         (Targeted or Fallback "Get Matched")
                                                    │
                                                    ▼
                                         WordPress REST API Publishing (Rank Math)
                                                    │
                                                    ▼
                                         Scheduled 1/Day Publishing Queue
                                                    │
                                                    ▼
                                         Multi-Channel Social Syndication
                                         (Facebook, LinkedIn, X, Bluesky, Threads)
```

---

## Workflows Included

All workflows are located in the [`workflows/`](file:///home/softvence/Projects/n8n-automation-projects/legal_content_system_for_common_law.ai/workflows/) directory:

| Workflow File | Name | Trigger | Core Functionality |
| :--- | :--- | :--- | :--- |
| [`00_CommonLaw_Master_Orchestrator.json`](file:///home/softvence/Projects/n8n-automation-projects/legal_content_system_for_common_law.ai/workflows/00_CommonLaw_Master_Orchestrator.json) | Master Production Orchestrator | Daily 08:00 AM / Manual | Sequentially coordinates research, generation, queue verification, and syndication. |
| [`01_Legal_Topic_Research_and_Ranking.json`](file:///home/softvence/Projects/n8n-automation-projects/legal_content_system_for_common_law.ai/workflows/01_Legal_Topic_Research_and_Ranking.json) | Legal Topic Research & Ranking | Cron 08:00 AM / Manual | Scrapes legal news RSS, court rulings, search volume signals, AI legal developments; scores topics (1–100); appends to Google Sheets `Topic_Bank`. |
| [`02_SEO_Article_and_Schema_Generation.json`](file:///home/softvence/Projects/n8n-automation-projects/legal_content_system_for_common_law.ai/workflows/02_SEO_Article_and_Schema_Generation.json) | AI Article, SEO & Schema Generator | Sub-workflow / Manual | Synthesizes full legal guides, H1/H2/H3 hierarchy, FAQ section, JSON-LD Schema (Article + FAQPage), Rank Math metadata, and legal disclaimers. |
| [`03_DALL-E_Featured_Image_Generator.json`](file:///home/softvence/Projects/n8n-automation-projects/legal_content_system_for_common_law.ai/workflows/03_DALL-E_Featured_Image_Generator.json) | Featured Image Generator | Sub-workflow | Generates 1600×900 editorial featured images with DALL-E 3, downloads binary, uploads directly to WordPress Media Library (`/wp/v2/media`), and sets alt text. |
| [`04_WordPress_REST_Publisher_RankMath.json`](file:///home/softvence/Projects/n8n-automation-projects/legal_content_system_for_common_law.ai/workflows/04_WordPress_REST_Publisher_RankMath.json) | WP REST Publisher & Rank Math Sync | Sub-workflow | Publishes/schedules posts via WordPress REST API with embedded Rank Math SEO meta fields, categories, tags, and featured media. Updates Google Sheets status. |
| [`05_Scheduled_Publishing_Queue_Manager.json`](file:///home/softvence/Projects/n8n-automation-projects/legal_content_system_for_common_law.ai/workflows/05_Scheduled_Publishing_Queue_Manager.json) | Scheduled Publishing Queue Manager | Daily 09:00 AM / Manual | Maintains the 1-article-per-day buffer queue, checks newly live posts on WordPress, and triggers social distribution. |
| [`06_MultiChannel_Social_Syndication.json`](file:///home/softvence/Projects/n8n-automation-projects/legal_content_system_for_common_law.ai/workflows/06_MultiChannel_Social_Syndication.json) | Multi-Channel Social Syndication | Webhook / Sub-workflow | Generates tailored copy and broadcasts to **Facebook Pages**, **LinkedIn**, **X (Twitter)**, **Bluesky**, and **Threads** with link back to article. Isolated branches with error-resilience. |
| [`07_Dynamic_Attorney_Directory_CTA_and_Internal_Links.json`](file:///home/softvence/Projects/n8n-automation-projects/legal_content_system_for_common_law.ai/workflows/07_Dynamic_Attorney_Directory_CTA_and_Internal_Links.json) | Dynamic Attorney CTA & Links Resolver | Sub-workflow | Matches target state & practice area against live directory. Emits personalized CTA banner if attorneys exist, or fallback "Get Matched" widget. Resolves internal linking. |
| [`09_Nightly_Content_Gap_Analysis.json`](file:///home/softvence/Projects/n8n-automation-projects/legal_content_system_for_common_law.ai/workflows/09_Nightly_Content_Gap_Analysis.json) | Nightly Site Content Gap Engine | Cron 01:00 AM / Manual | Audits all live WordPress posts across US States × Practice Areas matrix, discovers deficits, prompts AI to formulate gap-closing topics, and pushes into `Topic_Bank`. |
| [`99_Global_Error_Handler.json`](file:///home/softvence/Projects/n8n-automation-projects/legal_content_system_for_common_law.ai/workflows/99_Global_Error_Handler.json) | Centralized Error Logger & Alert | Error Trigger | Traps execution errors across any node and posts rich embed alerts to Discord/Slack webhooks. |

---

## Data Schema & Google Sheets Templates

Templates are provided in [`google_sheets_templates/`](file:///home/softvence/Projects/n8n-automation-projects/legal_content_system_for_common_law.ai/google_sheets_templates/):

1. **`Topic_Bank.csv`**: Contains researched legal ideas, primary keywords, target jurisdictions, practice areas, scores, and status lifecycle (`NEW` → `PUBLISHED`).
2. **`Publishing_Queue.csv`**: Manages the post queue, WordPress post IDs, live URLs, scheduled publish dates, and social distribution tracking (`PENDING` → `DISTRIBUTED`).
3. **`Directory_Lookup.csv`**: Maps state codes, state names, practice areas, and dynamic directory filter URLs, with active attorney flags and fallback URLs.

---

## Required Environment Variables & Credentials in n8n

### Environment Variables
Configure these in your n8n environment (`.env` or Docker container settings):
```env
# Core WordPress
WORDPRESS_BASE_URL=https://common-law.ai
WORDPRESS_AUTHOR_ID=1
WORDPRESS_DEFAULT_POST_STATUS=publish

# Google Sheets
GOOGLE_SHEETS_SPREADSHEET_ID=your_google_spreadsheet_id_here

# Social Integrations
FACEBOOK_PAGE_ID=your_facebook_page_id
LINKEDIN_ORG_ID=your_linkedin_company_id
BLUESKY_HANDLE=common-law.bsky.social
THREADS_USER_ID=your_threads_account_id

# Incident Notifications
ALERT_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

### Credentials Configured in Workflows
1. **OpenAI API Key (`openAiApi`)**: Needs access to `gpt-4o`, `gpt-4o-mini`, and `dall-e-3`.
2. **Google Sheets OAuth2 / Service Account (`googleSheetsOAuth2Api`)**: Read/write access to your master spreadsheet.
3. **WordPress Basic Auth / Application Password (`httpBasicAuth`)**:
   - Username: Your WordPress user.
   - Password: An **Application Password** generated under `Users -> Profile`.
   - **Crucial Note**: The user MUST be assigned the **Editor** or **Administrator** role. Standard "Author" roles lack permission to assign custom post meta (Rank Math) or manage all media items.
4. **Social API Tokens**:
   - Facebook Page Access Token (Header Auth).
   - LinkedIn OAuth Bearer Token (Header Auth).
   - Twitter / X API v2 Bearer Token (Header Auth).
   - Bluesky App Access JWT (Header Auth).
   - Threads User Access Token (Header Auth).

---

## Setup & Deployment Instructions

1. **Import Workflows into n8n**:
   - Open your n8n dashboard.
   - Go to **Workflows -> Import from File** and select each JSON file from the `workflows/` directory.
2. **Create the Google Spreadsheet**:
   - Create a Google Spreadsheet named `Common-Law Content Database`.
   - Create three sheets named:
     - `Topic_Bank`
     - `Publishing_Queue`
     - `Directory_Lookup`
   - Import or paste the headers and starter rows from `google_sheets_templates/`.
3. **Configure Rank Math in WordPress**:
   - Ensure the **Rank Math SEO** plugin is active.
   - Verify that REST API exposure is active (Rank Math natively saves `rank_math_title`, `rank_math_description`, and `rank_math_focus_keyword` in post meta).
4. **Test Run**:
   - Execute `WF-01` manually to populate `Topic_Bank`.
   - Execute `WF-02` manually to generate an article, featured image, dynamic CTA, and publish to WordPress.
   - Verify that the post appears on common-law.ai with complete Rank Math metadata, structured FAQ accordion, and 16:9 featured image.
