<script lang="ts">
	import { getGameStoreContext } from "$lib/client/GameStore.svelte";

	const { params } = $props();

	const gameStore = getGameStoreContext();
</script>

{#if gameStore.isLoading}{:else}
	{@const game = gameStore.gamesMap.get(params.sortName)}
	<div class="hero min-h-1/2" style="background-image: url({game?.hero})">
		<div class="hero-overlay"></div>
		<div class="hero-content text-neutral-content text-center">
			<div class="max-w-md">
				<h1 class="mb-5 text-5xl font-bold">{game?.name}</h1>
				<p class="mb-5">
					Provident cupiditate voluptatem et in. Quaerat fugiat ut assumenda excepturi
					exercitationem quasi. In deleniti eaque aut repudiandae et a id nisi.
				</p>
				<button class="btn btn-primary">Get Started</button>
			</div>
		</div>
	</div>
{/if}
