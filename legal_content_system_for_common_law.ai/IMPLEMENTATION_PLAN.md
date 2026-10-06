# Common-Law.ai — Legal Content Automation System
## Complete Architecture & Implementation Plan

---

## 1. Project Overview & Scope Alignment

The objective is to design and build an enterprise-grade, end-to-end automated legal content pipeline for **common-law.ai** powered by **n8n**, **OpenAI**, **WordPress REST API (Rank Math SEO)**, **Google Sheets**, and multi-platform **Social APIs**.

### Core Lifecycle Loop
```text
Legal Research & Signals (8:00 AM)
       │
       ▼
Topic Ranking & Scoring (AI) ──────────► Google Sheets (Topic Bank)
                                                │
                                                ▼
Nightly Gap Feedback Loop ◄──────── Topic Selection & Queue Engine
        │                                       │
        ▼                                       ▼
Content Gap Analysis (Nightly)       AI Full Article & SEO Generation
        ▲                                       │
        │                                       ▼
  Site Crawl & DB                  Featured Image Generation (DALL-E 1600x900)
                                                │
                                                ▼
                                   Dynamic Attorney Directory CTA + Linking
                                                │
                                                ▼
                                   WordPress REST Upload (Draft / Scheduled)
                                                │
                                                ▼
                                   Automated Publishing Queue (1/day)
                                                │
                                                ▼
                                   Multi-Channel Social Syndication
                                   (FB, LinkedIn, X, Bluesky, Threads)
```

### Scope Demarcation
- **In-Scope (Workflows 1–9)**:
  1. Automated Legal Topic Research (News, Search trends, Court rulings, AI legal)
  2. AI Comprehensive Article & SEO Metadata Generation
  3. AI Featured Image Generation (DALL-E, 1600×900)
  4. WordPress REST API Article & Media Upload (Rank Math integration)
  5. Automated Daily Publishing Queue Management
  6. Social Media Distribution (Facebook, LinkedIn, X, Bluesky, Threads)
  7. Internal Linking & Related Articles Engine
  8. Dynamic State & Practice-Area Attorney Directory CTA (with Fallback)
  9. Nightly Site Content Gap & Taxonomy Analysis Engine
- **Explicitly Excluded / Phase 2**:
  - Workflow 10: Automated Attorney Outreach & Email Prospecting.

---

## 2. Technical Prerequisites & Integration Matrix

| Integration / Service | Authentication / Protocol | Required Permissions & Roles | Known Risks / Mitigation |
| :--- | :--- | :--- | :--- |
| **n8n Instance** | Self-hosted or Cloud | Admin access, Webhooks enabled | Webhook endpoints must be publicly accessible for social callbacks & WP hooks. |
| **OpenAI API** | API Bearer Key (`Tier 2+` recommended) | `gpt-4o` / `gpt-4o-mini` & `dall-e-3` | Rate limits & token costs; balance model selection between deep generation and research summarization. |
| **WordPress REST API** | Application Password / Basic Auth | **Editor** or **Administrator** (Author cannot manage all taxonomy/media reliably) | User must have `upload_files`, `publish_posts`, and `edit_others_posts` capabilities. Fixes previously reported permission failure. |
| **Rank Math SEO** | WP REST Meta Endpoint (`rank_math_title`, `description`, etc.) | Custom meta exposed in REST API | Ensure Rank Math REST API support is enabled in WordPress settings (`rank_math/v1` or core post meta). |
| **Google Sheets API** | OAuth2 or Service Account | Read/Write access to master spreadsheet | Service account preferred for zero-maintenance headless execution. |
| **Facebook Graph API** | Page Access Token (Meta App) | `pages_manage_posts`, `pages_read_engagement` | App review requirements; fallback to RSS/Buffer if app verification is delayed. |
| **LinkedIn API** | OAuth2 Member/Organization Token | `w_member_social` or `w_organization_social` | Redirect URI must be registered in Developer Portal. |
| **X (Twitter) API** | OAuth 1.0a / OAuth 2.0 User Context | Read & Write (`Free/Basic` or `Pro` tier) | Twitter API v2 endpoints require paid tier for automated posting. |
| **Bluesky API** | App Password (AT Protocol) | Direct API authentication | Most stable and frictionless setup. |
| **Threads API** | Meta Threads Graph API | `threads_basic`, `threads_content_publish` | Requires Meta developer app approval. |
| **Attorney Directory** | JSON endpoint or Google Sheet sync | Read-only directory schema | Requires state & practice area taxonomy mapping table. |

