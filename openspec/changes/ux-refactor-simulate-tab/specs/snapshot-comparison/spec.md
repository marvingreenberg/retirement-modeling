## ADDED Requirements

### Requirement: Add to Comparison from simulation results
The Simulate tab SHALL provide a button to save the current simulation result as a comparison snapshot.

#### Scenario: Add single run to comparison
- **WHEN** a single run simulation has completed
- **AND** user clicks "Add to Comparison"
- **THEN** a snapshot is saved containing: run name, all assumption values, and outcome metrics (final balance, total taxes, total IRMAA, total Roth conversions)
- **AND** visual feedback confirms the snapshot was added

#### Scenario: Add Monte Carlo run to comparison
- **WHEN** a Monte Carlo simulation has completed
- **AND** user clicks "Add to Comparison"
- **THEN** a snapshot is saved with median outcome values and success rate
- **AND** the snapshot is labeled with run type "MC (N)" where N is iteration count

---

### Requirement: Auto-generated snapshot name
Each comparison snapshot SHALL have an auto-generated name derived from the simulation assumptions.

#### Scenario: Name generation
- **WHEN** a snapshot is created via "Add to Comparison"
- **THEN** the default name is generated from key assumptions (e.g., "3% infl, 7% growth, Fixed Dollar, 22% Bracket")

#### Scenario: Name is editable
- **WHEN** a snapshot is created
- **THEN** the user can edit the name on the Compare tab

---

### Requirement: Comparison table displays snapshots
The Compare tab SHALL display all saved snapshots in a table with assumption and outcome columns.

#### Scenario: Comparison table columns
- **WHEN** user navigates to the Compare tab with saved snapshots
- **THEN** a table is displayed with columns:
  - Name (editable)
  - Type (Single / MC)
  - Inflation Rate
  - Growth Rate
  - Spending Strategy
  - Conversion Strategy
  - Final Balance (median for MC)
  - Total Taxes
  - Total IRMAA
  - Success Rate (MC only, blank for single runs)

#### Scenario: Best values highlighted
- **WHEN** multiple snapshots are displayed
- **THEN** the best value in each outcome column is highlighted (highest final balance, lowest taxes, lowest IRMAA, highest success rate)

---

### Requirement: Remove snapshots from comparison
The Compare tab SHALL allow users to remove individual snapshots.

#### Scenario: Remove a snapshot
- **WHEN** user clicks a remove/delete control on a snapshot row
- **THEN** that snapshot is removed from the comparison table
- **AND** the remaining snapshots are re-evaluated for best-value highlighting

---

### Requirement: Empty comparison state
The Compare tab SHALL display guidance when no snapshots exist.

#### Scenario: No snapshots saved
- **WHEN** user navigates to Compare tab with no saved snapshots
- **THEN** a message is displayed: "No comparisons yet. Run a simulation and click 'Add to Comparison' to start comparing scenarios."

---

### Requirement: Comparison state persists across tab switches
Comparison snapshots SHALL persist as long as the browser session is active.

#### Scenario: Switch tabs and return
- **WHEN** user adds snapshots, switches to Portfolio tab, then returns to Compare
- **THEN** all previously added snapshots are still present
