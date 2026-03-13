import lunr from 'lunr';
import { getTopicMeta, allTopicIds } from './helpTopics';

export interface SearchResult {
   topicId: string;
   headingId: string;
   topicName: string;
   sectionTitle: string;
}

interface Section {
   topicId: string;
   headingId: string;
   sectionTitle: string;
   body: string;
}

const mdModules = import.meta.glob('./help/en/*.md', {
   query: '?raw',
   import: 'default',
   eager: true,
}) as Record<string, string>;

const headingRe = /^(#{2,3})\s+(.+?)(?:\s*\{#([\w-]+)\})?\s*$/;

function slugify(text: string): string {
   return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
}

function stripMarkdown(text: string): string {
   return text
      .replace(/<!--[\s\S]*?-->/g, '') // HTML comments
      .replace(/\*\*(.+?)\*\*/g, '$1') // bold
      .replace(/\*(.+?)\*/g, '$1') // italic
      .replace(/_(.+?)_/g, '$1') // italic alt
      .replace(/`(.+?)`/g, '$1') // inline code
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links
      .replace(/^[-*+]\s+/gm, '') // list markers
      .replace(/^\d+\.\s+/gm, '') // numbered list markers
      .replace(/^#+\s+/gm, ''); // heading markers (leftover)
}

function buildSections(): Section[] {
   const sections: Section[] = [];

   for (const topicId of allTopicIds) {
      const key = `./help/en/${topicId}.md`;
      const raw = mdModules[key];
      if (!raw) continue;

      const lines = raw.split('\n');
      let currentTitle = getTopicMeta(topicId)?.name ?? topicId;
      let currentId = topicId;
      let bodyLines: string[] = [];

      const flush = () => {
         const body = stripMarkdown(bodyLines.join('\n')).trim();
         if (body) {
            sections.push({
               topicId,
               headingId: currentId,
               sectionTitle: currentTitle,
               body,
            });
         }
      };

      for (const line of lines) {
         const match = headingRe.exec(line);
         if (match) {
            flush();
            const headingText = match[2].replace(/\{#[\w-]+\}\s*$/, '').trim();
            currentTitle = headingText;
            currentId = match[3] || slugify(headingText);
            bodyLines = [];
         } else {
            bodyLines.push(line);
         }
      }
      flush();
   }

   return sections;
}

const allSections = buildSections();

const sectionMap = new Map<string, Section>(
   allSections.map((s) => [`${s.topicId}:${s.headingId}`, s]),
);

const idx = lunr(function () {
   this.ref('key');
   this.field('title');
   this.field('body');

   for (const s of allSections) {
      this.add({
         key: `${s.topicId}:${s.headingId}`,
         title: s.sectionTitle,
         body: s.body,
      });
   }
});

export function searchHelp(query: string): SearchResult[] {
   const trimmed = query.trim();
   if (!trimmed) return [];

   const terms = trimmed.split(/\s+/).map((t) => `+${t}`);
   let results: lunr.Index.Result[];
   try {
      results = idx.search(terms.join(' '));
   } catch {
      return [];
   }

   return results
      .map((r) => {
         const section = sectionMap.get(r.ref);
         if (!section) return null;
         const meta = getTopicMeta(section.topicId);
         return {
            topicId: section.topicId,
            headingId: section.headingId,
            topicName: meta?.name ?? section.topicId,
            sectionTitle: section.sectionTitle,
         };
      })
      .filter((r): r is SearchResult => r !== null);
}

const stemPipeline = new lunr.Pipeline();
stemPipeline.add(lunr.stemmer);

function stemWord(word: string): string {
   const results = stemPipeline.run([new lunr.Token(word.toLowerCase(), {})]);
   return results.length > 0 ? results[0].toString() : word.toLowerCase();
}

export function highlightTerms(html: string, query: string): string {
   const trimmed = query.trim();
   if (!trimmed) return html;

   const queryStems = trimmed
      .split(/\s+/)
      .map((w) => stemWord(w))
      .filter(Boolean);
   if (queryStems.length === 0) return html;

   // Process only text content between HTML tags
   return html.replace(/>([^<]+)</g, (_fullMatch, textContent: string) => {
      const highlighted = textContent.replace(/\b(\w+)\b/g, (word: string) => {
         const wordStem = stemWord(word);
         if (queryStems.includes(wordStem)) {
            return `<mark>${word}</mark>`;
         }
         return word;
      });
      return `>${highlighted}<`;
   });
}
