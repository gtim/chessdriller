import { redirect } from "@sveltejs/kit";
import { auth } from "$lib/server/lucia";

export const load = async ({ locals }) => {
	const session = await locals.auth.validate();
	if (!session) throw redirect(302, "/join");
};
