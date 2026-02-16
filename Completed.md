# Completed

Items moved from TODO.md in order of completion.

---

## FE/BE boundary verification tests

Review the FE/BE boundary with permutations of inputs to ensure that the changes at the UI are processed properly to cause changes in returned API requests for simulation and montecarlo.

---

## UI bugs

- First use lets set user name and age AND add spouse (profile does not allow adding/deleting spouse)
- Bug parsing OFX: tag mismatch errors for .QFX files
- Parsing identifies %equities, etc. but information is not retained anywhere
- Can't import to create first account - get error must have one account
- Disconnect between 4% rule, RMD, and guardrails since can't support spending budget

---

## BE-6b. Cloud Run Deployment Process

Define a `docs/Deploy.md` documenting the GCP Cloud Run deployment process. Add a `make deploy` target.

---

## BE-8. Chatbot Integration / BE-9. Multi-user

Design documents for chatbot integration and multi-user support.

---

## FE-1. UX Refactoring — Layout and Navigation

SvelteKit route-based navigation, AppBar with profile drawer, first-use setup flow, guided tour, landing page with simulation controls, spending page, compare page, details page.

---

## FE-2. E2E Testing Expansion

Playwright E2E test suite covering setup, navigation, simulation, spending, compare, and details pages. TESTING.md documenting test layers.

---

## FE-3. Integrate ApplicationDetails.md Into UI

Contextual help drawer with 4 topics (Tax Bracket Inflation Indexing, Spending Strategies, Social Security Benefit Formula, Income Stream COLA), route-based default topics, maximize toggle, and internal navigation between related topics. CircleHelp button in AppBar.
