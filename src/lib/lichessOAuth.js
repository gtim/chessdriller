import { provider } from "@lucia-auth/oauth";

//import { createUrl, handleRequest, authorizationHeaders } from "@lucia-auth/oauth/request.js";
//import { scope, provider } from "@lucia-auth/oauth/core.js";

export const lichess = (auth, config ) => {

	const getAuthorizationUrl = async (state) => {
		const { code_challenge, code_verifier } = await generatePKCECodes();
		//code_challenge
		const url = createUrl("https://lichess.org/oauth", {
			response_type: "code",
			client_id: config.clientId,
			code_challenge_method: 'S256',
			code_challenge,
			scope: config.scope,
			redirect_uri: config.redirectUri,
			state
		});
		console.log(url);
		return url;
	};

	const getTokens = async (code) => {
		const request = new Request("https://lichess.org/api/token", {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: new URLSearchParams({
				client_id: config.clientId,
				grant_type: "authorization_code",
				redirect_uri: config.redirectUri,
				code
			}).toString()
		});
		const tokens = await handleRequest(request);

		return {
			accessToken: tokens.access_token,
			accessTokenExpiresIn: tokens.expires_in
		};
	};

	const getProviderUser = async (accessToken) => {
		const request = new Request("https://lichess.org/api/account", {
			/*headers: authorizationHeaders("bearer", accessToken)*/
			headers: {
				Authorization: ["Bearer", token].join(" ")
			}
		});
		const { lichessUser } = await handleRequest(request);
		return [lichessUser.id, lichessUser];
	};

	return provider(auth, {
		providerId: 'lichess',
		getAuthorizationUrl,
		getTokens,
		getProviderUser
	});
}

// createUrl from @lucia-auth/oauth/request.js
const createUrl = (base, urlSearchParams = {}) => {
    const url = new URL(base);
    for (const [key, value] of Object.entries(urlSearchParams)) {
	url.searchParams.set(key, value);
    }
    return url;
};

// handleRequest from request.js
const handleRequest = async (request) => {
    request.headers.set("User-Agent", "lucia");
    request.headers.set("Accept", "application/json");
    const response = await fetch(request);
    if (!response.ok) {
	const getErrorBody = async () => {
	    try {
		return await response.json();
	    }
	    catch {
		return null;
	    }
	};
	const errorBody = getErrorBody();
	throw new LuciaOAuthRequestError(response.status, errorBody);
    }
    return (await response.json());
};

/**
* generatePKCECodes from oauth2-auth-code-pkce (Apache 2 license).
* Generates a code_verifier and code_challenge, as specified in rfc7636.
*/
function verifier2challenge( verifier ) {
	return crypto
	.subtle
	.digest('SHA-256', (new TextEncoder()).encode(code_verifier))
	.then((buffer) => {
		let hash = new Uint8Array(buffer);
		let binary = '';
		let hashLength = hash.byteLength;
		for (let i = 0; i < hashLength; i++) {
			binary += String.fromCharCode(hash[i]);
		}
		return binary;
	})
	.then(base64urlEncode)
}
function generatePKCECodes() {
	const RECOMMENDED_CODE_VERIFIER_LENGTH = 96;
	const PKCE_CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';

	const output = new Uint32Array(RECOMMENDED_CODE_VERIFIER_LENGTH);
	crypto.getRandomValues(output);
	const code_verifier = base64urlEncode(Array
		.from(output)
		.map((num) => PKCE_CHARSET[num % PKCE_CHARSET.length])
		.join(''));

	return crypto
	.subtle
	.digest('SHA-256', (new TextEncoder()).encode(code_verifier))
	.then((buffer) => {
		let hash = new Uint8Array(buffer);
		let binary = '';
		let hashLength = hash.byteLength;
		for (let i = 0; i < hashLength; i++) {
			binary += String.fromCharCode(hash[i]);
		}
		return binary;
	})
	.then(base64urlEncode)
	.then((code_challenge) => ({ code_challenge, code_verifier }));
}

/**
* base64urlEncode from oauth2-auth-code-pkce (Apache 2 license).
* Implements *base64url-encode* (RFC 4648 § 5) without padding, which is NOT
* the same as regular base64 encoding.
*/
function base64urlEncode(value) {
	let base64 = btoa(value);
	base64 = base64.replace(/\+/g, '-');
	base64 = base64.replace(/\//g, '_');
	base64 = base64.replace(/=/g, '');
	return base64;
}
