<script lang="ts" module>
   let narrow = $state(false);

   export function isNarrow(): boolean {
      return narrow;
   }
</script>

<script lang="ts">
   import { onMount } from 'svelte';
   import { Monitor } from 'lucide-svelte';

   onMount(() => {
      const mql = window.matchMedia('(max-width: 767px)');
      narrow = mql.matches;
      const onChange = (e: MediaQueryListEvent) => {
         narrow = e.matches;
      };
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
   });
</script>

{#if narrow}
   <div
      class="fixed inset-0 z-[60] flex items-center justify-center bg-surface-900/95 p-8"
      data-testid="portrait-blocker"
   >
      <div class="text-center space-y-4 max-w-sm">
         <Monitor class="mx-auto h-16 w-16 text-primary-400" />
         <p class="text-lg text-surface-100">
            This app requires a landscape layout and works best on a larger
            screen.
         </p>
      </div>
   </div>
{/if}
