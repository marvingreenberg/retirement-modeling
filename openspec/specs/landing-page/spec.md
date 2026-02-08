## Requirements

### Requirement: Two-panel landing page layout
The landing page (`/`) SHALL display a two-panel layout: a left panel (~40%) containing the portfolio editor and simulation controls, and a right panel (~60%) containing simulation results or a welcome state.

#### Scenario: Two-panel layout on wide screens
- **WHEN** the user opens the app on a screen wider than the `lg` breakpoint
- **THEN** the portfolio editor and simulation controls appear on the left, and the results area appears on the right

#### Scenario: Single-column layout on narrow screens
- **WHEN** the user opens the app on a screen narrower than the `lg` breakpoint
- **THEN** the portfolio editor appears above the results area in a single column

### Requirement: Welcome state before first simulation
The results panel SHALL display a welcome message before any simulation has been run. The welcome state SHALL guide the user to configure their portfolio and run a simulation.

#### Scenario: Welcome state on initial load
- **WHEN** the user opens the app and no simulation has been run
- **THEN** the right panel displays a welcome message with guidance text

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
