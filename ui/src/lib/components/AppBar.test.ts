import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';

Object.defineProperty(window, 'matchMedia', {
	writable: true,
	value: vi.fn().mockImplementation((query: string) => ({
		matches: false, media: query, onchange: null,
		addListener: vi.fn(), removeListener: vi.fn(),
		addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
	})),
});

vi.mock('$app/state', () => ({
	page: { url: new URL('http://localhost/') },
}));

// Must import after mock setup
const { default: AppBar } = await import('./AppBar.svelte');

describe('AppBar', () => {
	it('renders the app title', () => {
		render(AppBar);
		expect(screen.getByText('Retirement Simulator')).toBeInTheDocument();
	});

	it('renders all navigation links', () => {
		render(AppBar);
		expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument();
		expect(screen.getByRole('link', { name: /spending/i })).toBeInTheDocument();
		expect(screen.getByRole('link', { name: /compare/i })).toBeInTheDocument();
		expect(screen.getByRole('link', { name: /details/i })).toBeInTheDocument();
	});

	it('navigation links have correct hrefs', () => {
		render(AppBar);
		expect(screen.getByRole('link', { name: /home/i })).toHaveAttribute('href', '/');
		expect(screen.getByRole('link', { name: /spending/i })).toHaveAttribute('href', '/spending');
		expect(screen.getByRole('link', { name: /compare/i })).toHaveAttribute('href', '/compare');
		expect(screen.getByRole('link', { name: /details/i })).toHaveAttribute('href', '/details');
	});

	it('marks home link as active on root path', () => {
		render(AppBar);
		const homeLink = screen.getByRole('link', { name: /home/i });
		expect(homeLink).toHaveAttribute('aria-current', 'page');
	});

	it('renders dark mode toggle', () => {
		render(AppBar);
		expect(screen.getByLabelText('Toggle dark mode')).toBeInTheDocument();
	});
});
