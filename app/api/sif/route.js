// app/api/sif/route.js
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import sql from '../../lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function getFallbackData() {
  const jsonPath = path.resolve(process.cwd(), 'sif_db.json');
  if (fs.existsSync(jsonPath)) {
    try {
      const raw = fs.readFileSync(jsonPath, 'utf8');
      const items = JSON.parse(raw);
      return items.map((item) => {
        const nav = Number(item.current_nav || item.currentNav || 10.0);
        const init = Number(item.initial_nav || item.initialNav || 10.0);
        return {
          code: item.code,
          name: item.name,
          company: item.company || 'Specialised Fund',
          category: item.category || 'Equity Oriented',
          plan: item.plan || 'Direct Plan',
          option: item.option || 'Growth',
          initialNav: init,
          currentNav: Number(nav.toFixed(4)),
          totalGainPerUnit: Number((nav - init).toFixed(4)),
          totalGrowthPct: Number((((nav - init) / init) * 100).toFixed(2)),
          date: item.nav_date || item.date || 'Latest',
          lastSynced: new Date().toISOString()
        };
      });
    } catch (e) {
      console.error('Error parsing sif_data.json fallback:', e.message);
    }
  }
  return [];
}

export async function GET() {
  try {
    // 1. Try fetching from Neon Postgres if configured
    if (sql) {
      const rows = await sql`
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

      if (rows && rows.length > 0) {
        return NextResponse.json({
          success: true,
          totalRecords: rows.length,
          data: rows,
          source: 'Neon Postgres'
        });
      }
    }

    // 2. Fallback to local dataset so localhost runs seamlessly
    const fallback = getFallbackData();
    return NextResponse.json({
      success: true,
      totalRecords: fallback.length,
      data: fallback,
      source: 'Local Fallback Cache'
    });
  } catch (error) {
    console.error('API Error in /api/sif:', error.message);
    const fallback = getFallbackData();
    return NextResponse.json({
      success: true,
      totalRecords: fallback.length,
      data: fallback,
      source: 'Error Recovery Cache'
    });
  }
}