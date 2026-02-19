<script lang="ts">
	import type { Account, AccountType, SimulationConfig } from '$lib/types';
	import { ACCOUNT_TYPE_DEFAULTS, ACCOUNT_TYPE_LABELS, EDITOR_ACCOUNT_TYPES, INDIVIDUAL_ONLY_TYPES, TAX_CATEGORY_MAP } from '$lib/types';
	import { validationErrors, formTouched } from '$lib/stores';
	import InfoPopover from '$lib/components/InfoPopover.svelte';
	import { ShieldCheck, Sprout, TrendingUp, Banknote } from 'lucide-svelte';

	let {
		accounts = $bindable(),
		config,
	}: {
		accounts: Account[];
		config?: SimulationConfig;
	} = $props();

	function ageToYear(age: number, owner: string): number {
		if (!config) return age;
		const ownerAge = owner === 'spouse' ? config.current_age_spouse : config.current_age_primary;
		return config.start_year + (age - ownerAge);
	}

	function yearToAge(year: number, owner: string): number {
		if (!config) return year;
		const ownerAge = owner === 'spouse' ? config.current_age_spouse : config.current_age_primary;
		return ownerAge + (year - config.start_year);
	}

	let nextId = $state(accounts.length + 1);

	function addAccount() {
		const num = nextId++;
		const type: AccountType = 'brokerage';
		const defaults = ACCOUNT_TYPE_DEFAULTS[type];
		accounts = [...accounts, {
			id: `account_${num}`,
			name: `Account ${num}`,
			balance: 0,
			type,
			owner: 'primary',
			cost_basis_ratio: defaults.cost_basis_ratio,
			available_at_age: defaults.default_available_age,
		}];
	}

	function removeAccount(index: number) {
		accounts = accounts.filter((_, i) => i !== index);
	}

	function handleTypeChange(i: number, newType: AccountType) {
		const account = { ...accounts[i] };
		account.type = newType;
		const defaults = ACCOUNT_TYPE_DEFAULTS[newType];
		account.cost_basis_ratio = defaults.cost_basis_ratio;
		account.available_at_age = defaults.default_available_age;
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
</script>

<div class="flex flex-col gap-1.5">
	{#if accounts.length > 0}
		<div class="flex gap-2 items-end px-2 text-xs font-medium text-surface-500 dark:text-surface-400">
			<span class="w-5"></span>
			<span class="w-44">Name</span>
			<span class="w-36">Type</span>
			<span class="w-30">Balance</span>
			<span class="w-30">Owner</span>
			<span class="w-24"><span class="flex items-center gap-1">Basis, as % <InfoPopover text="The portion of the account that represents original contributions (not gains). Affects capital gains tax on brokerage withdrawals." /></span></span>
			<span class="w-24">{config ? 'Avail. Year' : 'Avail. Age'}</span>
		</div>
	{/if}
	{#each accounts as account, i}
		{@const balanceError = hasError(`accounts.${i}.balance`)}
		{@const iconType = typeIcon(account.type)}
		<div class="flex gap-2 items-center p-2 bg-surface-100 dark:bg-surface-800 rounded flex-wrap">
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
			<input type="text" class="input w-44" bind:value={account.name} onfocus={(e) => e.currentTarget.select()} placeholder="Account name" aria-label="Name" />
			<select class="select w-36" value={account.type} aria-label="Type"
				onchange={(e) => handleTypeChange(i, (e.target as HTMLSelectElement).value as AccountType)}>
				{#each EDITOR_ACCOUNT_TYPES as t}
					<option value={t}>{ACCOUNT_TYPE_LABELS[t]}</option>
				{/each}
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
				{#if !INDIVIDUAL_ONLY_TYPES.has(account.type)}
					<option value="joint">Joint</option>
				{/if}
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
				aria-label="Basis, as %"
				disabled={!isCostBasisEditable(account.type)}
			/>
			{#if config}
				<div class="w-24">
					<input type="number" class="input w-full no-spinner"
						value={account.available_at_age ? ageToYear(account.available_at_age, account.owner) : ''}
						onfocus={(e) => e.currentTarget.select()}
						onchange={(e) => {
							const v = e.currentTarget.value;
							account.available_at_age = v ? yearToAge(Number(v), account.owner) : 0;
						}}
						placeholder={String(config.start_year)}
						aria-label="Avail. Year" />
					{#if (account.available_at_age ?? 0) > 0}
						<span class="text-xs text-surface-400">(age {account.available_at_age})</span>
					{/if}
				</div>
			{:else}
				<input type="number" class="input w-20 no-spinner" bind:value={account.available_at_age} onfocus={(e) => e.currentTarget.select()} min="0" aria-label="Avail. Age" />
			{/if}
			<button
				class="btn preset-outlined btn-sm"
				onclick={() => removeAccount(i)}
				disabled={accounts.length <= 1}
			>✕</button>
		</div>
	{/each}
	<button class="btn preset-tonal self-start" onclick={addAccount}>+ Add Account</button>
</div>
