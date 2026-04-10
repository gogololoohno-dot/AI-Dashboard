#!/usr/bin/env node
// Fetches subnet owner sell/buy data from taostats API with generous delays.
// Writes results to public/data/owners.json for static serving.
// Run: TAOSTATS_API_KEY=... node scripts/fetch-owners.mjs

import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = join(__dirname, '..', 'public', 'data', 'owners.json');
const EXTRA_PATH = join(__dirname, '..', 'public', 'data', 'subnets-extra.json');
const AGENTIC_PATH = join(__dirname, '..', 'public', 'data', 'agentic.json');

const API = 'https://api.taostats.io';
const KEY = process.env.TAOSTATS_API_KEY;
if (!KEY) { console.error('Missing TAOSTATS_API_KEY'); process.exit(1); }

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function taoFetchAll(path, params = {}) {
  const all = [];
  let page = 1;
  while (true) {
    const res = await taoFetch(path, { ...params, page: String(page) });
    const items = res.data || [];
    all.push(...items);
    if (!res.pagination?.next_page || items.length === 0) break;
    page++;
    await sleep(3000);
  }
  return all;
}

async function taoFetch(path, params = {}) {
  const qs = new URLSearchParams(params).toString();
  const url = `${API}/${path}?${qs}`;
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(url, { headers: { Authorization: KEY } });
    if (res.status === 429) {
      const wait = 5000 * (attempt + 1);
      console.log(`  429 on ${path}, waiting ${wait / 1000}s...`);
      await sleep(wait);
      continue;
    }
    if (!res.ok) {
      console.log(`  ${res.status} on ${path}`);
      return { data: [] };
    }
    return res.json();
  }
  console.log(`  FAILED ${path} after 3 retries`);
  return { data: [] };
}

const WINDOWS = [
  { key: 'd1', days: 1 },
  { key: 'd7', days: 7 },
  { key: 'd30', days: 30 },
  { key: 'd90', days: 90 },
];

// Identify restake pairs: DELEGATE + UNDELEGATE events in the same extrinsic
// represent a single atomic validator move (owner unstakes from validator A,
// restakes to validator B) — NOT a real buy or sell. Exclude both.
function filterRestakes(trades) {
  const byExtrinsic = {};
  for (const t of trades) {
    const eid = t.extrinsic_id;
    if (!eid || t.is_transfer) continue;
    if (!byExtrinsic[eid]) byExtrinsic[eid] = [];
    byExtrinsic[eid].push(t);
  }
  const excludeIds = new Set();
  for (const [eid, events] of Object.entries(byExtrinsic)) {
    const delegates = events.filter(e => e.action === 'DELEGATE');
    const undelegates = events.filter(e => e.action === 'UNDELEGATE');
    if (delegates.length > 0 && undelegates.length > 0) {
      const delSum = delegates.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
      const undelSum = undelegates.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
      // Amounts match within 0.1% → restake pair
      const diff = Math.abs(delSum - undelSum);
      if (delSum > 0 && diff / delSum < 0.001) {
        excludeIds.add(eid);
      }
    }
  }
  return trades.filter(t => !excludeIds.has(t.extrinsic_id));
}

