import { query, internalMutation, internalQuery } from "./_generated/server";
import { stream } from "convex-helpers/server/stream";
import { type SGDBGame } from "steamgriddb";
import { v } from "convex/values";
import { Effect } from "effect";
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
