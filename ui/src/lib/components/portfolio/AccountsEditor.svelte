<script lang="ts">
   import type {
      Account,
      AccountType,
      Owner,
      SimulationConfig,
   } from '$lib/types';
   import {
      ACCOUNT_TYPE_DEFAULTS,
      ACCOUNT_TYPE_LABELS,
      EDITOR_ACCOUNT_TYPES,
      INDIVIDUAL_ONLY_TYPES,
      TAX_CATEGORY_MAP,
   } from '$lib/types';
   import { validationErrors, formTouched } from '$lib/stores';
   import { SvelteSet } from 'svelte/reactivity';
   import { compactCurrency } from '$lib/format';
   import HelpButton from '$lib/components/HelpButton.svelte';
   import {
      ShieldCheck,
      Sprout,
      TrendingUp,
      Banknote,
      RotateCcw,
      Pencil,
      Check,
      Trash2,
   } from 'lucide-svelte';
   import { estimateTaxDrag } from '$lib/taxDrag';
   import TaxDragCalculator from './TaxDragCalculator.svelte';

   let {
      accounts = $bindable(),
      config,
   }: {
      accounts: Account[];
      config?: SimulationConfig;
   } = $props();

   let expandedIds = new SvelteSet<string>();

   function toggleExpand(id: string) {
      if (expandedIds.has(id)) expandedIds.delete(id);
      else expandedIds.add(id);
   }

   function isExpanded(id: string): boolean {
      return expandedIds.has(id);
   }

   function ageToYear(age: number, owner: string): number {
      if (!config) return age;
      const ownerAge =
         owner === 'spouse'
            ? config.current_age_spouse
            : config.current_age_primary;
      return config.start_year + (age - ownerAge);
   }

   function yearToAge(year: number, owner: string): number {
      if (!config) return year;
      const ownerAge =
         owner === 'spouse'
            ? config.current_age_spouse
            : config.current_age_primary;
      return ownerAge + (year - config.start_year);
   }

   let nextId = $state(accounts.length + 1);

   function addAccount() {
      const num = nextId++;
      const type: AccountType = 'brokerage';
      const defaults = ACCOUNT_TYPE_DEFAULTS[type];
      const id = `account_${num}`;
      accounts = [
         ...accounts,
         {
            id,
            name: `Account ${num}`,
            balance: 0,
            type,
            owner: 'primary',
            cost_basis_ratio: defaults.cost_basis_ratio,
            available_at_age: defaults.default_available_age,
         },
      ];
      expandedIds.add(id);
   }

   function removeAccount(index: number) {
      const id = accounts[index].id;
      accounts = accounts.filter((_, i) => i !== index);
      expandedIds.delete(id);
   }

   function handleTypeChange(i: number, newType: AccountType) {
      const account = { ...accounts[i] };
      account.type = newType;
      const defaults = ACCOUNT_TYPE_DEFAULTS[newType];
      account.cost_basis_ratio = defaults.cost_basis_ratio;
      account.available_at_age = defaults.default_available_age;
      account.stock_pct = undefined;
      if (INDIVIDUAL_ONLY_TYPES.has(newType) && account.owner === 'joint') {
         account.owner = 'primary';
      }
      accounts[i] = account;
      accounts = [...accounts];
   }

   function hasError(path: string): boolean {
      if (!$formTouched) return false;
      return Object.keys($validationErrors).some((k) => k.startsWith(path));
   }

   $effect(() => {
      if (!$formTouched) return;
      const errKeys = Object.keys($validationErrors);
      for (let i = 0; i < accounts.length; i++) {
         if (errKeys.some((k) => k.startsWith(`accounts.${i}.`))) {
            expandedIds.add(accounts[i].id);
         }
      }
   });

   function isCostBasisEditable(type: AccountType): boolean {
      return ACCOUNT_TYPE_DEFAULTS[type]?.editable ?? false;
   }

   function typeIcon(type: AccountType) {
      const cat = TAX_CATEGORY_MAP[type];
      if (cat === 'pretax') return 'pretax';
      if (cat === 'roth') return 'roth';
      if (cat === 'cash') return 'cash';
      return 'brokerage';
   }

   function stockPct(account: Account): number | null {
      if (account.stock_pct != null) return account.stock_pct;
      return null;
   }

   function pieStyle(account: Account): string {
      const pct = stockPct(account);
      if (pct == null) return 'background: #9ca3af';
      return `background: conic-gradient(#22c55e ${pct}%, #60a5fa ${pct}%)`;
   }

   function pieTooltip(account: Account): string {
      const pct = stockPct(account);
      if (pct == null) return 'Allocation unknown';
      return `${pct}% stocks, ${100 - pct}% bonds`;
   }
</script>