function aggregateDelegations(trades, netuid) {
  const now = Date.now() / 1000;
  const sell = {}, buy = {}, net = {};
  const transferred = {}; // alpha transferred (not sold) — tracked separately

  // Filter to this subnet, then remove restake pairs (not real sells/buys)
  let filtered = trades.filter(t => t.netuid === netuid);
  filtered = filterRestakes(filtered);
  const transferRecipients = new Set();

  for (const { key, days } of WINDOWS) {
    const cutoff = now - days * 86400;
    let s = 0, b = 0, xfer = 0;
    for (const t of filtered) {
      const ts = new Date(t.timestamp).getTime() / 1000;
      if (ts < cutoff) continue;
      const amt = (parseFloat(t.amount) || 0) / 1e9; // RAO -> TAO
      if (t.action === 'UNDELEGATE') {
        if (t.is_transfer && t.transfer_address) {
          xfer += amt; // alpha transferred to another address, not a market sell
          transferRecipients.add(t.transfer_address.ss58 || t.transfer_address);
        } else {
          s += amt; // actual market sell
        }
      } else if (t.action === 'DELEGATE') {
        if (!t.is_transfer) b += amt; // actual market buy (exclude incoming transfers)
      }
    }
    sell[key] = Math.round(s * 100) / 100;
    buy[key] = Math.round(b * 100) / 100;
    net[key] = Math.round((b - s) * 100) / 100;
    transferred[key] = Math.round(xfer * 100) / 100;
  }

  let ltS = 0, ltB = 0, ltX = 0;
  for (const t of filtered) {
    const amt = (parseFloat(t.amount) || 0) / 1e9;
    if (t.action === 'UNDELEGATE') {
      if (t.is_transfer) { ltX += amt; }
      else { ltS += amt; }
    } else if (t.action === 'DELEGATE' && !t.is_transfer) {
      ltB += amt;
    }
  }
  sell.lifetime = Math.round(ltS * 100) / 100;
  buy.lifetime = Math.round(ltB * 100) / 100;
  net.lifetime = Math.round((ltB - ltS) * 100) / 100;
  transferred.lifetime = Math.round(ltX * 100) / 100;

  return {
    sell_pressure: sell, buyback: buy, net_flow: net, transferred,
    transfer_recipients: [...transferRecipients],
  };
}

