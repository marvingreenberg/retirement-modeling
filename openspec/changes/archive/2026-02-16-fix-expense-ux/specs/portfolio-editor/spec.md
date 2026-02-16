## MODIFIED Requirements

### Requirement: Compact budget section
The PortfolioEditor SHALL include a Budget collapsible section containing the annual spending input (with monthly equivalent shown as detail), a count and total of planned expenses (if any), and a link to the full `/spending` page.

#### Scenario: Budget section with planned expenses
- **WHEN** user has 3 planned expenses totaling $55,000 and annual spending of $120,000
- **THEN** the Budget section shows "$120,000/yr ($10,000/mo)", "3 planned expenses ($55,000)", and a "Full spending plan" link to /spending

#### Scenario: Budget section without planned expenses
- **WHEN** user has annual spending of $120,000 and no planned expenses
- **THEN** the Budget section shows "$120,000/yr ($10,000/mo)" and the "Full spending plan" link

### Requirement: Collapsed section summaries
Each collapsible section (Accounts, Budget, Income) SHALL display a summary when collapsed, showing key data inline with the section title.

#### Scenario: Accounts collapsed summary
- **WHEN** the Accounts section is collapsed and user has accounts totaling $1,350,000
- **THEN** the section header shows "Accounts — Total $1.35M"

#### Scenario: Accounts collapsed with no accounts
- **WHEN** the Accounts section is collapsed and user has no accounts
- **THEN** the section header shows "Accounts — No accounts"

#### Scenario: Budget collapsed summary
- **WHEN** the Budget section is collapsed and annual spending is $120,000
- **THEN** the section header shows "Budget — $120,000/yr"

#### Scenario: Budget collapsed with planned expenses
- **WHEN** the Budget section is collapsed with $120,000 annual and 2 planned expenses totaling $55,000
- **THEN** the section header shows "Budget — $120,000/yr + 2 expenses"

#### Scenario: Income collapsed summary with SS and pension
- **WHEN** the Income section is collapsed with SS starting at age 70 and a $24K/yr pension
- **THEN** the section header shows a summary like "Income — SS at 70, Pension $24K/yr"

#### Scenario: Income collapsed with no income
- **WHEN** the Income section is collapsed and no income streams or SS configured
- **THEN** the section header shows "Income — None configured"
