<script lang="ts">
	import { buildingState, showResults } from '$lib/stores/buildingStore.svelte';
</script>

{#if buildingState.selectedBuilding && !buildingState.infoPanelVisible}
	<button
		id="btn-view-results"
		onclick={showResults}
		class="fixed bottom-7 left-1/2 z-[15] -translate-x-1/2 whitespace-nowrap rounded-xl border-none bg-gradient-to-r from-[#f0c040] to-[#e8a820] px-9 py-3.5 text-base font-semibold text-[#1a1a2e] shadow-lg shadow-[#f0c040]/30 transition-all duration-200 active:scale-95"
		style="letter-spacing:0.5px"
	>
		📋 查看匹配结果 (<span>{buildingState.matchCount}</span>户)
	</button>
{/if}
