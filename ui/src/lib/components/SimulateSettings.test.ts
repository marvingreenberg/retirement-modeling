import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import { portfolio, samplePortfolio } from '$lib/stores';

const { default: SimulateSettings } = await import('./SimulateSettings.svelte');

describe('SimulateSettings', () => {
	beforeEach(() => {
		portfolio.set(structuredClone(samplePortfolio));
	});

	function renderSettings(overrides: Record<string, any> = {}) {
		return render(SimulateSettings, {
			runMode: 'single',
			numSimulations: 1000,
			collapsed: false,
			onrun: vi.fn(),
			loading: false,
			...overrides,
		});
	}

	it('shows primary inputs by default', () => {
		renderSettings();
		expect(screen.getByText(/Inflation %/)).toBeInTheDocument();
		expect(screen.getByText(/Growth %/)).toBeInTheDocument();
		expect(screen.getByText(/Conversion/)).toBeInTheDocument();
	});

	it('shows withdrawal strategy dropdown', () => {
		renderSettings();
		expect(screen.getByText(/Withdrawal Strategy/)).toBeInTheDocument();
	});

	it('shows guardrails params when guardrails selected', () => {
		portfolio.update((p) => {
			p.config.spending_strategy = 'guardrails';
			return p;
		});
		renderSettings();
		expect(screen.getByText('Init. WD Rate')).toBeInTheDocument();
		expect(screen.getByText('Floor %')).toBeInTheDocument();
		expect(screen.getByText('Ceiling %')).toBeInTheDocument();
		expect(screen.getByText('Adjust %')).toBeInTheDocument();
	});

	it('shows withdrawal rate when percent_of_portfolio selected', () => {
		portfolio.update((p) => {
			p.config.spending_strategy = 'percent_of_portfolio';
			return p;
		});
		renderSettings();
		expect(screen.getByText('Withdrawal Rate')).toBeInTheDocument();
	});

	it('hides conditional params for fixed_dollar', () => {
		portfolio.update((p) => {
			p.config.spending_strategy = 'fixed_dollar';
			return p;
		});
		renderSettings();
		expect(screen.queryByText('Withdrawal Rate')).not.toBeInTheDocument();
		expect(screen.queryByText('Init. WD Rate')).not.toBeInTheDocument();
	});

	it('hides advanced inputs by default', () => {
		renderSettings();
		expect(screen.queryByText('State Tax %')).not.toBeInTheDocument();
		expect(screen.queryByText('Cap Gains %')).not.toBeInTheDocument();
	});

	it('shows advanced inputs after clicking Advanced toggle', async () => {
		renderSettings();
		const toggle = screen.getByText(/Advanced/);
		await fireEvent.click(toggle);
		expect(screen.getByText('State Tax %')).toBeInTheDocument();
		expect(screen.getByText('Cap Gains %')).toBeInTheDocument();
		expect(screen.getByText(/RMD Age/)).toBeInTheDocument();
		expect(screen.getByText(/IRMAA Limit/)).toBeInTheDocument();
	});

	it('shows Simulate button', () => {
		renderSettings();
		expect(screen.getByRole('button', { name: 'Simulate' })).toBeInTheDocument();
	});

	it('shows summary text with strategy when collapsed', () => {
		portfolio.update((p) => {
			p.config.spending_strategy = 'fixed_dollar';
			p.config.annual_spend_net = 120000;
			return p;
		});
		renderSettings({ collapsed: true });
		const summary = screen.getByText(/infl.*growth/);
		expect(summary).toBeInTheDocument();
		expect(summary.textContent).toContain('Fixed/$120K');
	});

	it('shows POP shorthand in summary', () => {
		portfolio.update((p) => {
			p.config.spending_strategy = 'percent_of_portfolio';
			p.config.withdrawal_rate = 0.04;
			return p;
		});
		renderSettings({ collapsed: true });
		expect(screen.getByText(/4\.0%\/POP/)).toBeInTheDocument();
	});

	it('shows run mode radio buttons', () => {
		renderSettings();
		expect(screen.getByText('Single run')).toBeInTheDocument();
		expect(screen.getByText('Monte Carlo')).toBeInTheDocument();
	});
});
