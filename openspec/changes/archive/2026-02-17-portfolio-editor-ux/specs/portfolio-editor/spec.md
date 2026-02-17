## ADDED Requirements

### Requirement: Select-all-on-focus for editor inputs
All text and number `<input>` elements in the Accounts, Budget, and Income editors SHALL select their full contents when receiving focus. This allows users to type a replacement value immediately without manual selection.

#### Scenario: Focus selects existing value
- **WHEN** the user clicks or tabs into a number input containing "1000"
- **THEN** the text "1000" is fully selected
- **AND** typing "500" replaces the value to "500" (not "1000500")

#### Scenario: Works on text inputs
- **WHEN** the user clicks into an account Name input containing "401k"
- **THEN** the text "401k" is fully selected

### Requirement: Immediate type-change reactivity for expenses
When the user changes a planned expense's type between One-time and Recurring, the When field SHALL immediately switch between the single year input and the start/end year inputs without requiring the user to click away or close/reopen the section.

#### Scenario: Switch from one-time to recurring
- **WHEN** a planned expense has type "One-time" with year 2028
- **AND** the user changes the Type dropdown to "Recurring"
- **THEN** the When field immediately shows two year inputs (start year pre-filled with 2028, end year empty)

#### Scenario: Switch from recurring to one-time
- **WHEN** a planned expense has type "Recurring" with start year 2026 and end year 2035
- **AND** the user changes the Type dropdown to "One-time"
- **THEN** the When field immediately shows a single year input pre-filled with 2026

### Requirement: Income section card layout
The Income editor SHALL display Social Security fields in a card-style block with `bg-surface-100` background and rounded corners. Other Income streams SHALL each display as individual card-style rows. A single "Other Income" heading SHALL appear above all income stream rows. Each stream card SHALL contain inline label+input pairs matching the Accounts editor pattern.

#### Scenario: Social Security card block
- **WHEN** the Income section is expanded
- **THEN** Social Security fields (Primary FRA Benefit, Primary Start Age, and optionally Spouse fields) appear inside a rounded card with background fill

#### Scenario: Other Income single header
- **WHEN** the user has 3 income streams
- **THEN** a single "Other Income" heading appears above the rows
- **AND** each stream appears as a card-style row with inline inputs (Name, Amount, Start Age, End Age, COLA %, Taxable)
- **AND** labels appear within each card row (not as a separate header row above)

## MODIFIED Requirements

### Requirement: Planned expenses table layout
Planned expenses SHALL be displayed as card-style rows with background fill (`bg-surface-100`) and rounded corners, matching the Accounts editor visual style. Each expense row SHALL contain inline label+input pairs for Name, Amount, Type, When, Inflation checkbox, and a remove button. Column labels SHALL appear within each card row. The Annual Spending input SHALL appear above the expense cards.

#### Scenario: Card rows visible
- **WHEN** the user has one or more planned expenses in the Budget section
- **THEN** each expense displays as a rounded card row with background fill containing inline inputs

#### Scenario: One-time expense When field
- **WHEN** a planned expense has type "One-time" with year 2028
- **THEN** the When area displays a single year input showing 2028

#### Scenario: Recurring expense When field
- **WHEN** a planned expense has type "Recurring" with start year 2026 and end year 2035
- **THEN** the When area displays two year inputs showing 2026 and 2035 separated by a dash

#### Scenario: Add expense
- **WHEN** the user clicks "Add Expense" below the cards
- **THEN** a new card row appears with default values

#### Scenario: Remove expense
- **WHEN** the user clicks the remove button on a card row
- **THEN** that expense card is removed
