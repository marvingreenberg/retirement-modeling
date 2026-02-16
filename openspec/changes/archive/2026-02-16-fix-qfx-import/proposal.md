## Why

QFX files exported from Wealthfront (and potentially other brokers) use XML-style closing tags on Intuit extension elements like `<INTU.BID>17260</INTU.BID>`. The OFX preprocessor only strips opening INTU tags, leaving orphaned `</INTU.BID>` closing tags that cause DOMParser XML parse errors. The error message shown to users is the raw browser XML error, which is unhelpful. Additionally, the import flow defaults account type to "brokerage" without requiring the user to explicitly choose.

## What Changes

- **Fix extension tag stripping**: Generalize from INTU-only to all dot-containing tags, handling both SGML and XML-style (with closing tags)
- **Simplify error message**: Show "Could not load <filename>" instead of raw XML parse errors
- **Require account type selection**: Default to unset ("-- Select type --"), disable import button until all types chosen

## Capabilities

### Modified Capabilities

- `portfolio-import-ui`: OFX preprocessing handles broader range of extension tags; error display uses filename; account type requires explicit selection before import

## Impact

- **ofxParser.ts**: Regex change in `preprocessOFX`, simplified error in `parseOFX`
- **ImportPortfolio.svelte**: Error message includes filename, account type defaults to unset with disabled confirm button
- **Tests**: New test cases for XML-style extension tags, Wealthfront-format files, error messages
