## MODIFIED Requirements

### Requirement: Zod validation
All portfolio fields SHALL be validated using Zod schemas that match the backend Pydantic model constraints. Validation errors SHALL be displayed inline next to the relevant field. Simulation settings validation errors (inflation rate, growth rate) SHALL appear next to their respective inputs, not in the portfolio editor error banner.

#### Scenario: Field-level error display
- **WHEN** the user enters a negative balance for an account
- **THEN** an error message appears next to the balance field

#### Scenario: Full portfolio validation on submit
- **WHEN** the user clicks a "Run" button on any analysis tab
- **THEN** the full portfolio is validated and all errors are displayed before the API call is made

#### Scenario: Config validation error appears at input
- **WHEN** the user enters an out-of-range inflation rate (e.g., 103%)
- **THEN** the error message appears next to the inflation rate input, not in the portfolio error banner

### Requirement: Compact budget section
The PortfolioEditor SHALL include a Budget collapsible section containing the monthly spending input (with annual equivalent shown), a count and total of planned expenses (if any), and a link to the full `/spending` page.

#### Scenario: Budget section with planned expenses
- **WHEN** user has 3 planned expenses totaling $55,000 and annual spending of $120,000
- **THEN** the Budget section shows "$10,000/mo ($120,000/yr)", "3 planned expenses ($55,000)", and a "Full spending plan" link to /spending

#### Scenario: Budget section without planned expenses
- **WHEN** user has annual spending of $120,000 and no planned expenses
- **THEN** the Budget section shows "$10,000/mo ($120,000/yr)" and the "Full spending plan" link
