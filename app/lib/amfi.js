// app/lib/amfi.js
const AMFI_FEED_URL = 'https://www.amfiindia.com/spages/NAVAll.txt';

export async function fetchAndParseAmfiNav() {
  const response = await fetch(AMFI_FEED_URL, {
    cache: 'no-store',
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
  });

  if (!response.ok) {
    throw new Error(`AMFI feed request failed: status ${response.status}`);
  }

  const text = await response.text();
  const lines = text.split('\n');
  const resultMap = new Map();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith('Scheme Code')) continue;

    const parts = line.split(';');
    if (parts.length >= 6) {
      const code = parts[0].trim();
      const schemeName = parts[3].trim();
      const nav = parseFloat(parts[4].trim());
      const date = parts[5].trim();

      if (code && !isNaN(nav) && nav > 0) {
        resultMap.set(code, { code, schemeName, nav, date });
      }
    }
  }

  return resultMap;
}