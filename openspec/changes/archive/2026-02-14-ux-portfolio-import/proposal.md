## Why

Users manually enter account balances. Every major brokerage (Fidelity, Vanguard, Schwab, Wealthfront) supports OFX/QFX file download. Parsing these files client-side eliminates manual entry, keeps financial data in the browser (never sent to server), and provides per-holding detail for portfolio analysis.

## What Changes

- Add OFX/QFX parser in TypeScript that runs entirely in the browser
- Parse INVPOSLIST positions, resolve CUSIPs to tickers via SECLIST
- Asset classification with built-in ETF lookup table (~50 common tickers)
- Portfolio summary: allocation percentages, stock/bond mix, estimated return
- File upload UI component on the landing page alongside existing accounts list
- Parsed accounts populate the existing `Account[]` model after user maps account types (pretax/roth/brokerage)
- No backend changes — file never leaves the browser

## Capabilities

### New Capabilities
- `portfolio-import-ui`: OFX/QFX client-side parsing, asset classification, file upload component, account-type mapping flow

### Modified Capabilities
(none — integrates with existing Account type, no spec changes to simulation or API)

## Impact

- New: `ui/src/lib/ofxParser.ts` — OFX SGML parser + position extraction
- New: `ui/src/lib/assetClassification.ts` — ETF lookup, allocation summary
- New: `ui/src/lib/components/ImportPortfolio.svelte` — file upload + account mapping UI
- New tests for parser and classification
- Modified: landing page (`+page.svelte`) to include import component
- No backend changes
