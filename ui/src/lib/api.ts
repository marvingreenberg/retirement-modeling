import type {
	Portfolio,
	SimulationResponse,
	MonteCarloResponse,
	CompareResponse,
	StrategiesResponse,
	ConversionStrategy,
	SpendingStrategy,
} from './types';

const BASE = '/api';

async function post<T>(path: string, body: unknown, params?: URLSearchParams): Promise<T> {
	const url = params ? `${BASE}${path}?${params}` : `${BASE}${path}`;
	const res = await fetch(url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body),
	});
	if (!res.ok) {
		const detail = await res.json().catch(() => ({ detail: res.statusText }));
		throw new Error(detail.detail || `API error: ${res.status}`);
	}
	return res.json();
}

async function get<T>(path: string): Promise<T> {
	const res = await fetch(`${BASE}${path}`);
	if (!res.ok) {
		throw new Error(`API error: ${res.status}`);
	}
	return res.json();
}

export async function fetchStrategies(): Promise<StrategiesResponse> {
	return get<StrategiesResponse>('/strategies');
}

export async function runSimulation(
	portfolio: Portfolio,
	strategy?: ConversionStrategy,
	spendingStrategy?: SpendingStrategy,
	withdrawalRate?: number,
): Promise<SimulationResponse> {
	return post<SimulationResponse>('/simulate', {
		portfolio,
		strategy,
		spending_strategy: spendingStrategy,
		withdrawal_rate: withdrawalRate,
	});
}

export async function runMonteCarlo(
	portfolio: Portfolio,
	numSimulations = 1000,
	seed?: number,
	spendingStrategy?: SpendingStrategy,
	withdrawalRate?: number,
): Promise<MonteCarloResponse> {
	return post<MonteCarloResponse>('/monte-carlo', {
		portfolio,
		num_simulations: numSimulations,
		seed,
		spending_strategy: spendingStrategy,
		withdrawal_rate: withdrawalRate,
	});
}

export async function runCompare(
	portfolio: Portfolio,
	conversionStrategies: ConversionStrategy[],
	spendingStrategies: SpendingStrategy[],
): Promise<CompareResponse> {
	const params = new URLSearchParams();
	conversionStrategies.forEach((s) => params.append('conversion_strategies', s));
	spendingStrategies.forEach((s) => params.append('spending_strategies', s));
	return post<CompareResponse>('/compare', portfolio, params);
}
