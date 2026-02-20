<script lang="ts">
   let { text }: { text: string } = $props();

   let open = $state(false);
   let popoverEl: HTMLDivElement | undefined = $state();

   function toggle(e: MouseEvent) {
      e.stopPropagation();
      open = !open;
   }

   function handleClickOutside(e: MouseEvent) {
      if (open && popoverEl && !popoverEl.contains(e.target as Node)) {
         open = false;
      }
   }

   $effect(() => {
      if (open) {
         document.addEventListener('click', handleClickOutside, true);
         return () =>
            document.removeEventListener('click', handleClickOutside, true);
      }
   });
</script>

<span class="relative inline-flex items-center">
   <button
      class="inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold leading-none bg-surface-300 dark:bg-surface-600 text-surface-600 dark:text-surface-300 hover:bg-surface-400 dark:hover:bg-surface-500 cursor-pointer"
      onclick={toggle}
      aria-label="More info"
      type="button">i</button
   >
   {#if open}
      <div
         bind:this={popoverEl}
         class="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 rounded-lg shadow-lg bg-surface-50 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 text-sm text-surface-700 dark:text-surface-300"
      >
         {text}
      </div>
   {/if}
</span>
