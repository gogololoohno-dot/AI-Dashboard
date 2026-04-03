import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const PROMPT = `Use web search to find current Bittensor TAO data from taostats.io and coingecko.

Search for: "TAO price USD today", "bittensor top subnets by market cap taostats", "bittensor top validators taostats"

From what you find, construct and return ONLY a JSON object (no markdown, no explanation, no preamble) with this exact shape:
{"tao_price":number,"subnets":[{"sn":number,"name":"string","price_tao":number,"change_1d":number,"emission_pct":number,"market_cap_tao":number}],"validators":[{"rank":number,"name":"string","stake_tao":number}],"last_block":number}

Include at least 10 subnets and 5 validators. Use real numbers from search results. If you cannot find an exact value, use your best estimate from the data available. Return ONLY the JSON.`;

export async function GET() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    return NextResponse.json({ error: 'Missing ANTHROPIC_API_KEY' }, { status: 500 });
  }

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        tool_choice: { type: 'auto' },
        tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 5 }],
        messages: [{ role: 'user', content: PROMPT }],
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: data.error?.message || res.statusText }, { status: res.status });
    }

    // Extract text blocks from response
    const textBlocks = (data.content || []).filter((b: any) => b.type === 'text');
    const finalText = textBlocks.map((b: any) => b.text).join('');

    // Parse JSON from response
    const clean = finalText.replace(/```json|```/g, '').trim();
    const match = clean.match(/\{[\s\S]*\}/);
    if (!match) {
      return NextResponse.json({ error: 'No JSON in response', raw: finalText.slice(0, 500) }, { status: 502 });
    }

    return NextResponse.json(JSON.parse(match[0]));
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
