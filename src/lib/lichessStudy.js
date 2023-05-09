import { PrismaClient } from '@prisma/client';

export async function fetchStudyIds( lichess_username, lichess_access_token ) {
	const req = new Request( 'https://lichess.org/study/by/' + lichess_username + '/export.pgn', {
		method: "GET",
		headers: {
			"User-Agent": "Chessdriller.org (tim@gurka.se)",
			"Authorization": "Bearer " + lichess_access_token
		}
	} );
	const resp = await fetch(req);
	if ( ! resp.ok ) {
		throw new Error( 'Lichess request failed (' + resp.status + '): ' + await resp.text() );
	}

	// Extract study IDs from full study export.
	// The [Site] field can be overwritten or spoofed. Hopefully, Lichess can add a more appropriate API endpoint.
	return resp.text().then( (pgn_export) => {
		const matches = [...pgn_export.matchAll( /^\[Site "https:\/\/lichess\.org\/study\/(\w+)\/(\w+)"\]/mg )];
		const study_ids = matches.map( match => match[1] );
		const unique_study_ids = [ ...new Set(study_ids) ];
		return unique_study_ids;
	} );
}

export async function fetchStudy( study_id, lichess_username, lichess_access_token ) {
	const req = new Request( 'https://lichess.org/api/study/' + study_id + '.pgn', {
		method: "GET",
		headers: {
			"User-Agent": "Chessdriller.org (tim@gurka.se)",
			"Authorization": "Bearer " + lichess_access_token
		}
	} );
	return fetch(req).then( (resp) => {
		if ( ! resp.ok ) {
			return resp.text().then( (resp_text) => {
				throw new Error( 'Lichess request failed (' + resp.status + '): ' + resp_text );
			} );
		}
		return resp.text().then( (resp_text) => { 
			return {
				pgn: resp_text,
				lastModified: resp.headers.get('last-modified'),
				name: pgnToStudyName( resp_text )
			}
		} );
	});
}

export async function fetchStudyLastModified( study_id, lichess_username, lichess_access_token ) {
	const req = new Request( 'https://lichess.org/api/study/' + study_id + '.pgn', {
		method: "HEAD",
		headers: {
			"User-Agent": "Chessdriller.org (tim@gurka.se)",
			"Authorization": "Bearer " + lichess_access_token
		}
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

function pgnToStudyName( pgn ) {
	// Try to find a name of the form "X: Y" (lichess default unless Event is overwritten)
	let match = pgn.match( /^\[Event "(.*?):.*"\]/m );
	if ( match ) {
		return match[1];
	}
	// Otherwise, just take the first event name
	match = pgn.match( /^\[Event "(.*?)"\]/m );
	return match[1];
}
