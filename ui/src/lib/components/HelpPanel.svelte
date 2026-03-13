<script lang="ts">
   import { helpState, closeHelp } from '$lib/helpState.svelte';
   import {
      helpCategories,
      getTopicMeta,
      getCategoryForTopic,
   } from '$lib/helpTopics';
   import { getTopicHtml } from '$lib/helpContent';
   import {
      searchHelp,
      highlightTerms,
      type SearchResult,
   } from '$lib/helpSearch';
   import {
      X,
      Maximize2,
      Minimize2,
      BookOpen,
      ChevronDown,
      ChevronRight,
      Search,
      XCircle,
   } from 'lucide-svelte';
   import { tick } from 'svelte';
   import { SvelteSet } from 'svelte/reactivity';

   let maximized = $state(false);
   let contentEl: HTMLDivElement | undefined = $state();
   let searchInput = $state('');
   let searchQuery = $state('');
   let searchResults: SearchResult[] = $state([]);

   function submitSearch() {
      searchQuery = searchInput.trim();
      searchResults = searchHelp(searchQuery);
   }

   function clearSearch() {
      searchInput = '';
      searchQuery = '';
      searchResults = [];
   }

   const expandedCategories = new SvelteSet<string>();

   $effect(() => {
      if (helpState.open) {
         maximized = false;
         expandedCategories.clear();
         const cat = getCategoryForTopic(helpState.topic);
         if (cat) expandedCategories.add(cat.id);
      }
   });

   $effect(() => {
      if (helpState.open) {
         clearSearch();
      }
   });

   let topicHtml = $derived.by(() => {
      const html = getTopicHtml(helpState.topic);
      return searchQuery ? highlightTerms(html, searchQuery) : html;
   });
   let topicMeta = $derived(getTopicMeta(helpState.topic));
   let relatedTopics = $derived(
      (topicMeta?.related ?? [])
         .map((id) => getTopicMeta(id))
         .filter((t): t is NonNullable<typeof t> => t != null),
   );

   function toggleCategory(catId: string) {
      if (expandedCategories.has(catId)) expandedCategories.delete(catId);
      else expandedCategories.add(catId);
   }

   async function selectTopic(id: string) {
      helpState.topic = id;
      helpState.anchor = undefined;
      await tick();
      contentEl?.scrollTo?.(0, 0);
   }

   async function scrollToAnchor() {
      if (!helpState.anchor || !contentEl) return;
      await tick();
      const el = contentEl.querySelector(`#${CSS.escape(helpState.anchor)}`);
      el?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
      helpState.anchor = undefined;
   }

   $effect(() => {
      if (helpState.anchor && contentEl) {
         scrollToAnchor();
      }
   });

   function handleBackdrop(e: MouseEvent) {
      if (e.target === e.currentTarget) closeHelp();
   }

   function handleKeydown(e: KeyboardEvent) {
      if (e.key === 'Escape') closeHelp();
   }
</script>

