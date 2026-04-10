#!/usr/bin/env node
// Fetches x402 Agentic Payments data from Artemis via headless browser.
// Scrapes both metrics and deep_dives tabs to capture:
//   - Summary KPIs (daily_txns, daily_vol, avg_tx, cumulative buyers/sellers)
//   - Daily time series for charts
//   - Server leaderboard (176 servers with real_txns, real_volume, buyers, gamed%)
//   - Facilitator aggregation (grouped from server URLs)
//   - Chain breakdown (Base, Solana, Polygon real volume/txns)
// Writes to public/data/agentic.json
// Run: node scripts/fetch-artemis.mjs

import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = join(__dirname, '..', 'public', 'data', 'agentic.json');

// Known x402 facilitator patterns — matched against server_url hostnames
const FACILITATOR_PATTERNS = [
  { name: 'Virtuals Protocol', match: /virtuals\.io/i, note: 'Degen Claw ACP' },
  { name: 'Coinbase', match: /(coinbase|cdp)/i, note: 'CDP facilitator' },
  { name: 'Payai', match: /payai/i, note: '' },
  { name: 'X402rs', match: /x402rs/i, note: '' },
  { name: 'Daydreams', match: /daydreams/i, note: '' },
  { name: 'Mogami', match: /mogami/i, note: '' },
  { name: 'Dexter', match: /dexter/i, note: '' },
  { name: 'Blockrun', match: /blockrun/i, note: '' },
  { name: 'Twit.sh', match: /twit\.sh/i, note: '' },
  { name: 'Enrichx402', match: /enrichx402/i, note: '' },
  { name: 'Ainalyst', match: /ainalyst/i, note: '' },
  { name: 'Vishwa Network', match: /vishwanetwork/i, note: '' },
  { name: 'Anyspend', match: /anyspend/i, note: '' },
  { name: 'Aubr.ai', match: /aubr\.ai/i, note: '' },
  { name: '100xConn', match: /100xconn/i, note: 'Outlier' },
];

function classifyFacilitator(serverUrl) {
  if (!serverUrl) return 'Other';
  for (const f of FACILITATOR_PATTERNS) {
    if (f.match.test(serverUrl)) return f.name;
  }
  return 'Other';
}

