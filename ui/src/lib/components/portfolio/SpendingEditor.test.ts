import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import { portfolio, samplePortfolio, validationErrors, formTouched } from '$lib/stores';
import type { SimulationConfig, PlannedExpense } from '$lib/types';

const { default: SpendingEditor } = await import('./SpendingEditor.svelte');

function renderEditor(overrides: Partial<{ config: SimulationConfig; plannedExpenses: PlannedExpense[] }> = {}) {
	const p = structuredClone(samplePortfolio);
	return render(SpendingEditor, {
		config: overrides.config ?? p.config,
		plannedExpenses: overrides.plannedExpenses ?? p.config.planned_expenses ?? [],
	});
}

describe('SpendingEditor', () => {
	beforeEach(() => {
		validationErrors.set({});
		formTouched.set(false);
	});

	it('shows annual spending label', () => {
		renderEditor();
		expect(screen.getByText(/Annual Spending/)).toBeInTheDocument();
	});

	it('shows monthly equivalent as detail', () => {
		renderEditor();
		expect(screen.getByText(/\/mo$/)).toBeInTheDocument();
	});

	it('displays annual value directly in input', () => {
		const config = structuredClone(samplePortfolio.config);
		config.annual_spend_net = 120000;
		renderEditor({ config });
		const input = screen.getByDisplayValue('120000');
		expect(input).toBeInTheDocument();
	});

	it('shows planned expenses header', () => {
		renderEditor();
		expect(screen.getByText('Planned Expenses')).toBeInTheDocument();
	});

	it('renders existing planned expenses', () => {
		renderEditor();
		expect(screen.getByDisplayValue('Kitchen remodel')).toBeInTheDocument();
		expect(screen.getByDisplayValue('Travel')).toBeInTheDocument();
	});

	it('adds a new expense on button click', async () => {
		renderEditor({ plannedExpenses: [] });
		const btn = screen.getByText('+ Add Expense');
		await fireEvent.click(btn);
		expect(screen.getByDisplayValue('Expense 1')).toBeInTheDocument();
	});

	it('shows error styling for expense amount when validation fails', () => {
		formTouched.set(true);
		validationErrors.set({ 'config.planned_expenses.0.amount': 'Required' });
		renderEditor();
		const labels = screen.getAllByText('Amount ($)');
		expect(labels[0].className).toContain('error');
	});
});
