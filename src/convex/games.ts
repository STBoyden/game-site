import { query, internalMutation, internalQuery } from "./functions";
import { api, internal } from "./_generated/api";
import { action } from "./_generated/server";
import type { Id } from "$convex/dataModel";
import { Effect, pipe } from "effect";
import type { Game } from "./types";
import { v } from "convex/values";
import { steamGridDB } from ".";

export const getAll = query({
	args: {},
	handler: (ctx) =>
		ctx.table("games").map(
			async (game) =>
				({
					...game,
					hero: game.heroID !== undefined ? await ctx.storage.getUrl(game.heroID) : null,
					icon: game.iconID !== undefined ? await ctx.storage.getUrl(game.iconID) : null,
					grid: game.gridID !== undefined ? await ctx.storage.getUrl(game.gridID) : null
				}) as Game
		)
});

export const getAllByIDs = query({
	args: { ids: v.array(v.id("games")) },
	handler: (ctx, args) =>
		Effect.runPromise(
			pipe(
				Effect.promise(() => ctx.table("games").getMany(args.ids)),
				Effect.andThen((results) =>
					Effect.promise(() =>
						Promise.all(
							results
								.filter((x) => x !== null)
								.map(
									async (game) =>
										({
											...game,
											hero:
												game.heroID !== undefined ? await ctx.storage.getUrl(game.heroID) : null,
											icon:
												game.iconID !== undefined ? await ctx.storage.getUrl(game.iconID) : null,
											grid: game.gridID !== undefined ? await ctx.storage.getUrl(game.gridID) : null
										}) as Game
								)
						)
					)
				)
			)
		)
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
							Effect.promise(
								async () =>
									({
										...game!,
										hero: game?.heroID !== undefined ? await ctx.storage.getUrl(game.heroID) : null,
										icon: game?.iconID !== undefined ? await ctx.storage.getUrl(game.iconID) : null,
										grid: game?.gridID !== undefined ? await ctx.storage.getUrl(game.gridID) : null
									}) as Game
							),
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
							Effect.promise(
								async () =>
									({
										...game!,
										hero: game?.heroID !== undefined ? await ctx.storage.getUrl(game.heroID) : null,
										icon: game?.iconID !== undefined ? await ctx.storage.getUrl(game.iconID) : null,
										grid: game?.gridID !== undefined ? await ctx.storage.getUrl(game.gridID) : null
									}) as Game
							),
						onFalse: () => Effect.succeed(null)
					})
				)
			)
		)
});

export const searchByName = internalQuery({
	args: v.object({ query: v.string(), limit: v.optional(v.number()) }),
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
	args: v.object({ query: v.string(), limit: v.optional(v.number()) }),
	handler: (ctx, args): Promise<Game[] | null> =>
		Effect.runPromise(
			Effect.gen(function* () {
				if (args.query === "") {
					return yield* Effect.succeed(null);
				}

				const results = yield* Effect.tryPromise(() =>
					ctx.runQuery(internal.games.searchByName, args)
				);

				yield* Effect.logInfo(
					`Searching by name ${args.query} yielded ${results.length} existing results.`
				);

				const fork = Effect.fork(
					Effect.gen(function* () {
						const names = yield* Effect.tryPromise(() =>
							steamGridDB.searchGame(args.query).then((x) => x.map((game) => game.name))
						);

						const ids = yield* Effect.tryPromise(() =>
							ctx.runAction(api.games_node.addGames, { names })
						);

						return ids.length !== 0
							? yield* Effect.tryPromise(() => ctx.runQuery(api.games.getAllByIDs, { ids }))
							: null;
					})
				);

				if (results?.length === 0) {
					return yield* yield* fork;
				} else {
					const mapped = yield* Effect.forEach(results, (game) =>
						Effect.promise(
							async () =>
								({
									...game,
									hero: game?.heroID !== undefined ? await ctx.storage.getUrl(game.heroID) : null,
									icon: game?.iconID !== undefined ? await ctx.storage.getUrl(game.iconID) : null,
									grid: game?.gridID !== undefined ? await ctx.storage.getUrl(game.gridID) : null
								}) as Game
						)
					);

					const extra = yield* yield* fork;
					if (extra) {
						return [...mapped, ...extra];
					} else {
						return mapped;
					}
				}
			})
		)
});

export const addGameArtwork = internalMutation({
	args: v.object({
		gameID: v.id("games"),
		gridID: v.id("_storage"),
		iconID: v.id("_storage"),
		heroID: v.id("_storage")
	}),
	handler: (ctx, { gameID, gridID, iconID, heroID }) =>
		Effect.runPromise(
			pipe(
				Effect.tryPromise(() => ctx.table("games").getX(gameID)),
				Effect.andThen((game) => Effect.tryPromise(() => game.patch({ gridID, iconID, heroID }))),
				Effect.catchAll((error) =>
					Effect.logError(`Could not update game artwork for ID ${gameID}: ${error}`)
				)
			)
		)
});

export const addGame = internalMutation({
	args: {
		name: v.string(),
		sortName: v.string(),
		releaseDate: v.number(),
		steamGridGameID: v.number()
	},
	handler: async (ctx, { name, sortName, releaseDate, steamGridGameID }): Promise<Id<"games">> =>
		Effect.runPromise(
			pipe(
				Effect.promise(() =>
					ctx.table("games").insert({
						name,
						sortName,
						releaseDate
					})
				),
				Effect.tap((id) =>
					pipe(
						Effect.tryPromise(() =>
							ctx.scheduler.runAfter(0, internal.games_node.getGameArtwork, {
								steamGridDBID: steamGridGameID,
								gameID: id
							})
						),
						Effect.andThen((scheduledTask) =>
							Effect.logInfo(
								`Added scheduled task to fetch artwork for game "${name}" with ID ${scheduledTask}`
							)
						)
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
