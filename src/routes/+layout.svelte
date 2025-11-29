<script lang="ts">
	import './layout.css';
	import {PUBLIC_CONVEX_URL} from "$env/static/public";
	import { setupConvex } from 'convex-svelte';
	import favicon from '$lib/assets/favicon.svg';

	setupConvex(PUBLIC_CONVEX_URL);

 	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}
