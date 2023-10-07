import { redirect } from "@sveltejs/kit";

export const load = async ({ locals }) => {
	// redirect to /study if logged in
	const session = await locals.auth.validate();
	if (session) throw redirect(302, "/study"); 
};

