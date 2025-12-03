import { defineSchema, defineTable } from "convex/server";
import { v as cv } from "convex/values";

export default defineSchema({
	games: defineTable({
		sortName: cv.string(),
		name: cv.string(),
		releaseDate: cv.number(),
		images: cv.object({
			grid: cv.string(),
			icon: cv.string()
		})
	})
		.index("by_sortname", ["sortName"])
		.index("by_releasedate", ["releaseDate"]),

	user: defineTable({
		name: cv.string(),
		games: cv.array(
			cv.object({
				playStateSection: cv.union(
					cv.literal("want_to_buy"),
					cv.literal("want_to_play"),
					cv.literal("playing"),
					cv.literal("completed")
				),
				game: cv.id("games")
			})
		)
	})
});
