import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { samplePortfolio } from '$lib/stores';

const { default: CurrentSalaryEditor } =
   await import('./CurrentSalaryEditor.svelte');

describe('CurrentSalaryEditor', () => {
   const defaultSalaryAuto = {
      primary_salary: 80000,
      primary_growth: 0.03,
      primary_end_age: null,
      spouse_salary: null,
      spouse_growth: null,
      spouse_end_age: null,
      primary_pretax_401k: 0,
      primary_roth_401k: 0,
      spouse_pretax_401k: 0,
      spouse_roth_401k: 0,
   };

   function renderEditor(configOverrides: Record<string, any> = {}) {
      const config = {
         ...structuredClone(samplePortfolio.config),
         ...configOverrides,
      };
      return render(CurrentSalaryEditor, { config });
   }

   it('is hidden when retirement_age is null', () => {
      renderEditor({ retirement_age: null });
      expect(screen.queryByText('Current Salary')).not.toBeInTheDocument();
   });

   it('is hidden when retirement_age <= current_age + 1', () => {
      renderEditor({ retirement_age: 66, current_age_primary: 65 });
      expect(screen.queryByText('Current Salary')).not.toBeInTheDocument();
   });

   it('shows when retirement_age > current_age + 1', () => {
      renderEditor({
         retirement_age: 70,
         current_age_primary: 60,
         salary_auto: defaultSalaryAuto,
      });
      expect(screen.getByText('Current Salary')).toBeInTheDocument();
   });

   it('shows primary salary fields', () => {
      renderEditor({
         retirement_age: 70,
         current_age_primary: 60,
         current_age_spouse: 0,
         salary_auto: defaultSalaryAuto,
      });
      expect(screen.getByText('Salary ($/yr)')).toBeInTheDocument();
      expect(screen.getByText('Growth %')).toBeInTheDocument();
      expect(screen.getByText('End Year')).toBeInTheDocument();
      expect(screen.getByText('Pre-tax 401k')).toBeInTheDocument();
      expect(screen.getByText('Roth 401k')).toBeInTheDocument();
   });

   it('shows spouse fields when spouse exists', () => {
      renderEditor({
         retirement_age: 70,
         current_age_primary: 60,
         current_age_spouse: 58,
         salary_auto: {
            ...defaultSalaryAuto,
            spouse_salary: 60000,
            spouse_growth: 0.03,
         },
      });
      expect(screen.getByText('Spouse Salary ($/yr)')).toBeInTheDocument();
   });

   it('hides spouse fields when no spouse', () => {
      renderEditor({
         retirement_age: 70,
         current_age_primary: 60,
         current_age_spouse: 0,
         salary_auto: defaultSalaryAuto,
      });
      expect(
         screen.queryByText('Spouse Salary ($/yr)'),
      ).not.toBeInTheDocument();
   });

   it('renders with default-initialized salary_auto', () => {
      // When the component auto-initializes salary_auto, it creates
      // an object with zero/null defaults. Verify rendering with that state.
      renderEditor({
         retirement_age: 70,
         current_age_primary: 60,
         salary_auto: {
            primary_salary: 0,
            primary_growth: 0.03,
            primary_end_age: null,
            spouse_salary: null,
            spouse_growth: null,
            spouse_end_age: null,
            primary_pretax_401k: 0,
            primary_roth_401k: 0,
            spouse_pretax_401k: 0,
            spouse_roth_401k: 0,
         },
      });
      expect(screen.getByText('Current Salary')).toBeInTheDocument();
      const salaryInput = screen.getByLabelText(
         'Salary ($/yr)',
      ) as HTMLInputElement;
      expect(Number(salaryInput.value)).toBe(0);
   });
});