<div class="flex flex-col gap-1.5">
   {#each accounts as account, i (account.id)}
      {@const expanded = isExpanded(account.id)}
      {@const iconType = typeIcon(account.type)}
      {@const balanceError = hasError(`accounts.${i}.balance`)}
      {#if expanded}
         <!-- Expanded card -->
         <div
            class="border border-surface-300 dark:border-surface-600 rounded p-3 bg-surface-50 dark:bg-surface-800 space-y-2"
         >
            <div class="flex gap-2 items-center">
               <button
                  class="btn btn-sm preset-tonal p-1"
                  onclick={() => removeAccount(i)}
                  aria-label="Delete account"
               >
                  <Trash2 size={14} />
               </button>
               <div class="w-5 flex items-center justify-center">
                  {#if iconType === 'pretax'}
                     <ShieldCheck size={18} class="text-blue-500" />
                  {:else if iconType === 'roth'}
                     <Sprout size={18} class="text-green-500" />
                  {:else if iconType === 'cash'}
                     <Banknote size={18} class="text-slate-500" />
                  {:else}
                     <TrendingUp size={18} class="text-amber-500" />
                  {/if}
               </div>
               <input
                  type="text"
                  class="input flex-1"
                  bind:value={accounts[i].name}
                  onfocus={(e) => e.currentTarget.select()}
                  placeholder="Account name"
                  aria-label="Name"
               />
               <button
                  class="btn preset-tonal btn-sm p-1"
                  onclick={() => toggleExpand(account.id)}
                  aria-label="Done editing"
               >
                  <Check size={16} />
               </button>
            </div>
            <div class="flex gap-4 flex-wrap items-end pl-7">
               <label
                  class="flex flex-col gap-0.5 text-xs font-medium text-surface-600 dark:text-surface-400"
               >
                  Type
                  <select
                     class="select w-36"
                     value={account.type}
                     aria-label="Type"
                     onchange={(e) =>
                        handleTypeChange(
                           i,
                           (e.target as HTMLSelectElement).value as AccountType,
                        )}
                  >
                     {#each EDITOR_ACCOUNT_TYPES as t (t)}
                        <option value={t}>{ACCOUNT_TYPE_LABELS[t]}</option>
                     {/each}
                  </select>
               </label>
               <label
                  class="flex flex-col gap-0.5 text-xs font-medium {balanceError
                     ? 'text-error-600 dark:text-error-400'
                     : 'text-surface-600 dark:text-surface-400'}"
               >
                  Balance
                  <input
                     type="number"
                     class="input w-30 no-spinner {balanceError
                        ? 'ring-2 ring-error-500 border-error-500'
                        : ''}"
                     bind:value={accounts[i].balance}
                     onfocus={(e) => e.currentTarget.select()}
                     min="0"
                     step="1000"
                     aria-label="Balance"
                  />
               </label>
               <label
                  class="flex flex-col gap-0.5 text-xs font-medium text-surface-600 dark:text-surface-400"
               >
                  Owner
                  <select
                     class="select w-30"
                     value={account.owner}
                     aria-label="Owner"
                     onchange={(e) => {
                        accounts[i] = {
                           ...account,
                           owner: (e.target as HTMLSelectElement)
                              .value as Owner,
                        };
                        accounts = [...accounts];
                     }}
                  >
                     <option value="primary">Primary</option>
                     <option value="spouse">Spouse</option>
                     {#if !INDIVIDUAL_ONLY_TYPES.has(account.type)}
                        <option value="joint">Joint</option>
                     {/if}
                  </select>
               </label>
               <div
                  class="flex flex-col gap-0.5 text-xs font-medium text-surface-600 dark:text-surface-400"
               >
                  <span class="flex items-center gap-1"
                     >Basis % <HelpButton topic="accounts-tax-treatment" anchor="cost-basis" /></span
                  >
                  <input
                     type="number"
                     class="input w-24 no-spinner"
                     value={Math.round((account.cost_basis_ratio ?? 0) * 100)}
                     onfocus={(e) => e.currentTarget.select()}
                     onchange={(e) => {
                        const pct = Math.max(
                           0,
                           Math.min(100, Number(e.currentTarget.value) || 0),
                        );
                        account.cost_basis_ratio = pct / 100;
                        e.currentTarget.value = String(pct);
                     }}
                     min="0"
                     max="100"
                     step="1"
                     aria-label="Basis, as %"
                     disabled={!isCostBasisEditable(account.type)}
                  />
               </div>
               <div
                  class="flex flex-col gap-0.5 text-xs font-medium text-surface-600 dark:text-surface-400"
               >
                  <span class="flex items-center gap-1"
                     >Stocks % <HelpButton topic="accounts-tax-treatment" anchor="stock-allocation" /></span
                  >
                  <input
                     type="number"
                     class="input w-20 no-spinner"
                     value={account.stock_pct ??
                        ACCOUNT_TYPE_DEFAULTS[account.type].default_stock_pct}
                     onfocus={(e) => e.currentTarget.select()}
                     onchange={(e) => {
                        const pct = Math.max(
                           0,
                           Math.min(
                              100,
                              Math.round(Number(e.currentTarget.value) || 0),
                           ),
                        );
                        accounts[i] = { ...account, stock_pct: pct };
                        accounts = [...accounts];
                        e.currentTarget.value = String(pct);
                     }}
                     min="0"
                     max="100"
                     step="5"
                     aria-label="Stocks %"
                  />
               </div>
               {#if TAX_CATEGORY_MAP[account.type] === 'brokerage'}
                  <span
                     class="text-xs text-surface-500 dark:text-surface-400 whitespace-nowrap flex items-center gap-0.5 self-end pb-1.5"
                  >
                     {#if account.tax_drag_override != null}
                        {(account.tax_drag_override * 100).toFixed(2)}% drag
                        <button
                           class="inline-flex items-center justify-center w-4 h-4 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300"
                           onclick={() => {
                              accounts[i] = {
                                 ...account,
                                 tax_drag_override: undefined,
                              };
                              accounts = [...accounts];
                           }}
                           aria-label="Reset to estimate"
                           type="button"
                        >
                           <RotateCcw size={12} />
                        </button>
                     {:else}
                        ~{(
                           estimateTaxDrag(
                              account.stock_pct ??
                                 ACCOUNT_TYPE_DEFAULTS[account.type]
                                    .default_stock_pct,
                           ) * 100
                        ).toFixed(2)}% drag
                        <TaxDragCalculator
                           balance={account.balance}
                           stateTaxRate={config?.tax_rate_state ?? 0.05}
                           federalBrackets={config?.tax_brackets_federal ?? []}
                           onapply={(drag) => {
                              accounts[i] = {
                                 ...account,
                                 tax_drag_override: drag,
                              };
                              accounts = [...accounts];
                           }}
                        />
                     {/if}
                  </span>
               {/if}
               {#if config}
                  <label
                     class="flex flex-col gap-0.5 text-xs font-medium text-surface-600 dark:text-surface-400"
                  >
                     Avail. Year
                     <div class="w-24">
                        <input
                           type="number"
                           class="input w-full no-spinner"
                           value={account.available_at_age
                              ? ageToYear(
                                   account.available_at_age,
                                   account.owner,
                                )
                              : ''}
                           onfocus={(e) => e.currentTarget.select()}
                           onchange={(e) => {
                              const v = e.currentTarget.value;
                              account.available_at_age = v
                                 ? yearToAge(Number(v), account.owner)
                                 : 0;
                           }}
                           placeholder={String(config.start_year)}
                           aria-label="Avail. Year"
                        />
                        {#if (account.available_at_age ?? 0) > 0}
                           <span class="text-xs text-surface-400"
                              >(age {account.available_at_age})</span
                           >
                        {/if}
                     </div>
                  </label>
               {:else}
                  <label
                     class="flex flex-col gap-0.5 text-xs font-medium text-surface-600 dark:text-surface-400"
                  >
                     Avail. Age
                     <input
                        type="number"
                        class="input w-20 no-spinner"
                        bind:value={accounts[i].available_at_age}
                        onfocus={(e) => e.currentTarget.select()}
                        min="0"
                        aria-label="Avail. Age"
                     />
                  </label>
               {/if}
            </div>
         </div>
      {:else}
         <!-- Compact row -->
         <button
            class="flex gap-2 items-center p-2 bg-surface-100 dark:bg-surface-800 rounded w-full text-left hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors cursor-pointer"
            onclick={() => toggleExpand(account.id)}
            aria-label="Edit {account.name}"
         >
            <div class="w-5 flex items-center justify-center flex-shrink-0">
               {#if iconType === 'pretax'}
                  <ShieldCheck size={18} class="text-blue-500" />
               {:else if iconType === 'roth'}
                  <Sprout size={18} class="text-green-500" />
               {:else if iconType === 'cash'}
                  <Banknote size={18} class="text-slate-500" />
               {:else}
                  <TrendingUp size={18} class="text-amber-500" />
               {/if}
            </div>
            <span class="flex-1 truncate font-medium text-sm"
               >{account.name}</span
            >
            <span
               class="text-xs text-surface-500 dark:text-surface-400 flex-shrink-0"
               >{ACCOUNT_TYPE_LABELS[account.type]}</span
            >
            <span class="text-sm font-medium tabular-nums flex-shrink-0"
               >{compactCurrency(account.balance)}</span
            >
            <div
               class="w-5 h-5 rounded-full flex-shrink-0"
               style={pieStyle(account)}
               title={pieTooltip(account)}
               role="img"
               aria-label={pieTooltip(account)}
            ></div>
            <Pencil size={14} class="text-surface-400 flex-shrink-0" />
         </button>
      {/if}
   {/each}
   <button class="btn preset-tonal self-start" onclick={addAccount}
      >+ Add Account</button
   >
</div>
