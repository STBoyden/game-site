<script lang="ts">
	import "./layout.css";
	import { PUBLIC_CONVEX_URL } from "$env/static/public";
	import { setupConvex } from "convex-svelte";
	import favicon from "$lib/assets/favicon.svg";
	import { ModeWatcher } from "mode-watcher";
	import Navbar from "$lib/components/Navbar.svelte";

	setupConvex(PUBLIC_CONVEX_URL);

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Game Site</title>
</svelte:head>

<ModeWatcher />
<Navbar />
<div class="prose p-4">
	{@render children()}
</div>
