// app/api/sif/history/route.js
import { NextResponse } from 'next/server';
import sql from '../../../lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json({ success: false, error: 'Fund code is required.' }, { status: 400 });
  }

  try {
    const history = await sql`
      SELECT 
        nav,
        recorded_date AS "date"
      FROM sif_nav_history
      WHERE fund_code = ${code}
      ORDER BY recorded_date ASC
    `;

    return NextResponse.json({
      success: true,
      code,
      data: history
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}