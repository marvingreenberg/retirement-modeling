<script lang="ts">
	let { text, targetEl }: { text: string; targetEl: HTMLElement | null } = $props();

	let top = $state(0);
	let left = $state(0);
	let caretLeft = $state(0);

	const tooltipWidth = 280;

	$effect(() => {
		if (!targetEl) return;
		const rect = targetEl.getBoundingClientRect();
		top = rect.bottom + 8;
		const centered = rect.left + rect.width / 2 - tooltipWidth / 2;
		left = Math.max(8, Math.min(centered, window.innerWidth - tooltipWidth - 8));
		caretLeft = rect.left + rect.width / 2 - left;
	});
</script>

{#if targetEl}
	<div
		class="fixed z-[100] w-70 bg-surface-900 dark:bg-surface-50 text-surface-50 dark:text-surface-900 text-sm rounded-lg shadow-xl px-4 py-3"
		style="top: {top}px; left: {left}px;"
		role="tooltip"
	>
		<div
			class="absolute -top-1.5 w-3 h-3 bg-surface-900 dark:bg-surface-50 rotate-45"
			style="left: {caretLeft}px;"
		></div>
		<p>{text}</p>
	</div>
{/if}
