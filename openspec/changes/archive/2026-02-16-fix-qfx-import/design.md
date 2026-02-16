## Context

The OFX/QFX parser (`ofxParser.ts`) converts OFX SGML to XML by stripping headers, closing unclosed leaf tags, and removing Intuit extension tags (which contain dots, invalid in XML element names). The INTU removal regex `/<INTU\.[^>]*>[^<]*/g` only matches opening tags. Files from Wealthfront use pre-closed XML (`<INTU.BID>17260</INTU.BID>`), leaving orphaned closing tags that break DOMParser.

## Goals / Non-Goals

**Goals:**
- Parse all QFX files from major brokers (Vanguard, Wealthfront, Fidelity) without errors
- Tolerate unknown extension tags with dots in their names
- Show clear, non-technical error messages on parse failure
- Require explicit account type selection before importing

**Non-Goals:**
- Switching to a different parsing approach (HTML mode, regex-only extraction)
- Auto-detecting account type from OFX data (not encoded in the format)

## Decisions

**1. Generalize dot-tag stripping**
- Change regex from `/<\/?INTU\.[^>]*>[^<]*/g` to `/<\/?[A-Z][A-Z0-9]*\.[^>]*>[^<]*/g`
- Matches any tag with a dot (INTU.BID, CUSTOM.EXT, etc.), both opening and closing
- Rationale: Standard OFX tags never contain dots; any dot tag is a non-standard extension

**2. Filename-based error message**
- Parser throws generic message; UI prepends filename: "Could not load <name>."
- Rationale: Users care about which file failed, not XML internals

**3. Unset account type with disabled confirm**
- Default `accountTypes` to `''` instead of `'brokerage'`
- Add disabled placeholder option "-- Select type --"
- Derive `allTypesSet` reactively; disable confirm button when false
- Rationale: OFX doesn't encode account type (IRA/Roth/brokerage), so defaulting to brokerage is a silent assumption that could be wrong

## Risks / Trade-offs

- Stripping all dot-containing tags could theoretically remove meaningful data from some exotic broker export, but standard OFX tags never use dots
- Requiring type selection adds one click per account but prevents incorrect defaults
