## MODIFIED Requirements

### Requirement: Avatar button with initials
The AppBar SHALL display an avatar button showing the user's initials. Clicking the avatar SHALL open the profile drawer.

#### Scenario: Avatar shows couple initials
- **WHEN** primaryName is "Mike" and spouseName is "Karen"
- **THEN** the avatar displays "M,K" in a circle

#### Scenario: Avatar shows single initial
- **WHEN** primaryName is "Mike" and spouseName is empty
- **THEN** the avatar displays "M" in a circle

#### Scenario: Avatar before setup
- **WHEN** no name has been entered (pre-setup state)
- **THEN** the avatar displays a generic person icon

#### Scenario: Avatar opens drawer
- **WHEN** the user clicks the avatar button
- **THEN** the profile drawer opens

### Requirement: Dark mode toggle location
The dark/light mode toggle SHALL NOT appear in the AppBar. It SHALL be accessible from the profile drawer.

#### Scenario: No toggle in AppBar
- **WHEN** the user views the AppBar
- **THEN** no dark/light mode toggle is visible in the bar itself
