## ADDED Requirements

### Requirement: Run Monte Carlo
The Monte Carlo view SHALL provide a "Run Monte Carlo" button, a simulation count input (default 1000, range 1-10000), and an optional seed input. It SHALL send the request to the `/monte-carlo` endpoint.

#### Scenario: Successful Monte Carlo run
- **WHEN** the user clicks "Run Monte Carlo" with a valid portfolio and 1000 simulations
- **THEN** the API is called and results are displayed

#### Scenario: Loading state
- **WHEN** the Monte Carlo simulation is in progress
- **THEN** the button shows a loading indicator and is disabled

### Requirement: Success rate display
The Monte Carlo view SHALL prominently display the success rate (percentage of simulations where the portfolio did not deplete).

#### Scenario: Success rate shown
- **WHEN** Monte Carlo results are available
- **THEN** the success rate is displayed prominently (e.g., "95% Success Rate")

### Requirement: Fan chart
The Monte Carlo view SHALL display a fan chart (area chart) showing percentile bands over time: 5th-95th percentile as the outer band, 25th-75th as the inner band, and the median as a line. The x-axis is age, y-axis is portfolio balance.

#### Scenario: Fan chart renders
- **WHEN** Monte Carlo results with yearly percentiles are available
- **THEN** a fan chart displays with shaded percentile bands and a median line

### Requirement: Final balance percentiles
The Monte Carlo view SHALL display the final balance at key percentiles: 5th, 25th, median, 75th, and 95th.

#### Scenario: Percentiles displayed
- **WHEN** Monte Carlo results are available
- **THEN** final balance percentiles are shown in a summary panel

### Requirement: Depletion information
The Monte Carlo view SHALL display depletion age information when any simulations result in portfolio depletion.

#### Scenario: Depletion ages shown
- **WHEN** Monte Carlo results include depletion ages (non-empty list)
- **THEN** the earliest, median, and latest depletion ages are displayed

#### Scenario: No depletion
- **WHEN** no simulations result in depletion (empty depletion_ages list)
- **THEN** a message indicates no depletion occurred in any simulation
