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
	"/profile": Record<string, never>;
	"/profile/[[...docs]]": { docs?: string[] };
	"/settings": Record<string, never>;
	"/user/[...slug]": { slug: string[] };
	"/user/[id]": { id: string }
};

