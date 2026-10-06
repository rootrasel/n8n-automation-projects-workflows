# TUDDEH Social Automation — Phase 1 (v3.5 FINAL)
**Simplified 4-Tab Tracker Architecture • Manual Publishing Phase**

Automates content planning, generation, Reel editing, draft storage, TUDDEH approval, and approved-content packaging. Scheduling and publishing remain manual in Phase 1. Google Sheets remains a streamlined 4-tab human interface, while technical workflow and operational states are isolated in n8n Data Tables.

---

## 1. Architecture & Lifecycle Overview

```
Marketing Queue (Planned)
        │
        ▼ (WF-01 Intake Gate: Global AUTOMATION_MODE + Business Automation Status)
    Generating
        │
        ▼ (WF-02 Validation Gate)
    Lookup & Quality Check (WF-03: Media & Video Asset Gate)
        │
        ▼ (WF-05: Presets, GPT-4o Copy, DALL-E 3 Image, Video Asset & Story/Carousel Engine)
    AI Content Decision & Format Generation
        │
        ▼ (WF-09: Save Draft Folder, metadata.json & Send Gmail Approval Request)
Ready for Review
        │
   ┌────┴───────────────────────────────────────┐
   ▼                                            ▼
Revision Needed (WF-11: Cap <= 3)        Approved (WF-11 Webhook)
   │                                            │
   └──────────> (Re-generate)                   ▼ (WF-12 Package Builder)
                                          Ready to Schedule
                                                │
                                                ▼ (Human schedules in Meta/TikTok)
                                          Schedule Requested
                                                │
                                                ▼ (WF-13A: Drive move: 01 → 02 Scheduled)
                                            Scheduled
                                                │
                                                ▼ (Human pastes live URL)
                                          Publish Confirmed
                                                │
                                                ▼ (WF-13B: Drive move: 02 → 06 Published)
                                            Published
                                                │
                                                └─> (WF-13B creates separate Performance rows per platform)
```

---

## 2. Directory Structure

```
c:\Users\rasel\Softvance\n8n projects\
├── data_tables/                     # Schemas and seed data for n8n Data Tables
│   ├── tuddeh_global_config.csv     # Central AUTOMATION_MODE (ACTIVE | PAUSED | MAINTENANCE)
│   ├── tuddeh_business_registry.csv # Business Drive folder mappings (root + 5 subfolders)
│   ├── tuddeh_content_jobs.csv      # Internal Job IDs, locks, approval tokens, Drive paths
│   ├── tuddeh_style_presets.csv     # Visual design tokens for static & video engines
│   ├── tuddeh_creative_history.csv  # Semantic anti-duplication history (recent hooks/angles)
│   ├── tuddeh_asset_usage.csv       # Asset rotation and usage timestamps
│   └── tuddeh_error_log.csv         # Structured technical error log and retry counters
├── workflows/                       # Consolidated 14-workflow production architecture
│   ├── WF-00_Business_Folder_Provisioning.json
│   ├── WF-01_Marketing_Queue_Trigger.json
│   ├── WF-02_Validate_Marketing_Job.json
│   ├── WF-03_Business_Listing_Media_Lookup.json
│   ├── WF-05_AI_Content_Decision_Copy.json  # Consolidated: Presets, Copy, DALL-E 3, Video & Carousels
│   ├── WF-09_Save_Generated_Draft.json      # Consolidated: Draft Drive Storage + Gmail Approval Token/Email
│   ├── WF-11_Approval_Revision_Controller.json
│   ├── WF-12_Create_Approved_Package.json
│   ├── WF-13A_Schedule_Requested_Verification.json
│   ├── WF-13B_Publish_Confirmed_Verification.json
│   ├── WF-15_Daily_Ready_To_Schedule_Digest.json
│   ├── WF-98_Daily_Reconciliation.json
│   ├── WF-99_Global_Error_Handler.json
│   └── TUDDEH_Master_Pipeline.json  # Orchestrator running the complete cycle
├── tests/
│   └── runner.js                    # Automated test suite (140 automated checks)
└── README.md
```

---

## 3. Google Sheets Tracker Architecture (4 Tabs Only)

The Google Sheet is the human-facing control panel. Technical IDs and internal logs are forbidden in the sheet.

| Tab | Purpose | Machine Headers |
|---|---|---|
| **Businesses** | Permanent business info, handles, and pause control | `Business` \| `Category` \| `Business ID` \| `Business Profile URL` \| `Instagram Profile URL` \| `Instagram Import Permission` \| `Instagram Tag` \| `Facebook Tag` \| `TikTok Tag` \| `Default Tagging` \| `Google Drive Asset Library` \| `Account Manager` \| `Status` \| `Automation Status` |
| **Listings** | Active deals, events, or listings | `Business` \| `Listing Type` \| `Listing Name` \| `Listing ID` \| `Listing URL` \| `Marketing Objective` \| `Primary CTA` \| `Priority` \| `Start Date` \| `End Date` \| `Active` |
| **Marketing Queue** | One row per marketing job; human creative & publishing lifecycle | `Business` \| `Campaign` \| `Content Focus` \| `Selected Listing` \| `Destination Type` \| `Marketing Job` \| `Content Format` \| `Prompt Template` \| `Creative Direction` \| `Revision Notes` \| `Production Status` \| `Recommended Publish Date` \| `Recommended Publish Time` \| `Scheduling Status` \| `Scheduled Date / Time` \| `Published URL` \| `Final Asset Link` |
| **Performance** | Human-readable results and AI learnings (1 row per platform) | `Business` \| `Content Focus` \| `Selected Listing` \| `Content Format` \| `Platform` \| `Publish Date` \| `Reach` \| `Engagements` \| `Link Clicks` \| `Goal Achieved` \| `AI Learning` |

