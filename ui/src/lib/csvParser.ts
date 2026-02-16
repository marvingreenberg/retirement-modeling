/**
 * Client-side CSV parser for brokerage position exports.
 * Supports Fidelity, Schwab, and Vanguard CSV formats.
 */

import type { ParsedHolding, ParsedAccount } from './ofxParser';

interface CsvRow {
	[key: string]: string;
}

function parseCsvRows(text: string): CsvRow[] {
	const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
	if (lines.length < 2) return [];

	// Find the header row (skip metadata lines that some brokers prepend)
	let headerIdx = 0;
	for (let i = 0; i < Math.min(lines.length, 10); i++) {
		const lower = lines[i].toLowerCase();
		if (lower.includes('symbol') || lower.includes('ticker') || lower.includes('investment name')) {
			headerIdx = i;
			break;
		}
	}

	const headers = splitCsvLine(lines[headerIdx]).map((h) => h.trim().toLowerCase());
	const rows: CsvRow[] = [];
	for (let i = headerIdx + 1; i < lines.length; i++) {
		const values = splitCsvLine(lines[i]);
		if (values.length < 2) continue;
		const row: CsvRow = {};
		for (let j = 0; j < headers.length && j < values.length; j++) {
			row[headers[j]] = values[j].trim();
		}
		rows.push(row);
	}
	return rows;
}

function splitCsvLine(line: string): string[] {
	const result: string[] = [];
	let current = '';
	let inQuotes = false;
	for (const ch of line) {
		if (ch === '"') {
			inQuotes = !inQuotes;
		} else if (ch === ',' && !inQuotes) {
			result.push(current);
			current = '';
		} else {
			current += ch;
		}
	}
	result.push(current);
	return result;
}

function parseNumber(s: string | undefined): number {
	if (!s) return 0;
	return parseFloat(s.replace(/[$,%]/g, '').trim()) || 0;
}

type BrokerFormat = 'fidelity' | 'schwab' | 'vanguard' | 'generic';

function detectBroker(text: string, headers: string[]): BrokerFormat {
	const lower = text.toLowerCase();
	if (lower.includes('fidelity') || headers.includes('last price change')) return 'fidelity';
	if (lower.includes('schwab') || headers.includes('day change %')) return 'schwab';
	if (lower.includes('vanguard') || headers.includes('investment name')) return 'vanguard';
	return 'generic';
}

function getField(row: CsvRow, candidates: string[]): string {
	for (const c of candidates) {
		if (row[c] !== undefined) return row[c];
	}
	return '';
}

function rowToHolding(row: CsvRow, broker: BrokerFormat): ParsedHolding | null {
	const symbol = getField(row, ['symbol', 'ticker']).replace(/[^A-Z0-9]/gi, '') || null;
	const name = getField(row, [
		'description', 'investment name', 'security description', 'name',
	]);
	const quantity = parseNumber(getField(row, ['quantity', 'shares']));
	const price = parseNumber(getField(row, [
		'last price', 'price', 'share price', 'current price', 'unit price',
	]));
	const marketValue = parseNumber(getField(row, [
		'current value', 'market value', 'total value', 'value',
	]));

	if (marketValue <= 0 && quantity <= 0) return null;
	// Skip cash/money-market summary rows
	if (!symbol && name.toLowerCase().includes('cash')) return null;
	const lowerName = name.toLowerCase();
	if (symbol === 'CASH' || (lowerName.includes('pending') && lowerName.includes('activity')))
		return null;

	const isMF = broker === 'vanguard' || (symbol?.length ?? 0) > 5;
	return {
		symbol: symbol || null,
		cusip: '',
		name: name || symbol || 'Unknown',
		quantity: quantity || (marketValue && price ? marketValue / price : 0),
		price: price || (quantity ? marketValue / quantity : 0),
		market_value: marketValue || quantity * price,
		security_type: isMF ? 'MF' : 'Stock',
	};
}

export function parseCSV(text: string): ParsedAccount[] {
	const rows = parseCsvRows(text);
	if (rows.length === 0) throw new Error('No data rows found in CSV file');

	const headers = Object.keys(rows[0]);
	const broker = detectBroker(text, headers);
	const brokerName =
		broker === 'fidelity' ? 'Fidelity' :
		broker === 'schwab' ? 'Schwab' :
		broker === 'vanguard' ? 'Vanguard' : 'unknown';

	// Group by account if account column exists
	const accountField = headers.find((h) =>
		['account number', 'account name/number', 'account'].includes(h)
	);

	const groups = new Map<string, CsvRow[]>();
	for (const row of rows) {
		const key = accountField ? (row[accountField] || 'default') : 'default';
		if (!groups.has(key)) groups.set(key, []);
		groups.get(key)!.push(row);
	}

	const accounts: ParsedAccount[] = [];
	for (const [accountId, accountRows] of groups) {
		const holdings: ParsedHolding[] = [];
		let cash = 0;

		for (const row of accountRows) {
			const holding = rowToHolding(row, broker);
			if (holding) {
				// Detect cash-equivalent holdings
				const sym = holding.symbol?.toUpperCase() ?? '';
				const isCash = ['SPAXX', 'VMFXX', 'SWVXX', 'FDRXX', 'FCASH'].includes(sym);
				if (isCash) {
					cash += holding.market_value;
				} else {
					holdings.push(holding);
				}
			}
		}

		// Extract cash from specific row patterns
		for (const row of accountRows) {
			const name = getField(row, ['description', 'investment name', 'name']).toLowerCase();
			if (name.includes('cash') || name.includes('money market') || name.includes('core position')) {
				const val = parseNumber(getField(row, ['current value', 'market value', 'total value', 'value']));
				if (val > 0 && !holdings.some((h) => h.name.toLowerCase() === name)) {
					cash += val;
				}
			}
		}

		if (holdings.length === 0 && cash <= 0) continue;

		const holdingsTotal = holdings.reduce((s, h) => s + h.market_value, 0);
		accounts.push({
			account_id: accountId === 'default' ? '1' : accountId.replace(/[^A-Z0-9]/gi, '').slice(-6),
			broker: brokerName,
			account_type: null,
			holdings,
			total_value: holdingsTotal + cash,
			cash_balance: cash,
			as_of_date: null,
		});
	}

	if (accounts.length === 0) {
		throw new Error('No holdings found in CSV file');
	}
	return accounts;
}
