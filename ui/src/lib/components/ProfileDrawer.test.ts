import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import { portfolio, samplePortfolio, profile, sampleProfile } from '$lib/stores';

const { default: ProfileDrawer } = await import('./ProfileDrawer.svelte');

describe('ProfileDrawer', () => {
	beforeEach(() => {
		portfolio.set(structuredClone(samplePortfolio));
		profile.set(structuredClone(sampleProfile));
	});

	function renderDrawer() {
		return render(ProfileDrawer, { open: true });
	}

	it('shows profile heading', () => {
		renderDrawer();
		expect(screen.getByText('Profile')).toBeInTheDocument();
	});

	it('shows name and age inputs', () => {
		renderDrawer();
		expect(screen.getByText('Your Name')).toBeInTheDocument();
		expect(screen.getByText('Your Age')).toBeInTheDocument();
	});

	it('shows Tax & Advanced section heading', () => {
		renderDrawer();
		expect(screen.getByText('Tax & Advanced')).toBeInTheDocument();
	});

	it('shows State Tax input', () => {
		renderDrawer();
		expect(screen.getByText('State Tax %')).toBeInTheDocument();
	});

	it('shows Cap Gains input', () => {
		renderDrawer();
		expect(screen.getByText('Cap Gains %')).toBeInTheDocument();
	});

	it('shows RMD Age input', () => {
		renderDrawer();
		expect(screen.getByText(/RMD Age/)).toBeInTheDocument();
	});

	it('shows IRMAA Limit input', () => {
		renderDrawer();
		expect(screen.getByText(/IRMAA Limit/)).toBeInTheDocument();
	});

	it('shows dark mode toggle', () => {
		renderDrawer();
		expect(screen.getByText('Dark Mode')).toBeInTheDocument();
	});

	it('shows spouse fields when spouse exists', () => {
		renderDrawer();
		expect(screen.getByText('Spouse Name')).toBeInTheDocument();
		expect(screen.getByText('Spouse Age')).toBeInTheDocument();
	});

	it('hides spouse fields when no spouse', () => {
		portfolio.update((p) => {
			p.config.current_age_spouse = 0;
			return p;
		});
		renderDrawer();
		expect(screen.queryByText('Spouse Name')).not.toBeInTheDocument();
		expect(screen.getByText(/Add Spouse/)).toBeInTheDocument();
	});
});
