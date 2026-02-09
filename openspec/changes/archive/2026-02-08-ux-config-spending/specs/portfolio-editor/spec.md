## MODIFIED Requirements

### Requirement: Collapsible form sections
The portfolio editor SHALL organize fields into collapsible sections: People & Timeline, Accounts, and Income. Each section SHALL be independently expandable/collapsible. Spending configuration is on the `/spending` page.

#### Scenario: Sections start expanded
- **WHEN** the user opens the portfolio editor
- **THEN** the People & Timeline section is expanded and other sections are collapsed

#### Scenario: Toggle section
- **WHEN** the user clicks a collapsed section header
- **THEN** that section expands to show its fields

## REMOVED Requirements

### Requirement: Spending section
**Reason**: Spending configuration (annual spend, planned expenses, strategy selection) moved to the dedicated `/spending` page.
**Migration**: All spending controls are on `/spending`. The portfolio editor no longer includes a Spending Plan section.
