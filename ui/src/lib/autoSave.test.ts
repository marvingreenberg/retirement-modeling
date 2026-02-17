import { describe, it, expect, beforeEach } from 'vitest';
import { isAutoSave, initAutoSave, toggleAutoSave, saveToLocalStorage } from '$lib/autoSave.svelte';
import { portfolio, profile, numSimulations, defaultPortfolio, defaultProfile } from '$lib/stores';

describe('autoSave', () => {
	beforeEach(() => {
		localStorage.clear();
		portfolio.set(structuredClone(defaultPortfolio));
		profile.set(structuredClone(defaultProfile));
		numSimulations.set(1000);
	});

	it('isAutoSave returns false by default', () => {
		initAutoSave();
		expect(isAutoSave()).toBe(false);
	});

	it('initAutoSave reads localStorage', () => {
		localStorage.setItem('retirement-sim-autosave', 'true');
		initAutoSave();
		expect(isAutoSave()).toBe(true);
	});

	it('toggleAutoSave switches from off to on', () => {
		initAutoSave();
		toggleAutoSave();
		expect(isAutoSave()).toBe(true);
		expect(localStorage.getItem('retirement-sim-autosave')).toBe('true');
	});

	it('toggleAutoSave switches from on to off', () => {
		localStorage.setItem('retirement-sim-autosave', 'true');
		initAutoSave();
		toggleAutoSave();
		expect(isAutoSave()).toBe(false);
		expect(localStorage.getItem('retirement-sim-autosave')).toBe('false');
	});

	it('toggleAutoSave saves state when turning on', () => {
		initAutoSave();
		toggleAutoSave();
		const saved = localStorage.getItem('retirement-sim-state');
		expect(saved).toBeTruthy();
		const data = JSON.parse(saved!);
		expect(data.portfolio).toBeDefined();
		expect(data.profile).toBeDefined();
	});

	it('saveToLocalStorage writes current state', () => {
		saveToLocalStorage();
		const saved = localStorage.getItem('retirement-sim-state');
		expect(saved).toBeTruthy();
		const data = JSON.parse(saved!);
		expect(data.numSimulations).toBe(1000);
	});
});
