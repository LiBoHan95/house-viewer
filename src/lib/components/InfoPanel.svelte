<script lang="ts">
	import { DATA } from '$lib/data/houseData';
	import {
		buildingState,
		clearSelection,
		getCrossReferenceNumbers
	} from '$lib/stores/buildingStore.svelte';
	import { copyText } from '$lib/utils/clipboard';
	import { toast } from '$lib/utils/toast.svelte';

	interface TableRow {
		num: string;
		addr133: string;
		addr87: string;
		addr60: string;
		hl133: boolean;
		hl87: boolean;
		hl60: boolean;
	}

	let allRows = $derived.by<TableRow[]>(() => {
		if (!buildingState.selectedBuilding || !buildingState.infoPanelVisible) return [];

		const srcKey = buildingState.selectedBuilding;
		const bld = DATA.buildings.find((b) => b.key === srcKey);
		if (!bld) return [];

		if (buildingState.secondaryBuilding && buildingState.infoPanelMode === 'cross') {
			const nums = getCrossReferenceNumbers(srcKey, buildingState.secondaryBuilding);
			return nums.map((num) => {
				const info = DATA.indexByNumber[num];
				if (!info) return null;
				return {
					num,
					addr133: info['133'],
					addr87: info['87'],
					addr60: info['60'],
					hl133: true,
					hl87: true,
					hl60: true
				};
			}).filter(Boolean) as TableRow[];
		}

		const nums133 = DATA.building133[srcKey] || [];
		const nums87 = DATA.building87[srcKey] || [];
		const allNums = new Set<string>();

		for (const num of nums133) allNums.add(num);
		for (const num of nums87) allNums.add(num);

		const pairedKeys = buildingState.pairedBuildings;
		for (const pk of pairedKeys) {
			for (const num of (DATA.building133[pk] || [])) allNums.add(num);
			for (const num of (DATA.building87[pk] || [])) allNums.add(num);
		}

		const sorted = Array.from(allNums).sort((a, b) => Number(a) - Number(b));
		return sorted.map((num) => {
			const info = DATA.indexByNumber[num];
			if (!info) return null;
			const hl133 = info['133'].startsWith(srcKey) || pairedKeys.some((p) => info['133'].startsWith(p));
			const hl87 = info['87'].startsWith(srcKey) || pairedKeys.some((p) => info['87'].startsWith(p));
			const hl60 = info['60'].startsWith(srcKey) || pairedKeys.some((p) => info['60'].startsWith(p));
			return { num, addr133: info['133'], addr87: info['87'], addr60: info['60'], hl133, hl87, hl60 };
		}).filter(Boolean) as TableRow[];
	});

	const pageSize = 50;
	let page = $state(1);
	let totalPages = $derived(Math.max(1, Math.ceil(allRows.length / pageSize)));
	let rows = $derived(allRows.slice((page - 1) * pageSize, page * pageSize));

	$effect(() => {
		if (buildingState.selectedBuilding) page = 1;
	});

	function goToPage(p: number) {
		if (p >= 1 && p <= totalPages) page = p;
	}

	let titleText = $derived.by(() => {
		if (!buildingState.selectedBuilding) return '📋 选择楼栋查看详情';
		const bld = DATA.buildings.find((b) => b.key === buildingState.selectedBuilding);
		if (!bld) return '';
		if (buildingState.secondaryBuilding && buildingState.infoPanelMode === 'cross') {
			const secBld = DATA.buildings.find((b) => b.key === buildingState.secondaryBuilding);
			return `📋 ${bld.zone}${bld.building}号楼 × ${secBld?.zone}${secBld?.building}号楼 (交叉筛选)`;
		}
		const sizeType = bld.count133 > 0 ? '133㎡' : '87㎡+60㎡';
		return `📋 ${bld.zone}${bld.building}号楼 (${sizeType})`;
	});

	function onRowClick(e: MouseEvent) {
		const tr = (e.target as HTMLElement).closest('tr');
		if (!tr) return;
		const cells = tr.querySelectorAll('td');
		if (cells.length < 4) return;
		const text = `编号: ${cells[0].textContent}, 133㎡: ${cells[1].textContent}, 87㎡: ${cells[2].textContent}, 60㎡: ${cells[3].textContent}`;
		copyText(text).then(() => toast.show('已复制'));
	}

	function onCopyAll() {
		const lines = ['编号\t133㎡\t87㎡\t60㎡'];
		for (const row of allRows) {
			lines.push(`${row.num}\t${row.addr133}\t${row.addr87}\t${row.addr60}`);
		}
		if (lines.length === 1) return;
		copyText(lines.join('\n')).then(() => toast.show('已复制全部'));
	}
