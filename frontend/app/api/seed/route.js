import { NextResponse } from 'next/server';

// DISABLED: This seed route was creating spam "Kondhwa" articles every time it was hit.
// The route has been disabled to prevent unwanted article creation.
export async function GET(request) {
    return NextResponse.json(
        { error: 'Seed route has been disabled to prevent spam articles.' },
        { status: 403 }
    );
}
