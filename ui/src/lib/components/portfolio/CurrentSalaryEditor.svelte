<script lang="ts">
   import { untrack } from 'svelte';
   import type { SimulationConfig, IncomeStream } from '$lib/types';
   import {
      ageToYear as _ageToYear,
      yearToAge as _yearToAge,
      ageHint,
      SALARY_PRIMARY,
      SALARY_SPOUSE,
   } from './incomeUtils';

   let { config = $bindable() }: { config: SimulationConfig } = $props();

   let hasSpouse = $derived(config.current_age_spouse > 0);
   let retirementAge = $derived(config.retirement_age);
   let showSalary = $derived(
      retirementAge != null && retirementAge > config.current_age_primary + 1,
   );

   function ageToYear(age: number, ownerAge: number): number {
      return _ageToYear(age, ownerAge, config.start_year);
   }

   function yearToAge(year: number, ownerAge: number): number {
      return _yearToAge(year, ownerAge, config.start_year);
   }

   function defaultEndAge(): number {
      return config.retirement_age ?? config.current_age_primary + 5;
   }

   function ensureSalaryAuto() {
      if (!config.salary_auto) {
         config.salary_auto = {
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
         };
      }
   }

   function upsertStream(
      name: string,
      salary: number,
      growth: number,
      endAge: number,
      owner: 'primary' | 'spouse',
      pretax401k: number,
      roth401k: number,
   ) {
      const idx = config.income_streams.findIndex((s) => s.name === name);
      const stream: IncomeStream = {
         name,
         kind: 'employment',
         amount: salary,
         start_age:
            owner === 'spouse'
               ? config.current_age_spouse
               : config.current_age_primary,
         end_age: endAge,
         taxable_pct: 1.0,
         cola_rate: growth,
         owner,
         pretax_401k: pretax401k,
         roth_401k: roth401k,
      };
      if (idx >= 0) {
         config.income_streams[idx] = stream;
      } else if (salary > 0) {
         config.income_streams = [...config.income_streams, stream];
      }
   }

   function removeStream(name: string) {
      config.income_streams = config.income_streams.filter(
         (s) => s.name !== name,
      );
   }

   $effect(() => {
      if (!config.salary_auto || !showSalary) return;
      // Read all salary_auto fields to establish reactive dependencies
      const sa = config.salary_auto;
      const pSalary = sa.primary_salary;
      const pGrowth = sa.primary_growth;
      const pEnd = sa.primary_end_age;
      const p401k = sa.primary_pretax_401k;
      const pRoth = sa.primary_roth_401k;
      const sSalary = sa.spouse_salary;
      const sGrowth = sa.spouse_growth;
      const sEnd = sa.spouse_end_age;
      const s401k = sa.spouse_pretax_401k;
      const sRoth = sa.spouse_roth_401k;
      const endAge = pEnd ?? defaultEndAge();
      const _spouse = hasSpouse;

      // Writes to income_streams must be untracked to avoid infinite loop
      untrack(() => {
         if (pSalary > 0) {
            upsertStream(
               SALARY_PRIMARY,
               pSalary,
               pGrowth,
               endAge,
               'primary',
               p401k,
               pRoth,
            );
         } else {
            removeStream(SALARY_PRIMARY);
         }
         if (_spouse && sSalary && sSalary > 0) {
            const spouseEnd = sEnd ?? defaultEndAge();
            upsertStream(
               SALARY_SPOUSE,
               sSalary,
               sGrowth ?? 0.03,
               spouseEnd,
               'spouse',
               s401k,
               sRoth,
            );
         } else {
            removeStream(SALARY_SPOUSE);
         }
      });
   });

   // Initialize salary_auto when section becomes visible; clean up when hidden
   $effect(() => {
      const show = showSalary;
      untrack(() => {
         if (show) {
            ensureSalaryAuto();
         } else {
            removeStream(SALARY_PRIMARY);
            removeStream(SALARY_SPOUSE);
         }
      });
   });
</script>

