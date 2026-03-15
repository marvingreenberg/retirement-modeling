<script lang="ts">
   let { rate }: { rate: number } = $props();

   let isGreen = $derived(rate >= 0.9);
   let isYellow = $derived(rate >= 0.7 && rate < 0.9);
   let isRed = $derived(rate < 0.7);
   let textColor = $derived(
      isGreen ? '#16a34a' : isYellow ? '#ca8a04' : '#dc2626',
   );
</script>

<span class="inline-flex items-center gap-1">
   <svg
      viewBox="0 0 52 20"
      class="inline-block h-5"
      role="img"
      aria-label="Success rate: {Math.round(rate * 100)}%"
   >
      <rect
         x="0.5"
         y="0.5"
         width="51"
         height="19"
         rx="4"
         class="fill-surface-500 dark:fill-surface-700 stroke-surface-400 dark:stroke-surface-600"
         stroke-width="1"
      />
      <circle cx="10" cy="10" r="6" fill={isRed ? '#ef4444' : '#6b3030'} />
      {#if isRed}
         <circle cx="10" cy="10" r="6" fill="url(#glowRed)" />
      {/if}
      <circle cx="26" cy="10" r="6" fill={isYellow ? '#eab308' : '#5c5020'} />
      {#if isYellow}
         <circle cx="26" cy="10" r="6" fill="url(#glowYellow)" />
      {/if}
      <circle cx="42" cy="10" r="6" fill={isGreen ? '#22c55e' : '#1a5030'} />
      {#if isGreen}
         <circle cx="42" cy="10" r="6" fill="url(#glowGreen)" />
      {/if}
      <defs>
         <radialGradient id="glowRed">
            <stop offset="0%" stop-color="#fca5a5" stop-opacity="0.8" />
            <stop offset="50%" stop-color="#ef4444" stop-opacity="0.6" />
            <stop offset="100%" stop-color="#ef4444" stop-opacity="0" />
         </radialGradient>
         <radialGradient id="glowYellow">
            <stop offset="0%" stop-color="#fde68a" stop-opacity="0.8" />
            <stop offset="50%" stop-color="#eab308" stop-opacity="0.6" />
            <stop offset="100%" stop-color="#eab308" stop-opacity="0" />
         </radialGradient>
         <radialGradient id="glowGreen">
            <stop offset="0%" stop-color="#86efac" stop-opacity="0.8" />
            <stop offset="50%" stop-color="#22c55e" stop-opacity="0.6" />
            <stop offset="100%" stop-color="#22c55e" stop-opacity="0" />
         </radialGradient>
      </defs>
   </svg>
   <span style="color: {textColor}">{Math.round(rate * 100)}%</span>
</span>
