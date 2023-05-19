import { redirect } from "@sveltejs/kit";
import { lichessAuth } from "$lib/server/lucia";

export const load = async ({ locals, cookies }) => {

	// redirect authenticated users to /
	const session = await locals.auth.validate();
	if (session)
		throw redirect(302, "/");

	// get url to redirect the user to, with the state
	const [authUrl, state] = await lichessAuth.getAuthorizationUrl();
	
	// the state can be stored in cookies or localstorage for request validation on callback
	cookies.set("lichess_oauth_state", state, {
		path: "/",
		maxAge: 60 * 60,
		secure: false // only for local testing without https
	});

	return { authUrl: authUrl.toString() }
};

