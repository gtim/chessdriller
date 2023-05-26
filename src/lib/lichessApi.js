// Lichess API logic
// All Lichess API calls, except for OAuth login, go through here.

export async function fetchStudiesMetadata( lichess_username, lichess_access_token ) {
	const req = new Request( 'https://lichess.org/api/study/by/' + lichess_username, {
		method: "GET",
		headers: headers(lichess_access_token)
	} );
	const resp = await fetch(req);
	if ( ! resp.ok ) {
		throw new Error( 'Lichess request failed (' + resp.status + '): ' + await resp.text() );
	}

	return resp.text().then( (content) => { 
		return content.split(/\n/).filter((line)=>line!='').map( JSON.parse );
	} );
}

export async function fetchStudy( study_id, lichess_username, lichess_access_token ) {
	const req = new Request( 'https://lichess.org/api/study/' + study_id + '.pgn', {
		method: "GET",
		headers: headers(lichess_access_token)
	} );
	const resp = await fetch(req);
	if ( ! resp.ok ) {
		throw new Error( 'Lichess request failed (' + resp.status + '): ' + await resp.text() );
	}
	const pgn = await resp.text();
	return {
		pgn,
		lastModified: resp.headers.get('last-modified')
	};
}

export async function fetchStudyLastModified( study_id, lichess_username, lichess_access_token ) {
	const req = new Request( 'https://lichess.org/api/study/' + study_id + '.pgn', {
		method: "HEAD",
		headers: headers(lichess_access_token)
	} );
	return fetch(req).then( (resp) => {
		if ( ! resp.ok ) {
			return resp.text().then( (resp_text) => {
				throw new Error( 'Lichess request failed (' + resp.status + '): ' + resp_text );
			} );
		}
		return resp.headers.get('last-modified');
	});
}

function headers( lichess_access_token ) {
	return {
		"User-Agent": "Chessdriller.org (tim@gurka.se)",
		"Authorization": "Bearer " + lichess_access_token
	};
}
