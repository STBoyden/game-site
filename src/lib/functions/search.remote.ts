import { effectfulBatchQuery, effectfulQuery } from "$server/utils/remote-functions.effect";
import { convexClient, steamGridDB } from "$server";
import { Effect, Schema, Option } from "effect";
import { api } from "$convex/api";

const searchByNameSchema = Schema.Struct({
	query: Schema.NonEmptyString,
	limit: Schema.optionalToRequired(Schema.Number, Schema.Number, {
		decode: (maybeLimit) => Option.getOrElse(maybeLimit, () => 10),
		encode: (limit) => Option.some(limit)
	})
});

export const getMatchingGameNames = effectfulQuery(searchByNameSchema, ({ query, limit }) =>
	Effect.gen(function* () {
		const results = yield* Effect.tryPromise(() => steamGridDB.searchGame(query.trim()));
		yield* Effect.logInfo(`Query for ${query} yielded ${results.length} results`);

		return results.map((game) => game.name).slice(0, limit);
	}).pipe(Effect.withLogSpan("get matching game names"))
);

export const searchByName = effectfulQuery(searchByNameSchema, ({ query, limit }) =>
	Effect.gen(function* () {
		const results = yield* Effect.tryPromise(() =>
			convexClient.action(api.games.search, { query, limit })
		);

		yield* Effect.logInfo(`Convex had ${results?.length ?? 0} result(s)`);

		return results ?? [];
	}).pipe(Effect.withLogSpan("search by name"))
);
