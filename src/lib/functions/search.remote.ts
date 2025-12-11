import { convexClient, steamGridDB } from "$server";
import { Effect, pipe, Schema } from "effect";
import { query } from "$app/server";
import { api } from "$convex/api";

const searchByNameSchema = Schema.Struct({ query: Schema.NonEmptyTrimmedString });

export const getMatchingGameNames = query(
	Schema.standardSchemaV1(searchByNameSchema),
	async ({ query }) =>
		Effect.runPromise(
			pipe(
				Effect.promise(() => steamGridDB.searchGame(query)),
				Effect.tap((results) =>
					Effect.logInfo(`Query for ${query} yielded ${results.length} results`)
				),
				Effect.andThen((results) => Effect.succeed(results.map((game) => game.name)))
			)
		)
);

export const searchByName = query(Schema.standardSchemaV1(searchByNameSchema), async ({ query }) =>
	Effect.runPromise(
		pipe(
			Effect.promise(() => convexClient.action(api.games.search, { query })),
			Effect.andThen((results) => Effect.succeed(results ?? []))
		)
	)
);
