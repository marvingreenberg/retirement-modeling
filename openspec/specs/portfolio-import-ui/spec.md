### Requirement: OFX/QFX Client-Side Parsing
The UI SHALL parse OFX/QFX files in the browser without server communication.

#### Scenario: Valid OFX file with stock positions
- **WHEN** a user selects an OFX/QFX file
- **THEN** the parser SHALL extract each POSSTOCK entry as a holding with cusip, quantity, price, and market_value

#### Scenario: Mutual fund positions
- **WHEN** the file contains POSMF entries
- **THEN** they SHALL be parsed as holdings with security_type "MF"

#### Scenario: Multi-account file
- **WHEN** the file contains multiple INVSTMTRS blocks
- **THEN** the parser SHALL return one parsed account per block

#### Scenario: Cash balance
- **WHEN** the file contains INVBAL with AVAILCASH
- **THEN** the parsed account SHALL include the cash balance

#### Scenario: CUSIP to ticker resolution
- **WHEN** a position's CUSIP appears in the SECLIST section
- **THEN** the holding SHALL have its ticker symbol and security name resolved

#### Scenario: Extension tags with dots (SGML-style)
- **WHEN** a file contains SGML-style extension tags like `<INTU.BID>17260`
- **THEN** the preprocessor SHALL strip the tag and its value before XML parsing

#### Scenario: Extension tags with dots (XML-style with closing tags)
- **WHEN** a file contains XML-style extension tags like `<INTU.BID>17260</INTU.BID>`
- **THEN** the preprocessor SHALL strip both the opening tag with value and the closing tag

#### Scenario: Non-INTU dot-extension tags
- **WHEN** a file contains any tag with a dot in its name (e.g. `<CUSTOM.EXT>`)
- **THEN** the preprocessor SHALL strip it, since standard OFX tags never contain dots

#### Scenario: Invalid file
- **WHEN** the file cannot be parsed as OFX
- **THEN** the UI SHALL display "Could not load <filename>" with a brief explanation
- **AND** SHALL NOT display raw XML parser error messages

---

### Requirement: Asset Classification
The UI SHALL classify holdings into asset classes using a built-in ticker lookup.

#### Scenario: Known ETF
- **WHEN** a holding's ticker is in the asset class lookup table
- **THEN** it SHALL be classified to the mapped class (e.g., VTI → us_equity)

#### Scenario: Unknown stock
- **WHEN** a holding's ticker is not in the lookup and security_type is stock
- **THEN** it SHALL default to us_equity

#### Scenario: Allocation summary
- **WHEN** all holdings are classified
- **THEN** the UI SHALL display allocation percentages by asset class and an estimated weighted return

---

### Requirement: Import Flow UI
The UI SHALL provide a file upload component that guides the user through import.

#### Scenario: File selection
- **WHEN** the user clicks the import button in the accounts section
- **THEN** a file picker SHALL open accepting .qfx and .ofx files

#### Scenario: Parsed results display
- **WHEN** parsing succeeds
- **THEN** a modal SHALL show: account(s) with total value, top holdings, allocation summary chart or breakdown

#### Scenario: Account type mapping
- **WHEN** parsed accounts are displayed
- **THEN** each account SHALL have a dropdown defaulting to "-- Select type --" (unset)
- **AND** the user SHALL be required to select a type (pretax/roth/brokerage) for every account before confirming
- **AND** a text field for account name (pre-filled with broker + account_id)

#### Scenario: Confirm button gating
- **WHEN** any account has no type selected
- **THEN** the Add button SHALL be disabled
- **WHEN** all accounts have a type selected
- **THEN** the Add button SHALL be enabled

#### Scenario: Confirm import
- **WHEN** the user confirms the import
- **THEN** each parsed account SHALL be added to the existing accounts store as an `Account` object
- **AND** the balance SHALL be the total market value of holdings plus cash

#### Scenario: Cancel import
- **WHEN** the user cancels
- **THEN** no accounts SHALL be modified
