// type GamesByPlatformID = {
// 	code: number;
// 	status: "Success";
// 	data?: {
// 		count: number;
// 		games: {
// 			id: number;
// 			game_title: string;
// 			release_date: string;
// 			platform: number;
// 			country_id: number;
// 			developers: number[];
// 		}[];
// 	};
// 	pages: {
// 		previous?: string;
// 		current: string;
// 		next?: string;
// 	};
// 	remaining_monthly_allowance: number;
// 	extra_allowance: number;
// 	allowance_refresh_timer: number;
// };

// type Game = NonNullable<GamesByPlatformID["data"]>["games"][number];
