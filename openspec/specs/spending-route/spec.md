# spending-route Specification

## Purpose
TBD - created by archiving change fe-1-ux-refactoring. Update Purpose after archive.
## Requirements
### Requirement: Spending route exists
The application SHALL provide a `/spending` route accessible via AppBar navigation that displays the full spending plan editor.

#### Scenario: Navigate to spending page
- **WHEN** user clicks the "Spending" link in the AppBar
- **THEN** the browser navigates to `/spending` and renders the SpendingEditor component with annual spending input and planned expenses

### Requirement: Spending page shows validation errors
The spending page SHALL display validation errors for planned expenses when the form has been touched.

#### Scenario: Invalid expense amount
- **WHEN** user enters an invalid amount for a planned expense
- **THEN** the error is displayed at the top of the spending page

### Requirement: Spending page shows summary
The spending page SHALL display the base monthly spending (with annual equivalent) and total planned expenses in the header area.

#### Scenario: Expenses exist
- **WHEN** user has $120,000 annual spending and $40,000 in planned expenses
- **THEN** the header shows "Base: $10,000/mo ($120,000/yr) + $40,000 planned"

#### Scenario: No expenses
- **WHEN** user has $120,000 annual spending and no planned expenses
- **THEN** the header shows "Base: $10,000/mo ($120,000/yr)"

