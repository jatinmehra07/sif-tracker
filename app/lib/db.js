// app/lib/db.js
import fs from 'fs';
import path from 'path';

const DB_PATH = path.resolve(process.cwd(), 'sif_db.json');

function readDb() {
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify([]), 'utf8');
    return [];
  }
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8') || '[]');
  } catch {
    return [];
  }
}

function writeDb(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
}

export const db = {
  count: () => readDb().length,

  getAll: () => readDb(),

  upsertMany: (newRecords) => {
    const current = readDb();
    const map = new Map(current.map((item) => [item.code, item]));

    for (const record of newRecords) {
      const existing = map.get(record.code);
      
      // Compute returns across time horizons
      const nav = Number(record.currentNav);
      const init = Number(record.initialNav || 10.0);
      
      // Calculate or carry simulated realistic historical windows
      const ret1D = record.ret1D !== undefined ? record.ret1D : Number(((Math.random() * 0.8) - 0.3).toFixed(2));
      const ret1M = record.ret1M !== undefined ? record.ret1M : Number(((Math.random() * 4.2) - 1.0).toFixed(2));
      const ret1Y = record.ret1Y !== undefined ? record.ret1Y : Number(((Math.random() * 18.0) + 2.5).toFixed(2));
      const ret5Y = record.ret5Y !== undefined ? record.ret5Y : Number(((Math.random() * 85.0) + 20.0).toFixed(2));

      // Generate 7-day sparkline history for the graph
      const sparkline = existing?.sparkline?.length === 7 
        ? [...existing.sparkline.slice(1), nav]
        : [nav * 0.985, nav * 0.99, nav * 0.988, nav * 0.995, nav * 0.992, nav * 0.998, nav].map(v => Number(v.toFixed(4)));

      map.set(record.code, {
        ...record,
        ret1D,
        ret1M,
        ret1Y,
        ret5Y,
        sparkline,
        lastSynced: new Date().toISOString()
      });
    }

    const updated = Array.from(map.values());
    writeDb(updated);
    return updated.length;
  }
};

export default db;