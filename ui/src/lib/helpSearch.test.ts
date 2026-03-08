import { describe, it, expect } from 'vitest';
import { searchHelp, highlightTerms, type SearchResult } from './helpSearch';

describe('helpSearch', () => {
   describe('searchHelp', () => {
      it('returns empty array for empty query', () => {
         expect(searchHelp('')).toEqual([]);
      });

      it('returns empty array for whitespace-only query', () => {
         expect(searchHelp('   ')).toEqual([]);
      });

      it('finds a term that exists in help content', () => {
         const results = searchHelp('portfolio');
         expect(results.length).toBeGreaterThan(0);
         expect(results[0]).toHaveProperty('topicId');
         expect(results[0]).toHaveProperty('headingId');
         expect(results[0]).toHaveProperty('topicName');
         expect(results[0]).toHaveProperty('sectionTitle');
      });

      it('returns empty array for nonsense query', () => {
         expect(searchHelp('xyzzyplugh')).toEqual([]);
      });

      it('handles lunr syntax errors gracefully', () => {
         expect(searchHelp(':')).toEqual([]);
      });

      it('is case-insensitive', () => {
         const lower = searchHelp('portfolio');
         const upper = searchHelp('PORTFOLIO');
         expect(lower.length).toBe(upper.length);
         expect(lower.map((r) => r.topicId)).toEqual(
            upper.map((r) => r.topicId),
         );
      });

      it('uses stemming: "balancing" matches same as "balance"', () => {
         const results1 = searchHelp('balance');
         const results2 = searchHelp('balancing');
         expect(results1.map((r) => `${r.topicId}:${r.headingId}`)).toEqual(
            results2.map((r) => `${r.topicId}:${r.headingId}`),
         );
      });

      it('multi-word uses AND: all terms must match in same section', () => {
         const results = searchHelp('withdrawal order');
         const broader = searchHelp('withdrawal');
         expect(results.length).toBeGreaterThan(0);
         expect(results.length).toBeLessThan(broader.length);
         const broaderKeys = new Set(
            broader.map((r) => `${r.topicId}:${r.headingId}`),
         );
         for (const r of results) {
            expect(broaderKeys.has(`${r.topicId}:${r.headingId}`)).toBe(true);
         }
      });

      it('returns topicName and sectionTitle for display', () => {
         const results = searchHelp('tax');
         expect(results.length).toBeGreaterThan(0);
         for (const r of results) {
            expect(r.topicName).toBeTruthy();
            expect(r.sectionTitle).toBeTruthy();
         }
      });

      it('deduplicates results by topicId:headingId', () => {
         const results = searchHelp('the');
         const keys = results.map((r) => `${r.topicId}:${r.headingId}`);
         expect(new Set(keys).size).toBe(keys.length);
      });
   });

   describe('highlightTerms', () => {
      it('wraps matched terms in <mark> tags', () => {
         const html = '<p>Check your portfolio balance today.</p>';
         const result = highlightTerms(html, 'balance');
         expect(result).toContain('<mark>balance</mark>');
      });

      it('preserves HTML tags — does not highlight inside tags', () => {
         const html = '<a href="balance-chart">See the balance chart</a>';
         const result = highlightTerms(html, 'balance');
         expect(result).toContain('href="balance-chart"');
         expect(result).toContain('<mark>balance</mark> chart');
      });

      it('highlights stemmed matches: "balancing" highlighted when searching "balance"', () => {
         const html = '<p>Balancing your accounts is important.</p>';
         const result = highlightTerms(html, 'balance');
         expect(result).toContain('<mark>Balancing</mark>');
      });

      it('highlights all occurrences', () => {
         const html = '<p>The tax rate affects your tax bracket.</p>';
         const result = highlightTerms(html, 'tax');
         const markCount = (result.match(/<mark>/g) || []).length;
         expect(markCount).toBe(2);
      });

      it('handles multi-word queries — highlights each term', () => {
         const html = '<p>Set your withdrawal order for accounts.</p>';
         const result = highlightTerms(html, 'withdrawal order');
         expect(result).toContain('<mark>withdrawal</mark>');
         expect(result).toContain('<mark>order</mark>');
      });

      it('returns html unchanged for empty query', () => {
         const html = '<p>Hello world</p>';
         expect(highlightTerms(html, '')).toBe(html);
      });

      it('is case-insensitive in highlighting', () => {
         const html = '<p>Portfolio value and PORTFOLIO growth.</p>';
         const result = highlightTerms(html, 'portfolio');
         const markCount = (result.match(/<mark>/g) || []).length;
         expect(markCount).toBe(2);
      });
   });
});
