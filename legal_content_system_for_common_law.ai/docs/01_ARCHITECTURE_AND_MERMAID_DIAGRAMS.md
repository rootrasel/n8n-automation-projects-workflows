# Master Architecture & Workflow Diagrams

## 1. Master System Architecture

The Common-Law.ai legal content automation system is organized into **7 discrete, production-ready workflows**. The diagram below demonstrates how data flows from gap analysis through topic research, legal drafting, media generation, WordPress publishing, social syndication, and error monitoring.

```mermaid
flowchart TD
    Site["Common-Law.ai Website & Posts"] --> WF1["WF1: Website Content Gap Analysis"]
    WF1 -->|"Structured Gap Report (Webhook)"| WF2["WF2: Legal Topic Research & Ranking"]
    WF2 -->|"Vetted Topics (Status: NEW)"| DB[("Google Sheets: Topic_Bank")]
    DB -->|"Select Approved Topic"| WF3["WF3: SEO Legal Article Generation"]
    WF3 -->|"Citation Audit & Fact-Check"| Review{"Human Legal Review Required?"}
    Review -->|"Yes (Unverified Claims)"| Slack["Slack/Discord Alert (Draft Flagged)"]
    Review -->|"No / Approved Payload"| WF4["WF4: AI Featured Image & WordPress Draft"]
    Slack --> WF4
    WF4 -->|"Featured Image & Draft Created"| Queue[("Google Sheets: Publishing_Queue")]
    Queue -->|"Scheduled 09:00 AM Cron"| WF5["WF5: Scheduled Publishing"]
    WF5 -->|"Live Published URL"| WF6["WF6: Social Media Distribution"]
    WF6 -->|"Syndicate to LinkedIn, X, FB, Bluesky, Threads"| Social["Social Media Channels"]
    
    subgraph Monitoring ["Cross-Workflow Monitoring & Resilience"]
        WF1 -.->|"Error Trigger"| WF7["WF7: Monitoring, Logging & Error Handling"]
        WF2 -.->|"Error Trigger"| WF7
        WF3 -.->|"Error Trigger"| WF7
        WF4 -.->|"Error Trigger"| WF7
        WF5 -.->|"Error Trigger"| WF7
        WF6 -.->|"Error Trigger"| WF7
        WF7 --> Logs[("Google Sheets: Execution_Logs")]
        WF7 --> Alert["Administrator Alert (Retries Exhausted)"]
    end

    classDef primary fill:#2563eb,stroke:#1d4ed8,color:#ffffff,stroke-width:2px;
    classDef secondary fill:#059669,stroke:#047857,color:#ffffff,stroke-width:2px;
    classDef warning fill:#d97706,stroke:#b45309,color:#ffffff,stroke-width:2px;
    classDef storage fill:#475569,stroke:#334155,color:#ffffff,stroke-width:2px;

    class WF1,WF2,WF3,WF4,WF5,WF6 primary;
    class WF7,Review warning;
    class DB,Queue,Logs storage;
    class Site,Social,Slack,Alert secondary;
```

---

## 2. Individual Workflow Diagrams (WF1 – WF7)

### WF1 — Website Content Gap Analysis
Audits live WordPress articles nightly across US States and core practice areas, determines coverage deficits, and posts a structured gap payload to WF2.

```mermaid
flowchart LR
    A["Schedule Trigger<br/>(Daily 01:00 AM)"] --> B["Fetch WordPress Posts<br/>(REST API)"]
    B --> C["Extract Titles, URLs & Content<br/>(Code Node)"]
    C --> D["Compare Against Target Legal Topics<br/>(OpenAI GPT-4o)"]
    D --> E["Identify Covered Topics & Content Gaps<br/>(Code Node)"]
    E --> F["Build Structured Gap Report<br/>(Code Node)"]
    F --> G["Send Report to WF2 Webhook<br/>(HTTP Request)"]
```

---

### WF2 — Legal Topic Research and Ranking
Consumes the WF1 report, normalizes candidates, queries Google SERP and CourtListener legal authorities, scores editorial priority (1–100), and appends vetted records to the Topic Bank.

```mermaid
flowchart TD
    A["Receive WF1 Gap Report<br/>(Webhook)"] --> B["Normalize Topic Candidates<br/>(Code Node)"]
    B --> C["Search Google SERP Evidence<br/>(Serper API)"]
    C --> D["Research Competitors & Legal Sources<br/>(CourtListener API)"]
    D --> E["Check Jurisdiction and Search Intent<br/>(OpenAI GPT-4o)"]
    E --> F["Collect Available SEO Metrics<br/>(DataForSEO / Search API)"]
    F --> G["Score and Rank Topics<br/>(OpenAI GPT-4o)"]
    G --> H["Validate Research Results<br/>(Code Node)"]
    H --> I["Editorial Queue / Database<br/>(Append to Topic_Bank)"]
    I --> J["Return WF2 Research Report<br/>(Respond to Webhook)"]
```

---

### WF3 — SEO Legal Article Generation
Ingests approved topics, outlines the article, synthesizes the complete draft under strict anti-hallucination guardrails, validates citations against primary legal domains, and injects Schema.org JSON-LD and attorney directory CTAs.

