import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import { portfolio, samplePortfolio } from '$lib/stores';

const { default: SpendingPage } = await import('./+page.svelte');

describe('Spending page', () => {
	beforeEach(() => {
		const p = structuredClone(samplePortfolio);
		p.config.spending_strategy = 'fixed_dollar';
		portfolio.set(p);
	});

	it('renders page heading', () => {
		render(SpendingPage);
		expect(screen.getByText('Spending Configuration')).toBeInTheDocument();
	});

	it('renders spending strategy dropdown', () => {
		render(SpendingPage);
		expect(screen.getByText('Spending Strategy')).toBeInTheDocument();
		const select = screen.getByDisplayValue('Fixed Dollar');
		expect(select).toBeInTheDocument();
	});

	it('shows withdrawal rate when percent_of_portfolio selected', async () => {
		portfolio.update((p) => {
			p.config.spending_strategy = 'percent_of_portfolio';
			return p;
		});
		render(SpendingPage);
		expect(screen.getByText('Withdrawal Rate')).toBeInTheDocument();
	});

	it('shows guardrails params when guardrails selected', async () => {
		portfolio.update((p) => {
			p.config.spending_strategy = 'guardrails';
			return p;
		});
		render(SpendingPage);
		expect(screen.getByText('Init. WD Rate')).toBeInTheDocument();
		expect(screen.getByText('Floor %')).toBeInTheDocument();
		expect(screen.getByText('Ceiling %')).toBeInTheDocument();
		expect(screen.getByText('Adjust %')).toBeInTheDocument();
	});

	it('hides conditional params for fixed_dollar', () => {
		render(SpendingPage);
		expect(screen.queryByText('Withdrawal Rate')).not.toBeInTheDocument();
		expect(screen.queryByText('Init. WD Rate')).not.toBeInTheDocument();
	});

	it('renders annual spending input', () => {
		render(SpendingPage);
		expect(screen.getByText('Annual Spending ($/yr)')).toBeInTheDocument();
	});

	it('renders planned expenses section', () => {
		render(SpendingPage);
		expect(screen.getByText('Planned Expenses')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /add expense/i })).toBeInTheDocument();
	});
});
