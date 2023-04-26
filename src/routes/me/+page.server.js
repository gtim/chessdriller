import { redirect } from "@sveltejs/kit";

export const load = async ({ locals }) => {
	const { user } = await locals.auth.validateUser();
	if (!user) throw redirect(302, "/join");
	return { user };
};
