import type { CamelCasedPropertiesDeep } from "type-fest";
import { buildAPIString } from "$server/steam-api/utils";
import { objectToCamel } from "ts-case-convert";
import * as v from "valibot";

export const GetAppListSchema = v.object({
	key: v.string(),
	ifModifiedSince: v.optional(v.pipe(v.date(), v.toNumber())),
	haveDescriptionLanguage: v.optional(v.object({})),
	includeGames: v.optional(v.boolean(), true),
	includeDLC: v.optional(v.boolean(), false),
	includeSoftware: v.optional(v.boolean(), false),
	includeVideos: v.optional(v.boolean(), false),
	includeHardware: v.optional(v.boolean(), false),
	lastAppID: v.optional(v.number()),
	maxResults: v.optional(v.pipe(v.number(), v.maxValue(50_000)), 10_000)
});

const GetAppListOutputSchema = v.object({
	response: v.object({
		apps: v.array(
			v.object({
				appid: v.number(),
				name: v.string(),
				last_modified: v.pipe(
					v.number(),
					v.transform((epochSeconds) => epochSeconds * 1000),
					v.toDate()
				),
				price_change_number: v.number()
			})
		),
		have_more_results: v.boolean(),
		last_appid: v.number()
	})
});

export type GetAppListOutput = CamelCasedPropertiesDeep<
	v.InferOutput<typeof GetAppListOutputSchema>
>;

export const GetAppInfoSchema = v.object({ appID: v.pipe(v.number(), v.minValue(10)) });

export const GetAppInfoOutputSchema = v.variant("success", [
	v.object({ success: v.literal(false) }),
	v.object({
		success: v.literal(true),
		data: v.looseObject({
			type: v.string(),
			name: v.string(),
			steam_appid: v.number(),
			required_age: v.number(),
			is_free: v.boolean(),
			controller_support: v.optional(
				v.union([v.literal("full"), v.literal("partial"), v.literal("none")]),
				"none"
			)
		})
	})
]);

export const GetDiscoveryQueueSchema = v.object({ key: v.boolean() });

export class IStoreService {
	public async getAppList(args: v.InferInput<typeof GetAppListSchema>) {
		const validated = v.parse(GetAppListSchema, args);
		const endpoint = buildAPIString("IStoreService", "getAppList", validated);

		const result = await fetch(endpoint);
		const json = await result.json();

		const apps = (objectToCamel(v.parse(GetAppListOutputSchema, json)) as GetAppListOutput).response
			.apps;

		const cast = apps.map((x) => x as Pick<typeof x, "appid" | "name">);

		return cast;
	}

	public async getAppInfo(args: v.InferInput<typeof GetAppInfoSchema>) {
		const validated = v.parse(GetAppInfoSchema, args);
		const endpoint =
			`https://store.steampowered.com/api/appdetails?appids=${validated.appID}` as const;

		console.log(endpoint);
		const result = await fetch(endpoint);

		return await result.json();
	}
}
