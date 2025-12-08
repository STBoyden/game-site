<script lang="ts">
	import { resolve } from "$app/paths";
	import { getGameStoreContext } from "$lib/client/GameStore.svelte";
	// import { ArrowLeft, ArrowRight } from "@lucide/svelte";
	import { ScrollState } from "runed";

	type Game = Awaited<typeof gamesStore.games>[number];

	let carouselElement = $state<HTMLElement>();
	const gamesStore = getGameStoreContext();
	const carouselScroll = new ScrollState({ element: () => carouselElement });

	// const scroll = (direction: "left" | "right") => {
	// 	if (direction === "left") {
	// 		carouselScroll.x -= 320;
	// 	} else {
	// 		carouselScroll.x += 320;
	// 	}
	// };
</script>

{#snippet gameCard(game: Game)}
	<div class="align-middle justify-center items-center flex flex-col gap-4 h-fit">
		<div class="hover-3d w-fit aspect-2/3 hover:z-10">
			<span class="rounded-box align-middle items-center justify-center flex bg-black">
				<img src={game.grid!} alt={game.name} placeholder="skeleton" />
			</span>

			<div></div>
			<div></div>
			<div></div>
			<div></div>
			<div></div>
			<div></div>
			<div></div>
			<div></div>
		</div>

		<p class="text-lg text-center font-semibold">{game.name}</p>
	</div>
{/snippet}

{#snippet gameCardSkeleton()}
	<div class="align-middle justify-center items-center flex flex-col gap-4 p-2 h-full w-full">
		<div class="rounded-box skeleton aspect-2/3 h-full w-full"></div>

		<p class="skeleton skeleton-text text-lg font-semibold">Loading...</p>
	</div>
{/snippet}

<div class="p-4">
	<div
		bind:this={carouselElement}
		class="carousel carousel-center w-full bg-base-200 p-2 space-x-2 border-base-300 border-2 rounded-box"
		onwheel={(event) => {
			if (event.deltaY > 0) {
				carouselScroll.x += 320;
			} else if (event.deltaY < 0) {
				carouselScroll.x -= 320;
			}
		}}
	>
		{#if gamesStore.isLoading}
			<span class="carousel-item"></span>
			{#each new Array(10).fill(null) as _, index (index)}
				<div class="carousel-item w-xs rounded-box bg-base-300 pb-2">
					{@render gameCardSkeleton()}
				</div>
			{/each}
		{:else}
			{#each gamesStore.games as game (game._id)}
				<a
					class="carousel-item max-w-xs rounded-box bg-base-300 pb-2 cursor-pointer"
					data-sveltekit-preload-data
					href={resolve(`/game-overview/${game.sortName}`)}
				>
					{@render gameCard(game)}
				</a>
			{/each}
		{/if}

		<!-- <div class="z-1 px-5 left-5 right-5 top-1/2 flex -translate-y-1/2 transform justify-between">
			<button class="btn btn-circle bg-base-300/90" onclick={() => scroll("left")}>
				<ArrowLeft class="w-[1em] h-[1em]" />
			</button>
			<button class="btn btn-circle bg-base-300/90" onclick={() => scroll("right")}>
				<ArrowRight class="w-[1em] h-[1em]" />
			</button>
		</div> -->
	</div>
</div>
