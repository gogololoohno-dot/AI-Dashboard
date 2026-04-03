import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const API = 'https://api.taostats.io';

async function taoFetch(path: string, params: Record<string, string> = {}) {
  const key = process.env.TAOSTATS_API_KEY;
  if (!key) throw new Error('Missing TAOSTATS_API_KEY');
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${API}/${path}?${qs}`, { headers: { Authorization: key } });
  if (res.status === 429) return { data: [], rate_limited: true };
  if (!res.ok) return { data: [] };
  return res.json();
}

function tsAgo(days: number): string {
  return String(Math.floor(Date.now() / 1000 - days * 86400));
}

async function getOwnerTrades(coldkey: string, netuid: number, action: string, days: number) {
  const params: Record<string, string> = {
    nominator: coldkey,
    netuid: String(netuid),
    action,
    limit: '200',
    order: 'timestamp_desc',
  };
  if (days > 0) params.timestamp_start = tsAgo(days);
  const res = await taoFetch('api/delegation/v1', params);
  const trades = res.data || [];
  return trades.reduce((sum: number, t: any) => sum + (parseFloat(t.amount) || 0), 0);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const netuidsParam = searchParams.get('netuids');
  if (!netuidsParam) {
    return NextResponse.json({ error: 'netuids param required (comma-separated)' }, { status: 400 });
  }

  const netuids = netuidsParam.split(',').map(Number).filter(n => n > 0).slice(0, 50);

  try {
    // Step 1: Get owner coldkeys for each subnet (parallel, batched)
    const ownerResults = await Promise.all(
      netuids.map(async (netuid) => {
        const res = await taoFetch('api/subnet/owner/v1', { netuid: String(netuid) });
        const latest = (res.data || [])[0];
        return { netuid, coldkey: latest?.owner?.ss58 || null };
      })
    );

    // Step 2: For each owner, fetch sell + buy volumes across time windows
    const periods = [
      { key: 'd1', days: 1 },
      { key: 'd7', days: 7 },
      { key: 'd30', days: 30 },
      { key: 'd90', days: 90 },
      { key: 'lifetime', days: 0 },
    ];

    // Process sequentially in batches of 5 to avoid rate limits
    const owners = [];
    for (const { netuid, coldkey } of ownerResults) {
      if (!coldkey) {
        owners.push({ sn: netuid, owner_coldkey: null, sell_pressure: {}, buyback: {}, net_flow: {} });
        continue;
      }

      const sell_pressure: Record<string, number> = {};
      const buyback: Record<string, number> = {};
      const net_flow: Record<string, number> = {};

      // Fetch all periods in parallel for this subnet
      const results = await Promise.all(
        periods.map(async ({ key, days }) => {
          const [sells, buys] = await Promise.all([
            getOwnerTrades(coldkey, netuid, 'undelegate', days),
            getOwnerTrades(coldkey, netuid, 'delegate', days),
          ]);
          return { key, sells, buys };
        })
      );

      for (const { key, sells, buys } of results) {
        sell_pressure[key] = Math.round(sells * 100) / 100;
        buyback[key] = Math.round(buys * 100) / 100;
        net_flow[key] = Math.round((buys - sells) * 100) / 100;
      }

      owners.push({ sn: netuid, owner_coldkey: coldkey, sell_pressure, buyback, net_flow });
    }

    return NextResponse.json({ owners });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
