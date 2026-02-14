import type {
	Portfolio,
	SimulationResponse,
	MonteCarloResponse,
} from './types';

const BASE = '/api/v1';

async function post<T>(path: string, body: unknown): Promise<T> {
	const res = await fetch(`${BASE}${path}`, {
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

export async function runSimulation(portfolio: Portfolio): Promise<SimulationResponse> {
	return post<SimulationResponse>('/simulate', { portfolio });
}

export async function runMonteCarlo(
	portfolio: Portfolio,
	numSimulations = 1000,
): Promise<MonteCarloResponse> {
	return post<MonteCarloResponse>('/monte-carlo', {
		portfolio,
		num_simulations: numSimulations,
	});
}
