// app/api/sif/sync/route.js
import { NextResponse } from 'next/server';
import sql from '../../../lib/db';
import { fetchAndParseAmfiNav } from '../../../lib/amfi';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request) {
  return handleSync(request);
}

export async function POST(request) {
  return handleSync(request);
}

async function handleSync(request) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const amfiMap = await fetchAndParseAmfiNav();
    const existingFunds = await sql`SELECT code, name, initial_nav FROM sif_funds`;

    let updatedCount = 0;

    for (const fund of existingFunds) {
      let matchedNav = null;
      let matchedDate = null;

      if (amfiMap.has(fund.code)) {
        const item = amfiMap.get(fund.code);
        matchedNav = item.nav;
        matchedDate = item.date;
      } else {
        const lowerName = fund.name.toLowerCase();
        for (const item of amfiMap.values()) {
          if (item.schemeName.toLowerCase().includes(lowerName)) {
            matchedNav = item.nav;
            matchedDate = item.date;
            break;
          }
        }
      }

      if (matchedNav) {
        const initialNav = Number(fund.initial_nav) || 10.0;
        const totalGain = matchedNav - initialNav;
        const growthPct = (totalGain / initialNav) * 100;

        await sql`
          UPDATE sif_funds
          SET current_nav = ${matchedNav},
              total_gain_unit = ${totalGain},
              total_growth_pct = ${growthPct},
              nav_date = ${matchedDate || 'Latest'},
              last_synced = CURRENT_TIMESTAMP
          WHERE code = ${fund.code}
        `;

        await sql`
          INSERT INTO sif_nav_history (fund_code, nav, recorded_date)
          VALUES (${fund.code}, ${matchedNav}, CURRENT_DATE)
          ON CONFLICT (fund_code, recorded_date)
          DO UPDATE SET nav = EXCLUDED.nav
        `;

        updatedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Synchronized ${updatedCount} funds successfully.`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}