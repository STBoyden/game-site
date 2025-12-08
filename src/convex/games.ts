import { query, internalMutation, internalQuery } from "./functions";

import type { Doc } from "./_generated/dataModel";
import { api, internal } from "./_generated/api";
import type { Merge, Simplify } from "type-fest";
import { action } from "./_generated/server";
import { Effect, Fiber, pipe } from "effect";
import { type SGDBGame } from "steamgriddb";
import { v } from "convex/values";

export const getAll = query({
	args: {},
	handler: (ctx) =>
		ctx.table("games").map(async (game) => ({
			...game,
			hero: await ctx.storage.getUrl(game.heroId),
			icon: await ctx.storage.getUrl(game.iconId),
			grid: await ctx.storage.getUrl(game.gridId)
		}))
});

export const get = query({
	args: v.object({ id: v.id("games") }),
	handler: (ctx, { id }) =>
		Effect.runPromise(
			pipe(
				Effect.promise(() => ctx.table("games").get(id)),
				Effect.andThen((game) =>
					Effect.if(game !== null, {
						onTrue: () =>
							Effect.promise(async () => ({
								...game!,
								hero: await ctx.storage.getUrl(game!.heroId),
								icon: await ctx.storage.getUrl(game!.iconId),
								grid: await ctx.storage.getUrl(game!.gridId)
							})),
						onFalse: () => Effect.succeed(null)
					})
				)
			)
		)
});

export const getBySortName = query({
	args: v.object({ sortName: v.string() }),
	handler: async (ctx, { sortName }) =>
		Effect.runPromise(
			pipe(
				Effect.promise(() =>
					ctx.table("games", "sortName", (q) => q.eq("sortName", sortName)).first()
				),
				Effect.andThen((game) =>
					Effect.if(game !== null, {
						onTrue: () =>
							Effect.promise(async () => ({
								...game!,
								hero: await ctx.storage.getUrl(game!.heroId),
								icon: await ctx.storage.getUrl(game!.iconId),
								grid: await ctx.storage.getUrl(game!.gridId)
							})),
						onFalse: () => Effect.succeed(null)
					})
				)
			)
		)
});

export const searchByName = internalQuery({
	args: { query: v.string(), limit: v.nullable(v.number()) },
	handler: (ctx, args) =>
		Effect.runPromise(
			Effect.promise(() =>
				ctx
					.table("games")
					.search("search_title", (q) => q.search("name", args.query))
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
													grid: await ctx.storage.getUrl(game.gridId),
													icon: await ctx.storage.getUrl(game.iconId),
													hero: await ctx.storage.getUrl(game.heroId)
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
	handler: async (ctx, { name, sortName, gameInformation }) =>
		Effect.runPromise(
			pipe(
				Effect.succeed(() => {
					const { data: _data, gridID: gridId, iconID: iconId, heroID: heroId } = gameInformation;
					const data = _data as SGDBGame;

					return { data, gridId, iconId, heroId };
				}),
				Effect.andThen((success) => success()),
				Effect.andThen(({ data, gridId, iconId, heroId }) =>
					Effect.promise(() =>
						ctx.table("games").insert({
							name,
							sortName,
							releaseDate: data.release_date,
							gridId,
							iconId,
							heroId
						})
					)
				)
			)
		)
});

export const fileBySha256 = internalQuery({
	args: v.object({ sha256: v.string() }),
	handler: async (ctx, args) => {
		return (await ctx.db.system.query("_storage").collect()).find((x) => x.sha256 === args.sha256);
	}
});
