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
		expect(screen.getByText('Primary Start Age')).toBeInTheDocument();
	});

	it('shows spouse SS fields when spouse exists', () => {
		renderEditor({ current_age_spouse: 55 });
		expect(screen.getByText('Spouse FRA Benefit ($/yr)')).toBeInTheDocument();
		expect(screen.getByText('Spouse Start Age')).toBeInTheDocument();
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
});
