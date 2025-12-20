import type { CamelCasedPropertiesDeep } from "type-fest";
import { Option, Schema } from "effect";

export const getAppListSchema = Schema.Struct({
	key: Schema.String,
	ifModifiedSince: Schema.optionalToOptional(Schema.DateFromSelf, Schema.Number, {
		decode: (maybeDate) => Option.map(maybeDate, (x) => x.getTime()),
		encode: (maybeNumber) => Option.map(maybeNumber, (x) => new Date(x))
	}),
	includeGames: Schema.optionalToOptional(Schema.Boolean, Schema.Boolean, {
		decode: (maybeBool) => Option.map(maybeBool, () => true),
		encode: (maybeBool) => maybeBool
	}),
	includeDLC: Schema.optionalToOptional(Schema.Boolean, Schema.Boolean, {
		decode: (maybeBool) => Option.map(maybeBool, () => false),
		encode: (maybeBool) => maybeBool
	}),
	includeVideos: Schema.optionalToOptional(Schema.Boolean, Schema.Boolean, {
		decode: (maybeBool) => Option.map(maybeBool, () => false),
		encode: (maybeBool) => maybeBool
	}),
	includeHardware: Schema.optionalToOptional(Schema.Boolean, Schema.Boolean, {
		decode: (maybeBool) => Option.map(maybeBool, () => false),
		encode: (maybeBool) => maybeBool
	}),
	lastAppID: Schema.optional(Schema.Number),
	maxResults: Schema.optional(Schema.Number.pipe(Schema.clamp(1, 50_000)))
});

export const getAppListOutputSchema = Schema.Struct({
	response: Schema.Struct({
		apps: Schema.Array(
			Schema.Struct({
				appid: Schema.Number,
				name: Schema.String,
				last_modified: Schema.Number.pipe(
					Schema.transform(Schema.Date, {
						strict: true,
						decode: (epochSeconds) => new Date(epochSeconds * 1000).toISOString(),
						encode: (_, date) => date.getTime()
					})
				),
				price_change_number: Schema.Number
			})
		),
		have_more_results: Schema.Boolean,
		last_appid: Schema.Number
	})
});

export type getAppListOutput = CamelCasedPropertiesDeep<typeof getAppListOutputSchema.Type>;

export const getAppInfoSchema = Schema.Struct({
	appID: Schema.Number.pipe(Schema.greaterThan(10))
});

const controllerSupportSchema = Schema.Literal("full", "partial", "none");

export const getAppInfoOutputSchema = Schema.Union(
	Schema.Struct({ success: Schema.Literal(false) }),
	Schema.Struct({
		success: Schema.Literal(true),
		data: Schema.Struct({
			type: Schema.String,
			name: Schema.String,
			steam_appid: Schema.Number,
			required_age: Schema.Number,
			is_free: Schema.Boolean,
			controller_support: Schema.optionalToRequired(
				controllerSupportSchema,
				controllerSupportSchema,
				{
					decode: (maybeOption) => Option.getOrElse(maybeOption, () => "none"),
					encode: (option) => Option.some(option)
				}
			)
		})
	})
);
