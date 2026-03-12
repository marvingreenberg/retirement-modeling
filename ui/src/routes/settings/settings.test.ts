import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import {
   portfolio,
   sampleScenarios,
   defaultPortfolio,
   profile,
   defaultProfile,
   numSimulations,
} from '$lib/stores';

vi.mock('$app/navigation', () => ({
   goto: vi.fn(),
}));

const mockPage = { url: new URL('http://localhost/settings') };
vi.mock('$app/state', () => ({
   page: mockPage,
}));

const { default: SettingsPage } = await import('./+page.svelte');
const { goto } = await import('$app/navigation');

describe('Settings Page', () => {
   beforeEach(() => {
      portfolio.value = structuredClone(defaultPortfolio);
      profile.value = structuredClone(defaultProfile);
      numSimulations.value = 1000;
      vi.mocked(goto).mockClear();
      localStorage.clear();
      mockPage.url = new URL('http://localhost/settings');
   });

   describe('Layout', () => {
      it('renders left nav with section links', () => {
         render(SettingsPage);
         // "Basic Info" appears as both nav link and content heading
         expect(
            screen.getAllByText('Basic Info').length,
         ).toBeGreaterThanOrEqual(1);
         expect(screen.getByText('Load / Save')).toBeInTheDocument();
         expect(screen.getByText('Advanced Settings')).toBeInTheDocument();
      });

      it('renders Overview link in footer', () => {
         render(SettingsPage);
         const link = screen.getByRole('link', { name: /overview/i });
         expect(link).toBeInTheDocument();
         expect(link).toHaveAttribute('href', '/');
      });

      it('shows avatar header with User icon when no name', () => {
         render(SettingsPage);
         expect(screen.getByText('Settings')).toBeInTheDocument();
      });

      it('shows avatar header with name when set', () => {
         profile.value = { primaryName: 'Mike', spouseName: 'Karen' };
         render(SettingsPage);
         expect(screen.getByText('Mike & Karen')).toBeInTheDocument();
      });
   });

   describe('Basic Info panel', () => {
      it('shows Basic Info fields by default', () => {
         render(SettingsPage);
         expect(screen.getByText('Your Name')).toBeInTheDocument();
         expect(screen.getByText('Your Age')).toBeInTheDocument();
         expect(screen.getByText('Simulation Years')).toBeInTheDocument();
      });

      it('shows context banner when needs setup', () => {
         render(SettingsPage);
         expect(
            screen.getByText(/enter your info to get started/i),
         ).toBeInTheDocument();
      });

      it('shows Get Started button when needs setup', () => {
         render(SettingsPage);
         expect(
            screen.getByRole('button', { name: /get started/i }),
         ).toBeInTheDocument();
      });

      it('hides Get Started when already set up', () => {
         portfolio.value = {
            ...portfolio.value,
            config: { ...portfolio.value.config, current_age_primary: 58 },
         };
         render(SettingsPage);
         expect(
            screen.queryByRole('button', { name: /get started/i }),
         ).not.toBeInTheDocument();
      });

      it('does not show Load Sample Data on Basic Info', () => {
         render(SettingsPage);
         expect(
            screen.queryByRole('combobox', { name: /load sample data/i }),
         ).not.toBeInTheDocument();
      });

      it('shows spouse toggle', () => {
         render(SettingsPage);
         expect(screen.getByLabelText(/spouse\/partner/i)).toBeInTheDocument();
      });

      it('shows spouse fields when spouse exists', () => {
         portfolio.value = {
            ...portfolio.value,
            config: { ...portfolio.value.config, current_age_spouse: 55 },
         };
         render(SettingsPage);
         expect(screen.getByText('Spouse Name')).toBeInTheDocument();
         expect(screen.getByText('Spouse Age')).toBeInTheDocument();
      });

      it('Get Started validates name', async () => {
         // Default state: age=0 (needs setup), name empty
         render(SettingsPage);
         await fireEvent.click(
            screen.getByRole('button', { name: /get started/i }),
         );
         expect(screen.getByText(/enter your name/i)).toBeInTheDocument();
      });

      it('Get Started validates age', async () => {
         profile.value = { primaryName: 'Mike', spouseName: '' };
         render(SettingsPage);
         await fireEvent.click(
            screen.getByRole('button', { name: /get started/i }),
         );
         expect(
            screen.getByText(/valid age between 20 and 120/i),
         ).toBeInTheDocument();
      });

      it('Get Started navigates home on valid input', async () => {
         // Render with age=0 so initialNeedsSetup=true and Get Started shows
         render(SettingsPage);
         // Set valid values via stores (simulating user input)
         profile.value = { primaryName: 'Alice', spouseName: '' };
         portfolio.value = {
            ...portfolio.value,
            config: { ...portfolio.value.config, current_age_primary: 60 },
         };
         await fireEvent.click(
            screen.getByRole('button', { name: /get started/i }),
         );
         expect(goto).toHaveBeenCalledWith('/');
      });

      it('Load Sample Data dropdown is in Load/Save section', async () => {
         render(SettingsPage);
         await fireEvent.click(screen.getByText('Load / Save'));
         expect(
            screen.getByRole('combobox', { name: /load sample data/i }),
         ).toBeInTheDocument();
      });

      it('Load Sample Data dropdown loads scenario and navigates home', async () => {
         render(SettingsPage);
         await fireEvent.click(screen.getByText('Load / Save'));
         const select = screen.getByRole('combobox', {
            name: /load sample data/i,
         });
         await fireEvent.change(select, {
            target: { value: 'Moderate Couple' },
         });
         expect(portfolio.value.config.current_age_primary).toBe(65);
         expect(profile.value.primaryName).toBe('Pat');
         expect(goto).toHaveBeenCalledWith('/');
      });
   });

   describe('Section navigation', () => {
      it('clicking Advanced Settings shows advanced fields', async () => {
         render(SettingsPage);
         await fireEvent.click(screen.getByText('Advanced Settings'));
         expect(screen.getByText('State/Local Tax %')).toBeInTheDocument();
         expect(screen.getByText(/RMD Age/)).toBeInTheDocument();
         expect(screen.getByText(/MC Iterations/)).toBeInTheDocument();
      });

      it('clicking Load / Save shows load/save panel', async () => {
         render(SettingsPage);
         await fireEvent.click(screen.getByText('Load / Save'));
         expect(screen.getByText('Load Portfolio')).toBeInTheDocument();
         expect(screen.getByText('Save Portfolio')).toBeInTheDocument();
      });
   });

   describe('Advanced Settings panel', () => {
      it('shows advanced fields with correct defaults', async () => {
         render(SettingsPage);
         await fireEvent.click(screen.getByText('Advanced Settings'));
         expect(screen.getByText(/RMD Age/)).toBeInTheDocument();
      });
   });

   describe('Query param section selection', () => {
      it('defaults to Basic Info with no query param', () => {
         mockPage.url = new URL('http://localhost/settings');
         render(SettingsPage);
         expect(screen.getByText('Your Name')).toBeInTheDocument();
      });

      it('selects Advanced Settings from query param', () => {
         mockPage.url = new URL('http://localhost/settings?section=advanced');
         render(SettingsPage);
         expect(screen.getByText('State/Local Tax %')).toBeInTheDocument();
      });

      it('selects Load/Save from query param', () => {
         mockPage.url = new URL('http://localhost/settings?section=loadsave');
         render(SettingsPage);
         expect(screen.getByText('Load Portfolio')).toBeInTheDocument();
      });

      it('defaults to Basic Info for invalid section param', () => {
         mockPage.url = new URL('http://localhost/settings?section=bogus');
         render(SettingsPage);
         expect(screen.getByText('Your Name')).toBeInTheDocument();
      });
   });
});
