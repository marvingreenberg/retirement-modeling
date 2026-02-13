<script lang="ts">
	import { page } from '$app/state';
	import { AppBar as SkAppBar } from '@skeletonlabs/skeleton-svelte';
	import DarkModeToggle from './DarkModeToggle.svelte';
	import AvatarButton from './AvatarButton.svelte';
	import { Home, UtensilsCrossed, GitCompareArrows, Table } from 'lucide-svelte';

	const navItems = [
		{ href: '/', label: 'Home', icon: Home },
		{ href: '/budget', label: 'Budget', icon: UtensilsCrossed },
		{ href: '/compare', label: 'Compare', icon: GitCompareArrows },
		{ href: '/details', label: 'Details', icon: Table },
	] as const;

	function isActive(href: string): boolean {
		if (href === '/') return page.url.pathname === '/';
		return page.url.pathname.startsWith(href);
	}
</script>

<SkAppBar>
	<SkAppBar.Toolbar>
		<SkAppBar.Lead>
			<a href="/" class="flex items-center gap-2 text-lg font-bold">Retirement Simulator</a>
		</SkAppBar.Lead>
		<SkAppBar.Headline>
			<nav class="flex items-center gap-1">
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
			<DarkModeToggle />
			<AvatarButton />
		</SkAppBar.Trail>
	</SkAppBar.Toolbar>
</SkAppBar>
