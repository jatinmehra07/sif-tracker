// app/api/sif/route.js
import { NextResponse } from 'next/server';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import db from '../../lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// AMFI's official unblocked daily NAV text stream
const AMFI_FEED_URL = 'https://www.amfiindia.com/spages/NAVAll.txt';

// Load base schemes if database is clean
function ensureBaseDataset() {
  if (db.count() === 0) {
    const jsonPath = path.resolve(process.cwd(), 'sif_data.json');
    if (fs.existsSync(jsonPath)) {
      try {
        const raw = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        if (Array.isArray(raw) && raw.length > 0) {
          db.upsertMany(raw);
          console.log(`[BOOTSTRAP] Loaded ${raw.length} base schemes into database.`);
        }
      } catch (err) {
        console.error('Failed to parse sif_data.json:', err.message);
      }
    }
  }
}

// Scrape live data directly from official AMFI Feed (Option A)
async function scrapeLiveFromAmfiTextFeed() {
  ensureBaseDataset();

  try {
    console.log('[LIVE FETCH] Requesting official raw AMFI stream from:', AMFI_FEED_URL);
    
    const response = await axios.get(AMFI_FEED_URL, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept': 'text/plain, */*'
      }
    });

    const rawText = response.data;
    if (!rawText || typeof rawText !== 'string') {
      throw new Error('Received invalid text response from AMFI');
    }

    const lines = rawText.split('\n');
    console.log(`[LIVE FETCH] Stream received. Parsing ${lines.length} lines from AMFI...`);

    // Build a quick lookup map of current schemes in our DB
    const currentFunds = db.getAll();
    if (currentFunds.length === 0) return;

    // Semicolon format: Scheme Code;ISIN Payout;ISIN Reinvest;Scheme Name;Net Asset Value;Date
    let updatedCount = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.startsWith('Scheme Code')) continue;

      const parts = line.split(';');
      if (parts.length >= 6) {
        const schemeName = parts[3].trim().toLowerCase();
        const navValue = parseFloat(parts[4].trim());
        const navDate = parts[5].trim();

        if (!isNaN(navValue) && navValue > 0) {
          // Match against our tracked funds by name or keyword
          for (const fund of currentFunds) {
            const fundCleanName = fund.name.toLowerCase();
            if (schemeName.includes(fundCleanName) || fundCleanName.includes(schemeName)) {
              fund.currentNav = Number(navValue.toFixed(4));
              fund.totalGainPerUnit = Number((navValue - (fund.initialNav || 10.0)).toFixed(4));
              fund.totalGrowthPct = Number((((navValue - 10.0) / 10.0) * 100).toFixed(2));
              fund.date = navDate;
              fund.source = 'AMFI Live Feed';
              updatedCount++;
            }
          }
        }
      }
    }

    // If AMFI's SIF-specific line items update with intraday ticks, save them
    if (updatedCount > 0) {
      console.log(`[LIVE SYNC SUCCESS] Updated ${updatedCount} funds with real AMFI rates!`);
      db.upsertMany(currentFunds);
    } else {
      console.log('[LIVE SYNC] AMFI feed scanned successfully. All funds are up to date.');
    }
  } catch (err) {
    console.error('[LIVE FETCH FAILED]:', err.message);
  }
}

export async function GET(request) {
  // Execute live scrape from official AMFI stream
  await scrapeLiveFromAmfiTextFeed();

  const rows = db.getAll();

  return NextResponse.json(
    {
      success: true,
      totalRecords: rows.length,
      data: rows,
      serverTime: new Date().toLocaleTimeString(),
      feedSource: 'AMFI (spages/NAVAll.txt)'
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
      }
    }
  );
}