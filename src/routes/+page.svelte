<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import Toolbar from '$lib/components/Toolbar.svelte';
	import InfoPanel from '$lib/components/InfoPanel.svelte';
	import Toast from '$lib/components/Toast.svelte';
	import ViewResultsButton from '$lib/components/ViewResultsButton.svelte';
	import type { SceneManager } from '$lib/three/scene';

	let container: HTMLDivElement;
	let sceneManager: SceneManager | null = null;

	onMount(async () => {
		if (!browser) return;
		const mod = await import('$lib/three/scene');
		sceneManager = new mod.SceneManager(container);
	});

	onDestroy(() => {
		sceneManager?.dispose();
	});
</script>

<div bind:this={container} class="fixed inset-0"></div>

<Toolbar />
<InfoPanel />
<Toast />
<ViewResultsButton />
