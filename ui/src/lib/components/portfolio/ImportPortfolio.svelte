<script lang="ts">
   import type { Account, AccountType, Owner } from '$lib/types';
   import {
      ACCOUNT_TYPE_DEFAULTS,
      ACCOUNT_TYPE_LABELS,
      EDITOR_ACCOUNT_TYPES,
      INDIVIDUAL_ONLY_TYPES,
   } from '$lib/types';
   import { parseOFX, type ParsedAccount } from '$lib/ofxParser';
   import { parseCSV } from '$lib/csvParser';
   import {
      summarizePortfolio,
      type PortfolioSummary,
   } from '$lib/assetClassification';
   import { Upload, X, FileCheck, AlertCircle } from 'lucide-svelte';

   import { profile } from '$lib/stores';

   let { accounts = $bindable() }: { accounts: Account[] } = $props();

   let showModal = $state(false);
   let error = $state('');
   let parsedAccounts = $state<ParsedAccount[]>([]);
   let summaries = $state<PortfolioSummary[]>([]);
   let accountTypes = $state<(AccountType | '')[]>([]);
   let accountOwners = $state<Owner[]>([]);
   let accountNames = $state<string[]>([]);

   let hasSpouse = $derived(!!$profile.spouseName?.trim());

   let sourceFiles = $state<string[]>([]);
   let loading = $state(false);
   let spinnerChar = $state('|');
   let spinnerInterval: ReturnType<typeof setInterval> | undefined;
   let fileInput: HTMLInputElement | undefined = $state();

   function startSpinner() {
      const chars = ['|', '/', '-', '\\'];
      let idx = 0;
      loading = true;
      spinnerChar = chars[0];
      spinnerInterval = setInterval(() => {
         idx = (idx + 1) % chars.length;
         spinnerChar = chars[idx];
      }, 150);
   }

   function stopSpinner() {
      loading = false;
      if (spinnerInterval) {
         clearInterval(spinnerInterval);
         spinnerInterval = undefined;
      }
   }

   function openFilePicker() {
      fileInput?.click();
   }

   function parseByExtension(text: string, filename: string): ParsedAccount[] {
      const ext = filename.split('.').pop()?.toLowerCase() ?? '';
      if (ext === 'csv') return parseCSV(text);
      return parseOFX(text);
   }

   async function handleFile(e: Event) {
      const input = e.target as HTMLInputElement;
      const files = input.files;
      if (!files || files.length === 0) return;

      error = '';
      startSpinner();
      const minDelay = new Promise((r) => setTimeout(r, 1000));

      const allParsed: ParsedAccount[] = [];
      const allFiles: string[] = [];
      const errors: string[] = [];

      for (const file of Array.from(files)) {
         try {
            const text = await file.text();
            const parsed = parseByExtension(text, file.name);
            for (const p of parsed) {
               allParsed.push(p);
               allFiles.push(file.name);
            }
         } catch {
            errors.push(file.name);
         }
      }

      await minDelay;
      stopSpinner();

      if (errors.length > 0) {
         error = `Could not load: ${errors.join(', ')}. Files may not be supported OFX/QFX/CSV exports.`;
      }

      if (allParsed.length > 0) {
         parsedAccounts = allParsed;
         sourceFiles = allFiles;
         summaries = allParsed.map((a) =>
            summarizePortfolio(a.holdings, a.cash_balance),
         );
         accountTypes = allParsed.map(() => '');
         accountOwners = allParsed.map(() => 'primary');
         accountNames = allParsed.map((a, idx) => {
            const broker = a.broker !== 'unknown' ? a.broker + ' ' : '';
            const file = allFiles[idx] ? ' - ' + allFiles[idx] : '';
            return `${broker}${a.account_id}${file}`;
         });
         showModal = true;
      }

      input.value = '';
   }

   function confirmImport() {
      const nextId = accounts.length + 1;
      const newAccounts: Account[] = parsedAccounts.map((parsed, i) => {
         const acctType = accountTypes[i] as AccountType;
         const summary = summaries[i];
         return {
            id: `import_${nextId + i}`,
            name: accountNames[i],
            balance: Math.round(parsed.total_value),
            type: acctType,
            owner: accountOwners[i],
            cost_basis_ratio:
               ACCOUNT_TYPE_DEFAULTS[acctType]?.cost_basis_ratio ?? 0.0,
            available_at_age:
               ACCOUNT_TYPE_DEFAULTS[acctType]?.default_available_age ?? 0,
            stock_pct:
               summary?.holdingsCount > 0
                  ? Math.round(summary.stockPercent * 100)
                  : undefined,
         };
      });
      accounts = [...accounts, ...newAccounts];
      showModal = false;
   }

   function cancel() {
      showModal = false;
      parsedAccounts = [];
      sourceFiles = [];
      summaries = [];
      accountOwners = [];
      error = '';
   }

   let allTypesSet = $derived(
      accountTypes.length > 0 && accountTypes.every((t) => t !== ''),
   );

   function formatMoney(n: number): string {
      return n.toLocaleString('en-US', {
         style: 'currency',
         currency: 'USD',
         maximumFractionDigits: 0,
      });
   }

   function formatPct(n: number): string {
      return (n * 100).toFixed(1) + '%';
   }
</script>

<input
   bind:this={fileInput}
   type="file"
   accept=".ofx,.qfx,.csv"
   multiple
   class="hidden"
   onchange={handleFile}
/>

<button
   class="btn preset-tonal self-start"
   onclick={openFilePicker}
   disabled={loading}
>
   <Upload size={16} />
   Import Accounts
