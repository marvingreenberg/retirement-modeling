# BE-8: Chatbot Integration — Design Notes

## Overview

Add an AI chatbot to the retirement simulator that can help users understand their portfolio, explain simulation results, and suggest parameter adjustments.

## Use Cases

1. **Portfolio Analysis**: "What does my stock/bond allocation look like?" — Summarize imported holdings, identify concentration risk, suggest diversification.

2. **Result Explanation**: "Why did the simulation show depletion at age 87?" — Walk through year-by-year logic: when RMDs start, how spending exceeds income, where tax drag occurs.

3. **What-If Guidance**: "What if I delay Social Security to 70?" — Suggest parameter changes and explain trade-offs before the user re-runs.

4. **Tax Strategy**: "Should I do Roth conversions?" — Explain conversion strategies in context of the user's bracket, IRMAA exposure, and time horizon.

5. **Terminology Help**: "What is IRMAA?" — Answer financial planning questions using content from ApplicationDetails.md.

## Architecture Options

### Option A: Client-side API Key (Simplest)

User provides their own API key (Anthropic or OpenAI) stored in localStorage. The UI sends chat requests directly to the provider's API with the portfolio context as system prompt.

- **Pros**: No backend changes, no GCP costs, no auth needed
- **Cons**: User must have an API key, key stored client-side (less secure), no server-side context enrichment

### Option B: Backend Proxy with GCP

FastAPI endpoint `/api/v1/chat` that proxies requests to an LLM API. API key stored as a Cloud Run secret.

- **Pros**: Key managed server-side, can enrich context with simulation results, rate limiting possible
- **Cons**: Requires GCP secret management, adds latency, costs accrue to service operator

### Option C: Vertex AI (GCP Native)

Use Google's Vertex AI (Gemini models) via the `google-cloud-aiplatform` SDK. Service account auth, no external API keys.

- **Pros**: Native GCP integration, IAM-based auth, no key management
- **Cons**: GCP lock-in, Vertex pricing, requires project setup

## Recommendation

Start with **Option A** for single-user local deployment. Add Option B when multi-user (BE-9) is implemented, since the backend already handles user context.

## Security Considerations

- **API Key Storage**: If client-side, use `localStorage` with a warning. Never log or transmit keys to the backend.
- **Context Injection**: Portfolio data sent as chat context should not include any data beyond what the user has entered. No PII beyond names/ages already in the config.
- **Rate Limiting**: If backend-proxied, implement per-session rate limiting to prevent abuse.
- **Prompt Injection**: Sanitize user input before including in prompts. Do not allow the chat to modify portfolio data directly — only suggest changes.

## Implementation Sketch

```
UI: ChatPanel component (sidebar or drawer)
  → User types question
  → Build prompt: system context (portfolio JSON + last simulation summary) + user message
  → Call LLM API (direct or via /api/v1/chat)
  → Stream response into chat panel
```

Context template:
```
You are a retirement planning assistant. The user has a portfolio with:
- Total balance: $X across N accounts (Y% stocks, Z% bonds)
- Annual spending: $X, strategy: fixed_dollar
- Social Security: primary $X/yr at age Y, spouse $X/yr at age Z
- Last simulation: final balance $X, taxes $X, IRMAA $X

Answer questions about their retirement plan. Be specific to their numbers.
```

## Dependencies

- LLM provider SDK (anthropic or openai Python package, or @anthropic-ai/sdk for client-side)
- For Option B/C: GCP Secret Manager or Vertex AI setup
- UI: New ChatPanel.svelte component

## Effort Estimate

- Option A (client-side): ~2 days (ChatPanel UI + API integration)
- Option B (backend proxy): +1 day (endpoint + secret management)
- Option C (Vertex AI): +2 days (GCP setup + SDK integration)
