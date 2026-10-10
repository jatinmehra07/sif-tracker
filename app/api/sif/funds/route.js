// app/api/sif/funds/route.js
import { NextResponse } from 'next/server';
import sql from '../../../lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const funds = await sql`
      SELECT 
        code,
        name,
        company,
        category,
        plan,
        option,
        initial_nav AS "initialNav",
        current_nav AS "currentNav",
        total_gain_unit AS "totalGainPerUnit",
        total_growth_pct AS "totalGrowthPct",
        nav_date AS "date",
        last_synced AS "lastSynced"
      FROM sif_funds
      ORDER BY total_growth_pct DESC
    `;

    return NextResponse.json({
      success: true,
      totalRecords: funds.length,
      data: funds
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}