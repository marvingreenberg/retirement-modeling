## MODIFIED Requirements

### Requirement: Route definitions
The app SHALL define the following routes:
- `/` — Home page (two-panel layout: portfolio editor with simulation controls on the left, results on the right)
- `/spending` — Spending strategies
- `/compare` — Snapshot comparison
- `/details` — Detailed results (placeholder)

#### Scenario: Home route content
- **WHEN** the user navigates to `/`
- **THEN** the two-panel landing page is displayed with the portfolio editor on the left and the results area on the right

#### Scenario: Spending route content
- **WHEN** the user navigates to `/spending`
- **THEN** a placeholder page is displayed (spending extraction deferred to ux-config-spending change)

#### Scenario: Compare route content
- **WHEN** the user navigates to `/compare`
- **THEN** the snapshot comparison view is displayed

#### Scenario: Details route placeholder
- **WHEN** the user navigates to `/details`
- **THEN** a placeholder page is displayed indicating detailed results will appear here
