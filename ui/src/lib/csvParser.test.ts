import { describe, it, expect } from 'vitest';
import { parseCSV } from './csvParser';

const FIDELITY_CSV = `
Account Number,Account Name,Symbol,Description,Quantity,Last Price,Current Value,Last Price Change
Z12345678,Individual,VTI,VANGUARD TOTAL STOCK MKT ETF,100,250.00,"$25,000.00",+1.25
Z12345678,Individual,BND,VANGUARD TOTAL BOND MKT ETF,200,75.00,"$15,000.00",-0.50
Z12345678,Individual,SPAXX,FIDELITY GOVT MONEY MKT,5000,1.00,"$5,000.00",0.00
`.trim();

const SCHWAB_CSV = `
"Positions for account XXXX-1234 as of 02/15/2026"
Symbol,Description,Quantity,Price,Market Value,Day Change %
VOO,"VANGUARD S&P 500 ETF",50,$450.00,"$22,500.00",+0.5%
SCHZ,"SCHWAB US AGGREGATE BOND",300,$50.00,"$15,000.00",-0.2%
SWVXX,"SCHWAB VALUE ADVANTAGE MONEY",3000,$1.00,"$3,000.00",0.0%
`.trim();

const VANGUARD_CSV = `
Account Number,Investment Name,Symbol,Shares,Share Price,Total Value
12345678,Vanguard Total Stock Market Index,VTSAX,500,$120.00,"$60,000.00"
12345678,Vanguard Total Intl Stock Index,VTIAX,300,$35.00,"$10,500.00"
12345678,Vanguard Total Bond Market Index,VBTLX,200,$10.00,"$2,000.00"
`.trim();

describe('parseCSV', () => {
	it('parses Fidelity positions', () => {
		const accounts = parseCSV(FIDELITY_CSV);
		expect(accounts.length).toBe(1);
		expect(accounts[0].broker).toBe('Fidelity');
		expect(accounts[0].holdings.length).toBe(2);
		expect(accounts[0].cash_balance).toBeGreaterThan(0);
		const symbols = accounts[0].holdings.map((h) => h.symbol);
		expect(symbols).toContain('VTI');
		expect(symbols).toContain('BND');
	});

	it('parses Schwab positions', () => {
		const accounts = parseCSV(SCHWAB_CSV);
		expect(accounts.length).toBe(1);
		expect(accounts[0].broker).toBe('Schwab');
		expect(accounts[0].holdings.length).toBe(2);
		const symbols = accounts[0].holdings.map((h) => h.symbol);
		expect(symbols).toContain('VOO');
		expect(symbols).toContain('SCHZ');
	});

	it('parses Vanguard positions', () => {
		const accounts = parseCSV(VANGUARD_CSV);
		expect(accounts.length).toBe(1);
		expect(accounts[0].broker).toBe('Vanguard');
		expect(accounts[0].holdings.length).toBe(3);
	});

	it('classifies cash holdings correctly', () => {
		const accounts = parseCSV(FIDELITY_CSV);
		// SPAXX is cash, should be in cash_balance not holdings
		expect(accounts[0].cash_balance).toBe(5000);
	});

	it('calculates total value including cash', () => {
		const accounts = parseCSV(FIDELITY_CSV);
		// VTI=25000 + BND=15000 + SPAXX(cash)=5000
		expect(accounts[0].total_value).toBe(45000);
	});

	it('extracts quantity and price', () => {
		const accounts = parseCSV(FIDELITY_CSV);
		const vti = accounts[0].holdings.find((h) => h.symbol === 'VTI');
		expect(vti?.quantity).toBe(100);
		expect(vti?.price).toBe(250);
		expect(vti?.market_value).toBe(25000);
	});

	it('throws on empty input', () => {
		expect(() => parseCSV('')).toThrow('No data rows');
	});

	it('throws on headerless data', () => {
		expect(() => parseCSV('a,b\n1,2')).toThrow();
	});

	it('handles quoted values with commas', () => {
		const csv = `Symbol,Description,Quantity,Price,Current Value
VTI,"Vanguard Total Stock, ETF",100,250.00,"$25,000.00"`;
		const accounts = parseCSV(csv);
		expect(accounts[0].holdings[0].name).toBe('Vanguard Total Stock, ETF');
	});
});
