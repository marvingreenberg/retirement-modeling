import { describe, it, expect } from 'vitest';
import { processConditionalSections, renderMarkdown } from './helpMarkdown';

describe('processConditionalSections', () => {
   it('keeps content when condition is true', () => {
      const md =
         'intro\n<!-- if:has_pretax -->\npretax content\n<!-- endif -->\noutro';
      const result = processConditionalSections(md, { has_pretax: true });
      expect(result).toContain('pretax content');
      expect(result).toContain('intro');
      expect(result).toContain('outro');
      expect(result).not.toContain('<!-- if:');
   });

   it('strips content when condition is false', () => {
      const md =
         'intro\n<!-- if:has_pretax -->\npretax content\n<!-- endif -->\noutro';
      const result = processConditionalSections(md, { has_pretax: false });
      expect(result).not.toContain('pretax content');
      expect(result).toContain('intro');
      expect(result).toContain('outro');
   });

   it('handles missing conditions as false', () => {
      const md = '<!-- if:has_pretax -->\nhidden\n<!-- endif -->';
      const result = processConditionalSections(md, {});
      expect(result).not.toContain('hidden');
   });

   it('handles multiple conditions', () => {
      const md =
         '<!-- if:a -->\nA\n<!-- endif -->\n<!-- if:b -->\nB\n<!-- endif -->';
      const result = processConditionalSections(md, { a: true, b: false });
      expect(result).toContain('A');
      expect(result).not.toContain('B');
   });

   it('passes through content with no conditions unchanged', () => {
      const md = '# Title\nSome content';
      const result = processConditionalSections(md, {});
      expect(result).toBe(md);
   });
});

describe('renderMarkdown', () => {
   it('renders heading to HTML', () => {
      const html = renderMarkdown('## Growth Rate');
      expect(html).toContain('<h2');
      expect(html).toContain('Growth Rate');
   });

   it('renders paragraph', () => {
      const html = renderMarkdown('Some text');
      expect(html).toContain('<p>Some text</p>');
   });

   it('generates slugified IDs on headings', () => {
      const html = renderMarkdown('## Growth Rate');
      expect(html).toContain('id="growth-rate"');
   });

   it('returns cached result on second call with same input', () => {
      const md = '## Caching Test';
      const first = renderMarkdown(md);
      const second = renderMarkdown(md);
      expect(first).toBe(second);
   });

   it('renders inline formatting', () => {
      const html = renderMarkdown('**bold** and *italic*');
      expect(html).toContain('<strong>bold</strong>');
      expect(html).toContain('<em>italic</em>');
   });

   it('renders lists', () => {
      const html = renderMarkdown('- item one\n- item two');
      expect(html).toContain('<li>item one</li>');
      expect(html).toContain('<li>item two</li>');
   });

   it('renders code blocks', () => {
      const html = renderMarkdown('`inline code`');
      expect(html).toContain('<code>inline code</code>');
   });

   it('generates id from heading text', () => {
      const html = renderMarkdown('### Some Heading');
      expect(html).toContain('<h3 id="some-heading">Some Heading</h3>');
   });

   it('uses explicit {#id} anchor and strips it from text', () => {
      const html = renderMarkdown(
         '### Conservative Growth {#conservative-growth}',
      );
      expect(html).toContain('id="conservative-growth"');
      expect(html).toContain('>Conservative Growth</h3>');
      expect(html).not.toContain('{#');
   });

   it('handles explicit anchor with different text slug', () => {
      const html = renderMarkdown('## My Section {#custom-id}');
      expect(html).toContain('id="custom-id"');
      expect(html).toContain('>My Section</h2>');
   });
});
