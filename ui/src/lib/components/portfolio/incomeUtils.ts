/** Shared utilities for income-related editor components. */

/** Convert an age to a calendar year given the config start_year and owner's current age. */
export function ageToYear(
   age: number,
   ownerAge: number,
   startYear: number,
): number {
   return startYear + (age - ownerAge);
}

/** Convert a calendar year back to an age. */
export function yearToAge(
   year: number,
   ownerAge: number,
   startYear: number,
): number {
   return ownerAge + (year - startYear);
}

/** Format an age as a display hint, e.g. "age 67". */
export function ageHint(age: number | null): string {
   return age != null ? `age ${age}` : '';
}

/** Sentinel names for salary-auto generated income streams. */
export const SALARY_PRIMARY = '__salary_primary';
export const SALARY_SPOUSE = '__salary_spouse';
export const SALARY_SENTINEL_NAMES = new Set([SALARY_PRIMARY, SALARY_SPOUSE]);
