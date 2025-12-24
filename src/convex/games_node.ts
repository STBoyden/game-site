"use node";

import { action, internalAction } from "./_generated/server";
import type { DataModel, Id } from "./_generated/dataModel";
import type { GenericActionCtx } from "convex/server";
import { api, internal } from "./_generated/api";
import { Data, Effect, pipe } from "effect";
import { v } from "convex/values";
import * as crypto from "crypto";
import { steamGridDB } from ".";

class DownloadImageError extends Data.TaggedClass("DownloadImageError")<{
	forURL: string | URL;
	reason: unknown;
}> {}

const downloadImage = (url: string | URL) =>
	Effect.tryPromise({
		try: async () => {
			const data = await fetch(url);
			const blob = await data.blob();

			const sha256 = crypto.createHash("sha256");
			const sha256sum = sha256.update(await blob.bytes()).digest("base64");

			return [blob, sha256sum] as const;
		},
		catch: unknown => new DownloadImageError({ forURL: url, reason: unknown })
	});

class ConvexStorageUploadError extends Data.TaggedClass("ConvexStorageUploadError")<{
	stage: "checking existing" | "uploading";
	reason: unknown;
}> {}

const uploadToConvex = (ctx: GenericActionCtx<DataModel>, blob: Blob, sha256?: string) =>
	Effect.gen(function* () {
		if (sha256) {
			const existing = yield* Effect.tryPromise({
				try: () => ctx.runQuery(internal.games.fileBySha256, { sha256 }),
				catch: reason => new ConvexStorageUploadError({ stage: "checking existing", reason })
			});

			if (existing) {
				console.log("File already exists in DB");
				return existing._id;
			}
		}
		return yield* Effect.tryPromise({
			try: () => ctx.storage.store(blob),
			catch: reason => new ConvexStorageUploadError({ stage: "uploading", reason })
		});
	});

export const getGameArtwork = internalAction({
	args: v.object({ steamGridDBID: v.number(), gameID: v.id("games") }),
	handler: (ctx, { steamGridDBID: id, gameID }): Promise<boolean> =>
		Effect.runPromise(
			pipe(
				Effect.tryPromise(async () =>
					Promise.all([
						await steamGridDB.getGridsById(id, [], [], ["image/png"], ["static"], "false", "false"),
						await steamGridDB.getIconsById(id, [], [], ["image/png"], ["static"], "false", "false"),
						await steamGridDB.getHeroesById(id, [], [], ["image/png"], ["static"], "false", "false")
					])
				),
				Effect.andThen(([grids, icons, heroes]) =>
					Effect.if(grids.length === 0 || icons.length === 0 || heroes.length === 0, {
						onTrue: () => Effect.fail("Grids, icons, or heroes returned nothing "),
						onFalse: () =>
							pipe(
								Effect.succeed([grids[0].url, icons[0].url, heroes[0].url]),
								Effect.andThen(([gridURL, iconURL, heroURL]) =>
									Effect.all([
										downloadImage(gridURL),
										downloadImage(iconURL),
										downloadImage(heroURL)
									])
								),
								Effect.andThen(([gridData, iconData, heroData]) =>
									Effect.all([
										uploadToConvex(ctx, gridData[0], gridData[1]),
										uploadToConvex(ctx, iconData[0], iconData[1]),
										uploadToConvex(ctx, heroData[0], heroData[1])
									])
								),
								Effect.andThen(([gridID, iconID, heroID]) =>
									Effect.tryPromise(() =>
										ctx.runMutation(internal.games.addGameArtwork, {
											gameID,
											gridID,
											iconID,
											heroID
										})
									)
								),
								Effect.andThen(id => (id ? Effect.succeed(true) : Effect.succeed(false)))
							)
					})
				)
			)
		)
});

