<script lang="ts">
	import { BarChart3 } from 'lucide-svelte';
</script>

<div class="flex flex-col items-center justify-center text-center py-16 px-8 space-y-4">
	<div class="text-surface-300 dark:text-surface-600">
		<BarChart3 size={64} strokeWidth={1.5} />
	</div>
	<h2 class="text-xl font-semibold text-surface-700 dark:text-surface-300">Ready to simulate</h2>
	<p class="text-surface-500 max-w-md">
		Configure your portfolio on the left, then click <strong>Simulate</strong> to see projected outcomes here.
	</p>
	<p class="text-sm text-surface-400">
		New here? Try <strong>Load Sample Data</strong> for a realistic starting scenario.
	</p>
</div>