async function main() {
  console.log('=== Fetching Artemis x402 data ===');
  console.log(`Time: ${new Date().toISOString()}`);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const summaryData = {};
  const timeseriesData = {};
  let serverLeaderboard = null;
  const chainSeries = {}; // { REAL_VOLUME: {base-x402: [...], solana-x402: [...]}, ... }

  page.on('response', async (resp) => {
    const url = resp.url();
    if (resp.status() !== 200) return;

    // Server leaderboard (has 176 servers)
    if (url.includes('x402-server-leaderboard')) {
      try { serverLeaderboard = await resp.json(); } catch {}
      return;
    }

    // Time series data
    if (!url.includes('data-svc.artemisxyz.com/v2/data/')) return;
    try {
      const body = await resp.json();
      if (!body.series) return;

      const isChainDim = url.includes('dimensionType=CHAIN');

      for (const s of body.series) {
        if (!Array.isArray(s.data) || s.data.length === 0) continue;

        if (isChainDim) {
          // Chain breakdown: asset is like "base-x402", "solana-x402"
          if (!chainSeries[s.metric]) chainSeries[s.metric] = {};
          chainSeries[s.metric][s.asset] = s.data.filter(v => v[1] !== null);
        } else if (typeof s.data[0][0] === 'number') {
          // Main time series
          timeseriesData[s.metric] = s.data.filter(v => v[1] !== null);
        } else {
          // Summary value
          summaryData[s.metric] = s.data[0]?.[1];
        }
      }
    } catch {}
  });

  // Phase 1: metrics tab (summary + time series + percent gamed)
  console.log('\n[1/2] Loading Artemis x402 metrics tab...');
  await page.goto('https://app.artemisanalytics.com/asset/x402?from=assets&tab=metrics', {
    waitUntil: 'networkidle', timeout: 60000,
  });
  await page.waitForTimeout(10000);

  // Phase 2: deep_dives tab (server leaderboard + chain breakdown + gamed %)
  console.log('[2/2] Loading Artemis x402 deep_dives tab...');
  await page.goto('https://app.artemisanalytics.com/asset/x402?from=assets&tab=deep_dives', {
    waitUntil: 'networkidle', timeout: 60000,
  });
  await page.waitForTimeout(15000);
  await browser.close();

  console.log(`Summary metrics: ${Object.keys(summaryData).filter(k => summaryData[k] != null).length} fields`);
  console.log(`Time series: ${Object.keys(timeseriesData).join(', ')}`);
  console.log(`Chain series: ${Object.keys(chainSeries).join(', ')}`);
  console.log(`Server leaderboard: ${serverLeaderboard?.data?.length || 0} servers`);

  // Build time series (last 180 days)
  const txns = timeseriesData['TXNS'] || [];
  const vol = timeseriesData['VOLUME'] || [];
  const ts = txns.slice(-180).map(([t, txVal]) => {
    const d = new Date(t).toISOString().split('T')[0];
    const volVal = vol.find(v => v[0] === t)?.[1] || 0;
    return { d: d.replace(/^\d{4}-/, '').replace('-', '/'), tx: txVal, vol: Math.round(volVal) };
  });

  // 30D averages
  const last30tx = txns.slice(-30);
  const last30vol = vol.slice(-30);
  const dailyTxns = last30tx.length > 0 ? Math.round(last30tx.reduce((s, v) => s + v[1], 0) / last30tx.length) : 0;
  const dailyVol = last30vol.length > 0 ? Math.round(last30vol.reduce((s, v) => s + v[1], 0) / last30vol.length) : 0;
  const avgTx = dailyTxns > 0 ? Math.round(dailyVol / dailyTxns * 100) / 100 : 0;

  // Build servers array (top 30 by real_volume)
  const servers = (serverLeaderboard?.data || [])
    .filter(s => s.real_volume > 0 || s.real_txns > 0)
    .sort((a, b) => (b.real_volume || 0) - (a.real_volume || 0))
    .slice(0, 30)
    .map(s => ({
      url: s.server_url,
      facilitator: classifyFacilitator(s.server_url),
      real_txns: s.real_txns || 0,
      real_volume: Math.round(s.real_volume || 0),
      avg_tx: Math.round((s.real_avg_txn_size || 0) * 100) / 100,
      buyers: s.buyers || 0,
      pct_gamed_txns: Math.round((s.pct_gamed_txns || 0) * 10000) / 100,
      pct_gamed_vol: Math.round((s.pct_gamed_volume || 0) * 10000) / 100,
    }));

  // Build facilitators array (aggregate by pattern)
  const facMap = {};
  for (const s of (serverLeaderboard?.data || [])) {
    const fac = classifyFacilitator(s.server_url);
    if (!facMap[fac]) facMap[fac] = { name: fac, vol: 0, tx: 0, buyers: 0, server_count: 0 };
    facMap[fac].vol += s.real_volume || 0;
    facMap[fac].tx += s.real_txns || 0;
    facMap[fac].buyers += s.buyers || 0;
    facMap[fac].server_count++;
  }
  const facilitators = Object.values(facMap)
    .filter(f => f.vol > 0 || f.tx > 0)
    .map(f => ({
      name: f.name,
      vol: Math.round(f.vol),
      tx: f.tx,
      avg: f.tx > 0 ? Math.round((f.vol / f.tx) * 100) / 100 : 0,
      buyers: f.buyers,
      server_count: f.server_count,
      note: FACILITATOR_PATTERNS.find(p => p.name === f.name)?.note || '',
    }))
    .sort((a, b) => b.vol - a.vol);

  // Build chain breakdown (aggregate real volume last 30d per chain)
  const chains = {};
  const now = Date.now();
  const cutoff30d = now - 30 * 86400000;
  if (chainSeries['REAL_VOLUME']) {
    for (const [asset, series] of Object.entries(chainSeries['REAL_VOLUME'])) {
      const chainName = asset.replace('-x402', '');
      const recent = series.filter(v => v[0] >= cutoff30d).reduce((s, v) => s + (v[1] || 0), 0);
      chains[chainName] = { real_volume_30d: Math.round(recent) };
    }
  }
  if (chainSeries['REAL_TXNS']) {
    for (const [asset, series] of Object.entries(chainSeries['REAL_TXNS'])) {
      const chainName = asset.replace('-x402', '');
      const recent = series.filter(v => v[0] >= cutoff30d).reduce((s, v) => s + (v[1] || 0), 0);
      if (!chains[chainName]) chains[chainName] = {};
      chains[chainName].real_txns_30d = Math.round(recent);
    }
  }
  const totalChainVol = Object.values(chains).reduce((s, c) => s + (c.real_volume_30d || 0), 0);
  for (const c of Object.values(chains)) {
    c.pct_of_volume = totalChainVol > 0 ? Math.round(((c.real_volume_30d || 0) / totalChainVol) * 10000) / 100 : 0;
  }

  const result = {
    updated_at: new Date().toISOString(),
    summary: {
      daily_txns: dailyTxns,
      daily_vol: dailyVol,
      avg_tx: avgTx,
      txns_d: summaryData['TXNS_PCT_CHG'] ?? null,
      vol_d: summaryData['VOLUME_PCT_CHG'] ?? null,
      avg_tx_d: summaryData['AVG_TXN_SIZE_PCT_CHG'] ?? null,
      cum_buyers: summaryData['CUMULATIVE_BUYERS'] ?? null,
      cum_sellers: summaryData['CUMULATIVE_SELLERS'] ?? null,
      buyers_d: summaryData['CUMULATIVE_BUYERS_PCT_CHG'] ?? null,
      sellers_d: summaryData['CUMULATIVE_SELLERS_PCT_CHG'] ?? null,
    },
    timeseries: ts,
    servers,
    facilitators,
    chains,
  };

  mkdirSync(dirname(OUT_PATH), { recursive: true });
  writeFileSync(OUT_PATH, JSON.stringify(result, null, 2));
  console.log(`\nWritten to ${OUT_PATH}`);
  console.log(`Summary: ${dailyTxns.toLocaleString()} txns/day, $${dailyVol.toLocaleString()} vol/day, $${avgTx} avg tx`);
  console.log(`Servers: ${servers.length} (top by volume)`);
  console.log(`Facilitators: ${facilitators.length} grouped (${facilitators[0]?.name || '?'} leads with $${facilitators[0]?.vol.toLocaleString() || 0})`);
  console.log(`Chains: ${Object.keys(chains).join(', ')}`);
  console.log('Done!');
}

main().catch(e => { console.error(e); process.exit(1); });
