import { auth, lichessAuth } from "$lib/server/lucia";


export async function GET({ url, cookies }) {

	// get url to redirect the user to, with the state
	const [authUrl, state] = await lichessAuth.getAuthorizationUrl();

	// the state can be stored in cookies or localstorage for request validation on callback
	cookies.set("lichess_oauth_state", state, {
		path: "/",
		maxAge: 60 * 60,
		secure: false // only for local testing without https
	});

	// redirect to authorization url
	return new Response(null, {
		status: 302,
		headers: {
			location: authUrl.toString()
		}
	});
}
