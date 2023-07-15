import { redirect } from "@sveltejs/kit";

export const load = async ({ locals }) => {
	// redirect to /study if logged in
	const { user } = await locals.auth.validateUser();
	if (user) throw redirect(302, "/study"); 
};

