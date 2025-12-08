import {
	internalMutation as baseInternalMutation,
	internalQuery as baseInternalQuery,
	mutation as baseMutation,
	query as baseQuery
} from "./_generated/server";
import { customCtx, customMutation, customQuery } from "convex-helpers/server/customFunctions";
import type { GenericDatabaseReader, GenericDatabaseWriter } from "convex/server";
import type { DataModel } from "./_generated/dataModel";
import { entsTableFactory } from "convex-ents";
import { entDefinitions } from "./schema";

type LegacyTables = "games" | "users";

export const query = customQuery(
	baseQuery,
	customCtx(async (ctx) => {
		return {
			table: entsTableFactory(ctx, entDefinitions),
			db: ctx.db as unknown as GenericDatabaseReader<Pick<DataModel, LegacyTables>>
		};
	})
);

export const internalQuery = customQuery(
	baseInternalQuery,
	customCtx(async (ctx) => {
		return {
			table: entsTableFactory(ctx, entDefinitions),
			db: ctx.db as unknown as GenericDatabaseReader<Pick<DataModel, LegacyTables>>
		};
	})
);

export const mutation = customMutation(
	baseMutation,
	customCtx(async (ctx) => {
		return {
			table: entsTableFactory(ctx, entDefinitions),
			db: ctx.db as GenericDatabaseWriter<Pick<DataModel, LegacyTables>>
		};
	})
);

export const internalMutation = customMutation(
	baseInternalMutation,
	customCtx(async (ctx) => {
		return {
			table: entsTableFactory(ctx, entDefinitions),
			db: ctx.db as GenericDatabaseWriter<Pick<DataModel, LegacyTables>>
		};
	})
);
