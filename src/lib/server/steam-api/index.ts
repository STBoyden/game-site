import { IStoreService } from "./interfaces/IStoreService";
import type { SteamInterface } from "./types";

export function api(iface: "IStoreService"): IStoreService;
export function api<Interface extends SteamInterface>(iface: Interface) {
	switch (iface) {
		case "IStoreService":
			return new IStoreService();
	}

	throw "";
}
