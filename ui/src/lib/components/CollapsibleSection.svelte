<script lang="ts">
	let { title, open = $bindable(false), children } = $props<{
		title: string;
		open?: boolean;
		children: any;
	}>();
</script>

<section class="collapsible">
	<button class="header" onclick={() => (open = !open)}>
		<span class="arrow" class:open>{open ? '▼' : '▶'}</span>
		<span class="title">{title}</span>
	</button>
	{#if open}
		<div class="content">
			{@render children()}
		</div>
	{/if}
</section>

<style>
	.collapsible {
		border: 1px solid #e2e8f0;
		border-radius: 6px;
		margin-bottom: 0.75rem;
	}
	.header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
		padding: 0.75rem 1rem;
		border: none;
		background: #f8fafc;
		cursor: pointer;
		font-size: 0.95rem;
		font-weight: 600;
		color: #334155;
		border-radius: 6px;
	}
	.header:hover {
		background: #f1f5f9;
	}
	.arrow {
		font-size: 0.7rem;
		color: #94a3b8;
	}
	.content {
		padding: 1rem;
		border-top: 1px solid #e2e8f0;
	}
</style>
