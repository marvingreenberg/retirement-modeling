<script lang="ts">
	import { page } from '$app/state';
	import { AppBar as SkAppBar } from '@skeletonlabs/skeleton-svelte';
	import AvatarButton from './AvatarButton.svelte';
	import ProfileDrawer from './ProfileDrawer.svelte';
	import { LayoutDashboard, GitCompareArrows, Table, Wallet } from 'lucide-svelte';

	const navItems = [
		{ href: '/', label: 'Overview', icon: LayoutDashboard },
		{ href: '/spending', label: 'Spending', icon: Wallet },
		{ href: '/compare', label: 'Compare', icon: GitCompareArrows },
		{ href: '/details', label: 'Details', icon: Table },
	] as const;

	function isActive(href: string): boolean {
		if (href === '/') return page.url.pathname === '/';
		return page.url.pathname.startsWith(href);
	}

	let drawerOpen = $state(false);
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
						data-tour={label.toLowerCase()}
					>
						<Icon size={16} />
						{label}
					</a>
				{/each}
			</nav>
		</SkAppBar.Headline>
		<SkAppBar.Trail>
			<span data-tour="profile">
				<AvatarButton onclick={() => drawerOpen = !drawerOpen} />
			</span>
		</SkAppBar.Trail>
	</SkAppBar.Toolbar>
</SkAppBar>

<ProfileDrawer bind:open={drawerOpen} />
