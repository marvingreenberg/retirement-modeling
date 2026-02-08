<script lang="ts">
	import PortfolioEditor from '$lib/components/portfolio/PortfolioEditor.svelte';
	import SimulateView from '$lib/components/SimulateView.svelte';
</script>

<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
	<section>
		<PortfolioEditor />
	</section>
	<section>
		<SimulateView />
	</section>
</div>
