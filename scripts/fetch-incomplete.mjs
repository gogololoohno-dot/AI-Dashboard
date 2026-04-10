#!/usr/bin/env node
// Patch script — re-fetches only incomplete/suspicious subnets from owners.json.
// Runs frequently throughout the day to fill gaps left by rate-limited main runs.
// Run: TAOSTATS_API_KEY=key1,key2,key3 node scripts/fetch-incomplete.mjs

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { taoFetch, taoFetchAll, sleep, interCallDelay } from './taostats-client.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OWNERS_PATH = join(__dirname, '..', 'public', 'data', 'owners.json');

const WINDOWS = [
  { key: 'd1', days: 1 },
  { key: 'd7', days: 7 },
  { key: 'd30', days: 30 },
  { key: 'd90', days: 90 },
];

// Any extrinsic with both DELEGATE + UNDELEGATE non-transfer events = validator
// move (restake/consolidation). Exclude all non-transfer events in such
// extrinsics. Real transfers (is_transfer=true) are never filtered.
function filterRestakes(trades) {
  const byExtrinsic = {};
  for (const t of trades) {
    const eid = t.extrinsic_id;
    if (!eid) continue;
    if (!byExtrinsic[eid]) byExtrinsic[eid] = [];
    byExtrinsic[eid].push(t);
  }
  const excludeIds = new Set();
  for (const [eid, events] of Object.entries(byExtrinsic)) {
    const nonTransfers = events.filter(e => !e.is_transfer);
    const hasDelegate = nonTransfers.some(e => e.action === 'DELEGATE');
    const hasUndelegate = nonTransfers.some(e => e.action === 'UNDELEGATE');
    if (hasDelegate && hasUndelegate) excludeIds.add(eid);
  }
  return trades.filter(t => {
    if (t.is_transfer) return true;
    return !excludeIds.has(t.extrinsic_id);
  });
}

function aggregateDelegations(trades, netuid) {
  const now = Date.now() / 1000;
  const sell = {}, buy = {}, net = {}, transferred = {};
  let filtered = trades.filter(t => t.netuid === netuid);
  filtered = filterRestakes(filtered);
  const transferRecipients = new Set();

  for (const { key, days } of WINDOWS) {
    const cutoff = now - days * 86400;
    let s = 0, b = 0, xfer = 0;
    for (const t of filtered) {
      const ts = new Date(t.timestamp).getTime() / 1000;
      if (ts < cutoff) continue;
      const amt = (parseFloat(t.amount) || 0) / 1e9;
      if (t.action === 'UNDELEGATE') {
        if (t.is_transfer && t.transfer_address) {
          xfer += amt;
          transferRecipients.add(t.transfer_address.ss58 || t.transfer_address);
        } else {
          s += amt;
        }
      } else if (t.action === 'DELEGATE' && !t.is_transfer) {
        b += amt;
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
      if (t.is_transfer) ltX += amt;
      else ltS += amt;
    } else if (t.action === 'DELEGATE' && !t.is_transfer) {
      ltB += amt;
    }
  }
  sell.lifetime = Math.round(ltS * 100) / 100;
  buy.lifetime = Math.round(ltB * 100) / 100;
  net.lifetime = Math.round((ltB - ltS) * 100) / 100;
  transferred.lifetime = Math.round(ltX * 100) / 100;

  return { sell_pressure: sell, buyback: buy, net_flow: net, transferred, transfer_recipients: [...transferRecipients] };
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
  console.log('=== Patch fetch: incomplete subnets only ===');
  console.log(`Time: ${new Date().toISOString()}`);

  const data = JSON.parse(readFileSync(OWNERS_PATH, 'utf8'));
  const allOwners = data.owners || [];

  // Find targets: marked incomplete OR suspicious (owner exists but all zeros)
  const targets = allOwners.filter(o => {
    if (!o.owner_coldkey) return false;
    if (o._incomplete) return true;
    const allZero = (o.sell_pressure?.lifetime || 0) === 0 &&
                    (o.buyback?.lifetime || 0) === 0 &&
                    (o.transferred?.lifetime || 0) === 0;
    return allZero;
  });

  if (targets.length === 0) {
    console.log('No incomplete subnets. Nothing to do.');
    return;
  }

  console.log(`Found ${targets.length} subnets to patch:`);
  targets.forEach(t => console.log(`  SN${t.sn} ${t.owner_coldkey.slice(0, 15)}...`));

  // Build unique coldkey → netuids mapping
  const coldkeyToNetuids = {};
  for (const t of targets) {
    if (!coldkeyToNetuids[t.owner_coldkey]) coldkeyToNetuids[t.owner_coldkey] = [];
    coldkeyToNetuids[t.owner_coldkey].push(t.sn);
  }

  const uniqueOwners = Object.keys(coldkeyToNetuids);
  console.log(`\n${uniqueOwners.length} unique owner coldkey(s) to fetch`);

  // Fetch each owner with generous delays
  const ownerData = {};
  for (let i = 0; i < uniqueOwners.length; i++) {
    const ck = uniqueOwners[i];
    console.log(`\n[${i + 1}/${uniqueOwners.length}] ${ck.slice(0, 15)}...`);

    const delegations = await taoFetchAll('api/delegation/v1', {
      nominator: ck, action: 'all', limit: '200', order: 'timestamp_desc',
    });
    await sleep(interCallDelay());

    const transfers = await taoFetchAll('api/transfer/v1', {
      from: ck, limit: '200', order: 'timestamp_desc',
    });
    await sleep(interCallDelay());

    ownerData[ck] = { delegations, transfers };
    console.log(`  ${delegations.length} delegations, ${transfers.length} transfers`);
  }

  // Merge results back into owners.json
  let updated = 0;
  for (let i = 0; i < allOwners.length; i++) {
    const o = allOwners[i];
    if (!o.owner_coldkey || !ownerData[o.owner_coldkey]) continue;
    const { delegations, transfers } = ownerData[o.owner_coldkey];

    // Skip if we got nothing useful
    if (delegations.length === 0 && transfers.length === 0) continue;

    const { sell_pressure, buyback, net_flow, transferred, transfer_recipients } =
      aggregateDelegations(delegations, o.sn);
    const transfers_out = aggregateTransfers(transfers);

    allOwners[i] = {
      sn: o.sn,
      owner_coldkey: o.owner_coldkey,
      sell_pressure, buyback, net_flow, transferred, transfers_out,
      transfer_recipients,
      indirect_sells: o.indirect_sells || {}, // preserve existing indirect data
      // _incomplete flag removed
    };
    updated++;
  }

  data.updated_at = new Date().toISOString();
  data.owners = allOwners;
  writeFileSync(OWNERS_PATH, JSON.stringify(data, null, 2));
  console.log(`\nPatched ${updated}/${targets.length} subnets. Written to ${OWNERS_PATH}`);
}

main().catch(e => { console.error(e); process.exit(1); });
