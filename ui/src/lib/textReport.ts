import type { YearResult, AccountWithdrawal, IncomeDetail, SimulationResponse } from './types';

function $(n: number): string {
	return n < 0 ? `-$${Math.abs(Math.round(n)).toLocaleString()}`
		: `$${Math.round(n).toLocaleString()}`;
}

function pad(s: string, w: number, right = false): string {
	return right ? s.padStart(w) : s.padEnd(w);
}

function withdrawalSection(details: AccountWithdrawal[] | undefined, purpose: string, label: string): string[] {
	const items = (details ?? []).filter((d) => d.purpose === purpose);
	if (items.length === 0) return [];
	const total = items.reduce((sum, d) => sum + d.amount, 0);
	const lines = [`  ${label}: ${$(total)}`];
	for (const d of items) lines.push(`    ${d.account_name}: ${$(d.amount)}`);
	return lines;
}

function withdrawalPlanText(years: YearResult[]): string {
	const planYears = years.slice(0, 2);
	const lines: string[] = ['WITHDRAWAL PLAN', ''];
	for (const yr of planYears) {
		lines.push(`${yr.year} · Age ${yr.age_primary}`);
		lines.push(`  Spending Target: ${$(yr.spending_target)}`);
		if (yr.surplus > 0) lines.push(`  Income Surplus: ${$(yr.surplus)}`);
		const incomes = yr.income_details ?? [];
		if (incomes.length > 0) {
			lines.push(`  Income: ${$(yr.total_income)}`);
			for (const inc of incomes) lines.push(`    ${inc.name}: ${$(inc.amount)}`);
		}
		lines.push(...withdrawalSection(yr.withdrawal_details, 'rmd', 'RMD'));
		lines.push(...withdrawalSection(yr.withdrawal_details, 'spending', 'Withdrawals'));
		if (yr.roth_conversion > 0) {
			lines.push(...withdrawalSection(yr.withdrawal_details, 'conversion', 'Roth Conversion'));
		}
		lines.push(`  Taxes: ${$(yr.total_tax)}`);
		if (yr.irmaa_cost > 0) lines.push(`    IRMAA Surcharge: ${$(yr.irmaa_cost)}`);
		if (yr.conversion_tax > 0) lines.push(`    Conversion Tax: ${$(yr.conversion_tax)}`);
		lines.push('');
	}
	return lines.join('\n');
}

const COL_WIDTHS = [6, 5, 12, 6, 12, 12, 12, 12, 10, 14, 12, 12, 12, 10, 14];
const HEADERS = ['Year', 'Age', 'AGI', 'Brkt', 'RMD', 'Income', 'Spending', 'Pre-tax WD', 'Roth WD', 'Brokerage WD', 'Roth Conv', 'Conv Tax', 'Total Tax', 'IRMAA', 'Total Balance'];

function tableRow(cells: string[]): string {
	return cells.map((c, i) => pad(c, COL_WIDTHS[i], i >= 2)).join('  ');
}

function yearByYearText(years: YearResult[]): string {
	const lines: string[] = ['YEAR-BY-YEAR DETAIL', ''];
	lines.push(tableRow(HEADERS));
	lines.push('-'.repeat(lines[lines.length - 1].length));
	for (const yr of years) {
		lines.push(tableRow([
			String(yr.year), String(yr.age_primary), $(yr.agi), yr.bracket,
			$(yr.rmd), $(yr.total_income), $(yr.spending_target),
			$(yr.pretax_withdrawal), $(yr.roth_withdrawal), $(yr.brokerage_withdrawal),
			$(yr.roth_conversion), $(yr.conversion_tax), $(yr.total_tax),
			$(yr.irmaa_cost), $(yr.total_balance),
		]));
	}
	return lines.join('\n');
}

function summaryText(sim: SimulationResponse): string {
	const s = sim.summary;
	const lines = ['SUMMARY', ''];
	lines.push(`Strategy: ${s.strategy} / ${s.spending_strategy}`);
	lines.push(`Simulation Years: ${s.simulation_years}`);
	lines.push(`Final Balance: ${$(s.final_balance)}`);
	lines.push(`Total Taxes Paid: ${$(s.total_taxes_paid)}`);
	if (s.total_irmaa_paid > 0) lines.push(`Total IRMAA Paid: ${$(s.total_irmaa_paid)}`);
	lines.push(`Total Roth Conversions: ${$(s.total_roth_conversions)}`);
	if (s.initial_annual_spend) lines.push(`Initial Annual Spend: ${$(s.initial_annual_spend)}`);
	return lines.join('\n');
}

export function generateTextReport(sim: SimulationResponse): string {
	const allYears = sim.result.years;
	const depletionIdx = allYears.findIndex((yr, i) => yr.total_balance <= 0 && i > 0);
	const years = depletionIdx >= 0 ? allYears.slice(0, depletionIdx + 1) : allYears;

	const sections = [
		`Retirement Simulation Report`,
		`Generated ${new Date().toLocaleDateString()}`,
		'',
		summaryText(sim),
		'',
		withdrawalPlanText(years),
		yearByYearText(years),
	];

	if (depletionIdx >= 0) {
		sections.push('');
		sections.push(`** Portfolio depleted at age ${allYears[depletionIdx].age_primary} — remaining years omitted **`);
	}

	return sections.join('\n') + '\n';
}
