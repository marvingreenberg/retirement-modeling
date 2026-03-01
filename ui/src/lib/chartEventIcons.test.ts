import { describe, it, expect } from 'vitest';
import { EVENT_ICON_MAP } from '$lib/chartEventIcons';
import type { ChartEventKind } from '$lib/types';

const ALL_KINDS: ChartEventKind[] = [
   'income_employment',
   'income_pension',
   'income_ss',
   'income_rental',
   'income_alimony',
   'income_other',
   'income_end',
   'expense_one_time',
   'expense_recurring',
];

describe('EVENT_ICON_MAP', () => {
   it('has an entry for every ChartEventKind', () => {
      for (const kind of ALL_KINDS) {
         const entry = EVENT_ICON_MAP[kind];
         expect(entry, `missing entry for ${kind}`).toBeDefined();
         expect(entry.icon).toBeDefined();
         expect(entry.color).toBeTruthy();
         expect(entry.bg).toBeTruthy();
      }
   });

   it('has no extra keys beyond known kinds', () => {
      const keys = Object.keys(EVENT_ICON_MAP);
      expect(keys.sort()).toEqual([...ALL_KINDS].sort());
   });
});
