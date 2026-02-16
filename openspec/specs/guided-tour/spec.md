## Purpose
Defines the one-time guided tour that orients users after first setup, highlighting nav tabs and the profile button.
## Requirements
### Requirement: Tour trigger
The guided tour SHALL start automatically after the user completes first-time setup (via Get Started or Load Sample Data). The tour SHALL run only once per session.

#### Scenario: Tour starts after Get Started
- **WHEN** the user completes the setup form and clicks Get Started
- **THEN** the guided tour begins, highlighting the first nav tab

#### Scenario: Tour starts after Load Sample Data
- **WHEN** the user clicks Load Sample Data on the setup form
- **THEN** the guided tour begins, highlighting the first nav tab

#### Scenario: Tour does not repeat
- **WHEN** the user has already seen the tour in this session
- **THEN** the tour does not start again, even if the app re-renders

### Requirement: Tour sequence
The guided tour SHALL highlight elements in this order: Overview nav link, Spending nav link, Compare nav link, Details nav link, Profile avatar. Each step SHALL display a tooltip describing the element's purpose. The tour SHALL have 5 steps total.

#### Scenario: Tour step order
- **WHEN** the guided tour activates
- **THEN** the steps are: Overview, Spending, Compare, Details, Profile

#### Scenario: Spending step content
- **WHEN** the tour reaches the Spending step
- **THEN** the tooltip text reads "Spending — Plan your expenses and spending goals"

### Requirement: Tour advancement
Each tour tooltip SHALL auto-advance after approximately 3 seconds, or be dismissed immediately by clicking anywhere.

#### Scenario: Auto-advance
- **WHEN** a tour tooltip has been visible for 3 seconds
- **THEN** it transitions to the next step or ends the tour if on the last step

#### Scenario: Click to advance
- **WHEN** the user clicks anywhere while a tour tooltip is visible
- **THEN** the tooltip advances to the next step immediately

#### Scenario: Tour completion
- **WHEN** the last tooltip has been shown and advances
- **THEN** the tour ends and the `tourActive` store is set to false

