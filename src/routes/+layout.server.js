export const load = async ({ locals }) => {
	const session = await locals.auth.validate();
	const user = session ? session.user : null;
	return { user };
};

