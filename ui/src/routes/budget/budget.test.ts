import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { portfolio, samplePortfolio } from '$lib/stores';

const { default: BudgetPage } = await import('./+page.svelte');

describe('Budget page', () => {
	beforeEach(() => {
		portfolio.set(structuredClone(samplePortfolio));
	});

	it('renders page heading', () => {
		render(BudgetPage);
		expect(screen.getByText('Budget')).toBeInTheDocument();
	});

	it('does not render strategy controls', () => {
		render(BudgetPage);
		expect(screen.queryByText('Spending Strategy')).not.toBeInTheDocument();
		expect(screen.queryByText('Withdrawal Strategy')).not.toBeInTheDocument();
	});

	it('renders annual spending input', () => {
		render(BudgetPage);
		expect(screen.getByText('Annual Spending ($/yr)')).toBeInTheDocument();
	});

	it('renders planned expenses section', () => {
		render(BudgetPage);
		expect(screen.getByText('Planned Expenses')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /add expense/i })).toBeInTheDocument();
	});
});
