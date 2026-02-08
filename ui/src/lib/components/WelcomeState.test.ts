import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import WelcomeState from './WelcomeState.svelte';

describe('WelcomeState', () => {
	it('renders heading', () => {
		render(WelcomeState);
		expect(screen.getByText('Ready to simulate')).toBeInTheDocument();
	});

	it('renders guidance text', () => {
		render(WelcomeState);
		expect(screen.getByText(/configure your portfolio/i)).toBeInTheDocument();
	});

	it('mentions sample data', () => {
		render(WelcomeState);
		expect(screen.getByText(/load sample data/i)).toBeInTheDocument();
	});
});
