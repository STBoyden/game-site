import type { SteamFunctions, SteamInterface } from "./types";
import { objectToSnake } from "ts-case-convert";
import type { KeyAsString } from "type-fest";

export function buildAPIString<
	Interface extends SteamInterface,
	Fn extends KeyAsString<SteamFunctions<Interface>>,
	Args extends object
>(iface: Interface, fn: Fn, args: Args) {
	const cased = { ...objectToSnake(args), format: "json" };

	let argsBuilder = "?";
	let index = 0;

	for (const [key, value] of Object.entries(cased)) {
		if (index !== 0) {
			argsBuilder = `${argsBuilder}&`;
		}

		argsBuilder = `${argsBuilder}${key}=${value}`;

		index++;
	}

	return `https://api.steampowered.com/${iface}/${fn}/v1${argsBuilder}` as const;
}
