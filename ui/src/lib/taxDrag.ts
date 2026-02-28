import type { Account, ConversionStrategy, WithdrawalCategory } from './types';
import { ACCOUNT_TYPE_DEFAULTS, TAX_CATEGORY_MAP } from './types';

export const STOCK_TAX_DRAG = 0.0022;
export const BOND_TAX_DRAG = 0.01;

export function estimateTaxDrag(stockPct: number): number {
   const s = stockPct / 100;
   return s * STOCK_TAX_DRAG + (1 - s) * BOND_TAX_DRAG;
}

export interface WithdrawalRecommendation {
   recommended: WithdrawalCategory[];
   reason: string;
}

export function recommendWithdrawalOrder(
   accounts: Account[],
   conversionStrategy: ConversionStrategy,
): WithdrawalRecommendation {
   const brokerageAccounts = accounts.filter(
      (a) => TAX_CATEGORY_MAP[a.type] === 'brokerage',
   );

   if (brokerageAccounts.length === 0) {
      return {
         recommended: ['cash', 'pretax', 'roth', 'brokerage'],
         reason: 'No brokerage accounts — withdrawal order has minimal impact.',
      };
   }

   const totalBrkBalance = brokerageAccounts.reduce((s, a) => s + a.balance, 0);
   if (totalBrkBalance <= 0) {
      return {
         recommended: ['cash', 'brokerage', 'pretax', 'roth'],
         reason: 'Brokerage accounts have no balance.',
      };
   }

   const weightedDrag =
      brokerageAccounts.reduce((s, a) => {
         const drag =
            a.tax_drag_override ??
            estimateTaxDrag(
               a.stock_pct ?? ACCOUNT_TYPE_DEFAULTS[a.type].default_stock_pct,
            );
         return s + drag * a.balance;
      }, 0) / totalBrkBalance;

   const drag = weightedDrag;
   const conversionsActive = conversionStrategy !== 'standard';

   if (conversionsActive) {
      return {
         recommended: ['cash', 'brokerage', 'pretax', 'roth'],
         reason: 'Brokerage-first preserves IRA headroom for Roth conversions.',
      };
   }

   if (drag > 0.005) {
      return {
         recommended: ['cash', 'brokerage', 'pretax', 'roth'],
         reason: `High tax drag (${(drag * 100).toFixed(2)}%) — spend brokerage first to stop the drag.`,
      };
   }

   if (drag < 0.003) {
      return {
         recommended: ['cash', 'pretax', 'brokerage', 'roth'],
         reason: `Low tax drag (${(drag * 100).toFixed(2)}%) — IRA-first may reduce lifetime taxes.`,
      };
   }

   return {
      recommended: ['cash', 'brokerage', 'pretax', 'roth'],
      reason: `Moderate tax drag (${(drag * 100).toFixed(2)}%) — brokerage-first is generally better.`,
   };
}
