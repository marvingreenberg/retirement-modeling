<script lang="ts">
	import type { Account } from '$lib/types';
	import { validationErrors, formTouched } from '$lib/stores';

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
	{#each accounts as account, i}
		{@const balanceError = hasError(`accounts.${i}.balance`)}
		<div class="flex gap-3 items-end p-3 bg-surface-100 dark:bg-surface-800 rounded flex-wrap">
			<label class="flex flex-col gap-1 text-sm font-medium text-surface-600 dark:text-surface-400">
				Name
				<input type="text" class="input w-36" bind:value={account.name} placeholder="Account name" />
			</label>
			<label class="flex flex-col gap-1 text-sm font-medium text-surface-600 dark:text-surface-400">
				Type
				<select class="select w-30" bind:value={account.type}>
					<option value="pretax">Pre-tax</option>
					<option value="roth">Roth</option>
					<option value="brokerage">Brokerage</option>
				</select>
			</label>
			<label class="flex flex-col gap-1 text-sm font-medium {balanceError ? 'text-error-600 dark:text-error-400' : 'text-surface-600 dark:text-surface-400'}">
				Balance
				<input
					type="number"
					class="input w-30 no-spinner {balanceError ? 'ring-2 ring-error-500 border-error-500' : ''}"
					bind:value={account.balance}
					min="0"
					step="1000"
				/>
			</label>
			<label class="flex flex-col gap-1 text-sm font-medium text-surface-600 dark:text-surface-400">
				Owner
				<select class="select w-30" bind:value={account.owner}>
					<option value="primary">Primary</option>
					<option value="spouse">Spouse</option>
					<option value="joint">Joint</option>
				</select>
			</label>
			<label class="flex flex-col gap-1 text-sm font-medium text-surface-600 dark:text-surface-400">
				Cost Basis %
				<input
					type="number"
					class="input w-24 no-spinner"
					value={Math.round((account.cost_basis_ratio ?? 0) * 100)}
					onchange={(e) => {
						const pct = Math.max(0, Math.min(100, Number(e.currentTarget.value) || 0));
						account.cost_basis_ratio = pct / 100;
						e.currentTarget.value = String(pct);
					}}
					min="0"
					max="100"
					step="1"
				/>
			</label>
			<label class="flex flex-col gap-1 text-sm font-medium text-surface-600 dark:text-surface-400">
				Avail. Age
				<input type="number" class="input w-20 no-spinner" bind:value={account.available_at_age} min="0" />
			</label>
			<button
				class="btn preset-outlined btn-sm"
				onclick={() => removeAccount(i)}
				disabled={accounts.length <= 1}
			>✕</button>
		</div>
	{/each}
	<button class="btn preset-tonal self-start" onclick={addAccount}>+ Add Account</button>
</div>
