import { describe, it, expect } from 'vitest';
import { getTopicHtml } from './helpContent';

describe('helpContent (markdown loader)', () => {
   it('returns rendered HTML with expected heading for a known topic', () => {
      const html = getTopicHtml('getting-started');
      // The marked renderer assigns id="getting-started" to the H2 heading;
      // this verifies markdown → HTML rendering and id-slugging both work.
      expect(html).toContain('<h2 id="getting-started">Getting Started</h2>');
   });

   it('returns fallback for unknown topic', () => {
      const html = getTopicHtml('nonexistent');
      expect(html).toContain('No content available');
   });

   it('all 15 topics return non-empty content', () => {
      const topicIds = [
         'getting-started',
         'about',
         'accounts-tax-treatment',
         'income-cola',
         'social-security',
         'spending-strategies',
         'withdrawal-order',
         'roth-conversions',
         'required-minimum-distributions',
         'simulation-parameters',
         'tax-bracket-indexing',
         'balance-chart',
         'spending-chart',
         'monte-carlo',
         'outcome-distribution',
      ];
      for (const id of topicIds) {
         const html = getTopicHtml(id);
         expect(html.length, `${id} should have content`).toBeGreaterThan(50);
      }
   });

   it('processes conditional sections when conditions provided', () => {
      const withPretax = getTopicHtml('balance-chart', { has_pretax: true });
      const withoutPretax = getTopicHtml('balance-chart', {
         has_pretax: false,
      });
      expect(withPretax.length).toBeGreaterThan(withoutPretax.length);
   });
});
