## MODIFIED Requirements

### Requirement: Conversion Timing
The system SHALL perform conversions at any age when the selected conversion strategy has a non-zero ceiling and AGI headroom exists. RMD income is included in AGI before the headroom calculation, so post-RMD-age conversions are naturally bounded.

#### Scenario: Before RMD age
- WHEN primary owner age is less than `rmd_start_age` (default 73)
- AND conversion ceiling is greater than 0
- THEN conversions may be executed based on AGI headroom

#### Scenario: At or after RMD age with headroom
- WHEN primary owner age is `rmd_start_age` or older
- AND conversion ceiling is greater than 0
- AND AGI (including RMD income) is below the conversion ceiling by more than $5,000
- THEN conversions are executed up to the AGI headroom

#### Scenario: At or after RMD age without headroom
- WHEN primary owner age is `rmd_start_age` or older
- AND RMD income pushes AGI to or above the conversion ceiling
- THEN no conversions are performed (headroom is zero or below threshold)

### Requirement: Conversion strategy UI gating
The conversion strategy dropdown SHALL always be enabled regardless of the primary user's age. The previous behavior of disabling the dropdown at RMD age SHALL be removed.

#### Scenario: User before RMD age
- **WHEN** primary age is 65 and RMD start age is 73
- **THEN** the conversion strategy dropdown is enabled and selectable

#### Scenario: User at RMD age
- **WHEN** primary age is 73 and RMD start age is 73
- **THEN** the conversion strategy dropdown is enabled and selectable

#### Scenario: User past RMD age
- **WHEN** primary age is 80 and RMD start age is 73
- **THEN** the conversion strategy dropdown is enabled and selectable

## REMOVED Requirements

(The previous "Conversion Timing" requirement that restricted conversions to before RMD age is superseded by the modified version above. The previous "Conversion strategy UI gating" requirement that disabled the dropdown at RMD age is superseded by the modified version above.)
