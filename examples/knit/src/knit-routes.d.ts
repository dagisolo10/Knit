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
	"/profile/[[...docs]]": { docs?: docs };
	"/settings": {  };
	"/user/[...slug]": { slug: slug };
	"/user/[id]": { id: id }
};