</button>

{#if loading}
   <div
      class="flex items-center gap-2 text-surface-600 dark:text-surface-400 text-sm mt-2"
   >
      <span class="font-mono w-3 text-center">{spinnerChar}</span>
      Importing...
   </div>
{/if}

{#if error}
   <div
      class="flex items-center gap-2 text-error-600 dark:text-error-400 text-sm mt-2"
   >
      <AlertCircle size={16} />
      {error}
   </div>
{/if}

{#if showModal}
   <!-- svelte-ignore a11y_click_events_have_key_events -->
   <!-- svelte-ignore a11y_no_static_element_interactions -->
   <div
      class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onclick={cancel}
   >
      <div
         class="bg-surface-50 dark:bg-surface-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6 space-y-4"
         onclick={(e) => e.stopPropagation()}
      >
         <div class="flex items-center justify-between">
            <h2 class="text-lg font-bold flex items-center gap-2">
               <FileCheck size={20} class="text-success-500" />
               Import Results
            </h2>
            <button class="btn-icon btn-icon-sm preset-tonal" onclick={cancel}>
               <X size={16} />
            </button>
         </div>

         {#each parsedAccounts as parsed, i (parsed.account_id)}
            {@const summary = summaries[i]}
            <div
               class="bg-surface-100 dark:bg-surface-800 rounded p-4 space-y-3"
            >
               <div class="flex items-center justify-between">
                  <span class="text-sm text-surface-500">
                     {parsed.broker !== 'unknown' ? parsed.broker : ''} Account {parsed.account_id}
                     {#if sourceFiles[i]}
                        <span class="text-xs ml-1">— {sourceFiles[i]}</span>
                     {/if}
                     {#if parsed.as_of_date}
                        <span class="text-xs ml-2"
                           >as of {parsed.as_of_date}</span
                        >
                     {/if}
                  </span>
                  <span class="font-semibold"
                     >{formatMoney(parsed.total_value)}</span
                  >
               </div>

               <div class="flex gap-3 flex-wrap">
                  <label
                     class="flex flex-col gap-1 text-sm font-medium text-surface-600 dark:text-surface-400"
                  >
                     Account Name
                     <input
                        type="text"
                        class="input w-48"
                        bind:value={accountNames[i]}
                     />
                  </label>
                  <label
                     class="flex flex-col gap-1 text-sm font-medium text-surface-600 dark:text-surface-400"
                  >
                     Account Type
                     <select
                        class="select w-36 {accountTypes[i] === ''
                           ? 'ring-2 ring-warning-400'
                           : ''}"
                        bind:value={accountTypes[i]}
                        onchange={() => {
                           const t = accountTypes[i];
                           if (
                              t &&
                              INDIVIDUAL_ONLY_TYPES.has(t) &&
                              accountOwners[i] === 'joint'
                           ) {
                              accountOwners[i] = 'primary';
                           }
                        }}
                     >
                        <option value="" disabled>-- Select type --</option>
                        {#each EDITOR_ACCOUNT_TYPES as t (t)}
                           <option value={t}>{ACCOUNT_TYPE_LABELS[t]}</option>
                        {/each}
                     </select>
                  </label>
                  {#if hasSpouse}
                     <label
                        class="flex flex-col gap-1 text-sm font-medium text-surface-600 dark:text-surface-400"
                     >
                        Owner
                        <select
                           class="select w-28"
                           bind:value={accountOwners[i]}
                        >
                           <option value="primary">Primary</option>
                           <option value="spouse">Spouse</option>
                           {#if !accountTypes[i] || !INDIVIDUAL_ONLY_TYPES.has(accountTypes[i] as AccountType)}
                              <option value="joint">Joint</option>
                           {/if}
                        </select>
                     </label>
                  {/if}
               </div>

               {#if summary}
                  {@const visibleAlloc = summary.allocation.filter(
                     (a) => a.percent >= 0.02,
                  )}
                  <div class="text-sm space-y-1">
                     <div class="text-surface-500">
                        {summary.holdingsCount} holdings + {formatMoney(
                           summary.cashBalance,
                        )} cash
                     </div>
                     <div class="flex gap-3 text-xs text-surface-500">
                        <span>Stocks: {formatPct(summary.stockPercent)}</span>
                        <span>Bonds: {formatPct(summary.bondPercent)}</span>
                        <span
                           >Est. Return: {formatPct(
                              summary.estimatedReturn,
                           )}</span
                        >
                     </div>
                     <div class="flex flex-wrap gap-2 mt-1">
                        {#each visibleAlloc.slice(0, 5) as entry (entry.label)}
                           <span
                              class="badge preset-outlined-surface-500 text-xs"
                           >
                              {entry.label}: {formatPct(entry.percent)}
                           </span>
                        {/each}
                        {#if visibleAlloc.length > 5}
                           <span
                              class="badge preset-outlined-surface-500 text-xs"
                           >
                              +{visibleAlloc.length - 5} more
                           </span>
                        {/if}
                     </div>
                  </div>
               {/if}
            </div>
         {/each}

         <div class="flex gap-3 justify-end pt-2">
            <button class="btn preset-tonal" onclick={cancel}>Cancel</button>
            <span
               title={!allTypesSet
                  ? 'Select an account type for each account'
                  : ''}
            >
               <button
                  class="btn preset-filled"
                  onclick={confirmImport}
                  disabled={!allTypesSet}
               >
                  Add {parsedAccounts.length} Account{parsedAccounts.length > 1
                     ? 's'
                     : ''}
               </button>
            </span>
         </div>
      </div>
   </div>
{/if}
