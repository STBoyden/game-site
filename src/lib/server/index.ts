import { PUBLIC_CONVEX_URL } from "$env/static/public";
import { STEAMGRIDDB_KEY } from "$env/static/private";
import { ConvexHttpClient } from "convex/browser";
import SGDB from "steamgriddb";

export const convexClient = new ConvexHttpClient(PUBLIC_CONVEX_URL);
export const steamGridDB = new SGDB(STEAMGRIDDB_KEY);
