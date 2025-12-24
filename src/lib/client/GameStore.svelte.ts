import { getContext, setContext } from "svelte";
import { SvelteMap } from "svelte/reactivity";
import { useQuery } from "convex-svelte";
import { api } from "$convex/api";

export class GameStore {
	private gamesQuery = useQuery(api.games.getAll, {});

	readonly isLoading = $derived(this.gamesQuery.isLoading);
	readonly error = $derived(this.gamesQuery.error);

	readonly games = $derived.by(() => {
		if (this.gamesQuery.data) {
			return this.gamesQuery.data;
		}

		return [];
	});

	readonly gamesMap = $derived.by(() => {
		return new SvelteMap(this.games.map(game => [game.sortName, game]));
	});
}

const KEY = "$_game_store";

export const setGameStoreContext = () => {
	const instance = new GameStore();
	return setContext(KEY, instance);
};

export const getGameStoreContext = () => {
	return getContext<GameStore>(KEY);
};
