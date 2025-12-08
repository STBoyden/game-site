import { defineEnt, defineEntFromTable, defineEntSchema, getEntDefinitions } from "convex-ents";
import { migrationsTable } from "convex-helpers/server/migrations";
import { v as cv } from "convex/values";

const schema = defineEntSchema({
	migrations: defineEntFromTable(migrationsTable),
	games: defineEnt({
		name: cv.string(),
		releaseDate: cv.number()
	})
		.field("sortName", cv.string(), { unique: true })
		.edge("grid", { to: "_storage", deletion: "hard" })
		.edge("icon", { to: "_storage", deletion: "hard" })
		.edge("hero", { to: "_storage", deletion: "hard" })
		.index("by_releasedate", ["releaseDate"])
		.searchIndex("search_title", {
			searchField: "name"
		}),
	users: defineEnt({
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

export default schema;
export const entDefinitions = getEntDefinitions(schema);
