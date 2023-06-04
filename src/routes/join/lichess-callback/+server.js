import { auth, lichessAuth } from "$lib/server/lucia";
import { redirect } from "@sveltejs/kit";

import { PrismaClient } from '@prisma/client';
const prismaClient = new PrismaClient();



export async function GET({ cookies, url, locals }) {

	const code = url.searchParams.get("code");
	const state = url.searchParams.get("state");
	const [ storedState, code_verifier ] = JSON.parse( cookies.get("lichess_oauth_state") );

	if (state !== storedState)
		return new Response(null, { status: 401 });

	// login successful

	try {
		const { existingUser, providerUserId, tokens } = await lichessAuth.validateCallback( code, code_verifier );
		const getUser = async () => {
			if ( existingUser )
				return existingUser;
			// new account: first create a new Chessdriller user (authenticated by the Auth user)
			const newCdUser = await prismaClient.user.create({ data: { } });
			// then, create Auth user
			return await auth.createUser({
				primaryKey: {
					providerId: 'lichess',
					providerUserId
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
				lichessUsername: providerUserId,
				lichessAccessToken: tokens.accessToken,
				lichessAccessTokenExpiresIn: tokens.accessTokenExpiresIn,
				lichessAccessTokenFetchedAt: new Date()
			}
		});
		const session = await auth.createSession(user.userId);
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

