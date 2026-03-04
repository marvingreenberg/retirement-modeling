<script lang="ts">
   import type { SimulationConfig } from '$lib/types';

   let { config = $bindable() }: { config: SimulationConfig } = $props();

   let hasSpouse = $derived(config.current_age_spouse > 0);

   function ageToYear(age: number, ownerAge: number): number {
      return config.start_year + (age - ownerAge);
   }

   function yearToAge(year: number, ownerAge: number): number {
      return ownerAge + (year - config.start_year);
   }

   function ageHint(age: number | null): string {
      return age != null ? `age ${age}` : '';
   }

   function ensureSSAuto() {
      if (!config.ss_auto) {
         config.ss_auto = {
            primary_fra_amount: 0,
            primary_start_age: 67,
            spouse_fra_amount: null,
            spouse_start_age: null,
            fra_age: 67,
            cola_rate: 0.025,
         };
      }
   }

   $effect(() => {
      if (config.ss_auto) {
         config.social_security.primary_benefit =
            config.ss_auto.primary_fra_amount;
         config.social_security.primary_start_age =
            config.ss_auto.primary_start_age;
         config.social_security.spouse_benefit =
            config.ss_auto.spouse_fra_amount ?? 0;
         config.social_security.spouse_start_age =
            config.ss_auto.spouse_start_age ?? 67;
      }
   });

   ensureSSAuto();
</script>

<div class="p-3 bg-surface-100 dark:bg-surface-800 rounded">
   <h4 class="text-sm text-surface-500 dark:text-surface-400 font-medium mb-2">
      Social Security
   </h4>
   {#if config.ss_auto}
      <div class="flex gap-4 flex-wrap">
         <label
            class="flex flex-col gap-1 text-sm font-medium text-surface-600 dark:text-surface-400"
         >
            Primary FRA Benefit ($/yr)
            <input
               type="number"
               class="input w-36"
               bind:value={config.ss_auto.primary_fra_amount}
               onfocus={(e) => e.currentTarget.select()}
               min="0"
               step="1000"
            />
         </label>
         <label
            class="flex flex-col gap-1 text-sm font-medium text-surface-600 dark:text-surface-400"
         >
            Primary Start Year
            <div class="flex items-center gap-2">
               <input
                  type="number"
                  class="input w-24"
                  value={ageToYear(
                     config.ss_auto.primary_start_age,
                     config.current_age_primary,
                  )}
                  onfocus={(e) => e.currentTarget.select()}
                  onchange={(e) => {
                     config.ss_auto!.primary_start_age = yearToAge(
                        Number(e.currentTarget.value),
                        config.current_age_primary,
                     );
                  }}
                  min={ageToYear(62, config.current_age_primary)}
                  max={ageToYear(70, config.current_age_primary)}
               />
               <span class="text-xs text-surface-400"
                  >({ageHint(config.ss_auto.primary_start_age)})</span
               >
            </div>
         </label>
         <label
            class="flex flex-col gap-1 text-sm font-medium text-surface-600 dark:text-surface-400"
         >
            Annual COLA %
            <input
               type="number"
               class="input w-20"
               value={Math.round(config.ss_auto.cola_rate * 1000) / 10}
               onfocus={(e) => e.currentTarget.select()}
               onchange={(e) => {
                  config.ss_auto!.cola_rate = Number(e.currentTarget.value) / 100;
               }}
               min="0"
               max="20"
               step="0.1"
            />
         </label>
      </div>
      {#if hasSpouse}
         <div class="flex gap-4 flex-wrap mt-2">
            <label
               class="flex flex-col gap-1 text-sm font-medium text-surface-600 dark:text-surface-400"
            >
               Spouse FRA Benefit ($/yr)
               <input
                  type="number"
                  class="input w-36"
                  bind:value={config.ss_auto.spouse_fra_amount}
                  onfocus={(e) => e.currentTarget.select()}
                  min="0"
                  step="1000"
               />
            </label>
            <label
               class="flex flex-col gap-1 text-sm font-medium text-surface-600 dark:text-surface-400"
            >
               Spouse Start Year
               <div class="flex items-center gap-2">
                  <input
                     type="number"
                     class="input w-24"
                     value={ageToYear(
                        config.ss_auto.spouse_start_age ?? 67,
                        config.current_age_spouse,
                     )}
                     onfocus={(e) => e.currentTarget.select()}
                     onchange={(e) => {
                        config.ss_auto!.spouse_start_age = yearToAge(
                           Number(e.currentTarget.value),
                           config.current_age_spouse,
                        );
                     }}
                     min={ageToYear(62, config.current_age_spouse)}
                     max={ageToYear(70, config.current_age_spouse)}
                  />
                  <span class="text-xs text-surface-400"
                     >({ageHint(config.ss_auto.spouse_start_age)})</span
                  >
               </div>
            </label>
         </div>
      {/if}
   {/if}
</div>
