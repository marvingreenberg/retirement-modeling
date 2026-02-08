<script lang="ts">
	import { Avatar } from '@skeletonlabs/skeleton-svelte';
	import { User } from 'lucide-svelte';
</script>

<Avatar>
	<Avatar.Fallback>
		<User size={20} />
	</Avatar.Fallback>
</Avatar>
