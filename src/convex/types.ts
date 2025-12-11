import type { CustomCtx } from "convex-helpers/server/customFunctions";
import type { GenericEnt, GenericEntWriter } from "convex-ents";
import type { Doc, TableNames } from "./_generated/dataModel";
import type { Except, Merge } from "type-fest";
import { mutation, query } from "./functions";
import { entDefinitions } from "./schema";

export type QueryCtx = CustomCtx<typeof query>;
export type MutationCtx = CustomCtx<typeof mutation>;

export type Ent<TableName extends TableNames> = GenericEnt<typeof entDefinitions, TableName>;
export type EntWriter<TableName extends TableNames> = GenericEntWriter<
	typeof entDefinitions,
	TableName
>;

export type Game = Merge<
	Except<Doc<"games">, "gridID" | "iconID" | "heroID">,
	{ grid: string | null; icon: string | null; hero: string | null }
>;
