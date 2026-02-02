# OpenSpec Analysis: Retirement Model

## What Worked Well

### 1. IRS-Based Rules Map Cleanly
Tax calculations, RMD divisors, IRMAA thresholds—these are essentially lookup tables with clear conditional logic. They translate directly to specs:

```markdown
#### Scenario: RMD at age 73
- WHEN owner age is 73
- AND pretax balance is $1,000,000
- THEN RMD = $1,000,000 / 26.5 = $37,736
```

The rules are external (IRS publishes them), deterministic, and well-documented.

### 2. Strategy Algorithms Are Discrete
Your spending strategies and conversion strategies have clear names and distinct behaviors. Each can be specified independently:

- `fixed_dollar` → inflation-adjust previous year
- `guardrails` → adjust if rate crosses thresholds
- `percent_of_portfolio` → simple percentage calc

These are essentially strategy pattern implementations where each variant has documented behavior.

### 3. Withdrawal Ordering Has Clear Priority
The "brokerage → roth → pretax" rule is easy to specify and test. The AGI headroom constraint adds a conditional, but it's still straightforward.

---

## What Was Harder

### 1. Interleaved Logic in simulation.py
The main simulation loop has ~200 lines where:
- AGI accumulates from multiple sources
- Withdrawal decisions depend on current AGI
- Conversion decisions depend on post-withdrawal AGI
- Tax calculations depend on everything above

This doesn't decompose cleanly into independent requirements. The spec for "simulation orchestration" is more of a sequence diagram than independent behaviors.

**Implication**: Changes to this area need careful integration testing, not just unit tests against individual requirements.

### 2. Magic Numbers
The code has decisions like:
```python
if agi_headroom > 5000:  # Worth doing
```

This "$5,000 threshold" is a heuristic, not an IRS rule. The spec documents it, but it's the kind of thing that might change based on experience. OpenSpec captures *what* the code does, but not necessarily *why* this specific threshold was chosen.

### 3. Simplified vs. Full Monte Carlo Divergence
You have two Monte Carlo implementations:
- `run_monte_carlo`: Fast, balance-only, skips taxes/conversions
- `run_full_monte_carlo`: Complete, slow, includes everything

They model different things. A user might be surprised that the "fast" Monte Carlo gives different results than the "full" one. The spec documents both, but this is a design choice that might warrant revisiting.

---

## Is Reverse-Engineering Specs Useful?

**Yes, for your use case, I think it is.** Here's why:

### For Non-Programmers
Your STRATEGIES.md already serves this purpose—explaining what each strategy does in plain English. The specs I created are more formal but serve a similar role. Someone reviewing your retirement projections could read the spec and understand the rules without reading Python.

### For AI Coding Assistants
If you ask Claude Code to "change the guardrails floor from 80% to 70%", having a spec means:
1. Claude knows exactly where the behavior is defined
2. You can verify the change by updating the spec first, then the code
3. The spec serves as acceptance criteria

### For Future Modifications
The spec captures decisions like "conversions only happen before RMD age" and "the $5,000 minimum threshold". When you revisit the code in 6 months, you (or an AI) can read the spec to understand the design intent.

---

## Recommendations

### Start Light
Don't spec everything. Prioritize:
1. **Tax calculations** (IRS rules, easy to validate)
2. **Spending strategies** (clear variants, user-facing)
3. **Roth conversion logic** (complex, high-value decisions)

Skip speccing the CLI, output formatting, and loader abstractions—those are infrastructure, not domain logic.

### Use Specs for Changes, Not Documentation
The real value of OpenSpec is the `/changes` workflow. When you want to add a feature like "support for QCDs (Qualified Charitable Distributions)", you'd:
1. Create `openspec/changes/add-qcd-support/`
2. Write a proposal explaining why
3. Draft a spec delta showing the new scenarios
4. Get AI to implement against the spec

### Keep Specs Close to Tests
Your specs describe behaviors that should have corresponding tests. Consider a 1:1 mapping:
- Spec scenario: "RMD at age 73 with $1M balance = $37,736"
- Test: `test_rmd_age_73_million_balance()`

This keeps specs honest—if the test passes, the spec is accurate.

---

## Summary Table

| Domain | Spec Quality | Effort | Value |
|--------|-------------|--------|-------|
| Tax Calculations | High | Low | High |
| Spending Strategies | High | Low | High |
| Roth Conversions | High | Medium | High |
| Withdrawal Ordering | Medium | Low | Medium |
| Simulation Orchestration | Medium | High | Medium |
| Monte Carlo | Medium | Medium | Medium |
| CLI/Output | N/A | Skip | Low |

The retirement model is actually a good candidate for specs because it's **rule-heavy** and the rules are **external** (IRS, financial planning best practices). The specs serve as both documentation and change management artifacts.
