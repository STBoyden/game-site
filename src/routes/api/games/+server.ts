import type { RequestHandler } from "./$types";
import { api } from "$lib/server/steam-api";
import { env } from "$env/dynamic/private";

export const GET: RequestHandler = async () => {
	return new Response(
		JSON.stringify(await api("IStoreService").getAppList({ key: env.STEAM_KEY }))
	);
};
