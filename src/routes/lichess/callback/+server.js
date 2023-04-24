import { auth, lichessAuth } from "$lib/server/lucia";
import { redirect } from "@sveltejs/kit";



export async function GET({ cookies, url, locals }) {

	const code = url.searchParams.get("code");
	const state = url.searchParams.get("state");
	const storedState = cookies.get("lichess_oauth_state");
	console.log('cd: '+code);
	console.log('st: '+state);
	console.log('ss: '+storedState);
	console.log('cookies in lichess/callback:');
	console.log(cookies.getAll());

	if (state !== storedState)
		return new Response(null, { status: 401 });

	// login successful

	try {
		const { providerUser, providerUserId, tokens } = await lichessAuth.validateCallback(code);
		console.log(providerUser);
		console.log(providerUserId);
		console.log(tokens);
	} catch (e) {
		// invalid code
		console.log('invalid code?');
		console.log(e);
		return new Response(null, {
			status: 500
		});
	}

	return new Response(null, { status: 418 });
}

