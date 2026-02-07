## ADDED Requirements

### Requirement: Lucide icon library integration
The UI SHALL use Lucide icons for visual indicators throughout the application.

#### Scenario: Icon package installed
- **WHEN** the application builds
- **THEN** `lucide-svelte` is available as a dependency
- **AND** icons are tree-shaken (only imported icons are bundled)

---

### Requirement: Section header icons
Each collapsible section on the Portfolio tab SHALL display a relevant icon next to the section title.

#### Scenario: Portfolio section icons
- **WHEN** the Portfolio tab is displayed
- **THEN** each section header includes an icon:
  - People & Timeline: Users or Calendar icon
  - Accounts: Wallet or Landmark icon
  - Income: Banknote or DollarSign icon
  - Spending: ShoppingCart or CreditCard icon

---

### Requirement: Account type visual indicators
Each account in the Accounts editor SHALL display a colored icon indicating account type.

#### Scenario: Account type icons
- **WHEN** accounts are listed in the Accounts editor
- **THEN** each account row shows a colored circular indicator with a type-specific icon:
  - Pre-tax (Traditional IRA/401k): distinctive color (e.g., blue) with Landmark icon
  - Roth: distinctive color (e.g., purple) with Shield icon
  - Brokerage: distinctive color (e.g., teal) with TrendingUp icon

---

### Requirement: Simulate tab visual indicators
The Simulate tab SHALL use icons for run mode and result sections.

#### Scenario: Run mode icons
- **WHEN** the run mode selection is displayed
- **THEN** Single run option has a Play icon
- **AND** Monte Carlo option has a Shuffle or Dices icon

#### Scenario: Result section icons
- **WHEN** simulation results are displayed
- **THEN** summary metrics use small icons (e.g., DollarSign for balances, Receipt for taxes)
