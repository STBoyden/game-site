import { query, internalMutation, internalQuery, action } from "./_generated/server";
import { stream } from "convex-helpers/server/stream";
import type { Doc } from "./_generated/dataModel";
import { api, internal } from "./_generated/api";
import type { Merge, Simplify } from "type-fest";
import { Effect, Fiber, pipe } from "effect";
import { type SGDBGame } from "steamgriddb";
import { v } from "convex/values";
import schema from "./schema";

export const getAll = query({
	args: {},
	handler: (ctx) =>
		stream(ctx.db, schema)
			.query("games")
			.map(async (game) => {
				return {
					...game,
					hero: await ctx.storage.getUrl(game.hero),
					icon: await ctx.storage.getUrl(game.icon),
					grid: await ctx.storage.getUrl(game.grid)
				};
			})
			.collect()
});

export const get = query({
	args: v.object({ id: v.id("games") }),
	handler: (ctx, { id }) =>
		Effect.runPromise(
			Effect.gen(function* () {
				yield* Effect.logInfo(`Fetching game information for ID: ${id}`);
				return yield* Effect.promise(async () => {
					const game = await ctx.db.get(id);

					if (game) {
						return {
							...game,
							hero: await ctx.storage.getUrl(game.hero),
							icon: await ctx.storage.getUrl(game.icon),
							grid: await ctx.storage.getUrl(game.grid)
						};
					}
				});
			})
		)
});

export const getBySortName = query({
	args: v.object({ sortName: v.string() }),
	handler: async (ctx, { sortName }) =>
		Effect.runPromise(
			Effect.gen(function* () {
				yield* Effect.logInfo(`Fetching game information for sort name: ${sortName}`);
				return yield* Effect.promise(async () => {
					const game = await ctx.db
						.query("games")
						.withIndex("by_sortname", (q) => q.eq("sortName", sortName))
						.first();

					if (game) {
						return {
							...game,
							hero: await ctx.storage.getUrl(game.hero),
							icon: await ctx.storage.getUrl(game.icon),
							grid: await ctx.storage.getUrl(game.grid)
						};
					}
				});
			})
		)
});

export const searchByName = internalQuery({
	args: { query: v.string(), limit: v.nullable(v.number()) },
	handler: (ctx, args) =>
		Effect.runPromise(
			Effect.promise(() =>
				ctx.db
					.query("games")
					.withSearchIndex("search_title", (q) => q.search("name", args.query))
					.take(args.limit ?? 10)
			)
		)
});

export const search = action({
	args: v.object({ query: v.string(), limit: v.nullable(v.number()) }),
	handler: (
		ctx,
		args
	): Promise<
		| Simplify<
				Merge<Doc<"games">, { grid: string | null; icon: string | null; hero: string | null }>
		  >[]
		| null
	> =>
		Effect.runPromise(
			Effect.if(args.query !== "", {
				onTrue: () =>
					pipe(
						Effect.promise(() => ctx.runQuery(internal.games.searchByName, args)),
						Effect.tap((results) =>
							Effect.logInfo(`Searching by name ${args.query} yielded ${results.length} results`)
						),
						Effect.andThen((results) =>
							Effect.if(results?.length === 0, {
								onTrue: () =>
									pipe(
										Effect.promise(() =>
											ctx.runAction(api.games_node.addGame, { name: args.query })
										),
										Effect.andThen((gameID) =>
											Effect.if(gameID !== null, {
												onTrue: () =>
													pipe(
														Effect.promise(() => ctx.runQuery(api.games.get, { id: gameID! })),
														Effect.map((game) => [game!])
													),
												onFalse: () => Effect.succeed(null)
											})
										)
									),
								onFalse: () =>
									Fiber.join(
										Effect.runFork(
											Effect.forEach(results, (game) =>
												Effect.promise(async () => ({
													...game,
													grid: await ctx.storage.getUrl(game.grid),
													icon: await ctx.storage.getUrl(game.icon),
													hero: await ctx.storage.getUrl(game.hero)
												}))
											)
										)
									)
							})
						)
					),
				onFalse: () => Effect.succeed(null)
			})
		)
});

export const addGameMutation = internalMutation({
	args: {
		name: v.string(),
		sortName: v.string(),
		gameInformation: v.object({
			data: v.any(),
			gridID: v.id("_storage"),
			iconID: v.id("_storage"),
			heroID: v.id("_storage")
		})
	},
	handler: async (ctx, { name, sortName, gameInformation }) => {
		const { data: _data, gridID: grid, iconID: icon, heroID: hero } = gameInformation;
		const data = _data as SGDBGame;

		return ctx.db.insert("games", {
			name,
			sortName,
			releaseDate: data.release_date,
			grid,
			icon,
			hero
		});
	}
});

export const fileBySha256 = internalQuery({
	args: v.object({ sha256: v.string() }),
	handler: async (ctx, args) => {
		return (await ctx.db.system.query("_storage").collect()).find((x) => x.sha256 === args.sha256);
	}
});
