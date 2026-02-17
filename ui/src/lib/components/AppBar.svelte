<script lang="ts">
	import { page } from '$app/state';
	import { AppBar as SkAppBar } from '@skeletonlabs/skeleton-svelte';
	import AvatarButton from './AvatarButton.svelte';
	import AvatarDropdown from './AvatarDropdown.svelte';
	import HelpDrawer from './HelpDrawer.svelte';
	import { LayoutDashboard, GitCompareArrows, Table, CircleHelp } from 'lucide-svelte';

	const navItems = [
		{ href: '/', label: 'Overview', icon: LayoutDashboard },
		{ href: '/compare', label: 'Compare', icon: GitCompareArrows },
		{ href: '/details', label: 'Details', icon: Table },
	] as const;

	function isActive(href: string): boolean {
		if (href === '/') return page.url.pathname === '/';
		return page.url.pathname.startsWith(href);
	}

	let dropdownOpen = $state(false);
	let helpOpen = $state(false);
</script>

<SkAppBar>
	<SkAppBar.Toolbar class="grid-cols-[auto_1fr_auto]">
		<SkAppBar.Lead>
			<a href="/" class="flex items-center gap-2 text-lg font-bold">Retirement Simulator</a>
		</SkAppBar.Lead>
		<SkAppBar.Headline>
			<nav class="flex items-center justify-center gap-1">
				{#each navItems as { href, label, icon: Icon }}
					<a
						{href}
						class="btn btn-sm flex items-center gap-1.5 {isActive(href) ? 'preset-filled' : 'preset-ghost'}"
						aria-current={isActive(href) ? 'page' : undefined}
					>
						<Icon size={16} />
						{label}
					</a>
				{/each}
			</nav>
		</SkAppBar.Headline>
		<SkAppBar.Trail>
			<button class="btn btn-sm preset-ghost" onclick={() => helpOpen = true} aria-label="Open help">
				<CircleHelp size={20} />
			</button>
			<AvatarButton onclick={() => dropdownOpen = !dropdownOpen} />
		</SkAppBar.Trail>
	</SkAppBar.Toolbar>
</SkAppBar>

<AvatarDropdown bind:open={dropdownOpen} />
<HelpDrawer bind:open={helpOpen} />
