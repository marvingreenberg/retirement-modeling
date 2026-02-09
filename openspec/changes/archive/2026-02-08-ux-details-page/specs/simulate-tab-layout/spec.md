## REMOVED Requirements

### Requirement: Year-by-year detail in results area
**Reason**: Year-by-year detail table moved to the dedicated `/details` page.
**Migration**: Users access year-by-year data via the Details tab in the navigation instead of expanding a collapsible section in the simulate results.

## MODIFIED Requirements

### Requirement: Results display adapts to run mode
The results area in the right panel SHALL display appropriate content based on whether a single run or Monte Carlo was executed.

#### Scenario: Single run results
- **WHEN** a single run simulation completes
- **THEN** results show: summary metrics (final balance, total taxes, IRMAA, Roth conversions, years, strategy), balance chart
- **AND** an "Add to Comparison" button appears

#### Scenario: Monte Carlo results
- **WHEN** a Monte Carlo simulation completes
- **THEN** results show: success rate (color-coded), final balance percentiles, fan chart, depletion analysis
- **AND** an "Add to Comparison" button appears (captures median values + success rate)
