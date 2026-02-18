### Requirement: App title and branding
The app bar SHALL display "Retirement Planner" with an icon.

#### Scenario: Title display
- **WHEN** the app bar renders
- **THEN** it shows an icon followed by "Retirement Planner"

### Requirement: Navigation readability
Nav items and help icon SHALL be sized for comfortable reading.

#### Scenario: Nav icon sizing
- **WHEN** nav items render
- **THEN** icons are size 18 (up from 16)

#### Scenario: Help icon sizing
- **WHEN** the help button renders
- **THEN** the icon is size 22 (up from 20)

### Requirement: Section header prominence
Portfolio section headers (Accounts, Budget, Income) SHALL use larger text and icons.

#### Scenario: Section text size
- **WHEN** a collapsible section renders
- **THEN** the title uses `text-lg font-semibold`

#### Scenario: Section icon size
- **WHEN** section icons render in PortfolioEditor
- **THEN** they use size 20 (up from 16)

### Requirement: Account row density
Account rows SHALL be vertically compact.

#### Scenario: Row padding and spacing
- **WHEN** account rows render
- **THEN** padding is `p-2` (not `p-3`) and gap is `gap-2` (not `gap-3`)
- **AND** space between rows is reduced

#### Scenario: Name field width
- **WHEN** the Name input renders
- **THEN** it is `w-44` (not `w-36`)

#### Scenario: Cost basis label
- **WHEN** the cost basis header renders
- **THEN** it reads "Basis, as %" (not "Cost Basis %")

#### Scenario: No (now) hint
- **WHEN** available_at_age is 0
- **THEN** no "(now)" text is shown

### Requirement: Strategy labeling
The conversion strategy dropdown SHALL use clear labels.

#### Scenario: Standard renamed
- **WHEN** the strategy dropdown renders
- **THEN** "Standard" is labeled "No Conversion"

#### Scenario: Withdrawal strategy text
- **WHEN** the withdrawal strategy label renders
- **THEN** it uses `text-sm` with standard text color (not muted xs)

### Requirement: Simulate button redesign
The simulate button SHALL be a prominent left-justified square button.

#### Scenario: Button layout
- **WHEN** SimulateSettings renders (collapsed or expanded)
- **THEN** a large square button with 🔁 icon appears left-justified
- **AND** the settings inputs are to its right
- **AND** the settings area uses less vertical space and more horizontal
