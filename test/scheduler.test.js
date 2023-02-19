import { moveIsDue } from '$lib/scheduler.js';

describe( 'moveIsDue', () => {
	test('not-own moves', () => {
		const date = new Date('2023-02-19T12:00:00');
		expect(
			moveIsDue( {
				ownMove: false, 
				learningDueTime: new Date('2023-02-18T10:00:00'),
				reviewDueDate: null
			}, date )
		).toBe(false);
		expect(
			moveIsDue( {
				ownMove: false, 
				learningDueTime: null,
				reviewDueDate: new Date('2023-02-17T00:00:00')
			}, date )
		).toBe(false);
	});
	
	test('moves in learning', () => {
		const move230218T10 = {
			ownMove: true, 
			learningDueTime: new Date('2023-02-18T10:00:00'),
			reviewDueDate: null
		};
		expect( moveIsDue( move230218T10, new Date('2022-02-18T10:00:00') ) ).toBe( false );
		expect( moveIsDue( move230218T10, new Date('2022-02-18T23:00:00') ) ).toBe( false );
		expect( moveIsDue( move230218T10, new Date('2023-02-17T10:00:00') ) ).toBe( false );
		expect( moveIsDue( move230218T10, new Date('2023-02-17T23:00:00') ) ).toBe( false );
		expect( moveIsDue( move230218T10, new Date('2023-02-18T00:00:00') ) ).toBe( false );
		expect( moveIsDue( move230218T10, new Date('2023-02-18T09:59:59') ) ).toBe( false );
		expect( moveIsDue( move230218T10, new Date('2023-02-18T10:00:01') ) ).toBe( true );
		expect( moveIsDue( move230218T10, new Date('2023-02-18T23:00:00') ) ).toBe( true );
		expect( moveIsDue( move230218T10, new Date('2023-02-19T00:00:00') ) ).toBe( true );
		expect( moveIsDue( move230218T10, new Date('2023-02-19T10:00:00') ) ).toBe( true );
		expect( moveIsDue( move230218T10, new Date('2023-03-19T00:00:00') ) ).toBe( true );
		expect( moveIsDue( move230218T10, new Date('2024-02-19T00:00:00') ) ).toBe( true );
	} );

	test('moves in review', () => {
		const move230218 = {
			ownMove: true, 
			learningDueTime: null,
			reviewDueDate: new Date('2023-02-18T00:00:00')
		};
		expect( moveIsDue( move230218, new Date('2022-02-18T10:00:00') ) ).toBe( false );
		expect( moveIsDue( move230218, new Date('2022-02-18T23:00:00') ) ).toBe( false );
		expect( moveIsDue( move230218, new Date('2023-02-17T10:00:00') ) ).toBe( false );
		expect( moveIsDue( move230218, new Date('2023-02-17T23:00:00') ) ).toBe( false );
		expect( moveIsDue( move230218, new Date('2023-02-18T00:00:00') ) ).toBe( true );
		expect( moveIsDue( move230218, new Date('2023-02-18T09:59:59') ) ).toBe( true );
		expect( moveIsDue( move230218, new Date('2023-02-18T10:00:01') ) ).toBe( true );
		expect( moveIsDue( move230218, new Date('2023-02-18T23:00:00') ) ).toBe( true );
		expect( moveIsDue( move230218, new Date('2023-02-19T00:00:00') ) ).toBe( true );
		expect( moveIsDue( move230218, new Date('2023-02-19T10:00:00') ) ).toBe( true );
		expect( moveIsDue( move230218, new Date('2023-03-19T00:00:00') ) ).toBe( true );
		expect( moveIsDue( move230218, new Date('2024-02-19T00:00:00') ) ).toBe( true );
	} );
});
