import { query } from "./_generated/server";

export const getAll = query({
	args: {},
	handler: async (ctx) => {
		const games = await ctx.db.query("games").collect();
		return games;
	}
});
