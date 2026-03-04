<script lang="ts">
   import { profile } from '$lib/stores';
   import { avatarSrc } from '$lib/avatar.svelte';
   import { Avatar } from '@skeletonlabs/skeleton-svelte';
   import { User } from 'lucide-svelte';

   let { onclick }: { onclick: () => void } = $props();

   let src = $derived(
      avatarSrc(profile.value.primaryName, profile.value.avatarSvg),
   );
   let imgFailed = $state(false);
   $effect(() => {
      src;
      imgFailed = false;
   });
   let showImage = $derived(!!src && !imgFailed);
</script>

<button class="cursor-pointer" {onclick} aria-label="Open profile">
   <Avatar>
      {#if showImage}
         <Avatar.Image
            {src}
            alt="User avatar"
            onerror={() => (imgFailed = true)}
         />
      {/if}
      <Avatar.Fallback>
         <User size={20} />
      </Avatar.Fallback>
   </Avatar>
</button>