```mermaid
flowchart TD
    A["Select Approved Topic<br/>(Google Sheets Topic_Bank)"] --> B["Research Reliable Legal Sources<br/>(CourtListener API)"]
    B --> C["Create Article Outline<br/>(OpenAI GPT-4o)"]
    C --> D["Generate Article Draft<br/>(OpenAI GPT-4o)"]
    D --> E["Validate Facts and Citations<br/>(Code Node)"]
    E --> F["Generate SEO Metadata & FAQs<br/>(OpenAI GPT-4o)"]
    F --> G["Fetch Site Posts for Linking<br/>(WordPress REST API)"]
    G --> H["Add Internal Links and Attorney CTA<br/>(Code Node)"]
    H --> I{"Legal Review Required?<br/>(IF Node)"}
    I -->|"Yes"| J["Human Review<br/>(Slack/Discord Alert)"]
    I -->|"No"| K["Prepare WordPress Draft<br/>(Set Node Payload)"]
    J --> K
```

---

### WF4 — AI Featured Image and WordPress Draft
Generates a photorealistic 1792×1024 editorial image via DALL-E 3 without text, uploads the binary to the WordPress Media Library, creates the post draft with Rank Math SEO custom meta, and logs the queue ID.

```mermaid
flowchart LR
    A["Approved Article Content<br/>(Trigger)"] --> B["Create Image Prompt<br/>(Code Node)"]
    B --> C["Generate Featured Image<br/>(DALL-E 3)"]
    C --> D["Validate Image<br/>(Code Node)"]
    D --> E["Download Image Binary<br/>(HTTP Request)"]
    E --> F["Upload Image to WordPress<br/>(WP REST Media)"]
    F --> G["Create WordPress Draft via REST API<br/>(Rank Math Meta)"]
    G --> H["Set Featured Image & Taxonomy<br/>(WP REST Posts)"]
    H --> I["Save Post ID and Status<br/>(Append Publishing_Queue)"]
```

---

### WF5 — Scheduled Publishing
Executes daily at 09:00 AM, verifies scheduled or due drafts, confirms required fields, promotes the post to `publish`, verifies the live HTTP 200 URL, and notifies WF6.

```mermaid
flowchart TD
    A["Schedule Trigger<br/>(Daily 09:00 AM)"] --> B["Fetch Due Articles<br/>(Publishing_Queue)"]
    B --> C["Check Approval and Required Fields<br/>(Code Node)"]
    C --> D{"Ready to Publish?<br/>(IF Node)"}
    D -->|"No"| E["Keep Queued and Flag Issue<br/>(Update Publishing_Queue)"]
    D -->|"Yes"| F["Publish or Verify WordPress Schedule<br/>(WP REST API)"]
    F --> G["Verify Published URL<br/>(HTTP Request)"]
    G --> H["Record Publication Status<br/>(Update Publishing_Queue)"]
    H --> I["Trigger WF6<br/>(Webhook / Sub-workflow)"]
```

---

### WF6 — Social Media Distribution
Triggered when an article goes live. Generates platform-tailored social copy for LinkedIn, X (Twitter), Facebook, Bluesky, and Threads, broadcasts updates, and tracks distribution status.

```mermaid
flowchart TD
    A["Published Article Event<br/>(Webhook)"] --> B["Fetch Title, URL and Image<br/>(WordPress REST API)"]
    B --> C["Generate Platform-Specific Copy<br/>(OpenAI GPT-4o-mini)"]
    C --> D["Publish to Configured Channels<br/>(Multi-Channel Dispatcher)"]
    D --> E{"All Posts Successful?<br/>(IF Node)"}
    E -->|"Yes"| F["Record Social Post URLs<br/>(Status: DISTRIBUTED)"]
    E -->|"No"| G["Log Failure and Queue Retry<br/>(Status: FAILED)"]
    F --> H["Update Distribution Status<br/>(Respond to Webhook)"]
    G --> H
```

---

### WF7 — Monitoring, Logging and Error Handling
Central error catcher configured as the n8n Error Trigger. Captures node and workflow error details, logs every incident to Google Sheets `Execution_Logs`, applies exponential backoff for transient issues (HTTP 429, 502, timeouts), and escalates fatal errors to Slack/Discord.

```mermaid
flowchart TD
    A["Workflow Execution<br/>(Error Trigger)"] --> B["Record Status, IDs and Results<br/>(Code Node)"]
    B --> C["Log to Execution Logs Sheet<br/>(Google Sheets)"]
    C --> D{"Execution Successful?<br/>(IF Node)"}
    D -->|"Yes"| E["Update Pipeline Status<br/>(Google Sheets)"]
    D -->|"No"| F["Capture Error Details<br/>(Code Node)"]
    F --> G{"Retry Transient Failures?<br/>(IF Node)"}
    G -->|"Retries Exhausted / Fatal"| H["Alert Administrator<br/>(Slack/Discord Alert)"]
    H --> I["Manual Recovery Queue<br/>(Status: MANUAL_REQUIRED)"]
```