function aggregateTransfers(transfers) {
  const now = Date.now() / 1000;
  const out = {};
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

async function main() {
  console.log('=== Fetching subnet owner data ===');
  console.log(`Time: ${new Date().toISOString()}`);

  // Step 1: Get top 50 subnets
  console.log('\n[1/3] Fetching top 50 subnets...');
  const poolRes = await taoFetch('api/dtao/pool/latest/v1', {
    limit: '50', order: 'market_cap_desc',
  });
  const subnets = (poolRes.data || []).map(s => s.netuid).filter(n => n > 0);
  console.log(`  Found ${subnets.length} subnets`);

  // Step 2: Get owner coldkeys (one at a time, 1s delay)
  console.log('\n[2/3] Fetching owner coldkeys...');
  const netuidToOwner = {};
  const coldkeyToNetuids = {};

  for (const netuid of subnets) {
    const res = await taoFetch('api/subnet/owner/v1', { netuid: String(netuid) });
    const ck = (res.data || [])[0]?.owner?.ss58 || null;
    netuidToOwner[netuid] = ck;
    if (ck) {
      if (!coldkeyToNetuids[ck]) coldkeyToNetuids[ck] = [];
      coldkeyToNetuids[ck].push(netuid);
    }
    await sleep(3000);
  }

  const uniqueOwners = Object.keys(coldkeyToNetuids);
  const ownersWithKeys = subnets.filter(n => netuidToOwner[n]);
  console.log(`  ${ownersWithKeys.length} subnets have owner coldkeys (${uniqueOwners.length} unique owners)`);

  // Step 3: Fetch delegation events + transfers per owner (2s delay between owners)
  console.log('\n[3/3] Fetching delegation events + transfers per owner...');
  const ownerData = {};

  for (let i = 0; i < uniqueOwners.length; i++) {
    const ck = uniqueOwners[i];
    const sns = coldkeyToNetuids[ck];
    console.log(`  [${i + 1}/${uniqueOwners.length}] ${ck.slice(0, 12)}... (SN${sns.join(',')})`);

    const delegations = await taoFetchAll('api/delegation/v1', {
      nominator: ck, action: 'all', limit: '200', order: 'timestamp_desc',
    });
    await sleep(3000);

    const transfers = await taoFetchAll('api/transfer/v1', {
      from: ck, limit: '200', order: 'timestamp_desc',
    });
    await sleep(3000);

    ownerData[ck] = { delegations, transfers };
    console.log(`    ${delegations.length} delegations, ${transfers.length} transfers`);
  }

  // Retry pass: re-fetch owners that got 0 delegations (likely rate-limited)
  const emptyOwners = uniqueOwners.filter(ck => ownerData[ck].delegations.length === 0);
  if (emptyOwners.length > 0) {
    console.log(`\n  Retrying ${emptyOwners.length} owners with 0 results (likely rate-limited)...`);
    await sleep(10000); // Wait 10s for rate limits to cool
    for (let i = 0; i < emptyOwners.length; i++) {
      const ck = emptyOwners[i];
      const sns = coldkeyToNetuids[ck];
      console.log(`  [retry ${i + 1}/${emptyOwners.length}] ${ck.slice(0, 12)}... (SN${sns.join(',')})`);
      const delegations = await taoFetchAll('api/delegation/v1', {
        nominator: ck, action: 'all', limit: '200', order: 'timestamp_desc',
      });
      await sleep(5000);
      const transfers = await taoFetchAll('api/transfer/v1', {
        from: ck, limit: '200', order: 'timestamp_desc',
      });
      await sleep(5000);
      ownerData[ck] = { delegations, transfers };
      console.log(`    ${delegations.length} delegations, ${transfers.length} transfers`);
    }
    const stillEmpty = uniqueOwners.filter(ck => ownerData[ck].delegations.length === 0);
    if (stillEmpty.length > 0) console.log(`  ${stillEmpty.length} owners still empty after retry`);
  }

  // Step 4: Aggregate owner data
  console.log('\nAggregating owner data...');
  const ownerRows = subnets.map(netuid => {
    const coldkey = netuidToOwner[netuid];
    if (!coldkey || !ownerData[coldkey]) {
      return {
        sn: netuid, owner_coldkey: null,
        sell_pressure: {}, buyback: {}, net_flow: {}, transferred: {}, transfers_out: {},
        indirect_sells: {},
      };
    }
    const { delegations, transfers } = ownerData[coldkey];
    const { sell_pressure, buyback, net_flow, transferred, transfer_recipients } = aggregateDelegations(delegations, netuid);
    const transfers_out = aggregateTransfers(transfers);
    const incomplete = delegations.length === 0 && transfers.length === 0;
    return {
      sn: netuid, owner_coldkey: coldkey,
      sell_pressure, buyback, net_flow, transferred, transfers_out,
      transfer_recipients, indirect_sells: {},
      ...(incomplete ? { _incomplete: true } : {}),
    };
  });

  // Step 4b: Track indirect sells from transfer recipients
  const allRecipients = new Set();
  for (const o of ownerRows) {
    for (const r of (o.transfer_recipients || [])) allRecipients.add(r);
  }
  console.log(`\n[3b/4] Tracking ${allRecipients.size} transfer recipient addresses...`);

  const recipientData = {};
  const recipientList = [...allRecipients];
  for (let i = 0; i < recipientList.length; i++) {
    const addr = recipientList[i];
    console.log(`  [${i + 1}/${recipientList.length}] ${addr.slice(0, 12)}...`);
    const trades = await taoFetchAll('api/delegation/v1', {
      nominator: addr, action: 'undelegate', limit: '200', order: 'timestamp_desc',
    });
    recipientData[addr] = trades.filter(t => !t.is_transfer); // only actual sells
    await sleep(3000);
  }

  // Aggregate indirect sells per subnet
  const now2 = Date.now() / 1000;
  for (const o of ownerRows) {
    if (!o.transfer_recipients?.length) continue;
    const indirect = {};
    for (const { key, days } of WINDOWS) {
      const cutoff = now2 - days * 86400;
      let total = 0;
      for (const addr of o.transfer_recipients) {
        for (const t of (recipientData[addr] || [])) {
          if (t.netuid !== o.sn) continue;
          const ts = new Date(t.timestamp).getTime() / 1000;
          if (ts < cutoff) continue;
          total += (parseFloat(t.amount) || 0) / 1e9;
        }
      }
      indirect[key] = Math.round(total * 100) / 100;
    }
    let ltTotal = 0;
    for (const addr of o.transfer_recipients) {
      for (const t of (recipientData[addr] || [])) {
        if (t.netuid !== o.sn) continue;
        ltTotal += (parseFloat(t.amount) || 0) / 1e9;
      }
    }
    indirect.lifetime = Math.round(ltTotal * 100) / 100;
    o.indirect_sells = indirect;
  }

  // Clean up transfer_recipients from output (internal use only)
  const owners = ownerRows.map(({ transfer_recipients, ...rest }) => rest);

  const result = {
    updated_at: new Date().toISOString(),
    subnet_count: subnets.length,
    owners,
  };

  mkdirSync(dirname(OUT_PATH), { recursive: true });
  writeFileSync(OUT_PATH, JSON.stringify(result, null, 2));
  console.log(`\nWritten to ${OUT_PATH}`);

  // Summary
  const selling = owners.filter(o => (o.net_flow?.lifetime || 0) < 0);
  const aligned = owners.filter(o => (o.net_flow?.lifetime || 0) > 0);
  console.log(`\nOwners: ${selling.length} SELLING, ${aligned.length} ALIGNED, ${owners.length - selling.length - aligned.length} neutral`);

  // Step 5: Fetch subnet pool history + emission data per subnet
  console.log('\n[4/4] Fetching subnet flow history + emission data...');
  const now = Date.now() / 1000;
  const subnetExtras = [];

  for (let i = 0; i < subnets.length; i++) {
    const netuid = subnets[i];
    console.log(`  [${i + 1}/${subnets.length}] SN${netuid}`);

    // Pool history for flow 1W/1M — compute from total_tao change over time
    const histRes = await taoFetch('api/dtao/pool/history/v1', {
      netuid: String(netuid), frequency: 'by_day', limit: '30', order: 'timestamp_desc',
    });
    const snapshots = histRes.data || [];
    let flow7 = 0, flow30 = 0;
    if (snapshots.length >= 2) {
      const latest = parseFloat(snapshots[0]?.total_tao || '0');
      // Find snapshot closest to 7 days ago and 30 days ago
      const cutoff7 = now - 7 * 86400;
      const cutoff30 = now - 30 * 86400;
      let snap7 = null, snap30 = null;
      for (const s of snapshots) {
        const ts = new Date(s.timestamp).getTime() / 1000;
        if (!snap7 && ts <= cutoff7) snap7 = s;
        if (!snap30 && ts <= cutoff30) snap30 = s;
      }
      // total_tao may be in RAO (large numbers) or TAO
      const toTao = v => { const n = parseFloat(v) || 0; return n > 1e6 ? n / 1e9 : n; };
      const latestTao = toTao(snapshots[0]?.total_tao);
      if (snap7) flow7 = Math.round((latestTao - toTao(snap7.total_tao)) * 100) / 100;
      if (snap30) flow30 = Math.round((latestTao - toTao(snap30.total_tao)) * 100) / 100;
    }
    await sleep(3000);

    // Metagraph for emission data — get top neuron (owner hotkey typically has highest emission)
    let daily_alpha = null, daily_tao = null, daily_owner_alpha = null;
    const metaRes = await taoFetch('api/metagraph/latest/v1', {
      netuid: String(netuid), limit: '1', order: 'emission_desc',
    });
    const topNeuron = (metaRes.data || [])[0];
    if (topNeuron?.daily_owner_alpha) {
      // daily_owner_alpha is in RAO-units, divide by 1e9 for alpha
      daily_owner_alpha = (parseFloat(topNeuron.daily_owner_alpha) || 0) / 1e9;
      if (daily_owner_alpha > 0) {
        // Owner gets 18% of total stakeholder emission → total = owner / 0.18
        daily_alpha = Math.round(daily_owner_alpha / 0.18 * 100) / 100;
      }
      const ownerTao = (parseFloat(topNeuron.daily_owner_alpha_as_tao) || 0) / 1e9;
      if (ownerTao > 0) {
        daily_tao = Math.round(ownerTao / 0.18 * 100) / 100;
      }
    }
    await sleep(3000);

    subnetExtras.push({
      sn: netuid,
      flow_7d: Math.round(flow7 * 100) / 100,
      flow_30d: Math.round(flow30 * 100) / 100,
      daily_alpha_emission: daily_alpha,
      daily_tao_equivalent: daily_tao,
      daily_owner_alpha: daily_owner_alpha ? Math.round(daily_owner_alpha * 100) / 100 : null,
    });
    await sleep(1000);
  }

  const extraResult = {
    updated_at: new Date().toISOString(),
    subnets: subnetExtras,
  };
  writeFileSync(EXTRA_PATH, JSON.stringify(extraResult, null, 2));
  console.log(`\nWritten to ${EXTRA_PATH}`);
  // NOTE: x402 Agentic data is handled by scripts/fetch-artemis.mjs
  // (scrapes live Artemis dashboard via headless browser — more accurate than Dune)

  console.log('\nDone!');
}

main().catch(e => { console.error(e); process.exit(1); });
