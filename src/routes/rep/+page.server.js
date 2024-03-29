import { redirect } from "@sveltejs/kit";

export const load = async ({ locals }) => {
	const session = await locals.auth.validate();
	if (!session) throw redirect(302, "/join"); // force login
	const user = session.user;
	return { user };
};
