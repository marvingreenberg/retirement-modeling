import { portfolio, profile, numSimulations } from '$lib/stores';
import { get } from 'svelte/store';

let autoSave = $state(false);

export function isAutoSave(): boolean {
	return autoSave;
}

export function initAutoSave() {
	autoSave = localStorage.getItem('retirement-sim-autosave') === 'true';
}

export function toggleAutoSave() {
	autoSave = !autoSave;
	localStorage.setItem('retirement-sim-autosave', String(autoSave));
	if (autoSave) saveToLocalStorage();
}

export function saveToLocalStorage() {
	const data = { portfolio: get(portfolio), profile: get(profile), numSimulations: get(numSimulations) };
	localStorage.setItem('retirement-sim-state', JSON.stringify(data));
}
