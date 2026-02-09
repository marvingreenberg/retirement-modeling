## MODIFIED Requirements

### Requirement: Simulation settings panel
The simulation settings panel SHALL provide input controls for simulation assumption parameters excluding spending configuration. The settings panel is rendered in the left panel of the landing page below the portfolio editor. Spending strategy and its conditional parameters are configured on the `/spending` page.

#### Scenario: Assumption inputs present
- **WHEN** the user views the landing page
- **THEN** the simulation settings inputs are visible below the portfolio editor sections in the left panel, including:
  - Inflation Rate (numeric, 0-50%, step 0.5%)
  - Investment Growth Rate (numeric, -50% to 50%, step 0.5%)
  - Conversion Strategy (dropdown: Standard, IRMAA Tier 1, 22% Bracket, 24% Bracket)
  - State Tax Rate (numeric, 0-20%)
  - Capital Gains Rate (numeric, 0-30%)
  - RMD Start Age (numeric, 70-80)
  - IRMAA Tier 1 Limit (currency)

#### Scenario: Spending strategy not in settings panel
- **WHEN** the user views the simulation settings panel
- **THEN** the spending strategy dropdown, withdrawal rate, and guardrails parameters are NOT present