---

## 3. Data Architecture (Google Sheets Schema)

To decouple workflows cleanly, the system utilizes a centralized Google Spreadsheet with structured sheets:

### Sheet 1: `Topic_Bank`
| Column Name | Data Type | Description | Source |
| :--- | :--- | :--- | :--- |
| `topic_id` | String (UUID) | Unique identifier | System |
| `title_idea` | String | Proposed title / research topic | Workflow 1 / 9 |
| `primary_keyword` | String | Main SEO search phrase | Workflow 1 |
| `target_state` | String | US State (e.g., "Missouri", "Texas", "Federal") | Workflow 1 / 9 |
| `practice_area` | String | e.g., "Business Law", "Family Law", "Estate Planning" | Workflow 1 / 9 |
| `source_type` | Enum | `news`, `search_volume`, `court_ruling`, `ai_legal`, `gap_analysis` | Workflow 1 / 9 |
| `relevance_score` | Number (1–100) | AI-scored viability and search interest | Workflow 1 |
| `status` | Enum | `NEW`, `QUEUED`, `PROCESSING`, `PUBLISHED`, `REJECTED` | Status Tracker |
| `suggested_date` | Date | Target publication date | Scheduler |
| `notes` | String | AI reasoning or source citations | Workflow 1 |

### Sheet 2: `Publishing_Queue`
| Column Name | Data Type | Description |
| :--- | :--- | :--- |
| `queue_id` | String | Reference ID |
| `topic_id` | String | Foreign key to `Topic_Bank` |
| `wp_post_id` | Number | WordPress Post ID (once drafted/scheduled) |
| `article_title` | String | Final H1 / Post Title |
| `slug` | String | URL-friendly slug |
| `scheduled_publish_time` | DateTime | Timestamp for publication (e.g., 9:00 AM daily) |
| `wp_status` | Enum | `draft`, `future`, `publish` |
| `social_status` | Enum | `PENDING`, `DISTRIBUTED`, `FAILED` |
| `article_url` | String | Canonical URL on common-law.ai |

### Sheet 3: `Directory_Lookup`
| Column Name | Data Type | Description |
| :--- | :--- | :--- |
| `state_code` | String (2-letter) | e.g., `TX`, `MO`, `CA` |
| `state_name` | String | e.g., `Texas`, `Missouri` |
| `practice_area` | String | e.g., `Family Law`, `LLC & Corporate`, `Estate Planning` |
| `has_active_attorneys` | Boolean | `TRUE` if state+area has live directory listings |
| `custom_directory_url` | String | URL filter e.g., `/attorneys/?state=texas&practice=family-law` |
| `cta_headline` | String | Dynamic headline copy |
| `cta_button_text` | String | e.g., "Find a Texas Family Law Attorney" |
| `fallback_url` | String | `/get-matched/` |

---

## 4. Detailed Workflow Architecture (Workflows 1–9)

