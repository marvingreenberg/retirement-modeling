<script lang="ts">
   import type { Chart } from 'chart.js';
   import type { ChartEvent, YearResult } from '$lib/types';
   import { EVENT_ICON_MAP } from '$lib/chartEventIcons';
   import { compactCurrency } from '$lib/format';

   let {
      chart = undefined,
      events = [],
      years = [],
      getYValue,
   }: {
      chart?: Chart;
      events: ChartEvent[];
      years: YearResult[];
      getYValue: (idx: number) => number;
   } = $props();

   interface Marker {
      event: ChartEvent;
      x: number;
      y: number;
      idx: number;
   }

   let resizeTick = $state(0);
   let hoveredIdx: number | null = $state(null);

   $effect(() => {
      if (!chart?.canvas) return;
      const ro = new ResizeObserver(() => {
         resizeTick++;
      });
      ro.observe(chart.canvas);
      return () => ro.disconnect();
   });

   const markers: Marker[] = $derived.by(() => {
      void resizeTick;
      if (!chart || !years.length || !events.length) return [];

      const xScale = chart.scales?.x;
      const yScale = chart.scales?.y;
      if (!xScale || !yScale) return [];

      const raw: Marker[] = [];
      for (let i = 0; i < events.length; i++) {
         const ev = events[i];
         const yearIdx = years.findIndex((y) => y.year === ev.year);
         if (yearIdx < 0) continue;
         const x = xScale.getPixelForValue(yearIdx);
         const yVal = getYValue(yearIdx);
         const y = yScale.getPixelForValue(yVal);
         raw.push({ event: ev, x, y, idx: i });
      }

      // Group by x pixel (same year) and stagger vertically
      const byYear: Record<number, Marker[]> = {};
      for (const m of raw) {
         const key = Math.round(m.x);
         (byYear[key] ??= []).push(m);
      }
      const result: Marker[] = [];
      for (const group of Object.values(byYear)) {
         for (let j = 0; j < group.length; j++) {
            result.push({
               ...group[j],
               y: group[j].y - 20 - j * 28,
            });
         }
      }
      return result;
   });

   function popoverStyle(
      m: Marker,
      container: HTMLDivElement | undefined,
   ): string {
      if (!container) return '';
      const rect = container.getBoundingClientRect();
      const popW = 200;
      let left = m.x - popW / 2;
      if (left + popW > rect.width) left = rect.width - popW - 4;
      if (left < 4) left = 4;

      // Show above marker by default, flip below if near top
      let top = m.y - 80;
      if (top < 4) top = m.y + 28;

      return `left:${left}px;top:${top}px;width:${popW}px`;
   }

   let containerEl: HTMLDivElement | undefined = $state();
</script>

<div
   bind:this={containerEl}
   class="pointer-events-none absolute inset-0 overflow-hidden"
>
   {#each markers as m (m.idx)}
      {@const config = EVENT_ICON_MAP[m.event.kind]}
      {@const Icon = config.icon}
      <button
         class="pointer-events-auto absolute flex items-center justify-center rounded-full border-2 shadow-sm transition-transform hover:scale-110"
         style="left:{m.x - 12}px;top:{m.y -
            12}px;width:24px;height:24px;border-color:{config.color};background:{config.bg}"
         aria-label={m.event.tooltip}
         onmouseenter={() => (hoveredIdx = m.idx)}
         onmouseleave={() => (hoveredIdx = null)}
         onfocus={() => (hoveredIdx = m.idx)}
         onblur={() => (hoveredIdx = null)}
      >
         <Icon size={14} color={config.color} />
      </button>
   {/each}

   {#if hoveredIdx != null}
      {@const m = markers.find((mk) => mk.idx === hoveredIdx)}
      {#if m}
         {@const yr = years.find((y) => y.year === m.event.year)}
         <div
            class="pointer-events-none absolute z-50 rounded-md border border-surface-300 bg-surface-100 px-3 py-2 text-sm shadow-lg dark:border-surface-600 dark:bg-surface-800"
            style={popoverStyle(m, containerEl)}
         >
            {#if yr}
               <div class="font-semibold">{yr.year} (Age {yr.age_primary})</div>
               <div class="text-surface-600 dark:text-surface-300">
                  {m.event.tooltip}
               </div>
               <div class="mt-1 font-medium">
                  {compactCurrency(yr.total_balance)}
               </div>
            {:else}
               <div>{m.event.tooltip}</div>
            {/if}
         </div>
      {/if}
   {/if}
</div>
