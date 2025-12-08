<script lang="ts">
	import { resolve } from "$app/paths";
	import ModeSwitcher from "./ModeSwitcher.svelte";
	import { Debounced, onClickOutside } from "runed";
	import { useConvexClient } from "convex-svelte";
	import { api } from "../../convex/_generated/api";

	let searchElement = $state<HTMLElement>();
	let searchQuery = $state("");
	let debouncedSearchQuery = new Debounced(() => searchQuery, 500);

	const convexClient = useConvexClient();

	const searchResults = $derived.by(() => {
		if (debouncedSearchQuery.pending) {
			return null;
		}

		console.log(`Searching for ${debouncedSearchQuery.current}...`);

		return convexClient.action(api.games.search, {
			query: debouncedSearchQuery.current,
			limit: null
		});
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
				<svelte:boundary>
					{#each (await searchResults) ?? [] as result (result._id)}
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
					{/each}

					{#snippet pending()}
						<li><span class="skeleton skeleton-text">Loading...</span></li>
					{/snippet}
				</svelte:boundary>
			</ul>
		</details>
	</div>
	<div class="navbar-end">
		<ModeSwitcher />
	</div>
</div>
