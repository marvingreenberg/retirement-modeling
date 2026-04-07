import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { portfolio, samplePortfolio } from '$lib/stores';

const { default: AdvancedSettings } = await import('./AdvancedSettings.svelte');

describe('AdvancedSettings', () => {
   beforeEach(() => {
      portfolio.value = structuredClone(samplePortfolio);
   });

   it('shows IRMAA field when conversion strategy is not standard', () => {
      portfolio.value = {
         ...portfolio.value,
         config: { ...portfolio.value.config, strategy_target: 'irmaa_tier_1' },
      };
      render(AdvancedSettings);
      expect(screen.getByText(/IRMAA Limit/)).toBeInTheDocument();
   });

   it('hides IRMAA field when conversion strategy is standard', () => {
      portfolio.value = {
         ...portfolio.value,
         config: { ...portfolio.value.config, strategy_target: 'standard' },
      };
      render(AdvancedSettings);
      expect(screen.queryByText(/IRMAA Limit/)).not.toBeInTheDocument();
   });
});
