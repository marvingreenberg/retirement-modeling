/**
 * Asset classification: maps ticker symbols to asset classes,
 * computes allocation percentages and estimated portfolio return.
 */

import type { ParsedHolding } from './ofxParser';

export type AssetClass =
	| 'us_equity'
	| 'intl_equity'
	| 'us_bond'
	| 'intl_bond'
	| 'reit'
	| 'commodity'
	| 'cash'
	| 'other';

export const ASSET_CLASS_LABELS: Record<AssetClass, string> = {
	us_equity: 'US Equity',
	intl_equity: 'Intl Equity',
	us_bond: 'US Bond',
	intl_bond: 'Intl Bond',
	reit: 'REIT',
	commodity: 'Commodity',
	cash: 'Cash',
	other: 'Other',
};

export const EXPECTED_RETURNS: Record<AssetClass, number> = {
	us_equity: 0.10,
	intl_equity: 0.08,
	us_bond: 0.04,
	intl_bond: 0.035,
	reit: 0.08,
	commodity: 0.05,
	cash: 0.03,
	other: 0.06,
};

// ~50 common ETFs/funds mapped to asset classes
export const ASSET_CLASS_MAP: Record<string, AssetClass> = {
	// US Total Market / Large Cap
	VTI: 'us_equity', VTSAX: 'us_equity', SWTSX: 'us_equity',
	VOO: 'us_equity', VFIAX: 'us_equity', SPY: 'us_equity', IVV: 'us_equity',
	VV: 'us_equity', SCHB: 'us_equity', ITOT: 'us_equity',
	// US Mid/Small Cap
	VO: 'us_equity', VB: 'us_equity', VSMAX: 'us_equity',
	IJR: 'us_equity', IJH: 'us_equity', SCHA: 'us_equity',
	// US Growth / Value
	VUG: 'us_equity', VTV: 'us_equity', SCHG: 'us_equity', SCHV: 'us_equity',
	QQQ: 'us_equity', MGK: 'us_equity',
	// International Equity
	VXUS: 'intl_equity', VTIAX: 'intl_equity', VEA: 'intl_equity',
	VWO: 'intl_equity', IXUS: 'intl_equity', SCHF: 'intl_equity',
	EFA: 'intl_equity', EEM: 'intl_equity', IEMG: 'intl_equity',
	// US Bonds
	BND: 'us_bond', VBTLX: 'us_bond', AGG: 'us_bond',
	SCHZ: 'us_bond', BSV: 'us_bond', BIV: 'us_bond', BLV: 'us_bond',
	VTIP: 'us_bond', TIP: 'us_bond', SHY: 'us_bond',
	VCSH: 'us_bond', VCIT: 'us_bond', VCLT: 'us_bond',
	// International Bonds
	BNDX: 'intl_bond', IAGG: 'intl_bond',
	// REIT
	VNQ: 'reit', VGSLX: 'reit', SCHH: 'reit', VNQI: 'reit',
	// Commodity
	GLD: 'commodity', IAU: 'commodity', GSG: 'commodity', PDBC: 'commodity',
	// Cash / Money Market
	VMFXX: 'cash', SPAXX: 'cash', SWVXX: 'cash',
};

export interface ClassifiedHolding {
	holding: ParsedHolding;
	assetClass: AssetClass;
}

export interface AllocationEntry {
	assetClass: AssetClass;
	label: string;
	value: number;
	percent: number;
}

export interface PortfolioSummary {
	totalValue: number;
	cashBalance: number;
	holdingsCount: number;
	allocation: AllocationEntry[];
	estimatedReturn: number;
	stockPercent: number;
	bondPercent: number;
}

export function classifyHolding(holding: ParsedHolding): AssetClass {
	if (holding.symbol && ASSET_CLASS_MAP[holding.symbol]) {
		return ASSET_CLASS_MAP[holding.symbol];
	}
	// Default: unknown stocks → us_equity, unknown MFs → other
	return holding.security_type === 'Stock' ? 'us_equity' : 'other';
}

export function summarizePortfolio(
	holdings: ParsedHolding[],
	cashBalance: number
): PortfolioSummary {
	const buckets = new Map<AssetClass, number>();

	for (const h of holdings) {
		const cls = classifyHolding(h);
		buckets.set(cls, (buckets.get(cls) ?? 0) + h.market_value);
	}
	if (cashBalance > 0) {
		buckets.set('cash', (buckets.get('cash') ?? 0) + cashBalance);
	}

	const totalValue = holdings.reduce((s, h) => s + h.market_value, 0) + cashBalance;

	const allocation: AllocationEntry[] = [];
	for (const [cls, value] of buckets) {
		allocation.push({
			assetClass: cls,
			label: ASSET_CLASS_LABELS[cls],
			value,
			percent: totalValue > 0 ? value / totalValue : 0,
		});
	}
	allocation.sort((a, b) => b.value - a.value);

	let estimatedReturn = 0;
	for (const entry of allocation) {
		estimatedReturn += entry.percent * EXPECTED_RETURNS[entry.assetClass];
	}

	const equityClasses: AssetClass[] = ['us_equity', 'intl_equity'];
	const bondClasses: AssetClass[] = ['us_bond', 'intl_bond'];
	const stockPercent = allocation
		.filter((a) => equityClasses.includes(a.assetClass))
		.reduce((s, a) => s + a.percent, 0);
	const bondPercent = allocation
		.filter((a) => bondClasses.includes(a.assetClass))
		.reduce((s, a) => s + a.percent, 0);

	return {
		totalValue,
		cashBalance,
		holdingsCount: holdings.length,
		allocation,
		estimatedReturn,
		stockPercent,
		bondPercent,
	};
}
