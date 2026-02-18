# Additional Improvements (deferred from 002 review)

## 14. Allow Roth conversions after RMD age
**Module:** `simulation.py` ~line 325

Conversions are restricted to before RMD age. In practice, conversions can continue after RMD age (take RMD first, then convert). Post-RMD conversions can reduce future RMDs and leave tax-free Roth to heirs.

**Fix:** Remove the `age_primary < cfg.rmd_start_age` restriction. The AGI headroom calculation already accounts for RMD income.
