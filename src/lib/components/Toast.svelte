<script lang="ts">
	import { toast } from '$lib/utils/toast.svelte';
</script>

{#if toast.visible}
	<div class="pointer-events-none fixed left-1/2 top-1/2 z-[99] -translate-x-1/2 -translate-y-1/2 rounded-lg bg-black/85 px-6 py-2.5 text-sm text-[#f0c040] opacity-100 transition-opacity duration-200">
		{toast.message}
	</div>
{/if}
