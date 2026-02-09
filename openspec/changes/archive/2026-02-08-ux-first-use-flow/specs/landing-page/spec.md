## MODIFIED Requirements

### Requirement: Welcome state before first simulation
The results panel SHALL display a welcome message before any simulation has been run. The welcome state SHALL guide the user to add accounts and configure their portfolio after completing setup.

#### Scenario: Welcome state on initial load
- **WHEN** the user completes setup and no simulation has been run
- **THEN** the right panel displays a welcome message guiding the user to add accounts and run a simulation

#### Scenario: Welcome state replaced by results
- **WHEN** a simulation completes successfully
- **THEN** the welcome state is replaced by simulation results and does not reappear until page reload
