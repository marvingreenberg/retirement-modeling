<script lang="ts">
	import { portfolio } from '$lib/stores';
	import { portfolioSchema } from '$lib/schema';
	import type { Portfolio } from '$lib/types';

	let fileInput: HTMLInputElement;
	let loadError = $state('');

	function loadFile() {
		fileInput.click();
	}

	function handleFile(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		loadError = '';
		const reader = new FileReader();
		reader.onload = (e) => {
			try {
				const json = JSON.parse(e.target?.result as string);
				const result = portfolioSchema.safeParse(json);
				if (!result.success) {
					const msgs = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
					loadError = `Validation errors:\n${msgs.join('\n')}`;
					return;
				}
				portfolio.set(result.data as Portfolio);
			} catch {
				loadError = 'Invalid JSON file';
			}
		};
		reader.readAsText(file);
		input.value = '';
	}

	function saveFile() {
		let data: Portfolio;
		portfolio.subscribe((p) => (data = p))();
		const blob = new Blob([JSON.stringify(data!, null, 2)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'portfolio.json';
		a.click();
		URL.revokeObjectURL(url);
	}
</script>

<div class="controls">
	<input type="file" accept=".json" bind:this={fileInput} onchange={handleFile} hidden />
	<button onclick={loadFile}>Load Portfolio</button>
	<button onclick={saveFile}>Save Portfolio</button>
</div>
{#if loadError}
	<pre class="error">{loadError}</pre>
{/if}

<style>
	.controls {
		display: flex;
		gap: 0.75rem;
		margin-bottom: 1rem;
	}
	button {
		padding: 0.5rem 1rem;
		border: 1px solid #cbd5e1;
		background: #fff;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.85rem;
		color: #334155;
	}
	button:hover {
		background: #f1f5f9;
	}
	.error {
		color: #dc2626;
		font-size: 0.8rem;
		background: #fef2f2;
		padding: 0.5rem;
		border-radius: 4px;
		white-space: pre-wrap;
		margin-bottom: 1rem;
	}
</style>
