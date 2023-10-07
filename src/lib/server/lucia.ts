import 'dotenv/config';
import { lucia } from "lucia";
import { sveltekit } from "lucia/middleware";
import { lichess } from '@lucia-auth/oauth/providers';
import { prisma } from "@lucia-auth/adapter-prisma";
import { PrismaClient } from "@prisma/client";
import { dev } from "$app/environment";

export const auth = lucia({
	adapter: prisma(new PrismaClient(),{
		user: 'authUser',
		key: 'authKey',
		session: 'authSession',
	}),
	env: dev ? "DEV" : "PROD",
	middleware: sveltekit(),
	getUserAttributes: (userData) => {
		return {
			cdUserId: userData.cdUserId
		};
	}
});

export const lichessAuth = lichess( auth, {
	clientId:    'chessdriller.org (tim@gurka.se)',
	redirectUri: process.env.LICHESS_REDIRECT_ORIGIN + '/join/lichess-callback',
	scope: ['study:read'],
} );

export type Auth = typeof auth;
