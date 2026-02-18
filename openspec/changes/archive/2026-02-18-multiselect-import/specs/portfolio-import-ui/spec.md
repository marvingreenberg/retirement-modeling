## MODIFIED Requirements

### Requirement: Multi-file import
The file picker SHALL allow selecting multiple files at once, parsing each and combining results into a single import modal.

#### Scenario: Multiple files selected
- **WHEN** user selects 3 files (.qfx, .ofx, .csv)
- **THEN** all files are parsed and all resulting accounts are shown in the import modal
- **AND** the confirm button shows the total account count

#### Scenario: Mixed file types
- **WHEN** a .csv file is selected alongside .ofx files
- **THEN** .csv files are parsed with `parseCSV()` and .ofx/.qfx with `parseOFX()`

#### Scenario: Per-file error handling
- **WHEN** one file fails to parse but others succeed
- **THEN** an error message names the failed file
- **AND** successfully parsed accounts are still shown in the modal

### Requirement: CSV format support
The import picker SHALL accept `.csv` files in addition to `.ofx` and `.qfx`.

#### Scenario: CSV file accepted
- **WHEN** the file picker opens
- **THEN** the accept filter includes `.ofx,.qfx,.csv`

#### Scenario: Button label
- **WHEN** the import button is displayed
- **THEN** it reads "Import Accounts" (not "Import OFX/QFX")
