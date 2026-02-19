<script lang="ts">
	import type { Account, AccountType } from '$lib/types';
	import { ACCOUNT_TYPE_DEFAULTS, ACCOUNT_TYPE_LABELS, EDITOR_ACCOUNT_TYPES } from '$lib/types';
	import { parseOFX, type ParsedAccount } from '$lib/ofxParser';
	import { parseCSV } from '$lib/csvParser';
	import { summarizePortfolio, type PortfolioSummary } from '$lib/assetClassification';
	import { Upload, X, FileCheck, AlertCircle } from 'lucide-svelte';

	import { portfolio } from '$lib/stores';

	let { accounts = $bindable() }: { accounts: Account[] } = $props();

	let showModal = $state(false);
	let error = $state('');
	let parsedAccounts = $state<ParsedAccount[]>([]);
	let summaries = $state<PortfolioSummary[]>([]);
	let accountTypes = $state<(AccountType | '')[]>([]);
	let accountNames = $state<string[]>([]);

	let fileInput: HTMLInputElement | undefined = $state();

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
		const allParsed: ParsedAccount[] = [];
		const errors: string[] = [];

		for (const file of Array.from(files)) {
			try {
				const text = await file.text();
				const parsed = parseByExtension(text, file.name);
				allParsed.push(...parsed);
			} catch {
				errors.push(file.name);
			}
		}

		if (errors.length > 0) {
			error = `Could not load: ${errors.join(', ')}. Files may not be supported OFX/QFX/CSV exports.`;
		}

		if (allParsed.length > 0) {
			parsedAccounts = allParsed;
			summaries = allParsed.map((a) => summarizePortfolio(a.holdings, a.cash_balance));
			accountTypes = allParsed.map(() => '');
			accountNames = allParsed.map(
				(a) => `${a.broker !== 'unknown' ? a.broker + ' ' : ''}${a.account_id}`
			);
			showModal = true;
		}

		input.value = '';
	}

	function confirmImport() {
		const nextId = accounts.length + 1;
		const newAccounts: Account[] = parsedAccounts.map((parsed, i) => {
			const acctType = accountTypes[i] as AccountType;
			return {
				id: `import_${nextId + i}`,
				name: accountNames[i],
				balance: Math.round(parsed.total_value),
				type: acctType,
				owner: 'primary' as const,
				cost_basis_ratio: ACCOUNT_TYPE_DEFAULTS[acctType]?.cost_basis_ratio ?? 0.0,
				available_at_age: ACCOUNT_TYPE_DEFAULTS[acctType]?.default_available_age ?? 0,
			};
		});
		accounts = [...accounts, ...newAccounts];

		// Use blended estimated return from imported holdings to suggest growth rate
		const validSummaries = summaries.filter((s) => s.holdingsCount > 0);
		if (validSummaries.length > 0) {
			const totalValue = validSummaries.reduce((s, p) => s + p.totalValue, 0);
			const weightedReturn = validSummaries.reduce(
				(s, p) => s + p.estimatedReturn * p.totalValue, 0
			) / totalValue;
			if (weightedReturn > 0) {
				portfolio.update((p) => ({
					...p,
					config: { ...p.config, investment_growth_rate: Math.round(weightedReturn * 1000) / 1000 },
				}));
			}
		}

		showModal = false;
	}

	function cancel() {
		showModal = false;
		parsedAccounts = [];
		summaries = [];
		error = '';
	}

	let allTypesSet = $derived(accountTypes.length > 0 && accountTypes.every((t) => t !== ''));

	function formatMoney(n: number): string {
		return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
	}

	function formatPct(n: number): string {
		return (n * 100).toFixed(1) + '%';
	}
</script>

<input bind:this={fileInput} type="file" accept=".ofx,.qfx,.csv" multiple class="hidden" onchange={handleFile} />

<button class="btn preset-tonal self-start" onclick={openFilePicker}>
	<Upload size={16} />
	Import Accounts
</button>

{#if error}
	<div class="flex items-center gap-2 text-error-600 dark:text-error-400 text-sm mt-2">
		<AlertCircle size={16} />
		{error}
	</div>
{/if}

{#if showModal}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onclick={cancel}>
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

			{#each parsedAccounts as parsed, i}
				{@const summary = summaries[i]}
				<div class="bg-surface-100 dark:bg-surface-800 rounded p-4 space-y-3">
					<div class="flex items-center justify-between">
						<span class="text-sm text-surface-500">
							{parsed.broker !== 'unknown' ? parsed.broker : ''} Account {parsed.account_id}
							{#if parsed.as_of_date}
								<span class="text-xs ml-2">as of {parsed.as_of_date}</span>
							{/if}
						</span>
						<span class="font-semibold">{formatMoney(parsed.total_value)}</span>
					</div>

					<div class="flex gap-3 flex-wrap">
						<label class="flex flex-col gap-1 text-sm font-medium text-surface-600 dark:text-surface-400">
							Account Name
							<input type="text" class="input w-48" bind:value={accountNames[i]} />
						</label>
						<label class="flex flex-col gap-1 text-sm font-medium text-surface-600 dark:text-surface-400">
							Account Type
							<select class="select w-36" bind:value={accountTypes[i]}>
								<option value="" disabled>-- Select type --</option>
								{#each EDITOR_ACCOUNT_TYPES as t}
									<option value={t}>{ACCOUNT_TYPE_LABELS[t]}</option>
								{/each}
							</select>
						</label>
					</div>

					{#if summary}
						<div class="text-sm space-y-1">
							<div class="text-surface-500">
								{summary.holdingsCount} holdings + {formatMoney(summary.cashBalance)} cash
							</div>
							<div class="flex gap-3 text-xs text-surface-500">
								<span>Stocks: {formatPct(summary.stockPercent)}</span>
								<span>Bonds: {formatPct(summary.bondPercent)}</span>
								<span>Est. Return: {formatPct(summary.estimatedReturn)}</span>
							</div>
							<div class="flex flex-wrap gap-2 mt-1">
								{#each summary.allocation.slice(0, 5) as entry}
									<span class="badge preset-outlined-surface-500 text-xs">
										{entry.label}: {formatPct(entry.percent)}
									</span>
								{/each}
								{#if summary.allocation.length > 5}
									<span class="badge preset-outlined-surface-500 text-xs">
										+{summary.allocation.length - 5} more
									</span>
								{/if}
							</div>
						</div>
					{/if}
				</div>
			{/each}

			<div class="flex gap-3 justify-end pt-2">
				<button class="btn preset-tonal" onclick={cancel}>Cancel</button>
				<button class="btn preset-filled" onclick={confirmImport} disabled={!allTypesSet}>
					Add {parsedAccounts.length} Account{parsedAccounts.length > 1 ? 's' : ''}
				</button>
			</div>
		</div>
	</div>
{/if}