</script>

{#if buildingState.infoPanelVisible}
	<div
		id="info-panel"
		class="fixed bottom-0 left-0 right-0 z-10 max-h-[50vh] overflow-y-auto border-t border-white/10 bg-black/85 backdrop-blur-lg"
	>
		<div class="sticky top-0 z-10 flex items-center gap-4 border-b border-white/10 bg-black/90 px-5 py-2.5 text-sm text-white">
			<span>{titleText}</span>
			<span class="text-[#f0c040]">{allRows.length} 户</span>
			<button
				onclick={onCopyAll}
				class="cursor-pointer rounded-md border border-[#f0c040] bg-[rgba(240,192,64,.15)] px-2.5 py-1 text-xs text-[#f0c040] transition-colors hover:bg-[rgba(240,192,64,.3)]"
			>
				📋 复制全部
			</button>
			<button
				onclick={clearSelection}
				class="ml-auto cursor-pointer border-none bg-transparent text-base text-white"
			>
				✕
			</button>
		</div>
		<table class="w-full border-collapse text-sm text-[#ddd]">
			<thead>
				<tr class="sticky top-10 bg-[rgba(255,255,255,.08)]">
					<th class="px-3 py-2 text-left">编号</th>
					<th class="px-3 py-2 text-left">133㎡</th>
					<th class="px-3 py-2 text-left">87㎡</th>
					<th class="px-3 py-2 text-left">60㎡</th>
				</tr>
			</thead>
			<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_noninteractive_element_interactions -->
			<tbody onclick={onRowClick}>
				{#each rows as row (row.num)}
					<tr class="cursor-pointer transition-colors hover:bg-[rgba(240,192,64,.1)]">
						<td class="border-b border-white/5 px-3 py-1.5">{row.num}</td>
						<td class="border-b border-white/5 px-3 py-1.5" class:text-[#f0c040]={row.hl133}>{row.addr133}</td>
						<td class="border-b border-white/5 px-3 py-1.5" class:text-[#f0c040]={row.hl87}>{row.addr87}</td>
						<td class="border-b border-white/5 px-3 py-1.5" class:text-[#f0c040]={row.hl60}>{row.addr60}</td>
					</tr>
				{/each}
			</tbody>
		</table>
		{#if totalPages > 1}
			<div class="flex items-center justify-center gap-3 border-t border-white/10 py-2 text-sm text-[#aaa]">
				<button
					onclick={() => goToPage(page - 1)}
					disabled={page <= 1}
					class="cursor-pointer rounded border border-white/20 bg-white/5 px-3 py-1 transition-colors hover:bg-white/15 disabled:cursor-default disabled:opacity-30"
				>
					上一页
				</button>
				<span>第 {page} / {totalPages} 页</span>
				<button
					onclick={() => goToPage(page + 1)}
					disabled={page >= totalPages}
					class="cursor-pointer rounded border border-white/20 bg-white/5 px-3 py-1 transition-colors hover:bg-white/15 disabled:cursor-default disabled:opacity-30"
				>
					下一页
				</button>
			</div>
		{/if}
	</div>
{/if}
