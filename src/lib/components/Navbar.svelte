<script lang="ts">
	import { resolve } from "$app/paths";
	import ModeSwitcher from "./ModeSwitcher.svelte";
	import { Debounced, onClickOutside } from "runed";
	import { getMatchingGameNames, searchByName } from "$lib/functions/search.remote";
	import type { Game } from "$lib/types";

	let searchElement = $state<HTMLElement>();
	let searchQuery = $state("");
	let searchResults = $state<Game[]>([]);
	let resultsPending = $state(false);
	let debouncedSearchQuery = new Debounced(() => searchQuery, 1000);
	const RESULTS_LIMIT = 10;

	// const convexClient = useConvexClient();

	$effect(() => {
		if (debouncedSearchQuery.pending || debouncedSearchQuery.current === "") {
			return;
		}

		console.log(`Searching for ${debouncedSearchQuery.current}...`);
		resultsPending = true;

		getMatchingGameNames({ query: debouncedSearchQuery.current, limit: RESULTS_LIMIT })
			.then((results) => {
				searchResults = [];

				if (!results || results.length === 0) {
					resultsPending = false;
					return;
				}

				for (const result of results) {
					searchByName({ query: result, limit: RESULTS_LIMIT })
						.then((games) => {
							if (!games) {
								resultsPending = false;
								return;
							}

							searchResults = [
								...searchResults,
								...games.filter((x) => !searchResults.find((existing) => existing._id === x._id))
							];

							resultsPending = false;

							console.log(`New games: ${games.map((x) => x.name).join(", ")}`);
						})
						.catch((reason) => `could not get any results for ${result}: ${reason}`);
				}
			})
			.catch((reason) => console.log(`could not get matching game names: ${reason}`));
	});

	onClickOutside(
		() => searchElement,
		() => {
			searchQuery = "";
			debouncedSearchQuery.updateImmediately();
		}
	);
</script>

<div class="navbar bg-base-300 shadow-sm">
	<div class="navbar-start">
		<a href={resolve("/")} class="btn btn-ghost text-xl">Game Site</a>
	</div>
	<div class="navbar-center w-lg">
		<details class="dropdown w-full" open={searchQuery !== ""} bind:this={searchElement}>
			<summary class="input input-md w-full">
				<span class="label">Search</span>
				<input type="text" placeholder="Search for a game..." bind:value={searchQuery} />
				<button
					class="label hover:text-base-content cursor-pointer"
					onclick={() => {
						searchQuery = "";
						debouncedSearchQuery.updateImmediately();
					}}>Clear</button
				>
			</summary>

			<ul class="menu dropdown-content bg-base-100 rounded-box z-1 w-lg p-2 shadow-sm">
				{#if resultsPending}
					<li><span class="skeleton skeleton-text">Loading...</span></li>
				{:else}
					{#each searchResults ?? [] as result (result._id)}
						<li>
							<a
								data-sveltekit-reload
								data-sveltekit-preload-data
								href={resolve(`/game-overview/${result.sortName}`)}
								onclick={() => (searchQuery = "")}
							>
								<span>{result.name}</span>
							</a>
						</li>
					{:else}
						<li><span>Nothing found.</span></li>
					{/each}
				{/if}
			</ul>
		</details>
	</div>
	<div class="navbar-end">
		<ModeSwitcher />
	</div>
</div>
