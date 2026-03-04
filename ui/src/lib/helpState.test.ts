import { describe, it, expect } from 'vitest';
import { helpState, openHelp, closeHelp } from './helpState.svelte';

describe('helpState', () => {
	it('starts closed with default topic', () => {
		expect(helpState.open).toBe(false);
		expect(helpState.topic).toBe('getting-started');
		expect(helpState.anchor).toBeUndefined();
	});

	it('openHelp sets open, topic, and anchor', () => {
		openHelp('spending-strategies', 'guardrail-floor');
		expect(helpState.open).toBe(true);
		expect(helpState.topic).toBe('spending-strategies');
		expect(helpState.anchor).toBe('guardrail-floor');
	});

	it('openHelp without anchor clears anchor', () => {
		openHelp('spending-strategies', 'guardrail-floor');
		openHelp('tax-bracket-indexing');
		expect(helpState.anchor).toBeUndefined();
	});

	it('closeHelp sets open to false and preserves topic', () => {
		openHelp('spending-strategies');
		closeHelp();
		expect(helpState.open).toBe(false);
		expect(helpState.topic).toBe('spending-strategies');
	});
});
