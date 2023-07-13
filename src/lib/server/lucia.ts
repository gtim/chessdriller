import lucia from "lucia-auth";
import { sveltekit } from "lucia-auth/middleware";
import { lichess } from '@lucia-auth/oauth/providers';
import prisma from "@lucia-auth/adapter-prisma";
import { PrismaClient } from "@prisma/client";
import { dev } from "$app/environment";

export const auth = lucia({
	adapter: prisma(new PrismaClient()),
	env: dev ? "DEV" : "PROD",
	middleware: sveltekit(),
	transformDatabaseUser: (userData) => {
		return {
			userId:   userData.id,
			cdUserId: userData.cdUserId
		};
	}
});

export const lichessAuth = lichess( auth, {
	clientId:    'chessdriller.org (tim@gurka.se)',
	redirectUri: 'https://chessdriller.org/join/lichess-callback',
	scope: ['study:read'],
	clientSecret: '', // TODO should not be needed
} );

export type Auth = typeof auth;
