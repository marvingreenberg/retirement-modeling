import type { YearResult } from '$lib/types';

export interface ColumnVisibility {
   dep401k: boolean;
   capGainsTax: boolean;
   convTax: boolean;
   rothConv: boolean;
   irmaa: boolean;
   income: boolean;
   brokerageWd: boolean;
   pretaxWd: boolean;
   rothWd: boolean;
}

function anyNonZero(
   years: YearResult[],
   getter: (yr: YearResult) => number,
): boolean {
   return years.some((yr) => Math.abs(getter(yr)) > 0.5);
}

export function getVisibleColumns(years: YearResult[]): ColumnVisibility {
   return {
      dep401k: anyNonZero(
         years,
         (yr) => yr.pretax_401k_deposit + yr.roth_401k_deposit,
      ),
      capGainsTax: anyNonZero(years, (yr) => yr.brokerage_gains_tax),
      convTax: anyNonZero(years, (yr) => yr.conversion_tax),
      rothConv: anyNonZero(years, (yr) => yr.roth_conversion),
      irmaa: anyNonZero(years, (yr) => yr.irmaa_cost),
      income: anyNonZero(years, (yr) => yr.total_income),
      brokerageWd: anyNonZero(years, (yr) => yr.brokerage_withdrawal),
      pretaxWd: anyNonZero(years, (yr) => yr.pretax_withdrawal),
      rothWd: anyNonZero(years, (yr) => yr.roth_withdrawal),
   };
}
