import {
	getAppInfoSchema,
	getAppListSchema,
	getAppInfoOutputSchema,
	getAppListOutputSchema
} from "./schema";
import { InterfaceFetchError, InterfaceJSONDecodeError } from "../errors";
import { buildAPIString } from "$server/steam-api/utils";
import { objectToCamel } from "ts-case-convert";
import { Effect, Schema } from "effect";

export class IStoreService {
	public getAppList = (args: typeof getAppListSchema.Encoded) =>
		Effect.runPromise(this.getAppListEffect(args));

	public getAppListEffect = (args: typeof getAppListSchema.Encoded) =>
		Effect.gen(function* () {
			const validated = yield* Schema.decode(getAppListSchema)(args);
			const endpoint = buildAPIString("IStoreService", "getAppList", validated);

			const result = yield* Effect.tryPromise({
				try: () => fetch(endpoint),
				catch: error =>
					new InterfaceFetchError({
						interface: "IStoreService",
						function: "getAppListEffect",
						endpoint,
						error
					})
			});
			const json = yield* Effect.tryPromise({
				try: () => result.json(),
				catch: error =>
					new InterfaceJSONDecodeError({
						interface: "IStoreService",
						function: "getAppListEffect",
						endpoint,
						error: error as TypeError | SyntaxError
					})
			});

			const jsonDecoded = yield* Schema.decodeUnknown(getAppListOutputSchema)(json);
			const apps = jsonDecoded.response.apps.map(x => objectToCamel(x));

			return apps;
		});

	public getAppInfo = (args: typeof getAppInfoSchema.Encoded) =>
		Effect.runPromise(this.getAppInfoEffect(args));

	public getAppInfoEffect = (args: typeof getAppInfoSchema.Encoded) =>
		Effect.gen(function* () {
			const validated = yield* Schema.decode(getAppInfoSchema)(args);
			const endpoint =
				`https://store.steampowered.com/api/appdetails?appids=${validated.appID}` as const;

			const result = yield* Effect.tryPromise({
				try: () => fetch(endpoint),
				catch: error =>
					new InterfaceFetchError({
						interface: "IStoreService",
						function: "getAppInfoEffect",
						endpoint,
						error
					})
			});
			const json = yield* Effect.tryPromise({
				try: () => result.json(),
				catch: error =>
					new InterfaceJSONDecodeError({
						interface: "IStoreService",
						function: "getAppInfoEffect",
						endpoint,
						error: error as TypeError | SyntaxError
					})
			});

			const appInfo = yield* Schema.decodeUnknown(getAppInfoOutputSchema)(json);
			return objectToCamel(appInfo);
		});
}
