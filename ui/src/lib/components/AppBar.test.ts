import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import { profile, defaultProfile, portfolio, defaultPortfolio } from '$lib/stores';

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
	beforeEach(() => {
		profile.set(structuredClone(defaultProfile));
		portfolio.set(structuredClone(defaultPortfolio));
	});

	it('renders the app title', () => {
		render(AppBar);
		expect(screen.getByText('Retirement Simulator')).toBeInTheDocument();
	});

	it('renders navigation links', () => {
		render(AppBar);
		expect(screen.getByRole('link', { name: /overview/i })).toBeInTheDocument();
		expect(screen.getByRole('link', { name: /compare/i })).toBeInTheDocument();
		expect(screen.getByRole('link', { name: /details/i })).toBeInTheDocument();
	});

	it('does not show a Spending navigation link', () => {
		render(AppBar);
		expect(screen.queryByRole('link', { name: /spending/i })).not.toBeInTheDocument();
	});

	it('navigation links have correct hrefs', () => {
		render(AppBar);
		expect(screen.getByRole('link', { name: /overview/i })).toHaveAttribute('href', '/');
		expect(screen.getByRole('link', { name: /compare/i })).toHaveAttribute('href', '/compare');
		expect(screen.getByRole('link', { name: /details/i })).toHaveAttribute('href', '/details');
	});

	it('marks overview link as active on root path', () => {
		render(AppBar);
		const overviewLink = screen.getByRole('link', { name: /overview/i });
		expect(overviewLink).toHaveAttribute('aria-current', 'page');
	});

	it('does not render dark mode toggle in bar', () => {
		render(AppBar);
		expect(screen.queryByLabelText('Toggle dark mode')).not.toBeInTheDocument();
	});

	it('renders avatar/profile button', () => {
		render(AppBar);
		expect(screen.getByLabelText('Open profile')).toBeInTheDocument();
	});

	it('renders help button', () => {
		render(AppBar);
		expect(screen.getByLabelText('Open help')).toBeInTheDocument();
	});

	it('help button opens help drawer', async () => {
		render(AppBar);
		expect(screen.queryByRole('complementary', { name: 'Help' })).not.toBeInTheDocument();
		await fireEvent.click(screen.getByLabelText('Open help'));
		expect(screen.getByRole('complementary', { name: 'Help' })).toBeInTheDocument();
	});

	it('avatar click opens dropdown with section links', async () => {
		profile.set({ primaryName: 'Mike', spouseName: '' });
		render(AppBar);
		await fireEvent.click(screen.getByLabelText('Open profile'));
		expect(screen.getByRole('link', { name: /basic info/i })).toBeInTheDocument();
		expect(screen.getByRole('link', { name: /load \/ save/i })).toBeInTheDocument();
		expect(screen.getByRole('link', { name: /advanced settings/i })).toBeInTheDocument();
	});

	it('dropdown shows dark mode and auto-save toggles', async () => {
		profile.set({ primaryName: 'Mike', spouseName: '' });
		render(AppBar);
		await fireEvent.click(screen.getByLabelText('Open profile'));
		expect(screen.getByLabelText('Toggle dark mode')).toBeInTheDocument();
		expect(screen.getByLabelText('Toggle auto-save')).toBeInTheDocument();
	});
});
