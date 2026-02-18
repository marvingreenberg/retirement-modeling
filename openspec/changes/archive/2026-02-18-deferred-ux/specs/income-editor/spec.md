## MODIFIED Requirements

### Requirement: Age fields display as calendar years
The income editor SHALL display age-based fields (SS start age, stream start/end age) as calendar year inputs with an "(age N)" hint.

#### Scenario: SS start age shown as year
- **WHEN** primary SS start age is 67 and primary is currently 65 in year 2026
- **THEN** the input SHALL show "2028" with hint "(age 67)"
- **AND** changing the year to 2030 SHALL set the age to 69

#### Scenario: Stream start age shown as year
- **WHEN** a stream has start_age 70 and the owner (primary) is 65 in 2026
- **THEN** the Start Year input SHALL show "2031" with hint "(age 70)"

#### Scenario: Spouse-owned stream uses spouse age
- **WHEN** a stream is owned by "spouse" with start_age 67
- **AND** spouse is currently 62 in 2026
- **THEN** the Start Year input SHALL show "2031" with hint "(age 67)"

#### Scenario: Null end age
- **WHEN** a stream has end_age null (lifetime)
- **THEN** the End Year input SHALL be empty/blank

### Requirement: Age validation warnings
The income editor SHALL show non-blocking warnings for unreasonable age values.

#### Scenario: Start age past simulation end
- **WHEN** a stream start_age exceeds current_age + simulation_years
- **THEN** a warning hint SHALL appear (e.g., "past simulation end")

#### Scenario: End age before start age
- **WHEN** a stream end_age is set and is less than start_age
- **THEN** a warning hint SHALL appear
