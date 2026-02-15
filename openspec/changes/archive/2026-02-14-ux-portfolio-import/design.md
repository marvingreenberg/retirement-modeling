## Context

OFX (Open Financial Exchange) files use an SGML-like format — not valid XML. They have a plaintext header block (`OFXHEADER:100`, `DATA:OFXSGML`, etc.) followed by SGML with unclosed tags. Browser DOMParser won't handle this directly.

The Python implementation used `ofxtools` to handle the SGML quirks. In the browser, we need a lightweight custom approach: strip the header, close unclosed tags (or use regex extraction), then parse with DOMParser or direct string processing.

The existing UI uses Svelte 5, TypeScript, Skeleton UI, and Tailwind. Account data is stored in Svelte stores as `Account[]`.

## Goals / Non-Goals

**Goals:**
- Parse OFX/QFX files entirely in the browser (no server round-trip)
- Extract positions (symbol, shares, price, market value) and cash balance
- Resolve CUSIPs to tickers via the embedded SECLIST section
- Classify holdings into asset classes and show allocation summary
- Let user map parsed accounts to types (pretax/roth/brokerage) then populate the existing `Account[]` store
- Handle large files (Wealthfront direct-indexing: 10MB, 250+ positions)

**Non-Goals:**
- Transaction history parsing (positions only)
- Cost basis computation
- Backend API for import (entirely client-side)
- Supporting non-OFX formats (CSV, etc.)

## Decisions

### Decision 1: Custom OFX-to-XML preprocessor, then DOMParser

**Choice:** Write a small function that strips the SGML header, then uses regex to close unclosed OFX tags (OFX uses `<TAG>value` without `</TAG>`). This produces valid-ish XML that DOMParser can handle. Then use standard DOM queries to extract positions and securities.

Alternative: Full SGML parser. Over-engineered for this — OFX SGML is a limited subset.

Alternative: Pure regex extraction without XML parsing. Fragile for nested structures like INVPOS inside POSSTOCK.

### Decision 2: Asset class lookup as a simple TypeScript Map

**Choice:** Same ~50 ETF ticker map from the Python implementation, ported to a `Map<string, AssetClass>`. Unknown stocks default to `us_equity`, unknown MFs to `other`.

### Decision 3: Import flow as a modal/drawer, not a separate page

**Choice:** File upload button in the accounts section of the landing page. Clicking it opens a modal showing parsed results, allocation summary, and account-type mapping dropdowns. User confirms → accounts are added to the store.

Alternative: Separate `/import` route. Unnecessary for a single-action flow.

### Decision 4: Aggregate direct-indexing positions in the UI display

**Choice:** Group the 250+ individual stock positions from Wealthfront as "N individual stocks (US Equity)" in the summary display. The individual holdings still populate the account balance correctly.

## Risks / Trade-offs

- **OFX format variations** — different brokerages may produce slightly different SGML. Mitigation: test against the real Vanguard and Wealthfront samples in `docs/accounts/`.
- **10MB file in browser** — DOMParser handles this fine. String processing is the only concern; keep it single-pass where possible.
- **No npm OFX library** — the custom preprocessor is ~50 lines. A dependency would be heavier than the solution.