---

## 4. Google Drive Hierarchy

```
TUDDEH Social Automation/
  ├── 01 Business Assets/
  │   └── [Business Name]/
  │       ├── 01 Brand
  │       ├── 02 Photos
  │       ├── 03 Videos
  │       ├── 04 Reference
  │       └── 05 Archive
  ├── 02 Master Prompts/
  ├── 03 Video Assets/
  ├── 04 Generated Drafts/
  │   └── [Business Name]/
  │       └── [Internal Job ID]/ (FINAL_REEL.mp4, CAPTION.txt, POSTING_INFO.txt, metadata.json)
  ├── 05 Approved Content/
  │   ├── 01 Ready to Schedule/
  │   │   └── [Recommended Date]/[Business]/[Job - Format]/
  │   └── 02 Scheduled/
  │       └── [Recommended Date]/[Business]/[Job - Format]/
  ├── 06 Published Content/
  │   └── [YYYY-MM]/[Business]/
  └── 07 Rejected or Archived/
```

> [!IMPORTANT]
> **Human Scheduling Rule**: Humans must ONLY schedule content located in `05 Approved Content/01 Ready to Schedule`.

---

## 5. Style Preset Tokens

Centrally defined in `data_tables/tuddeh_style_presets.csv`:
- `BUSINESS_V1`: Default luxury/lifestyle brand spotlight (Gold `#D4AF37`, Dark `#0D0F12`, Inter 600).
- `DEAL_V1`: High-contrast deal/discount promotion (Flame `#FF6B35`, Dark `#1A0A00`, Outfit 700).
- `EVENT_V1`: Live events, weekend calendar dates (Purple Glow `#9B5DE5`, Dark `#180E29`, Outfit 500).
- `EGIFT_V1`: Digital gift vouchers & perks (Emerald `#2EC4B6`, Dark `#0B2016`, Inter 700).
- `BIRTHDAY_V1`: Birthday celebration banners & VIP perks (Warm Gold `#FFB703`, Dark `#2B1800`, Inter 800).
- `STORY_V1`: Vertical 9:16 interactive story cards (Neon Pink `#F72585`, Safe Zone Margins).
- `CAROUSEL_V1`: 4:5 aspect ratio multi-slide cohesive cards (Royal Blue `#4361EE`, Clean Dividers).

---

## 6. Environment Variables Configuration

Set these variables in your n8n `.env` or system environment:

```env
# Google Tracker
GOOGLE_SHEETS_TRACKER_ID=1AbCdEfGhIjKlMnOpQrStUvWxYz-1234567890

# Google Drive Root Master Folder IDs
DRIVE_01_BUSINESS_ASSETS_FOLDER_ID=1FolderId_01BusinessAssets
DRIVE_04_GENERATED_DRAFTS_FOLDER_ID=1FolderId_04GeneratedDrafts
DRIVE_05_01_READY_TO_SCHEDULE_FOLDER_ID=1FolderId_0501ReadyToSchedule
DRIVE_05_02_SCHEDULED_FOLDER_ID=1FolderId_0502Scheduled
DRIVE_06_PUBLISHED_FOLDER_ID=1FolderId_06Published
DRIVE_07_ARCHIVED_FOLDER_ID=1FolderId_07Archived

# OpenAI API Key
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxx

# Approval & Alert Notifications
TUDDEH_APPROVAL_EMAIL=review@tuddeh.com
WEBHOOK_TUNNEL_URL=https://your-n8n-instance.com

# Video Pipeline Note:
# JSON2video video editing and yt-dlp have been completely removed per client specification.
# WF-07 directly packages hero video assets from Google Drive (03 Videos) with 0 third-party render latency.
```

---

## 7. How to Import and Deploy into n8n

### Step 1: Create n8n Data Tables
In your n8n instance, navigate to **Data Tables** and create the 7 tables using the CSV schemas in `data_tables/`:
1. `tuddeh_global_config`
2. `tuddeh_business_registry`
3. `tuddeh_content_jobs`
4. `tuddeh_style_presets`
5. `tuddeh_creative_history`
6. `tuddeh_asset_usage`
7. `tuddeh_error_log`

### Step 2: Configure Credentials in n8n
- **Google Sheets OAuth2 API**: Name credential `googleSheetsOAuth2Api`
- **Google Drive OAuth2 API**: Name credential `googleDriveOAuth2Api`
- **Gmail OAuth2 API**: Name credential `gmailOAuth2Api`

### Step 3: Import Workflows
In n8n, click **Workflows** → **Add Workflow** → **Import from File**, and import the workflows from the `workflows/` directory:
- Import `WF-00` through `WF-99`.
- Activate the scheduled workflows (`WF-01`, `WF-13A`, `WF-13B`, `WF-15`, `WF-98`).
- Activate the webhook workflow (`WF-11`).

### Step 4: Verify with the Automated Test Suite
From this directory, run:
```bash
node tests/runner.js
```
The test suite executes 140 automated checks covering JSON syntax, node types, connection topology, pause gates, quality gates, style preset resolvers, semantic duplicate detection, revision limits, and the 3-way reconciliation matrix across all 14 consolidated workflows.
