## MODIFIED Requirements

### Requirement: Collapsible form sections
The portfolio editor SHALL organize fields into collapsible sections: People & Timeline, Accounts, Income, Spending, Taxes, and Strategy. Each section SHALL use Skeleton Accordion components with themed styling.

#### Scenario: Sections start expanded
- **WHEN** the user opens the portfolio editor
- **THEN** the People & Timeline section is expanded and other sections are collapsed

#### Scenario: Toggle section
- **WHEN** the user clicks a collapsed section header
- **THEN** that section expands to show its fields

#### Scenario: Themed form inputs
- **WHEN** form fields render
- **THEN** all inputs, selects, and buttons use Skeleton/Tailwind styling consistent with the active theme and mode (light/dark)
