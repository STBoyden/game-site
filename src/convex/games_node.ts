"use node";

import type { DataModel, Id } from "./_generated/dataModel";
import type { GenericActionCtx } from "convex/server";
import { api, internal } from "./_generated/api";
import { action } from "./_generated/server";
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
		catch: (unknown) => new DownloadImageError({ forURL: url, reason: unknown })
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
				catch: (reason) => new ConvexStorageUploadError({ stage: "checking existing", reason })
			});

			if (existing) {
				console.log("File already exists in DB");
				return existing._id;
			}
		}
		return yield* Effect.tryPromise({
			try: () => ctx.storage.store(blob),
			catch: (reason) => new ConvexStorageUploadError({ stage: "uploading", reason })
		});
	});

export const getGameInformation = (ctx: GenericActionCtx<DataModel>, name: string) =>
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

		const [gridID, iconID, heroID] = yield* pipe(
			Effect.succeed([grids[0].url, icons[0].url, heroes[0].url]),
			Effect.map((urls) => Effect.all(urls.map((url) => downloadImage(url)))),
			Effect.flatten,
			Effect.map((pairs) =>
				Effect.all(pairs.map(([blob, sha256sum]) => uploadToConvex(ctx, blob, sha256sum)))
			),
			Effect.flatten
		);

		return { data: gameResults[0], gridID, iconID, heroID };
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
				Effect.andThen((sortName) =>
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
				Effect.andThen((sortName) =>
					Effect.zip(getGameInformation(ctx, args.name), Effect.succeed(sortName))
				),
				Effect.andThen(([gameInformation, _sortName]) =>
					Effect.if(gameInformation === null, {
						onTrue: () => Effect.fail(new NoGameInformation({ byName: args.name })),
						onFalse: () => Effect.succeed(gameInformation!)
					})
				),
				Effect.andThen((gameInformation) =>
					pipe(
						generateSortName(gameInformation.data.name),
						Effect.andThen((sortName) =>
							// Effect.tryPromise(() =>
							// 	ctx.runMutation(internal.games.addGameMutation, {
							// 		name: gameInformation.data.name,
							// 		sortName,
							// 		gameInformation
							// 	})
							// )
							Effect.tryPromise(() =>
								ctx.runMutation(internal.games.addGameMutation, {
									name: gameInformation.data.name,
									sortName,
									gameInformation
								})
							)
						)
					)
				),
				Effect.catchAll((error) =>
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
