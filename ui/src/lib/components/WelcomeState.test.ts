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
		expect(screen.getByText(/add your accounts and income/i)).toBeInTheDocument();
	});
});