{#if showSalary && config.salary_auto}
   <div class="p-3 bg-surface-100 dark:bg-surface-800 rounded">
      <h4
         class="text-sm text-surface-500 dark:text-surface-400 font-medium mb-2"
      >
         Current Salary
      </h4>
      <div class="flex gap-4 flex-wrap">
         <label
            class="flex flex-col gap-1 text-sm font-medium text-surface-600 dark:text-surface-400"
         >
            Salary ($/yr)
            <input
               type="number"
               class="input w-36"
               bind:value={config.salary_auto.primary_salary}
               onfocus={(e) => e.currentTarget.select()}
               min="0"
               step="1000"
            />
         </label>
         <label
            class="flex flex-col gap-1 text-sm font-medium text-surface-600 dark:text-surface-400"
         >
            Growth %
            <input
               type="number"
               class="input w-20"
               value={Math.round(config.salary_auto.primary_growth * 1000) / 10}
               onfocus={(e) => e.currentTarget.select()}
               onchange={(e) => {
                  config.salary_auto!.primary_growth =
                     Number(e.currentTarget.value) / 100;
               }}
               min="0"
               max="20"
               step="0.5"
            />
         </label>
         <label
            class="flex flex-col gap-1 text-sm font-medium text-surface-600 dark:text-surface-400"
         >
            End Year
            <div class="flex items-center gap-2">
               <input
                  type="number"
                  class="input w-24"
                  value={ageToYear(
                     config.salary_auto.primary_end_age ?? defaultEndAge(),
                     config.current_age_primary,
                  )}
                  onfocus={(e) => e.currentTarget.select()}
                  onchange={(e) => {
                     config.salary_auto!.primary_end_age = yearToAge(
                        Number(e.currentTarget.value),
                        config.current_age_primary,
                     );
                  }}
               />
               <span class="text-xs text-surface-400"
                  >({ageHint(
                     config.salary_auto.primary_end_age ?? defaultEndAge(),
                  )})</span
               >
            </div>
         </label>
         <label
            class="flex flex-col gap-1 text-sm font-medium text-surface-600 dark:text-surface-400"
         >
            Pre-tax 401k
            <input
               type="number"
               class="input w-28"
               bind:value={config.salary_auto.primary_pretax_401k}
               onfocus={(e) => e.currentTarget.select()}
               min="0"
               step="500"
            />
         </label>
         <label
            class="flex flex-col gap-1 text-sm font-medium text-surface-600 dark:text-surface-400"
         >
            Roth 401k
            <input
               type="number"
               class="input w-28"
               bind:value={config.salary_auto.primary_roth_401k}
               onfocus={(e) => e.currentTarget.select()}
               min="0"
               step="500"
            />
         </label>
      </div>
      {#if hasSpouse}
         <div class="flex gap-4 flex-wrap mt-2">
            <label
               class="flex flex-col gap-1 text-sm font-medium text-surface-600 dark:text-surface-400"
            >
               Spouse Salary ($/yr)
               <input
                  type="number"
                  class="input w-36"
                  value={config.salary_auto.spouse_salary ?? 0}
                  onfocus={(e) => e.currentTarget.select()}
                  onchange={(e) => {
                     config.salary_auto!.spouse_salary = Number(
                        e.currentTarget.value,
                     );
                  }}
                  min="0"
                  step="1000"
               />
            </label>
            <label
               class="flex flex-col gap-1 text-sm font-medium text-surface-600 dark:text-surface-400"
            >
               Growth %
               <input
                  type="number"
                  class="input w-20"
                  value={Math.round(
                     (config.salary_auto.spouse_growth ?? 0.03) * 1000,
                  ) / 10}
                  onfocus={(e) => e.currentTarget.select()}
                  onchange={(e) => {
                     config.salary_auto!.spouse_growth =
                        Number(e.currentTarget.value) / 100;
                  }}
                  min="0"
                  max="20"
                  step="0.5"
               />
            </label>
            <label
               class="flex flex-col gap-1 text-sm font-medium text-surface-600 dark:text-surface-400"
            >
               End Year
               <div class="flex items-center gap-2">
                  <input
                     type="number"
                     class="input w-24"
                     value={ageToYear(
                        config.salary_auto.spouse_end_age ?? defaultEndAge(),
                        config.current_age_spouse,
                     )}
                     onfocus={(e) => e.currentTarget.select()}
                     onchange={(e) => {
                        config.salary_auto!.spouse_end_age = yearToAge(
                           Number(e.currentTarget.value),
                           config.current_age_spouse,
                        );
                     }}
                  />
                  <span class="text-xs text-surface-400"
                     >({ageHint(
                        config.salary_auto.spouse_end_age ?? defaultEndAge(),
                     )})</span
                  >
               </div>
            </label>
            <label
               class="flex flex-col gap-1 text-sm font-medium text-surface-600 dark:text-surface-400"
            >
               Pre-tax 401k
               <input
                  type="number"
                  class="input w-28"
                  value={config.salary_auto.spouse_pretax_401k ?? 0}
                  onfocus={(e) => e.currentTarget.select()}
                  onchange={(e) => {
                     config.salary_auto!.spouse_pretax_401k = Number(
                        e.currentTarget.value,
                     );
                  }}
                  min="0"
                  step="500"
               />
            </label>
            <label
               class="flex flex-col gap-1 text-sm font-medium text-surface-600 dark:text-surface-400"
            >
               Roth 401k
               <input
                  type="number"
                  class="input w-28"
                  value={config.salary_auto.spouse_roth_401k ?? 0}
                  onfocus={(e) => e.currentTarget.select()}
                  onchange={(e) => {
                     config.salary_auto!.spouse_roth_401k = Number(
                        e.currentTarget.value,
                     );
                  }}
                  min="0"
                  step="500"
               />
            </label>
         </div>
      {/if}
   </div>
{/if}
