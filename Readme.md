# TransGuard - QueueStorm Investigator API

Production-ready backend API for the **QueueStorm Investigator** preliminary round of the SUST CSE Carnival 2026 Codex Community Hackathon.

This is an AI-powered support investigation API for a digital finance platform. It is not a CRUD app, not a chatbot, and not a free-form AI answer generator. Business decisions are made by deterministic rule-based services; Gemini is used only to write safe, professional support text.

## What It Does

- Investigates customer support complaints using complaint text and transaction history.
- Finds the most relevant transaction when evidence is clear.
- Detects ambiguous or insufficient evidence without guessing.
- Classifies case type, department, severity, evidence verdict, and human-review requirement with deterministic logic.
- Uses Google Gemini 2.5 Flash only for:
  - `agent_summary`
  - `recommended_next_action`
  - `customer_reply`
- Falls back to deterministic safe text if Gemini fails, times out, or is unavailable.
- Sanitizes generated responses to prevent unsafe instructions or promises.

## Tech Stack

- Node.js
- Express.js
- Google Gemini 2.5 Flash
- express-validator
- helmet
- cors
- dotenv
- morgan
- nodemon

No database, authentication, frontend, Docker, sessions, JWT, Redis, or external storage is required.

## Project Structure

```text
src/
  app.js
  server.js
  config/
    env.js
    gemini.js
  controllers/
    analyze.controller.js
    health.controller.js
  routes/
    analyze.routes.js
    health.routes.js
  services/
    reasoning.service.js
    matcher.service.js
    classifier.service.js
    department.service.js
    severity.service.js
    review.service.js
    gemini.service.js
    safety.service.js
    response.service.js
  middleware/
    validate.middleware.js
    error.middleware.js
  validators/
    analyze.validator.js
  prompts/
    system.prompt.js
  utils/
    constants.js
    helpers.js
    logger.js
  enums/
    caseType.js
    department.js
    severity.js
    evidenceVerdict.js
    transactionStatus.js
    transactionType.js
```

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create environment file

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

### 3. Configure environment variables

```env
NODE_ENV=development
PORT=8000
GEMINI_API_KEY=your_gemini_api_key_here
```

`GEMINI_API_KEY` is recommended for AI-written response text, but the API will still return valid deterministic fallback responses if the key is missing or Gemini fails.

## Run Locally

Development mode:

```bash
npm run dev
```

Production mode:

```bash
npm start
```

Default local URL:

```text
http://localhost:8000
```

## API Endpoints

### Health Check

```http
GET /health
```

Response:

```json
{
  "status": "ok"
}
```

### Analyze Ticket

```http
POST /analyze-ticket
Content-Type: application/json
```

Required request fields:

- `ticket_id`
- `complaint`

Optional request fields:

- `language`
- `channel`
- `user_type`
- `campaign_context`
- `transaction_history`
- `metadata`

Example request:

```json
{
  "ticket_id": "TKT-001",
  "complaint": "I sent 5000 taka to a wrong number around 2pm today. Please help.",
  "language": "en",
  "channel": "in_app_chat",
  "user_type": "customer",
  "transaction_history": [
    {
      "transaction_id": "TXN-9101",
      "timestamp": "2026-04-14T14:08:22Z",
      "type": "transfer",
      "amount": 5000,
      "counterparty": "+8801719876543",
      "status": "completed"
    }
  ]
}
```

Example response:

```json
{
  "ticket_id": "TKT-001",
  "relevant_transaction_id": "TXN-9101",
  "evidence_verdict": "consistent",
  "case_type": "wrong_transfer",
  "severity": "high",
  "department": "dispute_resolution",
  "human_review_required": true,
  "agent_summary": "The complaint was classified as wrong_transfer with consistent evidence.",
  "recommended_next_action": "A trained support reviewer should verify the case before any resolution is communicated.",
  "customer_reply": "Thank you for contacting us. We are reviewing the matter through official support channels and will ask only for the minimum information needed if anything else is required.",
  "confidence": 0.9,
  "reason_codes": [
    "wrong_transfer",
    "transaction_match",
    "human_review_required"
  ]
}
```

## Allowed Enums

### `language`

```text
en, bn, mixed
```

### `channel`

```text
in_app_chat, call_center, email, merchant_portal, field_agent
```

### `user_type`

```text
customer, merchant, agent, unknown
```

### `transaction.type`

```text
transfer, payment, cash_in, cash_out, settlement, refund
```

### `transaction.status`

```text
completed, failed, pending, reversed
```

### `case_type`

```text
wrong_transfer
payment_failed
refund_request
duplicate_payment
merchant_settlement_delay
agent_cash_in_issue
phishing_or_social_engineering
other
```

### `department`

```text
customer_support
payments_ops
fraud_risk
merchant_operations
agent_operations
dispute_resolution
```

### `severity`

```text
low, medium, high, critical
```

### `evidence_verdict`

```text
consistent, inconsistent, insufficient_data
```

## Curl Examples

Health:

```bash
curl http://localhost:8000/health
```

Analyze:

```bash
curl -X POST http://localhost:8000/analyze-ticket \
  -H "Content-Type: application/json" \
  -d '{
    "ticket_id": "TKT-001",
    "complaint": "Payment failed but balance deducted.",
    "language": "en",
    "channel": "in_app_chat",
    "user_type": "customer",
    "transaction_history": [
      {
        "transaction_id": "TXN-9301",
        "timestamp": "2026-04-14T16:00:00Z",
        "type": "payment",
        "amount": 1200,
        "counterparty": "MERCHANT-MOBILE-OP",
        "status": "failed"
      }
    ]
  }'
```

## Architecture Flow

```text
Client
  -> POST /analyze-ticket
  -> Request Validation
  -> Transaction Matcher
  -> Evidence Reasoning
  -> Case Classification
  -> Severity Calculation
  -> Department Routing
  -> Human Review Decision
  -> Gemini Narrative Generation
  -> Safety Filter
  -> Final JSON Response
```

## Important Design Rule

Gemini never decides:

- `case_type`
- `department`
- `severity`
- `evidence_verdict`
- `relevant_transaction_id`
- `human_review_required`

These are always determined by deterministic backend logic. Gemini only writes safe language for support agents and customers.

## Error Handling

- Malformed JSON returns `400`.
- Semantically invalid requests return `422`.
- Unknown routes return `404`.
- Server errors return controlled JSON without stack traces, API keys, or internal secrets.
- Gemini failure does not fail the API.

## Safety Rules

Generated responses are filtered to prevent:

- asking for OTP, PIN, password, CVV, or full card number
- refund, recovery, reversal, or account-unblock promises
- unofficial contact instructions
- third-party contact instructions
- unsafe customer guidance

Protective warnings such as "do not share your PIN or OTP" are allowed.

## Deployment on Render

Recommended Render settings:

```text
Build Command: npm install
Start Command: npm start
```

Environment variables:

```text
NODE_ENV=production
PORT=<Render sets this automatically>
GEMINI_API_KEY=<your Gemini API key>
```

Render provides `PORT` automatically. The server reads it from `process.env.PORT`.

## Local Validation

The `tests/data` folder contains official sample and edge-case JSON packs used for manual validation. They are not required for production runtime, but keeping them is useful for regression checks before submission.

## Notes for Judges and Reviewers

- The backend is intentionally deterministic for investigation decisions.
- It avoids guessing when multiple plausible transactions exist.
- It returns `relevant_transaction_id: null` when evidence is ambiguous or insufficient.
- It supports English, Bangla, and Banglish complaints through rule-based keyword and evidence matching.
- It is designed to keep responding safely even when Gemini is unavailable.
