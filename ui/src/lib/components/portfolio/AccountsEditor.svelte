<script lang="ts">
	import type { Account } from '$lib/types';

	let { accounts = $bindable() }: { accounts: Account[] } = $props();

	let nextId = $state(accounts.length + 1);

	function addAccount() {
		accounts = [...accounts, {
			id: `account_${nextId++}`,
			name: '',
			balance: 0,
			type: 'brokerage',
			owner: 'primary',
			cost_basis_ratio: 1.0,
			available_at_age: 0,
		}];
	}

	function removeAccount(index: number) {
		accounts = accounts.filter((_, i) => i !== index);
	}
</script>

<div class="accounts">
	{#each accounts as account, i}
		<div class="account-row">
			<label>
				Name
				<input type="text" bind:value={account.name} placeholder="Account name" />
			</label>
			<label>
				Type
				<select bind:value={account.type}>
					<option value="pretax">Pre-tax</option>
					<option value="roth">Roth</option>
					<option value="brokerage">Brokerage</option>
				</select>
			</label>
			<label>
				Balance
				<input type="number" bind:value={account.balance} min="0" step="1000" />
			</label>
			<label>
				Owner
				<select bind:value={account.owner}>
					<option value="primary">Primary</option>
					<option value="spouse">Spouse</option>
					<option value="joint">Joint</option>
				</select>
			</label>
			<label>
				Cost Basis Ratio
				<input type="number" bind:value={account.cost_basis_ratio} min="0" max="1" step="0.01" />
			</label>
			<label>
				Available at Age
				<input type="number" bind:value={account.available_at_age} min="0" />
			</label>
			<button
				class="remove-btn"
				onclick={() => removeAccount(i)}
				disabled={accounts.length <= 1}
				title="Remove account"
			>✕</button>
		</div>
	{/each}
	<button class="add-btn" onclick={addAccount}>+ Add Account</button>
</div>

<style>
	.accounts {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	.account-row {
		display: flex;
		gap: 0.75rem;
		align-items: flex-end;
		padding: 0.75rem;
		background: #f8fafc;
		border-radius: 4px;
		flex-wrap: wrap;
	}
	label {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		font-size: 0.85rem;
		font-weight: 500;
		color: #475569;
	}
	input, select {
		padding: 0.4rem 0.5rem;
		border: 1px solid #cbd5e1;
		border-radius: 4px;
		font-size: 0.9rem;
	}
	input[type="text"] { width: 140px; }
	input[type="number"] { width: 120px; }
	select { width: 120px; }
	.remove-btn {
		padding: 0.4rem 0.6rem;
		border: 1px solid #fca5a5;
		background: #fff;
		color: #dc2626;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.85rem;
	}
	.remove-btn:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}
	.add-btn {
		padding: 0.5rem 1rem;
		border: 1px dashed #94a3b8;
		background: none;
		color: #475569;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.85rem;
		align-self: flex-start;
	}
	.add-btn:hover {
		background: #f1f5f9;
	}
</style>
