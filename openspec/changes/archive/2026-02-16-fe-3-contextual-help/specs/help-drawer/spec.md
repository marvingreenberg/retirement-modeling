## ADDED Requirements

### Requirement: Help drawer component
The app SHALL provide a HelpDrawer component that slides in from the right side, displaying help topic content.

#### Scenario: Drawer opens from AppBar
- **WHEN** the user clicks the help button in the AppBar
- **THEN** the help drawer opens from the right side displaying a topic

#### Scenario: Drawer closes
- **WHEN** the user clicks the close button or clicks outside the drawer
- **THEN** the help drawer closes

### Requirement: Help topic content
The help drawer SHALL display content sourced from ApplicationDetails.md, organized into topics: Tax Bracket Inflation Indexing, Spending Strategies, Social Security Benefit Formula, and Income Stream COLA.

#### Scenario: Topic content displayed
- **WHEN** the help drawer is open with a selected topic
- **THEN** the topic title and formatted content are visible

#### Scenario: All topics accessible
- **WHEN** the help drawer is open
- **THEN** all topics are listed and selectable via a topic navigation list

### Requirement: Contextual topic mapping
The help drawer SHALL open to a contextually relevant topic based on the current route.

#### Scenario: Overview route default topic
- **WHEN** the user opens help from the `/` route
- **THEN** the Spending Strategies topic is displayed by default

#### Scenario: Spending route default topic
- **WHEN** the user opens help from the `/spending` route
- **THEN** the Spending Strategies topic is displayed by default

#### Scenario: Details route default topic
- **WHEN** the user opens help from the `/details` route
- **THEN** the Tax Bracket Inflation Indexing topic is displayed by default

### Requirement: Maximize toggle
The help drawer SHALL support a maximize/minimize toggle that expands the drawer to full viewport width for improved readability of longer content.

#### Scenario: Maximize from drawer
- **WHEN** the user clicks the maximize button in the help drawer
- **THEN** the drawer expands to cover the full viewport width

#### Scenario: Minimize back to drawer
- **WHEN** the user clicks the minimize button in maximized mode
- **THEN** the drawer returns to its default narrow width

### Requirement: Internal topic navigation
Topics SHALL support links to related topics. Clicking a related-topic link SHALL navigate within the drawer without closing it.

#### Scenario: Navigate to related topic
- **WHEN** the user clicks a related-topic link within a topic's content
- **THEN** the drawer displays the linked topic

#### Scenario: Related topics listed
- **WHEN** a topic has related topics defined
- **THEN** related topic links are displayed at the bottom of the topic content
