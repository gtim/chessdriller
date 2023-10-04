import { redirect } from "@sveltejs/kit";
import { auth } from "$lib/server/lucia";

export const load = async ({ locals }) => {
	const { user } = await locals.auth.validateUser();
	if (!user) throw redirect(302, "/join");
};
