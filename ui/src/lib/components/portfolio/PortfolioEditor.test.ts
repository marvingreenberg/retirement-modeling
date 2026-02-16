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

	it('shows monthly spending label in budget section', () => {
		render(PortfolioEditor);
		expect(screen.getByText(/Monthly Spending/)).toBeInTheDocument();
	});

	it('shows annual equivalent next to monthly input', () => {
		render(PortfolioEditor);
		expect(screen.getByText(/\/yr$/)).toBeInTheDocument();
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
		expect(screen.getByText(/Define expected monthly spending/)).toBeInTheDocument();
	});

	it('shows planned expenses count in budget section', () => {
		render(PortfolioEditor);
		expect(screen.getByText(/2 planned expenses/)).toBeInTheDocument();
	});
});
