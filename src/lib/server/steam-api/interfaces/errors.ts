import type { SteamFunctions, SteamInterface } from "../types";
import { Data } from "effect";

export class InterfaceFetchError<
	Interface extends SteamInterface,
	Fn extends keyof SteamFunctions<Interface>
> extends Data.TaggedClass("InterfaceFetchError")<{
	interface: Interface;
	function: Fn;
	endpoint: string;
	error: unknown;
}> {}

export class InterfaceJSONDecodeError<
	Interface extends SteamInterface,
	Fn extends keyof SteamFunctions<Interface>
> extends Data.TaggedClass("InterfaceJSONDecodeError")<{
	interface: Interface;
	function: Fn;
	endpoint: string;
	error: TypeError | SyntaxError;
}> {}
