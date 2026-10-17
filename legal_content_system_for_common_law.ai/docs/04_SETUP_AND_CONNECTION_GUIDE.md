# Setup & Workflow Connection Guide

This guide provides step-by-step instructions for importing, configuring, connecting, and running the 7 n8n workflows for Common-Law.ai.

---

## Step 1: Initialize Google Sheets Master Database

1. Open Google Sheets and create a new spreadsheet named `Common-Law Content Database`.
2. Create four distinct tabs (sheets) with exact names:
   - `Topic_Bank`
   - `Publishing_Queue`
   - `Directory_Lookup`
   - `Execution_Logs`
3. Copy the CSV headers and sample data from [`google_sheets_templates/`](file:///home/softvence/Projects_Hub/n8n-automation-projects-workflows/legal_content_system_for_common_law.ai/google_sheets_templates/) into each respective sheet.
4. Note the Google Spreadsheet ID from the URL:
   `https://docs.google.com/spreadsheets/d/<SPREADSHEET_ID>/edit`
5. Set `GOOGLE_SHEETS_SPREADSHEET_ID=<SPREADSHEET_ID>` in your n8n `.env`.

---

## Step 2: Configure WordPress REST API & Rank Math

1. Log in to your WordPress Admin dashboard on `common-law.ai`.
2. Verify the **Rank Math SEO** plugin is installed and activated.
3. Under **Rank Math -> Titles & Meta**, ensure the REST API support is enabled (standard in Rank Math).
4. Go to **Users -> Profile** for your Editor/Administrator account:
   - Scroll down to **Application Passwords**.
   - Enter `n8n Automation Engine` and click **Add New Application Password**.
   - Copy the generated 24-character password.
5. In n8n, create an **HTTP Basic Auth** credential:
   - Name: `WordPress Application Password CommonLaw`
   - User: `<your_wp_user>`
   - Password: `<your_application_password>`

---

## Step 3: Configure n8n Environment & Saved Credentials

1. Place your environment variables in your n8n `.env` (refer to [`.env.example`](file:///home/softvence/Projects_Hub/n8n-automation-projects-workflows/legal_content_system_for_common_law.ai/.env.example)).
2. In n8n, navigate to **Credentials -> New Credential**:
   - Create `OpenAI CommonLaw API Key` (`openAiApi`) with your OpenAI API key.
   - Create `OpenAI Bearer Auth CommonLaw` (`httpHeaderAuth`) with `Authorization: Bearer <sk-...>`.
   - Create `Google Sheets OAuth CommonLaw` (`googleSheetsOAuth2Api`) and complete OAuth authentication.
   - Create `DataForSEO API Credentials` (`httpBasicAuth`) or test without if only using Serper.

---

## Step 4: Import the 7 Workflows into n8n

In your n8n workspace:
1. Click **Add workflow -> Import from File** (or press `Ctrl+O`).
2. Import all 7 files from [`workflows/`](file:///home/softvence/Projects_Hub/n8n-automation-projects-workflows/legal_content_system_for_common_law.ai/workflows/):
   - `01_WF1_Website_Content_Gap_Analysis.json`
   - `02_WF2_Legal_Topic_Research_and_Ranking.json`
   - `03_WF3_SEO_Legal_Article_Generation.json`
   - `04_WF4_AI_Featured_Image_and_WordPress_Draft.json`
   - `05_WF5_Scheduled_Publishing.json`
   - `06_WF6_Social_Media_Distribution.json`
   - `07_WF7_Monitoring_Logging_and_Error_Handling.json`

---

## Step 5: Connect Inter-Workflow Webhooks

1. Open **WF2 — Legal Topic Research and Ranking**:
   - Double-click the **Receive WF1 Gap Report** Webhook node.
   - Copy the **Production Webhook URL** (e.g., `https://your-n8n.com/webhook/wf2-gap-report`).
   - Open **WF1 — Website Content Gap Analysis**, edit the **Send Report to WF2 Webhook** node, and ensure the URL matches (or set `WF2_WEBHOOK_URL` in `.env`).
2. Open **WF6 — Social Media Distribution**:
   - Copy the **Production Webhook URL** for the **Published Article Event** node (`https://your-n8n.com/webhook/wf6-published-article`).
   - Open **WF5 — Scheduled Publishing**, verify the **Trigger WF6** node points to this URL.

---

## Step 6: Configure Global Error Handling (WF7)

For **WF1 through WF6**:
1. Open the workflow in the n8n editor.
2. Click **Workflow settings** (gear icon in the top right).
3. Under **Error Workflow**, select **WF7 — Monitoring, Logging and Error Handling**.
4. Save the workflow.
Now, if any node in WF1–WF6 fails, n8n will immediately route the execution context into WF7 for logging, transient retry handling, and administrator alerting!
