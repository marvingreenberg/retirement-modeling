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

	it('shows summary text when collapsed', () => {
		renderSettings({ collapsed: true });
		expect(screen.getByText(/infl.*growth/)).toBeInTheDocument();
	});

	it('shows run mode radio buttons', () => {
		renderSettings();
		expect(screen.getByText('Single run')).toBeInTheDocument();
		expect(screen.getByText('Monte Carlo')).toBeInTheDocument();
	});
});
