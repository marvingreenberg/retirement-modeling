## Purpose
Main landing page combining portfolio overview, simulation controls, results display, and navigation to other views.
## Requirements
### Requirement: Two-panel landing page layout
The landing page SHALL use a single-column vertical layout. Simulation settings appear at the top, followed by chart/results, then a portfolio summary bar, then accounts and income editors below.

#### Scenario: Landing page with results
- **WHEN** user has run a simulation
- **THEN** the page displays (top to bottom): SimulateSettings, SimulateView with chart, portfolio summary bar with nav links, PortfolioEditor with accounts/income

#### Scenario: Landing page before simulation
- **WHEN** no simulation has been run
- **THEN** the page displays SimulateSettings, WelcomeState placeholder, then PortfolioEditor

### Requirement: Welcome state before first simulation
The results panel SHALL display a welcome message before any simulation has been run. The welcome state SHALL guide the user to add accounts and configure their portfolio after completing setup.

#### Scenario: Welcome state on initial load
- **WHEN** the user completes setup and no simulation has been run
- **THEN** the right panel displays a welcome message guiding the user to add accounts and run a simulation

#### Scenario: Welcome state replaced by results
- **WHEN** a simulation completes successfully
- **THEN** the welcome state is replaced by simulation results and does not reappear until page reload

### Requirement: Sample data loading
The landing page SHALL provide a "Load Sample Data" button that populates the portfolio with a realistic example scenario. The button SHALL appear alongside the existing Load/Save file controls.

#### Scenario: Load sample data
- **WHEN** the user clicks "Load Sample Data"
- **THEN** the portfolio is populated with a realistic two-person household scenario including multiple account types, Social Security income, and planned expenses

#### Scenario: Sample data is valid
- **WHEN** sample data is loaded
- **THEN** the portfolio passes validation with no errors and is ready for simulation

### Requirement: Simulation controls placement
The Simulate button and run mode selector SHALL appear at the bottom of the left panel, below the portfolio editor sections.

#### Scenario: Simulate button visible
- **WHEN** the user views the landing page
- **THEN** the Simulate button is visible below the portfolio collapsible sections

#### Scenario: Run simulation from landing page
- **WHEN** the user clicks Simulate
- **THEN** the simulation runs and results appear in the right panel

### Requirement: Portfolio summary in welcome state
The welcome state SHALL display a summary of the current portfolio: total account balance, annual spending, and estimated coverage years (balance / spending). The summary only appears when at least one account exists.

#### Scenario: Summary with configured portfolio
- **WHEN** the user has accounts and spending configured but has not run a simulation
- **THEN** the welcome state shows total balance, annual spending, and estimated years

#### Scenario: Summary with zero spending
- **WHEN** the user has accounts but $0 annual spending
- **THEN** the welcome state shows total balance and "$0" for spending, without a coverage estimate

### Requirement: Validation warning banner
The landing page SHALL display a warning banner above the results area when the portfolio has common configuration issues.

#### Scenario: No spending configured
- **WHEN** the portfolio has annual_spend_net of 0
- **THEN** a warning reads "Annual spending is $0 — configure spending on the Spending page"

#### Scenario: No warnings when portfolio is complete
- **WHEN** the portfolio has spending > 0 and at least one account
- **THEN** no warning banner is displayed

### Requirement: Results navigation hint
After simulation results appear, a link SHALL guide users to the Details page for the full year-by-year breakdown.

#### Scenario: View Details link after single run
- **WHEN** single-run results are displayed
- **THEN** a "View year-by-year details" link appears pointing to /details

#### Scenario: View Details link after Monte Carlo
- **WHEN** Monte Carlo results are displayed
- **THEN** a "View yearly percentiles" link appears pointing to /details

### Requirement: Loading indicator
The loading state SHALL display an animated spinner while a simulation is in progress.

#### Scenario: Loading state
- **WHEN** a simulation is running
- **THEN** an animated spinner is displayed with "Running simulation..." text

### Requirement: Portfolio summary bar
The landing page SHALL display a summary bar showing total portfolio balance, monthly spending (with annual in parentheses), spending strategy (if non-default), and navigation links to Spending, Compare, and Details pages. The summary bar SHALL only appear when accounts exist.

#### Scenario: Summary bar with accounts
- **WHEN** user has accounts totaling $1M and spending of $120,000/yr
- **THEN** summary bar shows portfolio total, "$10,000/mo ($120,000/yr)", and links to /spending, /compare, /details

#### Scenario: Summary bar hidden without accounts
- **WHEN** user has no accounts
- **THEN** summary bar is not displayed

