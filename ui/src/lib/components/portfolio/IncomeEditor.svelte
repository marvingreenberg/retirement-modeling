<script lang="ts">
   import type { SimulationConfig, IncomeStream, IncomeKind } from '$lib/types';
   import { INCOME_KIND_LABELS } from '$lib/types';
   import { Trash2 } from 'lucide-svelte';
   import CurrentSalaryEditor from './CurrentSalaryEditor.svelte';
   import SocialSecurityEditor from './SocialSecurityEditor.svelte';

   let {
      config = $bindable(),
      incomeStreams = $bindable(),
   }: {
      config: SimulationConfig;
      incomeStreams: IncomeStream[];
   } = $props();

   let hasSpouse = $derived(config.current_age_spouse > 0);
   let simEndAge = $derived(
      config.current_age_primary + config.simulation_years,
   );

   const SALARY_SENTINELS = new Set(['__salary_primary', '__salary_spouse']);
   let visibleStreams = $derived(
      incomeStreams
         .map((s, i) => ({ stream: s, origIdx: i }))
         .filter((x) => !SALARY_SENTINELS.has(x.stream.name)),
   );

   const editableKinds: IncomeKind[] = [
      'employment',
      'pension',
      'rental',
      'alimony',
      'other',
   ];

   function ageToYear(age: number, ownerAge: number): number {
      return config.start_year + (age - ownerAge);
   }

   function yearToAge(year: number, ownerAge: number): number {
      return ownerAge + (year - config.start_year);
   }

   function ownerAge(owner: string): number {
      return owner === 'spouse'
         ? config.current_age_spouse
         : config.current_age_primary;
   }

   function ageHint(age: number | null): string {
      return age != null ? `age ${age}` : '';
   }

   function streamWarning(stream: IncomeStream): string {
      if (stream.start_age > simEndAge) return 'past sim end';
      if (stream.end_age != null && stream.end_age < stream.start_age)
         return 'end < start';
      return '';
   }

   function toPct(v: number | null): string {
      return v != null ? String(Math.round(v * 10000) / 100) : '';
   }
   function pctToDecimal(s: string): number | null {
      if (!s) return null;
      return +s / 100;
   }

   function addStream() {
      incomeStreams = [
         ...incomeStreams,
         {
            name: '',
            kind: 'other' as IncomeKind,
            amount: 0,
            start_age: 65,
            end_age: null,
            taxable_pct: 1.0,
            cola_rate: null,
            owner: 'primary' as const,
            pretax_401k: 0,
            roth_401k: 0,
         },
      ];
   }

   function removeStream(idx: number) {
      incomeStreams = incomeStreams.filter((_, i) => i !== idx);
   }

   function handleKindChange(idx: number, newKind: IncomeKind) {
      incomeStreams[idx].kind = newKind;
      if (newKind !== 'employment') {
         incomeStreams[idx].pretax_401k = 0;
         incomeStreams[idx].roth_401k = 0;
      }
   }
</script>

