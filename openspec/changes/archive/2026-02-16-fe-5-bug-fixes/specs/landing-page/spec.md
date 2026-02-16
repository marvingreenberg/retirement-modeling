## MODIFIED Requirements

### Requirement: Portfolio summary bar
The landing page SHALL display a summary bar showing total portfolio balance, monthly spending (with annual in parentheses), spending strategy (if non-default), and navigation links to Spending, Compare, and Details pages. The summary bar SHALL only appear when accounts exist.

#### Scenario: Summary bar with accounts
- **WHEN** user has accounts totaling $1M and spending of $120,000/yr
- **THEN** summary bar shows portfolio total, "$10,000/mo ($120,000/yr)", and links to /spending, /compare, /details

#### Scenario: Summary bar hidden without accounts
- **WHEN** user has no accounts
- **THEN** summary bar is not displayed
