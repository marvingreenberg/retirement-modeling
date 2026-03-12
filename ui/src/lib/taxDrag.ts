export const STOCK_TAX_DRAG = 0.0022;
export const BOND_TAX_DRAG = 0.01;
export const EQUITY_RETURN = 0.1;
export const BOND_RETURN = 0.04;
export const CONSERVATIVE_GROWTH_FACTOR = 0.75;

export function estimateTaxDrag(stockPct: number): number {
   const s = stockPct / 100;
   return s * STOCK_TAX_DRAG + (1 - s) * BOND_TAX_DRAG;
}

export function computeEffectiveGrowth(
   stockPct: number,
   isBrokerage: boolean,
   taxDragOverride?: number,
): number {
   const s = stockPct / 100;
   const nominal = s * EQUITY_RETURN + (1 - s) * BOND_RETURN;
   if (!isBrokerage) return nominal;
   const drag = taxDragOverride ?? estimateTaxDrag(stockPct);
   return nominal - drag;
}

