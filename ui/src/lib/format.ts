export function currency(value: number): string {
   return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
   }).format(value);
}

export function pct(value: number): string {
   return (value * 100).toFixed(1) + '%';
}

export function uniqueId(): string {
   return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function compactCurrency(v: number): string {
   if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
   if (v >= 1_000) return `$${Math.round(v / 1_000)}K`;
   return `$${v}`;
}
