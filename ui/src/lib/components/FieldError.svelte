<script lang="ts">
	let { message }: { message?: string } = $props();
</script>

{#if message}
	<span class="error">{message}</span>
{/if}

<style>
	.error {
		color: #dc2626;
		font-size: 0.8rem;
		margin-top: 0.15rem;
	}
</style>
