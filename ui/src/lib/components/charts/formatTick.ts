export function formatTick(v: number | string): string {
   const n = Number(v);
   if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
   if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
   return `$${n.toFixed(0)}`;
}