{#if helpState.open}
   <!-- svelte-ignore a11y_no_static_element_interactions -->
   <div
      class="fixed inset-0 bg-black/40 z-50"
      onclick={handleBackdrop}
      onkeydown={handleKeydown}
   >
      <aside
         class="absolute right-0 top-0 h-full bg-surface-50 dark:bg-surface-900 shadow-xl flex flex-col transition-all duration-200"
         class:w-full={maximized}
         class:max-w-none={maximized}
         class:w-[420px]={!maximized}
         aria-label="Help"
      >
         <!-- Header -->
         <div
            class="flex items-center justify-between p-4 border-b border-surface-200 dark:border-surface-700 shrink-0 gap-2"
         >
            <h2
               class="text-lg font-semibold text-surface-900 dark:text-surface-50 flex items-center gap-2 shrink-0"
            >
               <BookOpen size={20} class="text-primary-500" /> Help
            </h2>
            <form
               class="flex items-center gap-1 flex-1 max-w-[200px]"
               onsubmit={(e) => {
                  e.preventDefault();
                  submitSearch();
               }}
            >
               <div class="relative flex-1">
                  <input
                     type="text"
                     placeholder="Search help..."
                     class="input w-full text-xs pr-6 py-1"
                     bind:value={searchInput}
                  />
                  {#if searchInput}
                     <button
                        type="button"
                        class="absolute right-1 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
                        onclick={clearSearch}
                        aria-label="Clear search"
                     >
                        <XCircle size={14} />
                     </button>
                  {/if}
               </div>
               <button
                  type="submit"
                  class="btn btn-sm preset-ghost p-1"
                  aria-label="Search"
               >
                  <Search size={16} />
               </button>
            </form>
            <div class="flex items-center gap-1 shrink-0">
               <button
                  class="btn btn-sm preset-ghost"
                  onclick={() => (maximized = !maximized)}
                  aria-label={maximized ? 'Minimize help' : 'Maximize help'}
               >
                  {#if maximized}<Minimize2 size={16} />{:else}<Maximize2
                        size={16}
                     />{/if}
               </button>
               <button
                  class="btn btn-sm preset-ghost"
                  onclick={() => closeHelp()}
                  aria-label="Close help"
               >
                  <X size={18} />
               </button>
            </div>
         </div>

         <!-- Nav: search results or accordion -->
         {#if searchQuery}
            <nav
               class="shrink-0 border-b border-surface-200 dark:border-surface-700 p-3 overflow-y-auto max-h-[30%]"
               aria-label="Search results"
            >
               {#if searchResults.length === 0}
                  <p class="text-sm text-surface-500 italic">
                     No results for "{searchQuery}"
                  </p>
               {:else}
                  <p class="text-xs text-surface-500 mb-2">
                     {searchResults.length}
                     {searchResults.length === 1 ? 'result' : 'results'} for "{searchQuery}"
                  </p>
                  {#each searchResults as result (result.topicId + ':' + result.headingId)}
                     <button
                        class="block w-full text-left text-sm py-1 px-2 rounded hover:bg-surface-200 dark:hover:bg-surface-800 {helpState.topic ===
                        result.topicId
                           ? 'text-primary-600 dark:text-primary-400'
                           : 'text-surface-700 dark:text-surface-300'}"
                        onclick={async () => {
                           helpState.topic = result.topicId;
                           helpState.anchor = result.headingId;
                           await tick();
                           scrollToAnchor();
                        }}
                     >
                        <span class="font-medium">{result.topicName}</span>
                        <span class="text-surface-400 mx-1">&rsaquo;</span>
                        <span>{result.sectionTitle}</span>
                     </button>
                  {/each}
               {/if}
            </nav>
         {:else}
            <nav
               class="shrink-0 border-b border-surface-200 dark:border-surface-700 p-3 overflow-y-auto max-h-[30%]"
               aria-label="Help topics"
            >
               {#each helpCategories as cat (cat.id)}
                  <div class="mb-1">
                     <button
                        class="flex items-center gap-1 w-full text-left text-sm font-medium text-surface-700 dark:text-surface-300 hover:text-surface-900 dark:hover:text-surface-100 py-0.5"
                        onclick={() => toggleCategory(cat.id)}
                     >
                        {#if expandedCategories.has(cat.id)}<ChevronDown
                              size={14}
                           />{:else}<ChevronRight size={14} />{/if}
                        {cat.name}
                     </button>
                     {#if expandedCategories.has(cat.id)}
                        <div class="flex gap-1 flex-wrap pl-5 py-1">
                           {#each cat.topics as topic (topic.id)}
                              <button
                                 class="px-2 py-0.5 text-xs rounded {helpState.topic ===
                                 topic.id
                                    ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 font-medium'
                                    : 'text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-800'}"
                                 onclick={() => selectTopic(topic.id)}
                              >
                                 {topic.name}
                              </button>
                           {/each}
                        </div>
                     {/if}
                  </div>
               {/each}
            </nav>
         {/if}

         <!-- Content -->
         <div bind:this={contentEl} class="flex-1 overflow-y-auto p-5">
            {#if topicMeta}
               <h3
                  class="text-base font-semibold text-surface-900 dark:text-surface-50 mb-4"
               >
                  {topicMeta.name}
               </h3>
            {/if}
            <div
               class="prose-help text-sm text-surface-700 dark:text-surface-300 leading-relaxed space-y-3"
            >
               <!-- eslint-disable-next-line svelte/no-at-html-tags -- trusted app-authored help content -->
               {@html topicHtml}
            </div>

            {#if relatedTopics.length > 0}
               <div
                  class="mt-6 pt-4 border-t border-surface-200 dark:border-surface-700"
               >
                  <span class="text-xs text-surface-500 uppercase tracking-wide"
                     >Related Topics</span
                  >
                  <div class="flex gap-2 mt-2 flex-wrap">
                     {#each relatedTopics as related (related.id)}
                        <button
                           class="btn btn-sm preset-ghost text-primary-500"
                           onclick={() => selectTopic(related.id)}
                        >
                           {related.name} &rarr;
                        </button>
                     {/each}
                  </div>
               </div>
            {/if}
         </div>
      </aside>
   </div>
{/if}
