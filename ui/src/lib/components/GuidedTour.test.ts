import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { get } from 'svelte/store';
import { tourActive } from '$lib/stores';

const { default: GuidedTour } = await import('./GuidedTour.svelte');

describe('GuidedTour', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		tourActive.set(false);
		document.body.innerHTML = '';
		const nav = document.createElement('nav');
		['overview', 'spending', 'compare', 'details', 'profile'].forEach((id) => {
			const el = document.createElement('a');
			el.setAttribute('data-tour', id);
			el.textContent = id;
			el.style.position = 'absolute';
			el.style.top = '10px';
			el.style.left = '10px';
			el.style.width = '80px';
			el.style.height = '30px';
			nav.appendChild(el);
		});
		document.body.appendChild(nav);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('does not show tooltip when tour is inactive', () => {
		render(GuidedTour);
		expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
	});

	it('shows first tooltip when tour becomes active', async () => {
		render(GuidedTour);
		tourActive.set(true);
		await vi.advanceTimersByTimeAsync(50);
		expect(screen.getByRole('tooltip')).toBeInTheDocument();
		expect(screen.getByText(/Overview/)).toBeInTheDocument();
	});

	it('auto-advances after 3 seconds', async () => {
		render(GuidedTour);
		tourActive.set(true);
		await vi.advanceTimersByTimeAsync(50);
		expect(screen.getByText(/Overview/)).toBeInTheDocument();
		await vi.advanceTimersByTimeAsync(3000);
		expect(screen.getByText(/Spending/)).toBeInTheDocument();
	});

	it('advances on click', async () => {
		render(GuidedTour);
		tourActive.set(true);
		await vi.advanceTimersByTimeAsync(50);
		expect(screen.getByText(/Overview/)).toBeInTheDocument();
		const overlay = document.querySelector('.fixed.inset-0.z-\\[99\\]') as HTMLElement;
		overlay?.click();
		await vi.advanceTimersByTimeAsync(50);
		expect(screen.getByText(/Spending/)).toBeInTheDocument();
	});

	it('ends tour after last step', async () => {
		render(GuidedTour);
		tourActive.set(true);
		await vi.advanceTimersByTimeAsync(50);
		// Advance through all 5 steps (3s each)
		for (let i = 0; i < 5; i++) {
			await vi.advanceTimersByTimeAsync(3000);
		}
		expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
		expect(get(tourActive)).toBe(false);
	});

	it('does not restart if already run', async () => {
		render(GuidedTour);
		tourActive.set(true);
		await vi.advanceTimersByTimeAsync(50);
		for (let i = 0; i < 5; i++) {
			await vi.advanceTimersByTimeAsync(3000);
		}
		expect(get(tourActive)).toBe(false);
		tourActive.set(true);
		await vi.advanceTimersByTimeAsync(50);
		expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
	});
});