```text
 ┌────────────────────────────────────────────────────────────────────────┐
 │ WORKFLOW 1: Legal Topic Research Engine                                │
 │ Trigger: Cron (08:00 AM Daily)                                         │
 │                                                                        │
 │  1. RSS / Legal News Scraping (Justia, Law360, Reuters Legal)          │
 │  2. Search Trends & Volume Querying (Google Trends / SerpApi / LLM)    │
 │  3. Court Decisions Fetch (CourtListener / Open Jurist APIs)           │
 │  4. AI & Tech Legal Signals                                            │
 │  5. LLM Evaluation & De-duplication (Scoring 1-100)                     │
 │  6. Append rows to Google Sheet: Topic_Bank (Status = 'NEW')           │
 └───────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
 ┌────────────────────────────────────────────────────────────────────────┐
 │ WORKFLOW 2: Content Generation Orchestrator                            │
 │ Trigger: Workflow 1 completion OR Scheduled Queue Manager              │
 │                                                                        │
 │  1. Fetch highest-scoring 'NEW' topic from Topic_Bank                  │
 │  2. Query existing site content (WP REST) for context & link targets   │
 │  3. Prompt Chain Execution:                                            │
 │     • Outline & H1/H2/H3 Structure with Legal Disclaimer               │
 │     • Deep Content Generation (in-depth, authoritative, neutral)       │
 │     • FAQ Section (with structured QA format)                          │
 │     • SEO Suite (Meta Title, Description, Excerpt, Target Slug)        │
 │     • JSON-LD Schema (Article + FAQPage schema)                        │
 │     • Taxonomy Assignment (Categories, Tags)                           │
 │     • Internal Link Injection (referencing active WP posts)            │
 │     • Dynamic Attorney Directory CTA Injection (State/Practice Match)  │
 │     • DALL-E Image Prompt Generation (Professional 1600x900 aesthetic) │
 └───────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
 ┌────────────────────────────────────────────────────────────────────────┐
 │ WORKFLOW 3: AI Featured Image Generator                                │
 │ Sub-workflow / Triggered by Workflow 2                                 │
 │                                                                        │
 │  1. Receive tailored visual prompt from Workflow 2                     │
 │  2. Call OpenAI DALL-E 3 (`1792x1024` or `1024x1024` resized to 16:9)  │
 │  3. Download binary image buffer in n8n                                │
 │  4. Optimize/Convert if necessary (JPEG/WebP)                          │
 │  5. Upload to WordPress via `POST /wp-json/wp/v2/media`                │
 │  6. Set Alt Text, Title, Caption                                       │
 │  7. Return `media_id` and `source_url`                                 │
 └───────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
 ┌────────────────────────────────────────────────────────────────────────┐
 │ WORKFLOW 4: WordPress Upload & Rank Math Sync                          │
 │ Triggered by Workflow 3 output                                         │
 │                                                                        │
 │  1. Assemble complete payload:                                         │
 │     • `title`, `content` (HTML with Schema & CTA embedded)             │
 │     • `slug`, `excerpt`, `status` ('future' or 'publish')              │
 │     • `categories`, `tags`, `featured_media` (from WF 3)               │
 │     • `meta`: Rank Math fields (`rank_math_title`,                    │
 │       `rank_math_description`, `rank_math_focus_keyword`,             │
 │       `rank_math_robots`)                                              │
 │  2. Post to `POST /wp-json/wp/v2/posts`                                │
 │  3. Verify publication / scheduling timestamp                          │
 │  4. Update `Topic_Bank` (Status = 'QUEUED' / 'PUBLISHED')              │
 │  5. Insert row into `Publishing_Queue`                                 │
 └───────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
 ┌────────────────────────────────────────────────────────────────────────┐
 │ WORKFLOW 5: Publishing Queue Manager (Buffer Strategy)                 │
 │ Trigger: Cron (Every Morning, e.g. 09:00 AM)                           │
 │                                                                        │
 │  1. Inspect `Publishing_Queue` buffer depth                            │
 │  2. Maintain 1 post/day cadence:                                       │
 │     • Ensure tomorrow has a post scheduled                             │
 │     • If queue depth < 7 days, trigger Workflow 2 to generate buffer   │
 │  3. Check for freshly published post on WordPress                      │
 │  4. When status transition = 'publish', emit event to Workflow 6       │
 └───────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
 ┌────────────────────────────────────────────────────────────────────────┐
 │ WORKFLOW 6: Multi-Channel Social Syndication                           │
 │ Trigger: Webhook from WP (Publish Event) OR Queue Cron                 │
 │                                                                        │
 │  1. Fetch published post details (Title, Excerpt, URL, Image URL)      │
 │  2. AI Social Post Formatter (Tailored copy per platform style):       │
 │     • LinkedIn: Professional legal insight summary + hashtags          │
 │     • X (Twitter): Punchy hook, 280 chars, thread or single post       │
 │     • Facebook: Conversational snippet + thumbnail card                │
 │     • Bluesky: Concise post with direct web card link                  │
 │     • Threads: Casual engaging angle with link                         │
 │  3. Parallel Dispatch with individual try/catch:                       │
 │     • Branch A: Facebook Graph API                                     │
 │     • Branch B: LinkedIn REST API                                      │
 │     • Branch C: X API v2                                               │
 │     • Branch D: Bluesky AT Protocol                                    │
 │     • Branch E: Threads Publishing API                                 │
 │  4. Update `Publishing_Queue` with social post IDs and statuses        │
 └────────────────────────────────────────────────────────────────────────┘

 ┌────────────────────────────────────────────────────────────────────────┐
 │ WORKFLOW 7: Internal Linking & Related Content Engine                  │
 │ (Embedded in WF 2 & standalone maintenance trigger)                   │
 │                                                                        │
 │  1. Maintain cached index of all published common-law.ai posts         │
 │  2. When generating a new article:                                     │
 │     • Vector search or Keyword match against existing post titles/tags │
 │     • Pick top 3-5 hyper-relevant internal articles                     │
 │     • Contextually embed hyperlinks inside article body                │
 │     • Append a dedicated "Related Legal Guides" block at bottom        │
 └────────────────────────────────────────────────────────────────────────┘

 ┌────────────────────────────────────────────────────────────────────────┐
 │ WORKFLOW 8: Dynamic Attorney Directory Matcher & CTA Engine            │
 │ (Modular Sub-Workflow called during Content Generation)                │
 │                                                                        │
 │  1. Extract `target_state` and `practice_area` from article metadata   │
 │  2. Query `Directory_Lookup` sheet or common-law.ai directory API      │
 │  3. Decision Gate:                                                     │
 │     • IF `has_active_attorneys == TRUE`:                               │
 │       Render State-Specific CTA Block:                                 │
 │       "Need a [State] [Practice Area] Attorney? Browse verified        │
 │        attorneys in our directory." -> [Custom Filter URL]             │
 │     • ELSE:                                                            │
 │       Render Generic Fallback CTA Block:                               │
 │       "Need Legal Assistance? Get Matched with a Qualified Attorney"   │
 │       -> [/get-matched/ or General Directory URL]                      │
 │  4. Output validated HTML banner block ready for post injection        │
 └────────────────────────────────────────────────────────────────────────┘

 ┌────────────────────────────────────────────────────────────────────────┐
 │ WORKFLOW 9: Nightly Content Gap & Taxonomy Intelligence Engine         │
 │ Trigger: Cron (01:00 AM Nightly)                                       │
 │                                                                        │
 │  1. Query WordPress REST API: Fetch all published posts & categories   │
 │  2. Build State × Practice Area Content Matrix:                        │
 │     • States (50 US States + Federal)                                  │
 │     • Practice Areas (Business, Family, Estate, Criminal, Injury, etc.)│
 │  3. Tally article counts per intersection                              │
 │  4. Detect gaps (e.g., Texas Family Law = 6 posts; Target = 20)        │
 │  5. LLM Prompt: "Given these weak areas, generate 5 high-converting,   │
 │     high-search-intent topic ideas addressing legal consumer needs"    │
 │  6. De-duplicate against `Topic_Bank`                                  │
 │  7. Push high-priority recommendations into `Topic_Bank`               │
 │     (Source = 'gap_analysis')                                          │
 └────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Work Breakdown Structure & Implementation Phases

### Phase 1: Environment Setup & Data Foundations
- [ ] Setup n8n workspace folder structure, credentials management, and global error triggers.
- [ ] Initialize Google Spreadsheet with the 3 structured sheets (`Topic_Bank`, `Publishing_Queue`, `Directory_Lookup`).
- [ ] Populate `Directory_Lookup` with existing common-law.ai state and practice area availability.
- [ ] Create reusable n8n Sub-workflows for standard error notifications (Discord/Slack/Email).

### Phase 2: Research & Topic Ingestion (Workflow 1)
- [ ] Build multi-source feed harvester (Legal RSS news feeds, trending search queries, court decision scrapers).
- [ ] Construct AI prompt for topic scoring, deduplication, and state/practice area classification.
- [ ] Implement Google Sheets append logic with duplicate detection.

### Phase 3: AI Article Generation & Legal Safeguards (Workflow 2, 7, 8)
- [ ] Build robust multi-stage OpenAI prompt chain:
  - Outline with standard legal disclaimer ("Information only, not legal advice").
  - Long-form markdown content generator with strict H2/H3 formatting.
  - FAQ schema and FAQ accordion generator.
  - Rank Math SEO metadata generator.
- [ ] Integrate **Workflow 8 (Directory CTA)**: Dynamic state/practice area matching with fallback.
- [ ] Integrate **Workflow 7 (Internal Linking)**: WP REST API cross-referencing to inject relevant internal links.

### Phase 4: Image Pipeline & WordPress REST Publishing (Workflows 3, 4, 5)
- [ ] Build DALL-E 3 image generation node (1600×900 aspect ratio, legal/editorial prompt styling without distorted text).
- [ ] Solve WordPress User Permission issue:
  - Verify credentials with a test payload for both `POST /wp-json/wp/v2/media` and `POST /wp-json/wp/v2/posts`.
  - Ensure user role has `upload_files` and `edit_posts`.
- [ ] Implement Rank Math meta integration (`rank_math_title`, `rank_math_description`, `rank_math_focus_keyword`).
- [ ] Build queue scheduling logic (maintaining the buffer of 1 article/day).

### Phase 5: Social Media Syndication (Workflow 6)
- [ ] Setup modular, decoupled publishing branches:
  - Facebook Pages API
  - LinkedIn UGC / Share API
  - X (Twitter) API v2
  - Bluesky AT Protocol
  - Threads API
- [ ] Add individual error-handling wrappers (a failure on X or Facebook must not crash LinkedIn or Bluesky).
- [ ] Log status back to `Publishing_Queue`.

### Phase 6: Nightly Content Gap Analyzer (Workflow 9)
- [ ] Create automated WP site crawler/auditor via REST API.
- [ ] Compute state-by-practice-area density matrix.
- [ ] Generate actionable topic recommendations and push directly into `Topic_Bank`.

### Phase 7: Testing, Edge Cases & Operational Handover
- [ ] Dry-run end-to-end flow with a single test topic.
- [ ] Verify image rendering, Rank Math scoring in WP admin, schema validation on Google Rich Results Test.
- [ ] Deliver full JSON workflow exports, documentation, and operational troubleshooting guides.

---

## 6. Critical Technical Safeguards & Solutions to Identified Blockers

1. **WordPress Permission Fix (`Sorry, you are not allowed to create posts...`)**:
   - The user associated with the Application Password must be promoted to **Editor** or **Administrator** (or a custom role with `upload_files`, `publish_posts`, `edit_published_posts`, `edit_others_posts`).
   - Standard "Author" roles fail on custom metadata fields (Rank Math) and certain media attachments.
2. **Rank Math REST API Metadata Exposure**:
   - Rank Math requires custom fields to be accepted by WP REST. The workflow will submit both standard post fields and meta objects (`meta: { rank_math_title: ..., rank_math_description: ... }`).
3. **OpenAI Credit Exhaustion & Rate Limiting**:
   - Implement exponential backoff retry in n8n HTTP / OpenAI nodes.
   - Utilize token-efficient models (`gpt-4o-mini`) for initial research ranking and gap analysis, reserving `gpt-4o` for deep article synthesis.
4. **Social API Token Expirations & Approvals**:
   - Structure social posting as independent sub-nodes so that pending approvals on Meta/Threads do not block live syndication on Bluesky or LinkedIn.
5. **Legal Compliance & Quality Disclaimer**:
   - Every generated article systematically embeds an approved legal disclaimer at the footer to ensure standard compliance for non-attorney legal information sites.
