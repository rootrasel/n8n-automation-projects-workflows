# Test Cases & Validation Matrix

This document provides a systematic test matrix to validate each workflow under normal, edge, and failure conditions.

---

## 1. Test Suite Overview

| Test ID | Target Workflow | Test Scenario | Expected Outcome | Pass/Fail Criteria |
| :--- | :--- | :--- | :--- | :--- |
| **TC-01** | WF1 Content Gap | Standard gap analysis with 50+ posts. | Generates structured JSON gap report; invokes WF2 webhook. | Valid JSON with `coverage_summary` and `content_gaps`. |
| **TC-02** | WF1 Content Gap | Empty site (0 posts found). | Gracefully falls back to seed practice areas; flags 100% gap. | Does not crash; outputs seed legal topics. |
| **TC-03** | WF2 Topic Ranking | Duplicate topic candidate sent from WF1. | Node `Normalize Topic Candidates` filters duplicate. | No duplicate `title_idea` appended to `Topic_Bank`. |
| **TC-04** | WF2 Topic Ranking | Serper API key invalid or rate-limited. | Node continues on fail; CourtListener & OpenAI execute. | Workflow finishes; relevance score marked with review flag. |
| **TC-05** | WF3 Article Gen | Topic has unsupported legal claims. | `Validate Facts and Citations` flags `requiresHumanReview = true`. | Sends Slack review alert; flags `wpForceDraft = true`. |
| **TC-06** | WF3 Article Gen | Model hallucinates non-primary domain source. | Filter catches non-allowed domain (not on court/gov whitelist). | Hallucination removed or flagged for review. |
| **TC-07** | WF4 Image & Draft | DALL-E 3 generates image; WP media upload. | Image binary uploaded to `/wp/v2/media`; post created as draft. | WordPress post created with Rank Math meta fields populated. |
| **TC-08** | WF5 Scheduled Pub | Post scheduled for future time (not due). | `Check Approval` marks `publish_ready = false`. | Post remains in queue; not published prematurely. |
| **TC-09** | WF5 Scheduled Pub | Post is due with valid WP Post ID. | WP REST API sets status `publish`; verifies live URL. | Returns HTTP 200; triggers WF6 webhook. |
| **TC-10** | WF6 Social Media | Social API rate limit (HTTP 429). | Node catches error; updates row to `social_status = FAILED`. | Logs error details without failing the article publication. |
| **TC-11** | WF7 Error Handler | Transient failure (ECONNRESET, 502 Bad Gateway). | `Capture Error Details` recognizes transient; queues retry. | Logs to `Execution_Logs`; applies exponential backoff. |
| **TC-12** | WF7 Error Handler | Fatal error or max retries reached (3/3). | Dispatches urgent Slack alert; updates status to `MANUAL_REQUIRED`. | Slack alert received; row marked in Google Sheets. |

---

## 2. Sample Payloads for Manual Testing

### A. Testing WF2 Webhook (Manual Trigger)
Send this JSON payload to your WF2 webhook URL (`POST /webhook/wf2-gap-report`):
```json
{
  "source": "Manual Test",
  "all_gaps": [
    {
      "practice_area": "Estate Planning",
      "title": "How to Create a Valid Handwritten Holographic Will in Texas",
      "keyword": "holographic will texas requirements",
      "target_state": "Texas",
      "priority": 9,
      "reason": "High search volume, legal nuances require clear statutory guide."
    }
  ]
}
```

### B. Testing WF6 Social Webhook (Manual Trigger)
Send this JSON payload to your WF6 webhook URL (`POST /webhook/wf6-published-article`):
```json
{
  "wp_post_id": 101,
  "link": "https://common-law.ai/texas-intestate-succession-guide/"
}
```

---

## 3. Legal Content Safeguard Verification Checklist

Before taking any workflow live in production, verify these non-negotiable legal safeguards:
- [x] **No Hallucinated Citations**: Articles never fabricate case names or docket numbers.
- [x] **Primary Source Enforcement**: Only citations from `.gov`, `law.cornell.edu`, `justia.com`, or `courtlistener.com` are retained.
- [x] **Mandatory Disclaimer**: Every article includes an explicit disclaimer stating it is for educational purposes only and not legal advice.
- [x] **Jurisdiction Transparency**: The target state or Federal scope is explicitly stated in the title, intro, and body.
- [x] **Human Review Escalation**: Any unverified claim automatically forces the post into `draft` status and triggers an editorial alert.
