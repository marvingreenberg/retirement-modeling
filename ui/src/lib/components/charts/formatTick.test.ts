import { describe, it, expect } from 'vitest';
import { formatTick } from './formatTick';

describe('formatTick', () => {
   it('formats values >= 1M with one decimal', () => {
      expect(formatTick(1_000_000)).toBe('$1.0M');
      expect(formatTick(1_500_000)).toBe('$1.5M');
      expect(formatTick(2_000_000)).toBe('$2.0M');
      expect(formatTick(10_000_000)).toBe('$10.0M');
   });

   it('formats values >= 1K in $K notation', () => {
      expect(formatTick(1_000)).toBe('$1K');
      expect(formatTick(100_000)).toBe('$100K');
      expect(formatTick(500_000)).toBe('$500K');
      expect(formatTick(999_999)).toBe('$1000K');
   });

   it('formats values < 1K as plain dollars', () => {
      expect(formatTick(500)).toBe('$500');
      expect(formatTick(0)).toBe('$0');
   });

   it('handles string input from Chart.js', () => {
      expect(formatTick('1500000')).toBe('$1.5M');
      expect(formatTick('500000')).toBe('$500K');
   });
});
