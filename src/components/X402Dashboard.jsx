'use client';

// TODO: Paste your full X402Dashboard component here from the Ubuntu session.
//
// This file is the main dashboard component (~700 lines) with 7 tabs:
//   1. Overview   - KPIs, thesis, tailwinds/headwinds
//   2. Charts     - Volume, txns, gamed %, facilitator mix
//   3. Facilitators - Pie chart, Dexter exclusion explanation
//   4. Servers    - Top x402 servers table with gamed metrics
//   5. Tokens     - VIRTUAL, PAYAI, KITE, DREAMS, SERV, DEXTER
//   6. ERC-8004   - Agent leaderboard, chain distribution
//   7. Signals    - Timeline of bullish/bearish events
//
// Key sheet IDs already wired in src/app/api/sheets/route.ts:
//   - Artemis Sheet: 1z2EtDU6YXownVQkX5VL2tqvbo2TcOv4BJydraXVzcnE
//   - raw_volume, raw_txns, raw_gamed, snapshot ranges

import { useState, useEffect } from 'react';

export default function X402Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/sheets')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ background: 'var(--color-background-tertiary)', color: 'var(--color-text-primary)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      Loading x402 data...
    </div>
  );

  return (
    <div style={{ background: 'var(--color-background-tertiary)', color: 'var(--color-text-primary)', minHeight: '100vh', padding: '2rem' }}>
      <h1>x402 Dashboard</h1>
      <p style={{ color: 'var(--color-text-secondary)' }}>
        Paste your full component here, or ask Claude to rebuild it from the project context.
      </p>
      <pre style={{ color: 'var(--color-text-tertiary)', fontSize: '0.75rem' }}>
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}
