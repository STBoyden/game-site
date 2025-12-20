import { Effect, pipe, Schema, Option } from "effect";
import { convexClient, steamGridDB } from "$server";
import { query } from "$app/server";
import { api } from "$convex/api";

const searchByNameSchema = Schema.Struct({
	query: Schema.NonEmptyString,
	limit: Schema.optionalToRequired(Schema.Number, Schema.Number, {
		decode: (maybeLimit) => Option.getOrElse(maybeLimit, () => 10),
		encode: (limit) => Option.some(limit)
	})
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
					Effect.succeed(results.map((game) => game.name).slice(0, limit))
				)
			)
		)
);

export const searchByName = query(
	Schema.standardSchemaV1(searchByNameSchema),
	async ({ query, limit }) =>
		Effect.runPromise(
			pipe(
				Effect.promise(() => convexClient.action(api.games.search, { query, limit })),
				Effect.andThen((results) => Effect.succeed(results ?? []))
			)
		)
);
