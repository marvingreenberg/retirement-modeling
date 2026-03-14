interface TaxRateInput {
   income_tax: number;
   brokerage_gains_tax: number;
   conversion_tax: number;
   total_income: number;
   pretax_withdrawal: number;
   roth_withdrawal: number;
   brokerage_withdrawal: number;
}

export function effectiveTaxRate(yr: TaxRateInput): number {
   const totalTax = yr.income_tax + yr.brokerage_gains_tax + yr.conversion_tax;
   const totalGross =
      yr.total_income +
      yr.pretax_withdrawal +
      yr.roth_withdrawal +
      yr.brokerage_withdrawal;
   return totalGross > 0 ? totalTax / totalGross : 0;
}

export function taxRateColor(rate: number): string {
   if (rate < 0.18) return 'rgb(34, 139, 34)'; // green
   if (rate > 0.23) return 'rgb(220, 38, 38)'; // red
   // Linear interpolate green → yellow → orange → red across 18-23%
   const t = (rate - 0.18) / 0.05;
   if (t < 0.33) {
      const s = t / 0.33;
      return `rgb(${Math.round(34 + s * (234 - 34))}, ${Math.round(139 + s * (179 - 139))}, ${Math.round(34 * (1 - s))})`;
   }
   if (t < 0.66) {
      const s = (t - 0.33) / 0.33;
      return `rgb(${Math.round(234 + s * (249 - 234))}, ${Math.round(179 - s * 64)}, 0)`;
   }
   const s = (t - 0.66) / 0.34;
   return `rgb(${Math.round(249 - s * 29)}, ${Math.round(115 - s * 77)}, 0)`;
}
