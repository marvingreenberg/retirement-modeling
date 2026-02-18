## REMOVED Requirements

### Requirement: Capital gains % in Advanced Settings
**Reason**: The `tax_rate_capital_gains` config field is removed. Capital gains are always calculated using tiered progressive brackets. Pre-1.0, no backward compatibility needed.
**Migration**: Remove the Capital Gains % input from the Advanced Settings section. Remove the field from Zod schema, TypeScript types, and store defaults.

## MODIFIED Requirements

### Requirement: Invalid data handling
The system SHALL gracefully handle saved data that references removed fields.

#### Scenario: localStorage with unknown fields
- **WHEN** auto-save restores data containing `tax_rate_capital_gains`
- **THEN** the Zod schema SHALL strip unknown fields silently
- **AND** the portfolio SHALL load without the removed field

#### Scenario: Imported file with unknown fields
- **WHEN** a JSON file containing `tax_rate_capital_gains` is imported
- **THEN** the Zod schema SHALL strip unknown fields
- **AND** the portfolio SHALL load successfully without the removed field
