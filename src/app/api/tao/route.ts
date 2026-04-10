import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const API = 'https://api.taostats.io';

// Multi-key rotation: pick first available key (simple round-robin via counter)
const KEYS = (process.env.TAOSTATS_API_KEY || '')
  .split(',').map(k => k.trim()).filter(k => k.length > 0);
let keyIdx = 0;
function nextKey(): string {
  if (KEYS.length === 0) throw new Error('Missing TAOSTATS_API_KEY');
  const k = KEYS[keyIdx % KEYS.length];
  keyIdx++;
  return k;
}

async function taoFetch(path: string, params: Record<string, string> = {}) {
  const qs = new URLSearchParams(params).toString();
  const url = `${API}/${path}${qs ? '?' + qs : ''}`;
  // Try each key once if rate-limited
  for (let attempt = 0; attempt < Math.max(1, KEYS.length); attempt++) {
    const key = nextKey();
    const res = await fetch(url, { headers: { Authorization: key }, next: { revalidate: 60 } });
    if (res.status === 429 && attempt < KEYS.length - 1) continue;
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`taostats ${res.status}: ${text.slice(0, 200)}`);
    }
    return res.json();
  }
  throw new Error('taostats: all keys rate-limited');
}

export async function GET() {
  try {
    // Phase 1: TAO price + top 50 subnet pools in parallel
    const [priceData, poolData] = await Promise.all([
      taoFetch('api/price/history/v1', { asset: 'tao', period: '1d', limit: '1' }),
      taoFetch('api/dtao/pool/latest/v1', { limit: '50', order: 'market_cap_desc' }),
    ]);

    const taoInfo = priceData.data?.[0] || {};
    const tao_price = parseFloat(taoInfo.price) || 0;
    const tao_price_change_24h = parseFloat(taoInfo.percent_change_24h) || 0;

    const pools = poolData.data || [];
    const R = 1e9; // RAO to TAO conversion
    const subnets = pools.map((p: any) => {
      const mcap = parseFloat(p.market_cap) || 0;
      const liq = parseFloat(p.liquidity) || 0;
      const vol = parseFloat(p.tao_volume_24_hr) || 0;
      const buyVol = parseFloat(p.tao_buy_volume_24_hr) || 0;
      const sellVol = parseFloat(p.tao_sell_volume_24_hr) || 0;
      // Values > 1M are in RAO, convert to TAO
      const toTao = (v: number) => v > 1e6 ? v / R : v;
      return {
        sn: p.netuid,
        name: p.name || `SN${p.netuid}`,
        symbol: p.symbol || '',
        price_tao: parseFloat(p.price) || 0,
        price_usd: (parseFloat(p.price) || 0) * tao_price,
        change_1h: parseFloat(String(p.price_change_1_hour).replace('%', '')) || 0,
        change_1d: parseFloat(String(p.price_change_1_day).replace('%', '')) || 0,
        change_7d: parseFloat(String(p.price_change_1_week).replace('%', '')) || 0,
        change_30d: parseFloat(String(p.price_change_1_month).replace('%', '')) || 0,
        emission_pct: parseFloat(p.root_prop) * 100 || 0,
        market_cap_tao: toTao(mcap),
        market_cap_usd: toTao(mcap) * tao_price,
        liquidity_tao: toTao(liq),
        volume_24h_tao: toTao(vol),
        net_tao_flow_1d: toTao(buyVol) - toTao(sellVol),
        buys_24h: p.buys_24_hr || 0,
        sells_24h: p.sells_24_hr || 0,
        buyers_24h: p.buyers_24_hr || 0,
        sellers_24h: p.sellers_24_hr || 0,
        fear_greed: parseFloat(p.fear_and_greed_index) || 0,
        fear_greed_label: p.fear_and_greed_sentiment || '',
        alpha_in_pool: parseFloat(p.alpha_in_pool) || 0,
        alpha_staked: parseFloat(p.alpha_staked) || 0,
      };
    });

    return NextResponse.json({
      tao_price,
      tao_price_change_24h,
      last_block: pools[0]?.block_number || 0,
      timestamp: pools[0]?.timestamp || new Date().toISOString(),
      subnets,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
