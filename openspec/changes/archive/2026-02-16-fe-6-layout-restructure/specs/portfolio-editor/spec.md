## MODIFIED Requirements

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
- **THEN** the section header shows "Budget — $10,000/mo"

#### Scenario: Budget collapsed with planned expenses
- **WHEN** the Budget section is collapsed with $120,000 annual and 2 planned expenses totaling $55,000
- **THEN** the section header shows "Budget — $10,000/mo + 2 expenses"

#### Scenario: Income collapsed summary with SS and pension
- **WHEN** the Income section is collapsed with SS starting at age 70 and a $24K/yr pension
- **THEN** the section header shows a summary like "Income — SS at 70, Pension $24K/yr"

#### Scenario: Income collapsed with no income
- **WHEN** the Income section is collapsed and no income streams or SS configured
- **THEN** the section header shows "Income — None configured"

### Requirement: Stacked area balance chart
The single-run balance chart SHALL use a stacked area chart with three series: Pre-tax, Roth, and Brokerage. The Total line is removed since the stack top implicitly shows the total.

#### Scenario: Chart renders stacked areas
- **WHEN** single-run results are displayed
- **THEN** the chart shows three filled, stacked areas for pre-tax (bottom), roth (middle), brokerage (top)
- **AND** no separate "Total" line is displayed

#### Scenario: Chart tooltip shows all values
- **WHEN** the user hovers over the chart
- **THEN** the tooltip shows the value for each account type and the total
