import { convexClient, steamGridDB } from "$server";
import { Effect, pipe, Schema } from "effect";
import { query } from "$app/server";
import { api } from "$convex/api";

const searchByNameSchema = Schema.Struct({
	query: Schema.NonEmptyString,
	limit: Schema.NullOr(Schema.Number)
});

export const getMatchingGameNames = query(
	Schema.standardSchemaV1(searchByNameSchema),
	async ({ query, limit }) =>
		Effect.runPromise(
			pipe(
				Effect.promise(() => steamGridDB.searchGame(query.trim())),
				Effect.tap((results) =>
					Effect.logInfo(`Query for ${query} yielded ${results.length} results`)
				),
				Effect.andThen((results) =>
					Effect.succeed(results.map((game) => game.name).slice(0, limit ?? 10))
				)
			)
		)
);

export const searchByName = query(
	Schema.standardSchemaV1(searchByNameSchema),
	async ({ query, limit }) =>
		Effect.runPromise(
			pipe(
				Effect.promise(() =>
					convexClient.action(api.games.search, {
						query,
						limit: limit ?? 10
					})
				),
				Effect.andThen((results) => Effect.succeed(results ?? []))
			)
		)
);
