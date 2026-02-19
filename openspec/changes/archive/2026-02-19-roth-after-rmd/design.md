## Context

The simulation currently guards Roth conversions with `age_primary < cfg.rmd_start_age` (simulation.py:392). The AGI headroom calculation already includes RMD income in `current_agi`, so removing the age guard is safe — post-RMD conversions will naturally be bounded by the AGI ceiling minus RMD-inflated AGI.

The UI disables the conversion strategy dropdown when `current_age_primary >= rmd_start_age` (SimulateSettings.svelte:54-56, 95, 101-103).

## Goals / Non-Goals

**Goals:**
- Allow Roth conversions at any age when AGI headroom exists
- Remove UI gating that disables conversion dropdown at/past RMD age
- Add test coverage for post-RMD conversion scenarios

**Non-Goals:**
- Changing the conversion amount logic or strategy ceilings
- Adding any new conversion strategies
- Modifying RMD calculation logic

## Decisions

### 1. Remove the age guard in simulation.py

**Decision**: Remove `and age_primary < cfg.rmd_start_age` from line 392, leaving only the `conversion_ceiling > 0` check.

**Rationale**: The AGI headroom calculation (`conversion_ceiling - current_agi`) already accounts for RMD income since RMDs are added to `current_agi` earlier in the year loop. Post-RMD-age conversions will naturally be smaller (or zero) when RMDs push AGI near the ceiling.

### 2. Remove UI gating on conversion dropdown

**Decision**: Remove the `conversionDisabled` derived state and the conditional disabled/opacity/warning on the conversion select in SimulateSettings.svelte.

**Rationale**: With conversions now allowed at any age, the dropdown should always be enabled.

## Risks / Trade-offs

- [Post-RMD conversions may yield smaller headroom] → Expected behavior; the AGI ceiling math handles this correctly.
- [Users at RMD age previously saw conversions disabled] → Now they can choose a strategy; the simulation will convert when headroom allows.
