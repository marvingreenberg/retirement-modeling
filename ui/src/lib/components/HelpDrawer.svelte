<script lang="ts">
   import { page } from '$app/state';
   import {
      helpTopics,
      getTopicById,
      getDefaultTopicId,
   } from '$lib/helpContent';
   import { X, Maximize2, Minimize2, BookOpen } from 'lucide-svelte';

   let { open = $bindable(false) }: { open: boolean } = $props();

   let maximized = $state(false);
   let currentTopicId = $state('spending-strategies');

   $effect(() => {
      if (open) {
         currentTopicId = getDefaultTopicId(page.url.pathname);
         maximized = false;
      }
   });

   let currentTopic = $derived(getTopicById(currentTopicId));
   let relatedTopics = $derived(
      (currentTopic?.relatedTopics ?? [])
         .map((id) => getTopicById(id))
         .filter((t): t is NonNullable<typeof t> => t != null),
   );

   function selectTopic(id: string) {
      currentTopicId = id;
   }

   function handleBackdrop(e: MouseEvent) {
      if (e.target === e.currentTarget) open = false;
   }

   function handleKeydown(e: KeyboardEvent) {
      if (e.key === 'Escape') open = false;
   }
</script>

{#if open}
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
            class="flex items-center justify-between p-4 border-b border-surface-200 dark:border-surface-700 shrink-0"
         >
            <h2
               class="text-lg font-semibold text-surface-900 dark:text-surface-50 flex items-center gap-2"
            >
               <BookOpen size={20} class="text-primary-500" /> Help
            </h2>
            <div class="flex items-center gap-1">
               <button
                  class="btn btn-sm preset-ghost"
                  onclick={() => (maximized = !maximized)}
                  aria-label={maximized ? 'Minimize help' : 'Maximize help'}
               >
                  {#if maximized}
                     <Minimize2 size={16} />
                  {:else}
                     <Maximize2 size={16} />
                  {/if}
               </button>
               <button
                  class="btn btn-sm preset-ghost"
                  onclick={() => (open = false)}
                  aria-label="Close help"
               >
                  <X size={18} />
               </button>
            </div>
         </div>

         <div class="flex flex-1 overflow-hidden" class:flex-col={!maximized}>
            <!-- Topic nav -->
            <nav
               class="shrink-0 border-surface-200 dark:border-surface-700 overflow-y-auto"
               class:border-b={!maximized}
               class:p-3={!maximized}
               class:border-r={maximized}
               class:p-4={maximized}
               class:w-64={maximized}
               aria-label="Help topics"
            >
               {#if !maximized}
                  <div class="flex gap-1 flex-wrap">
                     {#each helpTopics as topic (topic.id)}
                        <button
                           class="btn btn-sm {currentTopicId === topic.id
                              ? 'preset-filled'
                              : 'preset-ghost'}"
                           onclick={() => selectTopic(topic.id)}
                        >
                           {topic.title}
                        </button>
                     {/each}
                  </div>
               {:else}
                  <ul class="space-y-1">
                     {#each helpTopics as topic (topic.id)}
                        <li>
                           <button
                              class="w-full text-left text-sm px-3 py-2 rounded {currentTopicId ===
                              topic.id
                                 ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 font-medium'
                                 : 'text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-800'}"
                              onclick={() => selectTopic(topic.id)}
                           >
                              {topic.title}
                           </button>
                        </li>
                     {/each}
                  </ul>
               {/if}
            </nav>

            <!-- Content -->
            <div class="flex-1 overflow-y-auto p-5">
               {#if currentTopic}
                  <h3
                     class="text-base font-semibold text-surface-900 dark:text-surface-50 mb-4"
                  >
                     {currentTopic.title}
                  </h3>
                  <div
                     class="prose-help text-sm text-surface-700 dark:text-surface-300 leading-relaxed space-y-3"
                  >
                     <!-- eslint-disable-next-line svelte/no-at-html-tags -- trusted app-authored help content -->
                     {@html currentTopic.content}
                  </div>

                  {#if relatedTopics.length > 0}
                     <div
                        class="mt-6 pt-4 border-t border-surface-200 dark:border-surface-700"
                     >
                        <span
                           class="text-xs text-surface-500 uppercase tracking-wide"
                           >Related Topics</span
                        >
                        <div class="flex gap-2 mt-2 flex-wrap">
                           {#each relatedTopics as related (related.id)}
                              <button
                                 class="btn btn-sm preset-ghost text-primary-500"
                                 onclick={() => selectTopic(related.id)}
                              >
                                 {related.title} &rarr;
                              </button>
                           {/each}
                        </div>
                     </div>
                  {/if}
               {/if}
            </div>
         </div>
      </aside>
   </div>
{/if}
