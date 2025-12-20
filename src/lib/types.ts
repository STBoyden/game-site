import type { Except, Merge } from "type-fest";
import type { Doc } from "$convex/dataModel";

export type Game = Merge<
	Except<Doc<"games">, "gridID" | "iconID" | "heroID">,
	{ grid: string | null; icon: string | null; hero: string | null }
>;
