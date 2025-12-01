import { IStoreService } from "./interfaces/IStoreService";
import type { SteamInterface } from "./types";

export function steamAPI(iface: "IStoreService"): IStoreService;
export function steamAPI<Interface extends SteamInterface>(iface: Interface) {
	switch (iface) {
		case "IStoreService":
			return new IStoreService();
	}

	throw "";
}
