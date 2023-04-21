import { lichess } from '$lib/lichessOAuth.js';
import { auth } from "$lib/server/lucia";


export async function GET({ url, cookies }) {

	const lichessAuth = lichess( auth, {
		clientId:    'chessdriller.org',
		redirectUri: 'http://139.162.141.167:5173/lichess', // TODO very hard-coded
		scope: []
	} );

	// get url to redirect the user to, with the state
	const [authUrl, state] = await lichessAuth.getAuthorizationUrl();

	console.log('url: ');
	console.log(url);
	console.log('state: ');
	console.log(state);


	// the state can be stored in cookies or localstorage for request validation on callback
	cookies.set("lichess_oauth_state", state, {
		path: "/",
		maxAge: 60 * 60
	});

	// redirect to authorization url
	return new Response(null, {
		status: 302,
		headers: {
			location: authUrl.toString()
		}
	});
}
