import { defineSchema, defineTable } from "convex/server";
import { v as cv } from "convex/values";

export default defineSchema({
	games: defineTable({
		sortName: cv.string(),
		name: cv.string(),
		releaseDate: cv.number(),
		grid: cv.id("_storage"),
		icon: cv.id("_storage"),
		hero: cv.id("_storage")
	})
		.index("by_sortname", ["sortName"])
		.index("by_releasedate", ["releaseDate"])
		.searchIndex("search_title", {
			searchField: "name",
			staged: false
		}),
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
