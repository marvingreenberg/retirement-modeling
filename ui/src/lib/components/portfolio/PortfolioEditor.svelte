<script lang="ts">
   import {
      portfolio,
      validationErrors,
      formTouched,
      markFormTouched,
      simulateBlockedSection,
   } from '$lib/stores';

   function handleFocusOut() {
      markFormTouched();
   }
   import { validatePortfolio } from '$lib/validation';
   import CollapsibleSection from '$lib/components/CollapsibleSection.svelte';
   import AccountsEditor from './AccountsEditor.svelte';
   import ImportPortfolio from './ImportPortfolio.svelte';
   import IncomeEditor from './IncomeEditor.svelte';
   import SpendingEditor from './SpendingEditor.svelte';
   import { currency, compactCurrency } from '$lib/format';
   import { Landmark, Briefcase, Wallet, AlertTriangle } from 'lucide-svelte';

   let accountsOpen = $state(false);
   let budgetOpen = $state(false);
   let incomeOpen = $state(false);
   let errors = $derived(validatePortfolio(portfolio.value));
   $effect(() => {
      validationErrors.value = errors;
   });

   const configInputPaths = ['config.inflation_rate'];
   let errorList = $derived(
      formTouched.value
         ? Object.entries(errors).filter(([k]) => !configInputPaths.includes(k))
         : [],
   );

   let noAccounts = $derived(portfolio.value.accounts.length === 0);
   let noBudget = $derived(portfolio.value.config.annual_spend_net === 0);
   let totalBalance = $derived(
      portfolio.value.accounts.reduce((sum, a) => sum + a.balance, 0),
   );

   let incomeSummary = $derived.by(() => {
      const parts: string[] = [];
      const ss = portfolio.value.config.social_security;
      const ssAuto = portfolio.value.config.ss_auto;
      const hasSS =
         (ssAuto && ssAuto.primary_fra_amount > 0) || ss.primary_benefit > 0;
      if (hasSS) {
         const startAge = ssAuto?.primary_start_age ?? ss.primary_start_age;
         parts.push(`SS at ${startAge}`);
      }
      for (const s of portfolio.value.config.income_streams) {
         const amt =
            s.amount >= 1000
               ? `$${Math.round(s.amount / 1000)}K`
               : `$${s.amount}`;
         parts.push(`${s.name} ${amt}/yr`);
      }
      return parts.length > 0 ? parts.join(', ') : 'None configured';
   });

   $effect(() => {
      const section = simulateBlockedSection.value;
      if (section === 'accounts') accountsOpen = true;
      if (section === 'budget') budgetOpen = true;
   });

   function friendlyPath(path: string): string {
      const fieldLabels: Record<string, string> = {
         balance: 'Balance',
         amount: 'Amount',
         year: 'Year',
         start_year: 'Start Year',
         end_year: 'End Year',
         cost_basis_ratio: 'Cost Basis %',
         available_at_age: 'Available Age',
      };
      const accountMatch = path.match(/^accounts\.(\d+)\.(\w+)$/);
      if (accountMatch) {
         const idx = parseInt(accountMatch[1]);
         const field = accountMatch[2];
         const name =
            portfolio.value.accounts[idx]?.name || `Account ${idx + 1}`;
         const fieldName = fieldLabels[field] || field;
         return `${name} - ${fieldName}`;
      }
      const expenseMatch = path.match(
         /^config\.planned_expenses\.(\d+)\.(\w+)$/,
      );
      if (expenseMatch) {
         const idx = parseInt(expenseMatch[1]);
         const field = expenseMatch[2];
         const name =
            portfolio.value.config.planned_expenses?.[idx]?.name ||
            `Expense ${idx + 1}`;
         const fieldName = fieldLabels[field] || field;
         return `${name} - ${fieldName}`;
      }
      return path;
   }

   $effect(() => {
      if (!formTouched.value) return;
      const keys = Object.keys(errors);
      if (keys.some((k) => k.startsWith('accounts'))) accountsOpen = true;
      if (keys.some((k) => k.startsWith('config.social_security')))
         incomeOpen = true;
   });
</script>

<div class="space-y-2" onfocusout={handleFocusOut}>
   {#if errorList.length > 0}
      <div
         class="bg-error-50 dark:bg-error-950 border border-error-200 dark:border-error-800 rounded p-3"
      >
         <p class="text-error-700 dark:text-error-300 text-sm font-medium mb-2">
            Validation errors:
         </p>
         <ul
            class="text-error-600 dark:text-error-400 text-sm list-disc list-inside space-y-1"
         >
            {#each errorList as [path, message] (path)}
               <li><strong>{friendlyPath(path)}</strong>: {message}</li>
            {/each}
         </ul>
      </div>
   {/if}

   <CollapsibleSection title="Accounts" bind:open={accountsOpen}>
      {#snippet icon()}<Landmark
            size={20}
            class="text-tertiary-500"
         />{/snippet}
      {#snippet summary()}{#if noAccounts}No accounts{:else}Total {compactCurrency(
               totalBalance,
            )}{/if}{/snippet}
      {#if noAccounts}
         <div
            class="flex items-center gap-2 text-warning-600 dark:text-warning-400 text-sm font-semibold py-2"
         >
            <AlertTriangle size={16} />
            Add an account to allow simulation
         </div>
      {/if}
      <AccountsEditor
         bind:accounts={portfolio.value.accounts}
         config={portfolio.value.config}
      />
      <ImportPortfolio bind:accounts={portfolio.value.accounts} />
   </CollapsibleSection>

   <CollapsibleSection title="Budget" bind:open={budgetOpen}>
      {#snippet icon()}<Wallet size={20} class="text-primary-500" />{/snippet}
      {#snippet summary()}{currency(
            portfolio.value.config.annual_spend_net,
         )}/yr{#if (portfolio.value.config.planned_expenses ?? []).length > 0}
            + {(portfolio.value.config.planned_expenses ?? []).length} expenses{/if}{/snippet}
      {#if noBudget && !noAccounts}
         <div
            class="flex items-center gap-2 text-warning-600 dark:text-warning-400 text-sm font-semibold py-2"
         >
            <AlertTriangle size={16} />
            Define expected annual spending to allow simulation
         </div>
      {/if}
      <SpendingEditor
         bind:config={portfolio.value.config}
         bind:plannedExpenses={portfolio.value.config.planned_expenses}
      />
   </CollapsibleSection>

   <CollapsibleSection title="Income" bind:open={incomeOpen}>
      {#snippet icon()}<Briefcase
            size={20}
            class="text-success-500"
         />{/snippet}
      {#snippet summary()}{incomeSummary}{/snippet}
      <IncomeEditor
         bind:config={portfolio.value.config}
         bind:incomeStreams={portfolio.value.config.income_streams}
      />
   </CollapsibleSection>
</div>
