## MODIFIED Requirements

### Requirement: OFX/QFX Client-Side Parsing

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

### Requirement: Import Flow UI

#### Scenario: Account type mapping
- **WHEN** parsed accounts are displayed
- **THEN** each account SHALL have a dropdown defaulting to "-- Select type --" (unset)
- **AND** the user SHALL be required to select a type (pretax/roth/brokerage) for every account before confirming

#### Scenario: Confirm button gating
- **WHEN** any account has no type selected
- **THEN** the Add button SHALL be disabled
- **WHEN** all accounts have a type selected
- **THEN** the Add button SHALL be enabled