<div class="flex flex-col gap-4">
   <SocialSecurityEditor bind:config />
   <CurrentSalaryEditor bind:config />

   <div>
      <h4
         class="text-sm text-surface-500 dark:text-surface-400 font-medium mb-2"
      >
         Other Income
      </h4>
      {#if visibleStreams.length > 0}
         <div
            class="flex gap-3 items-end px-3 mb-1 text-xs font-medium text-surface-500 dark:text-surface-400"
         >
            <span class="w-24">Kind</span>
            <span class="w-32">Name</span>
            <span class="w-28">Amount ($/yr)</span>
            <span class="w-28">Start Year</span>
            <span class="w-28">End Year</span>
            <span class="w-20">COLA %</span>
            <span class="w-20">Taxable %</span>
            {#if hasSpouse}<span class="w-24">Owner</span>{/if}
         </div>
      {/if}
      {#each visibleStreams as { stream, origIdx: idx } (idx)}
         {@const oa = ownerAge(stream.owner)}
         {@const warning = streamWarning(stream)}
         <div
            class="flex gap-3 items-center p-3 bg-surface-100 dark:bg-surface-800 rounded flex-wrap mb-2"
         >
            <select
               class="select w-24 text-sm"
               value={stream.kind}
               onchange={(e) =>
                  handleKindChange(idx, e.currentTarget.value as IncomeKind)}
               aria-label="Kind"
            >
               {#each editableKinds as k (k)}
                  <option value={k}>{INCOME_KIND_LABELS[k]}</option>
               {/each}
            </select>
            <input
               type="text"
               class="input w-32 text-sm"
               bind:value={incomeStreams[idx].name}
               onfocus={(e) => e.currentTarget.select()}
               placeholder="e.g. Pension"
               aria-label="Name"
            />
            <input
               type="number"
               class="input w-28 text-sm"
               bind:value={incomeStreams[idx].amount}
               onfocus={(e) => e.currentTarget.select()}
               min="0"
               step="1000"
               aria-label="Amount"
            />
            <div class="w-28">
               <input
                  type="number"
                  class="input w-full text-sm"
                  value={ageToYear(stream.start_age, oa)}
                  onfocus={(e) => e.currentTarget.select()}
                  onchange={(e) => {
                     stream.start_age = yearToAge(
                        Number(e.currentTarget.value),
                        oa,
                     );
                  }}
                  aria-label="Start Year"
               />
               <span class="text-xs text-surface-400"
                  >({ageHint(stream.start_age)})</span
               >
            </div>
            <div class="w-28">
               {#if stream.end_age != null}
                  <input
                     type="number"
                     class="input w-full text-sm"
                     value={ageToYear(stream.end_age, oa)}
                     onfocus={(e) => e.currentTarget.select()}
                     onchange={(e) => {
                        stream.end_age = yearToAge(
                           Number(e.currentTarget.value),
                           oa,
                        );
                     }}
                     aria-label="End Year"
                  />
                  <span class="text-xs text-surface-400"
                     >({ageHint(stream.end_age)})</span
                  >
               {:else}
                  <input
                     type="number"
                     class="input w-full text-sm"
                     value=""
                     onfocus={(e) => e.currentTarget.select()}
                     onchange={(e) => {
                        const v = e.currentTarget.value;
                        stream.end_age = v ? yearToAge(Number(v), oa) : null;
                     }}
                     placeholder="∞"
                     aria-label="End Year"
                  />
                  <span class="text-xs text-surface-400">lifetime</span>
               {/if}
            </div>
            <input
               type="number"
               class="input w-20 text-sm"
               value={toPct(stream.cola_rate)}
               onfocus={(e) => e.currentTarget.select()}
               onchange={(e) => {
                  stream.cola_rate = pctToDecimal(e.currentTarget.value);
               }}
               min="0"
               max="20"
               step="0.5"
               placeholder="0"
               aria-label="COLA %"
            />
            <input
               type="number"
               class="input w-20 text-sm"
               value={toPct(stream.taxable_pct)}
               onfocus={(e) => e.currentTarget.select()}
               onchange={(e) => {
                  stream.taxable_pct = +e.currentTarget.value / 100;
               }}
               min="0"
               max="100"
               step="5"
               aria-label="Taxable %"
            />
            {#if hasSpouse}
               <select
                  class="select w-24 text-sm"
                  bind:value={incomeStreams[idx].owner}
                  aria-label="Owner"
               >
                  <option value="primary">Primary</option>
                  <option value="spouse">Spouse</option>
               </select>
            {/if}
            <button
               class="btn btn-sm preset-tonal p-1"
               onclick={() => removeStream(idx)}
               aria-label="Remove income stream"
            >
               <Trash2 size={14} />
            </button>
            {#if warning}
               <span class="text-xs text-warning-500 w-full">{warning}</span>
            {/if}
         </div>

         <!-- 401k contribution fields for employment income -->
         {#if stream.kind === 'employment'}
            <div
               class="flex gap-3 items-center px-3 pb-3 ml-6 text-sm flex-wrap"
            >
               <label class="flex items-center gap-1">
                  <span class="text-xs text-surface-500">Pre-tax 401k</span>
                  <input
                     type="number"
                     class="input w-28 text-sm"
                     bind:value={incomeStreams[idx].pretax_401k}
                     onfocus={(e) => e.currentTarget.select()}
                     min="0"
                     step="500"
                     aria-label="Pre-tax 401k"
                  />
               </label>
               <label class="flex items-center gap-1">
                  <span class="text-xs text-surface-500">Roth 401k</span>
                  <input
                     type="number"
                     class="input w-28 text-sm"
                     bind:value={incomeStreams[idx].roth_401k}
                     onfocus={(e) => e.currentTarget.select()}
                     min="0"
                     step="500"
                     aria-label="Roth 401k"
                  />
               </label>
               <span class="text-xs text-surface-400"
                  >2025 limit: $23,500 (under 50) / $31,000 (50+)</span
               >
            </div>
         {/if}
      {/each}
      <button class="btn btn-sm preset-tonal mt-1" onclick={addStream}
         >Add Income</button
      >
   </div>
</div>
