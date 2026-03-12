import { Marked, type Tokens } from 'marked';

const conditionalRe = /<!-- if:(\w+) -->\n([\s\S]*?)<!-- endif -->/g;

export function processConditionalSections(
   md: string,
   conditions: Record<string, boolean>,
): string {
   return md.replace(conditionalRe, (_, key: string, content: string) => {
      return conditions[key] ? content : '';
   });
}

const parser = new Marked();
parser.use({
   renderer: {
      heading({ text, depth }: Tokens.Heading): string {
         const anchorMatch = text.match(/\s*\{#([a-z0-9-]+)\}\s*$/);
         let id: string;
         let displayText: string;
         if (anchorMatch) {
            id = anchorMatch[1];
            displayText = text.slice(0, anchorMatch.index!).trim();
         } else {
            id = text
               .toLowerCase()
               .replace(/[^a-z0-9]+/g, '-')
               .replace(/(^-|-$)/g, '');
            displayText = text;
         }
         return `<h${depth} id="${id}">${displayText}</h${depth}>\n`;
      },
   },
});

const renderCache = new Map<string, string>();

export function renderMarkdown(md: string): string {
   const cached = renderCache.get(md);
   if (cached) return cached;
   const html = parser.parse(md, { async: false }) as string;
   renderCache.set(md, html);
   return html;
}
