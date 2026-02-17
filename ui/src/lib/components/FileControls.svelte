<script lang="ts">
	import { portfolio, samplePortfolio } from '$lib/stores';
	import { portfolioSchema } from '$lib/schema';
	import type { Portfolio } from '$lib/types';

	function loadSample() {
		portfolio.set(structuredClone(samplePortfolio));
	}

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
					loadError = 'Invalid portfolio file — may be pre-version 0.10.0 data.';
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

<div class="flex gap-3 mb-4">
	<input type="file" accept=".json" bind:this={fileInput} onchange={handleFile} hidden />
	<button class="btn preset-tonal" onclick={loadSample}>Load Sample Data</button>
	<button class="btn preset-tonal" onclick={loadFile}>Load Portfolio</button>
	<button class="btn preset-tonal" onclick={saveFile}>Save Portfolio</button>
</div>
{#if loadError}
	<pre class="text-sm text-error-500 bg-error-50 dark:bg-error-950 p-3 rounded mb-4 whitespace-pre-wrap">{loadError}</pre>
{/if}
