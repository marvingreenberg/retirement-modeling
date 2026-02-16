## MODIFIED Requirements

### Requirement: Spending page shows summary
The spending page SHALL display the base monthly spending (with annual equivalent) and total planned expenses in the header area.

#### Scenario: Expenses exist
- **WHEN** user has $120,000 annual spending and $40,000 in planned expenses
- **THEN** the header shows "Base: $10,000/mo ($120,000/yr) + $40,000 planned"

#### Scenario: No expenses
- **WHEN** user has $120,000 annual spending and no planned expenses
- **THEN** the header shows "Base: $10,000/mo ($120,000/yr)"
