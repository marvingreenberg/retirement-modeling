import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { portfolio, samplePortfolio, validationErrors, formTouched } from '$lib/stores';

const { default: PortfolioEditor } = await import('./PortfolioEditor.svelte');

describe('PortfolioEditor', () => {
	beforeEach(() => {
		portfolio.set(structuredClone(samplePortfolio));
		validationErrors.set({});
		formTouched.set(false);
	});

	it('shows annual spending label in budget section', () => {
		render(PortfolioEditor);
		expect(screen.getByText(/Annual Spending/)).toBeInTheDocument();
	});

	it('shows monthly equivalent next to annual input', () => {
		render(PortfolioEditor);
		expect(screen.getByText(/\$10,000\/mo/)).toBeInTheDocument();
	});

	it('shows collapsible sections for accounts, budget, income', () => {
		render(PortfolioEditor);
		expect(screen.getByText('Accounts')).toBeInTheDocument();
		expect(screen.getByText('Budget')).toBeInTheDocument();
		expect(screen.getByText('Income')).toBeInTheDocument();
	});

	it('filters config input errors from validation banner', () => {
		formTouched.set(true);
		portfolio.update((p) => {
			p.config.inflation_rate = -1;
			p.accounts[0].balance = -1;
			return p;
		});
		render(PortfolioEditor);
		// inflation_rate error should be filtered (shown inline in SimulateSettings instead)
		const items = screen.getAllByRole('listitem');
		const texts = items.map((li) => li.textContent ?? '');
		expect(texts.some((t) => t.includes('inflation'))).toBe(false);
		// account balance error should show in the banner
		expect(texts.some((t) => t.includes('Balance'))).toBe(true);
	});

	it('does not show validation errors when form is not touched', () => {
		formTouched.set(false);
		validationErrors.set({ 'accounts.0.balance': 'Balance required' });
		render(PortfolioEditor);
		expect(screen.queryByText('Balance required')).not.toBeInTheDocument();
	});

	it('shows warning when no accounts exist', () => {
		portfolio.update((p) => {
			p.accounts = [];
			return p;
		});
		render(PortfolioEditor);
		expect(screen.getByText(/Add an account to allow simulation/)).toBeInTheDocument();
	});

	it('shows warning when budget is zero but accounts exist', () => {
		portfolio.update((p) => {
			p.config.annual_spend_net = 0;
			return p;
		});
		render(PortfolioEditor);
		expect(screen.getByText(/Define expected annual spending/)).toBeInTheDocument();
	});

	it('shows planned expenses count in budget section', () => {
		render(PortfolioEditor);
		expect(screen.getByText(/2 planned expenses/)).toBeInTheDocument();
	});

	it('shows accounts collapsed summary with total', () => {
		render(PortfolioEditor);
		expect(screen.getByText(/Total \$1\.80M/)).toBeInTheDocument();
	});

	it('shows "No accounts" summary when accounts empty', () => {
		portfolio.update((p) => {
			p.accounts = [];
			return p;
		});
		render(PortfolioEditor);
		expect(screen.getByText(/No accounts/)).toBeInTheDocument();
	});

	it('shows budget collapsed summary with annual spending', () => {
		render(PortfolioEditor);
		expect(screen.getByText(/\$120,000\/yr/)).toBeInTheDocument();
	});

	it('shows budget summary with expense count', () => {
		render(PortfolioEditor);
		expect(screen.getByText(/\+ 2 expenses/)).toBeInTheDocument();
	});

	it('shows income collapsed summary with SS and pension', () => {
		render(PortfolioEditor);
		expect(screen.getByText(/SS at 70/)).toBeInTheDocument();
		expect(screen.getByText(/Pension \$24K\/yr/)).toBeInTheDocument();
	});

	it('shows "None configured" when no income', () => {
		portfolio.update((p) => {
			p.config.social_security.primary_benefit = 0;
			p.config.ss_auto = null;
			p.config.income_streams = [];
			return p;
		});
		render(PortfolioEditor);
		expect(screen.getByText(/None configured/)).toBeInTheDocument();
	});
});
