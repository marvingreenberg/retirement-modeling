import { describe, it, expect } from 'vitest';
import { helpTopics, getTopicById, getDefaultTopicId } from './helpContent';

describe('helpContent', () => {
	it('exports all four topics', () => {
		expect(helpTopics).toHaveLength(4);
		const ids = helpTopics.map((t) => t.id);
		expect(ids).toContain('tax-indexing');
		expect(ids).toContain('spending-strategies');
		expect(ids).toContain('ss-benefit');
		expect(ids).toContain('income-cola');
	});

	it('getTopicById returns matching topic', () => {
		const topic = getTopicById('ss-benefit');
		expect(topic).toBeDefined();
		expect(topic!.title).toBe('Social Security Benefit Formula');
	});

	it('getTopicById returns undefined for unknown id', () => {
		expect(getTopicById('nonexistent')).toBeUndefined();
	});

	it('getDefaultTopicId returns spending-strategies for /', () => {
		expect(getDefaultTopicId('/')).toBe('spending-strategies');
	});

	it('getDefaultTopicId returns tax-indexing for /details', () => {
		expect(getDefaultTopicId('/details')).toBe('tax-indexing');
	});

	it('getDefaultTopicId returns spending-strategies for unknown route', () => {
		expect(getDefaultTopicId('/unknown')).toBe('spending-strategies');
	});

	it('all relatedTopics reference valid topic ids', () => {
		const validIds = new Set(helpTopics.map((t) => t.id));
		for (const topic of helpTopics) {
			for (const relId of topic.relatedTopics) {
				expect(validIds.has(relId), `${topic.id} references unknown topic ${relId}`).toBe(true);
			}
		}
	});
});
