## MODIFIED Requirements

### Requirement: Themed Monte Carlo controls and results
The Monte Carlo view buttons, inputs, success rate display, percentile panels, and depletion info SHALL use Skeleton/Tailwind styling consistent with the active theme and mode.

#### Scenario: Success rate display styled
- **WHEN** Monte Carlo results show a success rate
- **THEN** the success rate uses themed color variants (green for good, amber for moderate, red for poor)

#### Scenario: Stats panels styled
- **WHEN** percentile and depletion statistics render
- **THEN** they appear in themed card/surface containers
