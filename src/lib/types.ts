import type { Except, Merge } from "type-fest";
import type { Doc } from "$convex/dataModel";

// export type GameSections = Doc<"user">["games"][number]["playStateSection"];
export type Game = Merge<
	Except<Doc<"games">, "gridId" | "iconId" | "heroId">,
	{ grid: string | null; icon: string | null; hero: string | null }
>;
