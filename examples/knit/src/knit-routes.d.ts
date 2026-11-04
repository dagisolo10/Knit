/**
 * Auto-generated route types from src/app.
 */

export type RoutePattern = 
	| "/profile"
	| "/profile/[[...docs]]"
	| "/settings"
	| "/user/[...slug]"
	| "/user/[id]";

export type RouteParams = {
	"/profile": {  };
	"/profile/[[...docs]]": { docs?: string[] };
	"/settings": {  };
	"/user/[...slug]": { slug: string[] };
	"/user/[id]": { id: string }
};

