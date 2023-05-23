import { redirect } from "@sveltejs/kit";

export const load = async ({ locals }) => {
	const { user } = await locals.auth.validateUser();
	console.log(user);

	return { user };
};

