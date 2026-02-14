## ADDED Requirements

### Requirement: Profile drawer
A slide-out drawer SHALL open from the right when the user clicks the avatar button. The drawer SHALL contain people/timeline settings and preferences.

#### Scenario: Drawer contents
- **WHEN** the profile drawer is open
- **THEN** it displays: primary name, spouse name (if applicable), primary age, spouse age (if applicable), simulation years, and dark/light mode toggle

#### Scenario: Drawer edits update stores
- **WHEN** the user changes a name in the profile drawer
- **THEN** the profile store updates and the avatar initials reflect the new name
- **WHEN** the user changes an age in the profile drawer
- **THEN** the portfolio config updates with the new age

#### Scenario: Drawer closes
- **WHEN** the user clicks outside the drawer or clicks the close button
- **THEN** the drawer closes

### Requirement: Name fields in setup flow
The first-use setup flow SHALL capture the user's first name and optionally a spouse's first name, in addition to ages.

#### Scenario: Setup captures names
- **WHEN** the user completes the setup flow
- **THEN** the entered names are stored in the profile store
- **AND** the avatar displays the appropriate initials
