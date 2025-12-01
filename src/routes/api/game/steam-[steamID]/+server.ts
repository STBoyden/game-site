import type { RequestHandler } from "./$types";
import { api } from "$lib/server/steam-api";
import { error } from "@sveltejs/kit";

export const GET: RequestHandler = async ({ params }) => {
	const appID = parseInt(params.steamID);
	if (isNaN(appID)) {
		return error(400, "supplied steam app id needs to be a valid integer");
	}

	return new Response(JSON.stringify(await api("IStoreService").getAppInfo({ appID })));
};
