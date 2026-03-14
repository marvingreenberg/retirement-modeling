import { describe, it, expect } from 'vitest';
import { pvDivisor, toPV } from './presentValue';

describe('pvDivisor', () => {
   it('returns 1 at year 0', () => {
      expect(pvDivisor(0.03, 0)).toBe(1);
   });

   it('returns correct value at year 10 with 3%', () => {
      expect(pvDivisor(0.03, 10)).toBeCloseTo(1.03 ** 10);
   });
});

describe('toPV', () => {
   it('divides value by pvDivisor', () => {
      const value = 1000;
      const rate = 0.03;
      const year = 5;
      expect(toPV(value, rate, year)).toBeCloseTo(
         value / pvDivisor(rate, year),
      );
   });

   it('returns value unchanged at year 0', () => {
      expect(toPV(500, 0.03, 0)).toBe(500);
   });

   it('returns 0 for 0 value', () => {
      expect(toPV(0, 0.03, 10)).toBe(0);
   });
});
