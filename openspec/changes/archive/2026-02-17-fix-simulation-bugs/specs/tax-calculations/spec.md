## MODIFIED Requirements

### Requirement: Capital Gains Tax
The system SHALL apply tiered long-term capital gains rates progressively, stacking gains on top of ordinary income.

#### Scenario: 0% capital gains rate
- WHEN total income (ordinary + gains) is below $89,250 (MFJ)
- THEN capital gains are taxed at 0%

#### Scenario: 15% capital gains rate
- WHEN total income is between $89,250 and $553,850 (MFJ)
- THEN capital gains in that range are taxed at 15%

#### Scenario: 20% capital gains rate
- WHEN total income exceeds $553,850 (MFJ)
- THEN capital gains in that range are taxed at 20%

#### Scenario: Progressive stacking across brackets
- WHEN ordinary income is $80,000 and capital gains are $50,000
- THEN gains from $80,000 to $89,250 ($9,250) are taxed at 0%
- AND gains from $89,250 to $130,000 ($40,750) are taxed at 15%
- AND total cap gains tax = $0 + $6,112.50 = $6,112.50

#### Scenario: No flat rate override
- WHEN calculating capital gains tax
- THEN the system SHALL always use tiered progressive brackets
- AND there is no flat rate override option

---

### Requirement: Social Security Taxability
The system SHALL calculate the taxable portion of Social Security benefits using IRS provisional income rules.

#### Scenario: SS taxability based on combined income
- WHEN Social Security benefits are received
- THEN the taxable portion SHALL be computed using `calculate_ss_taxable_portion()`
- AND the calculation uses combined income (half SS + other income) against MFJ thresholds

#### Scenario: Low income — 0% taxable
- WHEN combined income is $32,000 or less (MFJ)
- THEN 0% of SS benefits are included in AGI

#### Scenario: Mid income — up to 50% taxable
- WHEN combined income is between $32,001 and $44,000 (MFJ)
- THEN up to 50% of SS benefits are included in AGI

#### Scenario: High income — up to 85% taxable
- WHEN combined income exceeds $44,000 (MFJ)
- THEN up to 85% of SS benefits are included in AGI

#### Scenario: Income streams in AGI
- WHEN income streams are active
- THEN `amount * taxable_pct` for each stream is added to AGI
- AND this is added alongside SS taxable income before RMD and other components

---

## ADDED Requirements

### Requirement: Bracket label accuracy
The system SHALL return the correct tax bracket label for all income levels, including the 10% bracket.

#### Scenario: Income in 10% bracket
- WHEN taxable income is between $0 and $23,200
- THEN the bracket label SHALL be "10%"

#### Scenario: Income in 12% bracket
- WHEN taxable income is between $23,201 and $94,300
- THEN the bracket label SHALL be "12%"

## REMOVED Requirements

### Requirement: Flat rate override
**Reason**: The `tax_rate_capital_gains` config field and flat rate override are removed. Pre-1.0, no backward compatibility needed.
**Migration**: Capital gains are always calculated using tiered progressive brackets. Remove the field from config, models, schema, and UI.
