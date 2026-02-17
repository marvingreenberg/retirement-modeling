<script lang="ts">
	import type { Account } from '$lib/types';
	import { validationErrors, formTouched } from '$lib/stores';
	import InfoPopover from '$lib/components/InfoPopover.svelte';
	import { ShieldCheck, Sprout, TrendingUp } from 'lucide-svelte';

	let { accounts = $bindable() }: { accounts: Account[] } = $props();

	let nextId = $state(accounts.length + 1);

	function addAccount() {
		const num = nextId++;
		accounts = [...accounts, {
			id: `account_${num}`,
			name: `Account ${num}`,
			balance: 0,
			type: 'brokerage',
			owner: 'primary',
			cost_basis_ratio: 0.0,
			available_at_age: 0,
		}];
	}

	function removeAccount(index: number) {
		accounts = accounts.filter((_, i) => i !== index);
	}

	function hasError(path: string): boolean {
		if (!$formTouched) return false;
		return Object.keys($validationErrors).some((k) => k.startsWith(path));
	}
</script>

<div class="flex flex-col gap-3">
	{#if accounts.length > 0}
		<div class="flex gap-3 items-end px-3 text-xs font-medium text-surface-500 dark:text-surface-400">
			<span class="w-5"></span>
			<span class="w-36">Name</span>
			<span class="w-30">Type</span>
			<span class="w-30">Balance</span>
			<span class="w-30">Owner</span>
			<span class="w-24"><span class="flex items-center gap-1">Cost Basis % <InfoPopover text="The portion of the account that represents original contributions (not gains). Affects capital gains tax on brokerage withdrawals." /></span></span>
			<span class="w-20">Avail. Age</span>
		</div>
	{/if}
	{#each accounts as account, i}
		{@const balanceError = hasError(`accounts.${i}.balance`)}
		<div class="flex gap-3 items-center p-3 bg-surface-100 dark:bg-surface-800 rounded flex-wrap">
			<div class="w-5 flex items-center justify-center">
				{#if account.type === 'pretax'}
					<ShieldCheck size={18} class="text-blue-500" />
				{:else if account.type === 'roth'}
					<Sprout size={18} class="text-green-500" />
				{:else}
					<TrendingUp size={18} class="text-amber-500" />
				{/if}
			</div>
			<input type="text" class="input w-36" bind:value={account.name} onfocus={(e) => e.currentTarget.select()} placeholder="Account name" aria-label="Name" />
			<select class="select w-30" bind:value={account.type} aria-label="Type">
				<option value="pretax">Pre-tax</option>
				<option value="roth">Roth</option>
				<option value="brokerage">Brokerage</option>
			</select>
			<input
				type="number"
				class="input w-30 no-spinner {balanceError ? 'ring-2 ring-error-500 border-error-500' : ''}"
				bind:value={account.balance}
				onfocus={(e) => e.currentTarget.select()}
				min="0"
				step="1000"
				aria-label="Balance"
			/>
			<select class="select w-30" bind:value={account.owner} aria-label="Owner">
				<option value="primary">Primary</option>
				<option value="spouse">Spouse</option>
				<option value="joint">Joint</option>
			</select>
			<input
				type="number"
				class="input w-24 no-spinner"
				value={Math.round((account.cost_basis_ratio ?? 0) * 100)}
				onfocus={(e) => e.currentTarget.select()}
				onchange={(e) => {
					const pct = Math.max(0, Math.min(100, Number(e.currentTarget.value) || 0));
					account.cost_basis_ratio = pct / 100;
					e.currentTarget.value = String(pct);
				}}
				min="0"
				max="100"
				step="1"
				aria-label="Cost Basis %"
			/>
			<input type="number" class="input w-20 no-spinner" bind:value={account.available_at_age} onfocus={(e) => e.currentTarget.select()} min="0" aria-label="Avail. Age" />
			<button
				class="btn preset-outlined btn-sm"
				onclick={() => removeAccount(i)}
				disabled={accounts.length <= 1}
			>✕</button>
		</div>
	{/each}
	<button class="btn preset-tonal self-start" onclick={addAccount}>+ Add Account</button>
</div>
