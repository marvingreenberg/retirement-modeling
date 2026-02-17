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

	it('shows header row when expenses exist', () => {
		renderEditor();
		expect(screen.getByText('Name')).toBeInTheDocument();
		expect(screen.getByText('Amount ($)')).toBeInTheDocument();
		expect(screen.getByText('Type')).toBeInTheDocument();
		expect(screen.getByText('When')).toBeInTheDocument();
		expect(screen.getByText('Infl.')).toBeInTheDocument();
	});

	it('does not show header row when no expenses', () => {
		renderEditor({ plannedExpenses: [] });
		expect(screen.queryByText('Name')).not.toBeInTheDocument();
		expect(screen.queryByText('When')).not.toBeInTheDocument();
	});

	it('renders existing planned expenses as cards', () => {
		renderEditor();
		expect(screen.getByDisplayValue('Kitchen remodel')).toBeInTheDocument();
		expect(screen.getByDisplayValue('Travel')).toBeInTheDocument();
	});

	it('shows single year input for one-time expense', () => {
		const expenses: PlannedExpense[] = [
			{ name: 'Test', amount: 5000, expense_type: 'one_time', year: 2028, inflation_adjusted: true },
		];
		renderEditor({ plannedExpenses: expenses });
		expect(screen.getByDisplayValue('2028')).toBeInTheDocument();
	});

	it('shows start-end year inputs for recurring expense', () => {
		const expenses: PlannedExpense[] = [
			{ name: 'Test', amount: 5000, expense_type: 'recurring', start_year: 2026, end_year: 2035, inflation_adjusted: true },
		];
		renderEditor({ plannedExpenses: expenses });
		expect(screen.getByDisplayValue('2026')).toBeInTheDocument();
		expect(screen.getByDisplayValue('2035')).toBeInTheDocument();
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
		const amountInput = screen.getAllByLabelText('Amount')[0];
		expect(amountInput.className).toContain('ring-error');
	});
});
