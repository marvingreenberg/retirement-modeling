import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';

Object.defineProperty(window, 'matchMedia', {
	writable: true,
	value: vi.fn().mockImplementation((query: string) => ({
		matches: false, media: query, onchange: null,
		addListener: vi.fn(), removeListener: vi.fn(),
		addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
	})),
});

describe('Route pages render expected content', () => {
	it('/compare page renders CompareView', async () => {
		const { default: ComparePage } = await import('../../routes/compare/+page.svelte');
		render(ComparePage);
		expect(screen.getByText('No comparisons yet')).toBeInTheDocument();
	});

	it('/spending page renders spending configuration', async () => {
		const { default: SpendingPage } = await import('../../routes/spending/+page.svelte');
		render(SpendingPage);
		expect(screen.getByText('Spending Configuration')).toBeInTheDocument();
	});

	it('/details page renders placeholder', async () => {
		const { default: DetailsPage } = await import('../../routes/details/+page.svelte');
		render(DetailsPage);
		expect(screen.getByText('Detailed Results')).toBeInTheDocument();
	});
});
