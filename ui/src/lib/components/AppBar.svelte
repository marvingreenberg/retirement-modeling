<script lang="ts">
   import { page } from '$app/state';
   import { AppBar as SkAppBar } from '@skeletonlabs/skeleton-svelte';
   import AvatarButton from './AvatarButton.svelte';
   import AvatarDropdown from './AvatarDropdown.svelte';
   import HelpDrawer from './HelpDrawer.svelte';
   import {
      LayoutDashboard,
      GitCompareArrows,
      Table,
      CircleHelp,
      LineChart,
   } from 'lucide-svelte';
   import { onMount } from 'svelte';

   const navItems = [
      { href: '/', label: 'Overview', icon: LayoutDashboard },
      { href: '/details', label: 'Details', icon: Table },
      { href: '/compare', label: 'Compare', icon: GitCompareArrows },
   ] as const;

   function isActive(href: string): boolean {
      if (href === '/') return page.url.pathname === '/';
      return page.url.pathname.startsWith(href);
   }

   let dropdownOpen = $state(false);
   let helpOpen = $state(false);
   let appVersion = $state('');

   onMount(async () => {
      try {
         const res = await fetch('/api/v1/status');
         if (res.ok) appVersion = (await res.json()).version ?? '';
      } catch {
         /* dev mode without backend */
      }
   });
</script>

<SkAppBar>
   <SkAppBar.Toolbar class="grid-cols-[auto_1fr_auto]">
      <SkAppBar.Lead>
         <a href="/" class="flex items-center gap-2 text-lg font-bold"
            ><LineChart size={22} />
            <span
               >Retirement Planner{#if appVersion}<span
                     class="block text-[9px] font-normal text-surface-400 leading-none"
                     >v{appVersion}</span
                  >{/if}</span
            ></a
         >
      </SkAppBar.Lead>
      <SkAppBar.Headline>
         <nav class="flex items-center justify-center gap-1">
            {#each navItems as { href, label, icon: Icon }}
               <a
                  {href}
                  class="btn btn-md flex items-center gap-1.5 {isActive(href)
                     ? 'preset-filled'
                     : 'preset-ghost'}"
                  aria-current={isActive(href) ? 'page' : undefined}
               >
                  <Icon size={18} />
                  {label}
               </a>
            {/each}
         </nav>
      </SkAppBar.Headline>
      <SkAppBar.Trail>
         <button
            class="btn btn-sm preset-ghost"
            color="dark cyan"
            onclick={() => (helpOpen = true)}
            aria-label="Open help"
         >
            <CircleHelp color="DarkCyan" size={36} />
         </button>
         <AvatarButton onclick={() => (dropdownOpen = !dropdownOpen)} />
      </SkAppBar.Trail>
   </SkAppBar.Toolbar>
</SkAppBar>

<AvatarDropdown bind:open={dropdownOpen} />
<HelpDrawer bind:open={helpOpen} />