export const getGameInformation = (name: string) =>
	Effect.gen(function* () {
		const gameResults = yield* Effect.tryPromise(() => steamGridDB.searchGame(name));
		if (gameResults.length === 0) {
			return null;
		}

		const [grids, icons, heroes] = yield* Effect.tryPromise(async () =>
			Promise.all([
				await steamGridDB.getGridsById(
					gameResults[0].id,
					[],
					[],
					["image/png"],
					["static"],
					"false",
					"false"
				),
				await steamGridDB.getIconsById(
					gameResults[0].id,
					[],
					[],
					["image/png"],
					["static"],
					"false",
					"false"
				),
				await steamGridDB.getHeroesById(
					gameResults[0].id,
					[],
					[],
					["image/png"],
					["static"],
					"false",
					"false"
				)
			])
		);
		if (grids.length === 0 || icons.length === 0 || heroes.length === 0) {
			return null;
		}

		return { data: gameResults[0] };
	});

const generateSortName = (name: string) =>
	Effect.succeed(
		name
			.toLowerCase()
			.replaceAll(/\s/g, "_")
			.replaceAll(/[$&+,:;=?@#|'<>.\-^*()%![\]"`]/g, "")
	);

class GameExistsError extends Data.TaggedClass("GameExistsError")<{ withSortName: string }> {}
class NoGameInformation extends Data.TaggedClass("NoGameInformation")<{ byName: string }> {}

export const addGame = action({
	args: { name: v.string() },
	handler: async (ctx, args): Promise<Id<"games"> | null> =>
		Effect.runPromise(
			pipe(
				generateSortName(args.name),
				Effect.andThen(sortName =>
					Effect.zip(
						Effect.promise(() => ctx.runQuery(api.games.getBySortName, { sortName })),
						Effect.succeed(sortName)
					)
				),
				Effect.andThen(([existing, sortName]) =>
					Effect.if(existing !== null, {
						onTrue: () => Effect.fail(new GameExistsError({ withSortName: sortName })),
						onFalse: () => Effect.succeed(sortName)
					})
				),
				Effect.andThen(sortName =>
					Effect.zip(getGameInformation(args.name), Effect.succeed(sortName))
				),
				Effect.andThen(([gameInformation, _sortName]) =>
					Effect.if(gameInformation === null, {
						onTrue: () => Effect.fail(new NoGameInformation({ byName: args.name })),
						onFalse: () => Effect.succeed(gameInformation!.data)
					})
				),
				Effect.andThen(sgdbGame =>
					pipe(
						generateSortName(sgdbGame.name),
						Effect.andThen(sortName =>
							Effect.tryPromise(() =>
								ctx.runMutation(internal.games.addGame, {
									name: sgdbGame.name,
									sortName,
									releaseDate: sgdbGame.release_date,
									steamGridGameID: sgdbGame.id
								})
							)
						)
					)
				),
				Effect.catchAll(error =>
					Effect.logWarning(`Could not add game to database: ${error.toString()}`).pipe(
						Effect.as(null)
					)
				)
			)
		)
	// Effect.runPromise(
	// 	Effect.orElseSucceed(
	// 		Effect.gen(function* () {
	// 			const sortName = yield* generateSortName(args.name);

	// 			const existing = yield* Effect.promise(() =>
	// 				ctx.runQuery(api.games.getBySortName, { sortName })
	// 			);
	// 			if (existing) {
	// 				return yield* Effect.fail(new GameExistsError({ withSortName: sortName }));
	// 			}

	// 			const gameInformation = yield* getGameInformation(ctx, args.name);
	// 			if (!gameInformation) {
	// 				return yield* Effect.fail(new NoGameInformation({ byName: args.name }));
	// 			}

	// 			const id: Id<"games"> = yield* Effect.tryPromise(() =>
	// 				ctx.runMutation(internal.games.addGameMutation, {
	// 					name: args.name,
	// 					sortName,
	// 					gameInformation
	// 				})
	// 			);

	// 			return id;
	// 		}),
	// 		() => null
	// 	)
	// )
});

export const addGames = action({
	args: v.object({ names: v.array(v.string()) }),
	handler: (ctx, args): Promise<Id<"games">[]> =>
		Effect.runPromise(
			pipe(
				Effect.forEach(args.names, name =>
					Effect.promise(() => ctx.runAction(api.games_node.addGame, { name }))
				),
				Effect.andThen(games => Effect.succeed(games.filter(game => game !== null)))
			)
		)
});
