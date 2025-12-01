import { defineSchema, defineTable } from "convex/server";
import { v as cv } from "convex/values";

export default defineSchema({
	game: defineTable({
		sortName: cv.string(),
		name: cv.string(),
		releaseDate: cv.number()
	})
		.index("by_sortname", ["sortName"])
		.index("by_releasedate", ["releaseDate"])
});
