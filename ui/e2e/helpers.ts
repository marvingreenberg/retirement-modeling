import { test, type Page } from '@playwright/test';

const API_URL = 'http://localhost:8000/api/v1/strategies';
let apiAvailable: boolean | null = null;

async function checkApi(): Promise<boolean> {
	if (apiAvailable !== null) return apiAvailable;
	try {
		const res = await fetch(API_URL, { signal: AbortSignal.timeout(2000) });
		apiAvailable = res.ok;
	} catch {
		apiAvailable = false;
	}
	return apiAvailable;
}

export async function requiresApi() {
	const available = await checkApi();
	test.skip(!available, 'Backend API not running (start with: make run-api)');
}

export async function loadSampleData(page: Page) {
	await page.goto('/');
	await page.getByRole('button', { name: 'Load Sample Data' }).click();
}
