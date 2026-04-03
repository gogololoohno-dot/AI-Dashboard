import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const PROMPT = `Search taostats.io right now for current Bittensor live data. I need subnet data and top validators. Return ONLY valid JSON with no markdown fences, no preamble, no explanation:
{"tao_price":number,"subnets":[{"sn":number,"name":"string","symbol":"string","price_tao":number,"change_1d":number,"change_7d":number,"change_30d":number,"emission_pct":number,"alpha_per_day":number,"market_cap_tao":number}],"validators":[{"rank":number,"name":"string","hotkey":"string","stake_tao":number,"daily_reward_tao":number,"subnet_count":number}],"last_block":number}
Include at least 15 subnets sorted by emission_pct descending. Include top 10 validators by stake.`;

export async function GET() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    return NextResponse.json({ error: 'Missing ANTHROPIC_API_KEY' }, { status: 500 });
  }

  try {
    // Initial request with web_search tool
    let messages: any[] = [{ role: 'user', content: PROMPT }];
    let finalText = '';

    for (let i = 0; i < 5; i++) {
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
          tools: [{ type: 'web_search_20250305', name: 'web_search' }],
          messages,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        return NextResponse.json({ error: data.error?.message || res.statusText }, { status: res.status });
      }

      // Collect any text blocks
      const textBlocks = (data.content || []).filter((b: any) => b.type === 'text');
      if (textBlocks.length) {
        finalText = textBlocks.map((b: any) => b.text).join('');
      }

      // If stop_reason is end_turn, we're done
      if (data.stop_reason === 'end_turn') break;

      // If tool_use, feed results back
      const toolUses = (data.content || []).filter((b: any) => b.type === 'tool_use');
      if (toolUses.length === 0) break;

      // Add assistant message, then tool results
      messages.push({ role: 'assistant', content: data.content });
      messages.push({
        role: 'user',
        content: toolUses.map((tu: any) => ({
          type: 'tool_result',
          tool_use_id: tu.id,
          content: 'Search completed. Please provide the JSON now.',
        })),
      });
    }

    // Parse JSON from response
    const clean = finalText.replace(/```json[\s\S]*?```|```/g, '').trim();
    const match = clean.match(/\{[\s\S]*\}/);
    if (!match) {
      return NextResponse.json({ error: 'No JSON in response', raw: finalText.slice(0, 500) }, { status: 502 });
    }

    return NextResponse.json(JSON.parse(match[0]));
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
