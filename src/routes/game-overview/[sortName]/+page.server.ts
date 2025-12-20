import type { PageServerLoad } from "./$types";
import { convexClient } from "$server";
import { error } from "@sveltejs/kit";
import { api } from "$convex/api";

export const load: PageServerLoad = async ({ params }) => {
	const sortName = params.sortName;
	const game = await convexClient.query(api.games.getBySortName, { sortName });

	if (!game) {
		error(404, "Game not found");
	}

	return { game };
};
