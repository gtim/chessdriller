import { auth, lichessAuth } from "$lib/server/lucia";
import { redirect } from "@sveltejs/kit";

import { PrismaClient } from '@prisma/client';
const prismaClient = new PrismaClient();



export async function GET({ cookies, url, locals }) {

	const code = url.searchParams.get("code");
	const state = url.searchParams.get("state");
	const [ storedState, codeVerifier ] = JSON.parse( cookies.get("lichess_oauth_state") );

	if (state !== storedState)
		return new Response(null, { status: 401 });

	// login successful

	try {
		const { getExistingUser, lichessUser, lichessTokens } = await lichessAuth.validateCallback( code, codeVerifier );
		const lichessUserId = lichessUser.id;
		const getUser = async () => {
			const existingUser = await getExistingUser();
			if ( existingUser )
				return existingUser;
			// new account: first create a new Chessdriller user (authenticated by the Auth user)
			const newCdUser = await prismaClient.user.create({ data: { } });
			// then, create Auth user
			return await auth.createUser({
				key: {
					providerId: 'lichess',
					providerUserId: lichessUserId,
					password: null,
				},
				attributes: {
					cdUserId: newCdUser.id
				}
			});
		};
		const user = await getUser();
		await prismaClient.user.update({
			where: { id: user.cdUserId },
			data: {
				lichessUsername: lichessUserId,
				lichessAccessToken: lichessTokens.accessToken,
				lichessAccessTokenExpiresIn: lichessTokens.accessTokenExpiresIn,
				lichessAccessTokenFetchedAt: new Date()
			}
		});
		const session = await auth.createSession({
			userId: user.userId,
			attributes: {}
		});
		locals.auth.setSession(session);
	} catch (e) {
		// invalid code
		console.log('invalid code?');
		console.log(e);
		return new Response(null, {
			status: 500
		});
	}

	throw redirect( 301, '/' );
}

