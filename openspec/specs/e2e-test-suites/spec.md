# e2e-test-suites Specification

## Purpose
TBD - created by archiving change fe-2-e2e-testing. Update Purpose after archive.
## Requirements
### Requirement: Setup flow E2E tests
The `setup.spec.ts` file SHALL verify the first-use setup experience.

#### Scenario: Setup view visible on first visit
- **WHEN** a user navigates to `/` with no saved data
- **THEN** the "Retirement Simulator" heading, name input, age input, "Get Started" and "Load Sample Data" buttons are visible

#### Scenario: Empty name validation
- **WHEN** the user fills in age but leaves name empty and clicks "Get Started"
- **THEN** an error message "Please enter your name" is displayed

#### Scenario: Invalid age validation
- **WHEN** the user enters an age below 20 and clicks "Get Started"
- **THEN** an error message containing "valid age" is displayed

#### Scenario: Successful setup
- **WHEN** the user enters a name and valid age and clicks "Get Started"
- **THEN** the setup view disappears and AppBar navigation links are visible

#### Scenario: Spouse fields toggle
- **WHEN** the user checks "I have a spouse/partner"
- **THEN** spouse name and spouse age input fields appear

#### Scenario: Load sample data skips setup
- **WHEN** the user clicks "Load Sample Data"
- **THEN** the main UI appears with sample account data visible

### Requirement: Navigation E2E tests
The `navigation.spec.ts` file SHALL verify route-based navigation works correctly.

#### Scenario: AppBar shows all nav links
- **WHEN** the user is on the main app (past setup)
- **THEN** links for Overview, Spending, Compare, and Details are visible in the AppBar

#### Scenario: Navigate to Spending
- **WHEN** the user clicks the Spending link
- **THEN** the URL changes to `/spending` and "Spending Plan" text is visible

#### Scenario: Navigate to Compare
- **WHEN** the user clicks the Compare link
- **THEN** the URL changes to `/compare`

#### Scenario: Navigate to Details
- **WHEN** the user clicks the Details link
- **THEN** the URL changes to `/details` and "Run a simulation" prompt is visible

#### Scenario: Navigate back to Overview
- **WHEN** the user navigates to Spending then clicks Overview
- **THEN** the URL returns to `/`

#### Scenario: Color bar visible
- **WHEN** the app is loaded
- **THEN** the gradient color bar below the AppBar is visible

#### Scenario: Profile drawer opens
- **WHEN** the user clicks "Open profile"
- **THEN** a profile drawer showing "Primary Name" is visible

### Requirement: Simulation flow E2E tests
The `simulate.spec.ts` file SHALL verify the full simulation workflow using sample data and the real API.

#### Scenario: Run single simulation with sample data
- **WHEN** the user loads sample data and clicks "Simulate"
- **THEN** simulation results appear with "Final Balance", "Total Taxes", and "Years" visible
- **AND** a chart canvas element is present
- **AND** no error alerts are displayed

#### Scenario: Run Monte Carlo simulation
- **WHEN** the user selects "Monte Carlo" mode and clicks "Simulate"
- **THEN** a "Success Rate" result is displayed
- **AND** percentile data (5th, Median, 95th) is visible

#### Scenario: Add to Comparison from results
- **WHEN** the user runs a simulation and clicks "Add to Comparison"
- **THEN** feedback text "Added!" appears briefly

#### Scenario: Simulation settings collapse after run
- **WHEN** a simulation completes
- **THEN** the settings panel collapses to a summary line with a "Simulate" button

### Requirement: Spending page E2E tests
The `spending.spec.ts` file SHALL verify the spending page displays and accepts input.

#### Scenario: Spending page loads with base amount
- **WHEN** the user navigates to `/spending` after loading sample data
- **THEN** the "Spending Plan" heading and base spending amount are visible

### Requirement: Compare page E2E tests
The `compare.spec.ts` file SHALL verify the comparison workflow.

#### Scenario: Compare page empty state
- **WHEN** the user navigates to `/compare` with no comparison snapshots
- **THEN** the "No comparisons yet" message is displayed

#### Scenario: Compare page shows snapshot after simulation
- **WHEN** the user runs a simulation, adds to comparison, then navigates to `/compare`
- **THEN** a comparison table row with the snapshot data is visible

### Requirement: Details page E2E tests
The `details.spec.ts` file SHALL verify the details page shows results after simulation.

#### Scenario: Details page prompts for simulation
- **WHEN** the user navigates to `/details` without running a simulation
- **THEN** a "Run a simulation" message is displayed

#### Scenario: Details page shows year-by-year data
- **WHEN** the user runs a simulation and navigates to `/details`
- **THEN** a table with columns Year, Age, AGI, Bracket, and Total Balance is visible

