import type { YearResult } from '$lib/types';

export function pvDivisor(inflationRate: number, yearIndex: number): number {
   return (1 + inflationRate) ** yearIndex;
}

export function toPV(
   value: number,
   inflationRate: number,
   yearIndex: number,
): number {
   return value / pvDivisor(inflationRate, yearIndex);
}

export function pvTotalTaxes(
   years: YearResult[],
   inflationRate: number,
): number {
   return years.reduce(
      (sum, yr, i) => sum + toPV(yr.total_tax, inflationRate, i),
      0,
   );
}

export function pvTotalIrmaa(
   years: YearResult[],
   inflationRate: number,
): number {
   return years.reduce(
      (sum, yr, i) => sum + toPV(yr.irmaa_cost, inflationRate, i),
      0,
   );
}

export function pvSpendingRange(
   years: YearResult[],
   inflationRate: number,
): { min: number; max: number } | null {
   if (years.length === 0) return null;
   const pvSpends = years.map((yr, i) =>
      toPV(yr.spending_target, inflationRate, i),
   );
   return { min: Math.min(...pvSpends), max: Math.max(...pvSpends) };
}
