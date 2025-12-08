import { internalMutation, type MutationCtx } from "./_generated/server";
import { makeMigration } from "convex-helpers/server/migrations";
import { entsTableFactory } from "convex-ents";
import { entDefinitions } from "./schema";

const _migration = makeMigration(internalMutation, {
	migrationTable: "migrations"
});

async function _mutationCtx(baseCtx: MutationCtx) {
	return {
		...baseCtx,
		table: entsTableFactory(baseCtx, entDefinitions),
		db: undefined
	};
}
