// app/lib/db.js
import { neon } from '@neondatabase/serverless';

let sqlClient = null;

if (process.env.DATABASE_URL) {
  try {
    sqlClient = neon(process.env.DATABASE_URL);
  } catch (err) {
    console.warn('Neon initialization failed, falling back to local mode:', err.message);
  }
}

export const sql = sqlClient;
export default sql;