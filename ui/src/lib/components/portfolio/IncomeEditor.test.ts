import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { portfolio, samplePortfolio } from '$lib/stores';
import { get } from 'svelte/store';

const { default: IncomeEditor } = await import('./IncomeEditor.svelte');

describe('IncomeEditor', () => {
	function renderEditor(configOverrides: Record<string, any> = {}, incomeOverride?: any[]) {
		const config = { ...structuredClone(samplePortfolio.config), ...configOverrides };
		const incomeStreams = incomeOverride ?? config.income_streams;
		return render(IncomeEditor, { config, incomeStreams });
	}

	it('renders Social Security section', () => {
		renderEditor();
		expect(screen.getByText('Social Security')).toBeInTheDocument();
		expect(screen.getByText('Primary FRA Benefit ($/yr)')).toBeInTheDocument();
		expect(screen.getByText('Primary Start Year')).toBeInTheDocument();
	});

	it('shows spouse SS fields when spouse exists', () => {
		renderEditor({ current_age_spouse: 55 });
		expect(screen.getByText('Spouse FRA Benefit ($/yr)')).toBeInTheDocument();
		expect(screen.getByText('Spouse Start Year')).toBeInTheDocument();
	});

	it('hides spouse SS fields when no spouse', () => {
		renderEditor({ current_age_spouse: 0 });
		expect(screen.queryByText('Spouse FRA Benefit ($/yr)')).not.toBeInTheDocument();
	});

	it('renders Other Income section with heading', () => {
		renderEditor();
		expect(screen.getByText('Other Income')).toBeInTheDocument();
	});

	it('renders existing income streams from sample data', () => {
		renderEditor();
		expect(screen.getByDisplayValue('Pension')).toBeInTheDocument();
	});

	it('renders Add Income button', () => {
		renderEditor();
		expect(screen.getByText('Add Income')).toBeInTheDocument();
	});

	it('shows SS start age as year with age hint', () => {
		renderEditor({ current_age_primary: 65, start_year: 2026, ss_auto: {
			primary_fra_amount: 36000, primary_start_age: 67,
			spouse_fra_amount: null, spouse_start_age: null, fra_age: 67,
		}});
		// age 67 for primary age 65 in 2026 = year 2028
		expect(screen.getByText('(age 67)')).toBeInTheDocument();
	});

	it('shows stream years with age hints', () => {
		renderEditor({ current_age_primary: 65, start_year: 2026, ss_auto: {
			primary_fra_amount: 36000, primary_start_age: 67,
			spouse_fra_amount: null, spouse_start_age: null, fra_age: 67,
		}}, [{
			name: 'Pension', amount: 24000, start_age: 72, end_age: null,
			taxable_pct: 1.0, cola_rate: null, owner: 'primary',
		}]);
		// age 72 for primary age 65 in 2026 = year 2033
		expect(screen.getByText('(age 72)')).toBeInTheDocument();
		expect(screen.getByText('lifetime')).toBeInTheDocument();
	});

	it('shows column headers as Start Year and End Year', () => {
		renderEditor({}, [{
			name: 'Test', amount: 1000, start_age: 65, end_age: null,
			taxable_pct: 1.0, cola_rate: null, owner: 'primary',
		}]);
		expect(screen.getByText('Start Year')).toBeInTheDocument();
		expect(screen.getByText('End Year')).toBeInTheDocument();
	});

	it('shows warning for start age past simulation end', () => {
		renderEditor({ current_age_primary: 65, simulation_years: 30, start_year: 2026 }, [{
			name: 'Late', amount: 1000, start_age: 96, end_age: null,
			taxable_pct: 1.0, cola_rate: null, owner: 'primary',
		}]);
		expect(screen.getByText('past sim end')).toBeInTheDocument();
	});

	it('shows warning for end age before start age', () => {
		renderEditor({ current_age_primary: 65, start_year: 2026 }, [{
			name: 'Bad', amount: 1000, start_age: 70, end_age: 65,
			taxable_pct: 1.0, cola_rate: null, owner: 'primary',
		}]);
		expect(screen.getByText('end < start')).toBeInTheDocument();
	});
});
