import { STEAM_API_KEY } from "$env/static/private";
import { steamAPI } from "$lib/server/steam-api";
import type { ServerInit } from "@sveltejs/kit";
import { api } from "./convex/_generated/api";
import { convexClient } from "$lib/server";
import { Data, Effect } from "effect";

export class SteamAPIError extends Data.TaggedError("SteamAPIError")<{
	reason: unknown;
}> {}

export class AddGameError extends Data.TaggedError("AddGameError")<{
	reason: unknown;
}> {}

export const init: ServerInit = () =>
	Effect.runPromise(
		Effect.gen(function* () {
			yield* Effect.logInfo("Server started.");

			const games = yield* Effect.tryPromise({
				try: () => steamAPI("IStoreService").getAppList({ key: STEAM_API_KEY, maxResults: 100 }),
				catch: (reason) => new SteamAPIError({ reason })
			});

			for (const game of games) {
				const newGameID = yield* Effect.orElseSucceed(
					Effect.tryPromise(() => convexClient.action(api.games_node.addGame, { name: game.name })),
					() => null
				);

				if (!newGameID) {
					continue;
				}

				const newGame = yield* Effect.promise(() =>
					convexClient.query(api.games.get, { id: newGameID })
				);

				yield* Effect.logDebug(`Added ${newGameID}: ${newGame?.name}`);
			}
		}).pipe(
			Effect.catchAllCause((cause) =>
				Effect.logWarning(
					`Encountered an error, ignoring and continuing server start... reason: ${cause.toString()}`
				)
			)
		)
	);
