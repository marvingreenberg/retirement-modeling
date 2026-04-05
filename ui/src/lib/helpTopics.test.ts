import { describe, it, expect } from 'vitest';
import {
   helpCategories,
   getTopicMeta,
   getCategoryForTopic,
   getDefaultTopicId,
   allTopicIds,
} from './helpTopics';

describe('helpTopics', () => {
   it('defines 4 categories', () => {
      expect(helpCategories).toHaveLength(4);
      const names = helpCategories.map((c) => c.name);
      expect(names).toEqual([
         'App Basics',
         'Your Inputs',
         'Rules & Strategies',
         'Understanding Results',
      ]);
   });

   it('defines 21 topics total', () => {
      expect(allTopicIds).toHaveLength(21);
   });

   it('getTopicMeta returns metadata for known topic', () => {
      const meta = getTopicMeta('spending-strategies');
      expect(meta).toBeDefined();
      expect(meta!.name).toBe('Spending Strategies');
      expect(meta!.related.length).toBeGreaterThan(0);
   });

   it('getTopicMeta returns undefined for unknown topic', () => {
      expect(getTopicMeta('nonexistent')).toBeUndefined();
   });

   it('getCategoryForTopic returns correct category', () => {
      const cat = getCategoryForTopic('balance-chart');
      expect(cat).toBeDefined();
      expect(cat!.name).toBe('Understanding Results');
   });

   it('getDefaultTopicId maps routes to topics', () => {
      expect(getDefaultTopicId('/')).toBe('getting-started');
      expect(getDefaultTopicId('/details')).toBe('details-page');
      expect(getDefaultTopicId('/compare')).toBe('compare-page');
      expect(getDefaultTopicId('/spending')).toBe('spending-strategies');
   });

   it('getDefaultTopicId falls back for unknown routes', () => {
      expect(getDefaultTopicId('/unknown')).toBe('getting-started');
   });

   it('all related topic references are valid', () => {
      const validIds = new Set(allTopicIds);
      for (const cat of helpCategories) {
         for (const topic of cat.topics) {
            for (const relId of topic.related) {
               expect(
                  validIds.has(relId),
                  `${topic.id} references unknown topic ${relId}`,
               ).toBe(true);
            }
         }
      }
   });
});
