<script lang="ts">
	import { buildingState, selectBuilding, focusBuilding, searchByNumber, clearSelection } from '$lib/stores/buildingStore.svelte';
	import { toast } from '$lib/utils/toast.svelte';

	let searchValue = $state('');

	function onSearchKeydown(e: KeyboardEvent) {
		if (e.key !== 'Enter') return;
		const val = searchValue.trim();
		if (!val) return;
		const key = searchByNumber(val);
		if (!key) {
			toast.show(`未找到编号 ${val}`);
			return;
		}
		selectBuilding(key);
		focusBuilding(key);
	}
</script>

<div
	id="toolbar"
	class="fixed top-3 left-1/2 z-10 flex items-center gap-2.5 rounded-xl bg-black/75 px-4 py-2 backdrop-blur-lg"
	style="transform:translateX(-50%)"
>
	<h1 class="whitespace-nowrap text-base font-semibold text-white">🏠 宋村回迁房源分配图</h1>
	<input
		bind:value={searchValue}
		onkeydown={onSearchKeydown}
		type="text"
		placeholder="输入户号搜索..."
		autocomplete="off"
		class="w-40 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white outline-none placeholder:text-white/40 focus:border-[#f0c040]"
	/>
</div>
