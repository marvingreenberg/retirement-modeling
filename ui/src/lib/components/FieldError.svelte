<script lang="ts">
	let { message }: { message?: string } = $props();
</script>

{#if message}
	<span class="text-error-500 text-xs mt-0.5">{message}</span>
{/if}
