// Shared taostats client with multi-key round-robin rotation.
// Each key is rate-limited independently (5 req/min per account).
// Combining N keys gives ~N * 5 req/min effective throughput.
//
// Usage:
//   TAOSTATS_API_KEY=key1,key2,key3 node script.mjs
//   (comma-separated list; single key also works)
//
// Import:
//   import { taoFetch, taoFetchAll, sleep } from './taostats-client.mjs';

const API = 'https://api.taostats.io';

const rawKeys = process.env.TAOSTATS_API_KEY || '';
const KEYS = rawKeys.split(',').map(k => k.trim()).filter(k => k.length > 0);
if (KEYS.length === 0) {
  console.error('Missing TAOSTATS_API_KEY (comma-separated for multi-key rotation)');
  process.exit(1);
}
console.log(`[taostats-client] Using ${KEYS.length} key(s), effective rate limit ~${KEYS.length * 5} req/min`);

// Track usage per key (timestamp list of recent calls)
const keyUsage = new Map();
for (const k of KEYS) keyUsage.set(k, []);

// Return the key with the fewest recent calls in the last 60s
function pickKey() {
  const now = Date.now();
  const cutoff = now - 60_000;
  let best = KEYS[0];
  let bestCount = Infinity;
  for (const k of KEYS) {
    const recent = keyUsage.get(k).filter(t => t >= cutoff);
    keyUsage.set(k, recent);
    if (recent.length < bestCount) {
      bestCount = recent.length;
      best = k;
    }
  }
  keyUsage.get(best).push(now);
  return best;
}

export const sleep = (ms) => new Promise(r => setTimeout(r, ms));

export async function taoFetch(path, params = {}, opts = {}) {
  const qs = new URLSearchParams(params).toString();
  const url = `${API}/${path}?${qs}`;
  const retries = opts.retries ?? 3;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const key = pickKey();
    const res = await fetch(url, { headers: { Authorization: key } });
    if (res.status === 429 && attempt < retries) {
      const wait = 3000 * (attempt + 1);
      console.log(`  429 on ${path} (key ${key.slice(0, 10)}), waiting ${wait / 1000}s...`);
      await sleep(wait);
      continue;
    }
    if (res.status === 429) {
      console.log(`  429 EXHAUSTED on ${path}`);
      return { data: [], rate_limited: true };
    }
    if (!res.ok) {
      console.log(`  ${res.status} on ${path}`);
      return { data: [] };
    }
    return res.json();
  }
  return { data: [] };
}

export async function taoFetchAll(path, params = {}) {
  const all = [];
  let page = 1;
  while (true) {
    const res = await taoFetch(path, { ...params, page: String(page) });
    const items = res.data || [];
    all.push(...items);
    if (!res.pagination?.next_page || items.length === 0) break;
    page++;
    // Shorter delay between pages since we have more keys
    await sleep(Math.max(1500, 6000 / KEYS.length));
  }
  return all;
}

// Adaptive sleep — shorter when we have more keys (1s per key capacity)
export function interCallDelay() {
  return Math.max(1500, 6000 / KEYS.length);
}

export const NUM_KEYS = KEYS.length;
