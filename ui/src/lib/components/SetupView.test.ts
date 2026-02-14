import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import { get } from 'svelte/store';
import { portfolio, defaultPortfolio, profile, defaultProfile } from '$lib/stores';

const { default: SetupView } = await import('./SetupView.svelte');

describe('SetupView', () => {
	beforeEach(() => {
		portfolio.set(structuredClone(defaultPortfolio));
		profile.set(structuredClone(defaultProfile));
	});

	it('renders setup form with heading and name field', () => {
		render(SetupView);
		expect(screen.getByText('Retirement Simulator')).toBeInTheDocument();
		expect(screen.getByText('Your Name')).toBeInTheDocument();
		expect(screen.getByText('Your Age')).toBeInTheDocument();
	});

	it('renders Get Started and Load Sample Data buttons', () => {
		render(SetupView);
		expect(screen.getByRole('button', { name: /get started/i })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /load sample data/i })).toBeInTheDocument();
	});

	it('shows spouse fields when toggle is checked', async () => {
		render(SetupView);
		expect(screen.queryByText('Spouse Name')).not.toBeInTheDocument();
		expect(screen.queryByText('Spouse Age')).not.toBeInTheDocument();
		const checkbox = screen.getByRole('checkbox');
		await fireEvent.click(checkbox);
		expect(screen.getByText('Spouse Name')).toBeInTheDocument();
		expect(screen.getByText('Spouse Age')).toBeInTheDocument();
	});

	it('rejects empty name', async () => {
		render(SetupView);
		const ageInput = screen.getByPlaceholderText('e.g. 55');
		await fireEvent.input(ageInput, { target: { value: '58' } });
		await fireEvent.click(screen.getByRole('button', { name: /get started/i }));
		expect(screen.getByText(/enter your name/i)).toBeInTheDocument();
	});

	it('rejects invalid primary age', async () => {
		render(SetupView);
		const nameInput = screen.getByPlaceholderText('e.g. Mike');
		await fireEvent.input(nameInput, { target: { value: 'Mike' } });
		const ageInput = screen.getByPlaceholderText('e.g. 55');
		await fireEvent.input(ageInput, { target: { value: '5' } });
		await fireEvent.click(screen.getByRole('button', { name: /get started/i }));
		expect(screen.getByText(/valid age between 20 and 120/)).toBeInTheDocument();
	});

	it('initializes portfolio and profile on valid submission', async () => {
		render(SetupView);
		const nameInput = screen.getByPlaceholderText('e.g. Mike');
		await fireEvent.input(nameInput, { target: { value: 'Mike' } });
		const ageInput = screen.getByPlaceholderText('e.g. 55');
		await fireEvent.input(ageInput, { target: { value: '58' } });
		await fireEvent.click(screen.getByRole('button', { name: /get started/i }));
		const p = get(portfolio);
		expect(p.config.current_age_primary).toBe(58);
		expect(p.config.simulation_years).toBe(37);
		expect(p.accounts).toHaveLength(1);
		const prof = get(profile);
		expect(prof.primaryName).toBe('Mike');
	});

	it('loads sample data including profile when Load Sample Data is clicked', async () => {
		render(SetupView);
		await fireEvent.click(screen.getByRole('button', { name: /load sample data/i }));
		const p = get(portfolio);
		expect(p.config.current_age_primary).toBe(58);
		expect(p.accounts.length).toBeGreaterThan(1);
		const prof = get(profile);
		expect(prof.primaryName).toBe('Mike');
		expect(prof.spouseName).toBe('Karen');
	});
});
