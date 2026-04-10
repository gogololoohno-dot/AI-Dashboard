import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const API = 'https://api.taostats.io';

async function taoFetchAll(path: string, params: Record<string, string> = {}) {
  const all: any[] = [];
  let page = 1;
  while (true) {
    const res = await taoFetch(path, { ...params, page: String(page) });
    const items = res.data || [];
    all.push(...items);
    if (!res.pagination?.next_page || items.length === 0) break;
    page++;
    await new Promise(r => setTimeout(r, 400));
  }
  return all;
}

async function taoFetch(path: string, params: Record<string, string> = {}, retries = 2) {
  const key = process.env.TAOSTATS_API_KEY;
  if (!key) throw new Error('Missing TAOSTATS_API_KEY');
  const qs = new URLSearchParams(params).toString();
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(`${API}/${path}?${qs}`, { headers: { Authorization: key } });
    if (res.status === 429 && attempt < retries) {
      await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
      continue;
    }
    if (res.status === 429) return { data: [], rate_limited: true };
    if (!res.ok) return { data: [] };
    return res.json();
  }
  return { data: [] };
}

const WINDOWS = [
  { key: 'd1', days: 1 },
  { key: 'd7', days: 7 },
  { key: 'd30', days: 30 },
  { key: 'd90', days: 90 },
];

// Remove restake pairs: DELEGATE + UNDELEGATE on same extrinsic_id with
// matching amounts = atomic validator move, not a real buy or sell.
function filterRestakes(trades: any[]): any[] {
  const byExtrinsic: Record<string, any[]> = {};
  for (const t of trades) {
    const eid = t.extrinsic_id;
    if (!eid || t.is_transfer) continue;
    if (!byExtrinsic[eid]) byExtrinsic[eid] = [];
    byExtrinsic[eid].push(t);
  }
  const excludeIds = new Set<string>();
  for (const [eid, events] of Object.entries(byExtrinsic)) {
    const delegates = events.filter((e: any) => e.action === 'DELEGATE');
    const undelegates = events.filter((e: any) => e.action === 'UNDELEGATE');
    if (delegates.length > 0 && undelegates.length > 0) {
      const delSum = delegates.reduce((s: number, e: any) => s + (parseFloat(e.amount) || 0), 0);
      const undelSum = undelegates.reduce((s: number, e: any) => s + (parseFloat(e.amount) || 0), 0);
      const diff = Math.abs(delSum - undelSum);
      if (delSum > 0 && diff / delSum < 0.001) excludeIds.add(eid);
    }
  }
  return trades.filter((t: any) => !excludeIds.has(t.extrinsic_id));
}

function aggregate(trades: any[], netuid: number) {
  const now = Date.now() / 1000;
  const sell: Record<string, number> = {};
  const buy: Record<string, number> = {};
  const net: Record<string, number> = {};

  // Filter to this subnet, then remove restake pairs
  let filtered = trades.filter((t: any) => t.netuid === netuid);
  filtered = filterRestakes(filtered);

  // Per-window aggregation
  for (const { key, days } of WINDOWS) {
    const cutoff = now - days * 86400;
    let s = 0, b = 0;
    for (const t of filtered) {
      const ts = new Date(t.timestamp).getTime() / 1000;
      if (ts < cutoff) continue;
      // amount is in RAO (1e9 RAO = 1 TAO)
      const amt = (parseFloat(t.amount) || 0) / 1e9;
      if (t.action === 'UNDELEGATE' && !t.is_transfer) s += amt;
      else if (t.action === 'DELEGATE' && !t.is_transfer) b += amt;
    }
    sell[key] = Math.round(s * 100) / 100;
    buy[key] = Math.round(b * 100) / 100;
    net[key] = Math.round((b - s) * 100) / 100;
  }

  // Lifetime (all trades, no time filter)
  let ltS = 0, ltB = 0;
  for (const t of filtered) {
    const amt = (parseFloat(t.amount) || 0) / 1e9;
    if (t.action === 'UNDELEGATE' && !t.is_transfer) ltS += amt;
    else if (t.action === 'DELEGATE' && !t.is_transfer) ltB += amt;
  }
  sell.lifetime = Math.round(ltS * 100) / 100;
  buy.lifetime = Math.round(ltB * 100) / 100;
  net.lifetime = Math.round((ltB - ltS) * 100) / 100;

  return { sell_pressure: sell, buyback: buy, net_flow: net };
}

