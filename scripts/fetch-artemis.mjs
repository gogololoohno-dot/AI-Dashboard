#!/usr/bin/env node
// Fetches x402 Agentic Payments data from Artemis via headless browser.
// Writes to public/data/agentic.json
// Run: node scripts/fetch-artemis.mjs

import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = join(__dirname, '..', 'public', 'data', 'agentic.json');

async function main() {
  console.log('=== Fetching Artemis x402 data ===');
  console.log(`Time: ${new Date().toISOString()}`);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const summaryData = {};
  const timeseriesData = {};

  page.on('response', async (resp) => {
    const url = resp.url();
    if (!url.includes('data-svc.artemisxyz.com/v2/data/') || resp.status() !== 200) return;
    try {
      const body = await resp.json();
      if (!body.series) return;
      for (const s of body.series) {
        if (!Array.isArray(s.data) || s.data.length === 0) continue;
        if (typeof s.data[0][0] === 'number') {
          // Time series
          timeseriesData[s.metric] = s.data.filter(v => v[1] !== null);
        } else {
          // Summary value
          summaryData[s.metric] = s.data[0]?.[1];
        }
      }
    } catch {}
  });

  console.log('Loading Artemis x402 metrics page...');
  await page.goto('https://app.artemisanalytics.com/asset/x402?from=assets&tab=metrics', {
    waitUntil: 'networkidle', timeout: 45000,
  });
  await page.waitForTimeout(12000);
  await browser.close();

  console.log('Summary metrics:', Object.keys(summaryData).filter(k => summaryData[k] != null).join(', '));
  console.log('Time series:', Object.keys(timeseriesData).join(', '));

  // Build output
  const txns = timeseriesData['TXNS'] || [];
  const vol = timeseriesData['VOLUME'] || [];
  const avg = timeseriesData['AVG_TXN_SIZE'] || [];
  const buyers = timeseriesData['CUMULATIVE_BUYERS'] || [];
  const sellers = timeseriesData['CUMULATIVE_SELLERS'] || [];

  // Build daily time series (last 180 days for charts)
  const ts = txns.slice(-180).map(([ts, txVal]) => {
    const d = new Date(ts).toISOString().split('T')[0];
    const volVal = vol.find(v => v[0] === ts)?.[1] || 0;
    return { d: d.replace(/^\d{4}-/, '').replace('-', '/'), tx: txVal, vol: Math.round(volVal) };
  });

  // Compute 30D averages from last 30 daily data points
  const last30tx = txns.slice(-30);
  const last30vol = vol.slice(-30);
  const dailyTxns = last30tx.length > 0 ? Math.round(last30tx.reduce((s, v) => s + v[1], 0) / last30tx.length) : 0;
  const dailyVol = last30vol.length > 0 ? Math.round(last30vol.reduce((s, v) => s + v[1], 0) / last30vol.length) : 0;
  const avgTx = dailyTxns > 0 ? Math.round(dailyVol / dailyTxns * 100) / 100 : 0;

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
  };

  mkdirSync(dirname(OUT_PATH), { recursive: true });
  writeFileSync(OUT_PATH, JSON.stringify(result, null, 2));
  console.log(`\nWritten to ${OUT_PATH}`);
  console.log(`Summary: ${dailyTxns.toLocaleString()} txns/day, $${dailyVol.toLocaleString()} vol/day, $${avgTx} avg tx`);
  console.log(`Cumulative: ${Math.round(summaryData['CUMULATIVE_BUYERS'] || 0).toLocaleString()} buyers, ${Math.round(summaryData['CUMULATIVE_SELLERS'] || 0).toLocaleString()} sellers`);
  console.log('Done!');
}

main().catch(e => { console.error(e); process.exit(1); });