function aggregateTransfers(transfers: any[]) {
  const now = Date.now() / 1000;
  const out: Record<string, number> = {};
  for (const { key, days } of WINDOWS) {
    const cutoff = now - days * 86400;
    let total = 0;
    for (const t of transfers) {
      const ts = new Date(t.timestamp).getTime() / 1000;
      if (ts < cutoff) continue;
      total += (parseFloat(t.amount) || 0) / 1e9;
    }
    out[key] = Math.round(total * 100) / 100;
  }
  let lt = 0;
  for (const t of transfers) lt += (parseFloat(t.amount) || 0) / 1e9;
  out.lifetime = Math.round(lt * 100) / 100;
  return out;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const netuidsParam = searchParams.get('netuids');
  if (!netuidsParam) {
    return NextResponse.json({ error: 'netuids param required (comma-separated)' }, { status: 400 });
  }

  const netuids = netuidsParam.split(',').map(Number).filter(n => n > 0).slice(0, 50);

  try {
    // Step 1: Get owner coldkeys for each subnet (batched to avoid rate limits)
    const ownerResults: { netuid: number; coldkey: string | null }[] = [];
    for (let i = 0; i < netuids.length; i += 5) {
      const batch = netuids.slice(i, i + 5);
      const results = await Promise.all(
        batch.map(async (netuid) => {
          const res = await taoFetch('api/subnet/owner/v1', { netuid: String(netuid) });
          const latest = (res.data || [])[0];
          return { netuid, coldkey: latest?.owner?.ss58 || null };
        })
      );
      ownerResults.push(...results);
      if (i + 5 < netuids.length) await new Promise(r => setTimeout(r, 500));
    }

    // Deduplicate: coldkey -> [netuids they own]
    const coldkeyToNetuids: Record<string, number[]> = {};
    const netuidToOwner: Record<number, string | null> = {};
    for (const { netuid, coldkey } of ownerResults) {
      netuidToOwner[netuid] = coldkey;
      if (coldkey) {
        if (!coldkeyToNetuids[coldkey]) coldkeyToNetuids[coldkey] = [];
        coldkeyToNetuids[coldkey].push(netuid);
      }
    }

    // Step 2: For each unique owner, fetch ALL delegation events + TAO transfers
    // One call per owner for delegations (action=all, no netuid filter)
    // One call per owner for outbound TAO transfers
    // = ~40 calls total instead of ~200
    const ownerData: Record<string, { delegations: any[]; transfers: any[] }> = {};
    const uniqueColdkeys = Object.keys(coldkeyToNetuids);

    // Sequential per owner — paginate to get ALL events (not just first page)
    for (const ck of uniqueColdkeys) {
      const delegations = await taoFetchAll('api/delegation/v1', {
        nominator: ck,
        action: 'all',
        limit: '200',
        order: 'timestamp_desc',
      });
      await new Promise(r => setTimeout(r, 400));
      const transfers = await taoFetchAll('api/transfer/v1', {
        from: ck,
        limit: '200',
        order: 'timestamp_desc',
      });
      ownerData[ck] = { delegations, transfers };
      await new Promise(r => setTimeout(r, 400));
    }

    // Step 3: Aggregate by subnet and time window
    const owners = netuids.map(netuid => {
      const coldkey = netuidToOwner[netuid];
      if (!coldkey || !ownerData[coldkey]) {
        return {
          sn: netuid, owner_coldkey: null,
          sell_pressure: {}, buyback: {}, net_flow: {}, transfers_out: {},
        };
      }

      const { delegations, transfers } = ownerData[coldkey];
      const { sell_pressure, buyback, net_flow } = aggregate(delegations, netuid);
      const transfers_out = aggregateTransfers(transfers);

      return { sn: netuid, owner_coldkey: coldkey, sell_pressure, buyback, net_flow, transfers_out };
    });

    return NextResponse.json({ owners });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
