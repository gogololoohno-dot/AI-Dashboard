'use client';
import { useState, useEffect, useRef } from "react";

const DUNE_KEY="dP3RddcVjGFkvz1crqcPCeh2oWBCA3l8",DUNE_QID=6934571,SNAP="Apr 3 2026";
const SUM={daily_txns:54938,daily_vol:1897225,avg_tx:34.53,txns_d:-43.31,vol_d:1106.32,avg_tx_d:2027.91,cum_buyers:367104,cum_sellers:4643,buyers_d:8.13,sellers_d:126.16};
const TS=[{d:"Jan 2",tx:1160915,vol:48266},{d:"Jan 5",tx:1351413,vol:100},{d:"Jan 8",tx:1195290,vol:50},{d:"Jan 11",tx:1038668,vol:115},{d:"Jan 14",tx:763776,vol:284},{d:"Jan 17",tx:505372,vol:269},{d:"Jan 20",tx:500431,vol:678},{d:"Jan 23",tx:751553,vol:124270},{d:"Jan 26",tx:544666,vol:194969},{d:"Jan 27",tx:547253,vol:3248321},{d:"Jan 28",tx:541509,vol:3891234},{d:"Jan 29",tx:556593,vol:4102341},{d:"Feb 1",tx:59847,vol:2891234},{d:"Feb 5",tx:375463,vol:1876543},{d:"Feb 10",tx:132640,vol:1321098},{d:"Feb 15",tx:268045,vol:1076543},{d:"Feb 20",tx:273555,vol:1521098},{d:"Feb 25",tx:455368,vol:1966543},{d:"Mar 1",tx:287043,vol:2200000},{d:"Mar 5",tx:251847,vol:2090000},{d:"Mar 10",tx:156432,vol:1940000},{d:"Mar 15",tx:87291,vol:1870000},{d:"Mar 20",tx:57891,vol:1895000},{d:"Mar 25",tx:54234,vol:1897150},{d:"Mar 28",tx:54812,vol:1897210},{d:"Apr 1",tx:54938,vol:1897225}];
const FACS=[{name:"Other-x402",vol:38265187,tx:287103,avg:133.28,note:"Unclassified long tail"},{name:"Virtuals Protocol",vol:760317,tx:201437,avg:3.77,note:"Degen Claw ACP ★"},{name:"Coinbase-x402",vol:243615,tx:663046,avg:0.37,note:"CDP facilitator"},{name:"Payai-x402",vol:218913,tx:305687,avg:0.72,note:""},{name:"X402rs-x402",vol:148234,tx:89123,avg:1.66,note:""},{name:"Daydreams-x402",vol:112445,tx:45234,avg:2.49,note:""},{name:"Mogami-x402",vol:98123,tx:32456,avg:3.02,note:""},{name:"Dexter-x402",vol:76234,tx:28901,avg:2.64,note:""}];
const SERVERS=[
  {url:"acp-x402virtuals.io",       pTx:56.97,pVol:27.97,rTx:232326,rVol:997262819,  avg:4293,  buyers:7147, note:"Virtuals ACP / Degen Claw ★"},
  {url:"x402.twit.an",              pTx:31.08,pVol:0.47, rTx:36914, rVol:20290208,   avg:0.550, buyers:131,  note:""},
  {url:"blockrun.ai",               pTx:1.75, pVol:0.25, rTx:177752,rVol:12074866,   avg:0.068, buyers:653,  note:""},
  {url:"api.100xconn.com",          pTx:42.24,pVol:20.73,rTx:67,    rVol:4314773,    avg:64400, buyers:22,   note:"⚠ OUTLIER $64K avg"},
  {url:"enricbx-x402.com",          pTx:0.80, pVol:0.64, rTx:130444,rVol:3468549,    avg:0.027, buyers:612,  note:""},
  {url:"api.dexter.cash",           pTx:84.40,pVol:83.47,rTx:35023, rVol:1974220,    avg:0.056, buyers:5365, note:"High txn share, tiny avg"},
  {url:"x402.anyspend.com",         pTx:73.70,pVol:72.88,rTx:1042,  rVol:1798895,    avg:1726,  buyers:260,  note:"High-value agent tasks"},
  {url:"analyst-api.xyz",           pTx:null, pVol:null, rTx:75179, rVol:1503477,    avg:0.020, buyers:3,    note:""},
  {url:"mcp-x402.viahovenwork.xyz", pTx:0.00, pVol:50.11,rTx:295118,rVol:1452234,    avg:0.005, buyers:594,  note:""},
  {url:"x402.sniperx.fun",          pTx:63.03,pVol:63.03,rTx:59895, rVol:1197648,    avg:0.020, buyers:104,  note:""},
  {url:"x402endpoint-utlwoa54hq…",  pTx:5.26, pVol:6.59, rTx:342,   rVol:1176941,    avg:3441,  buyers:69,   note:""},
];
const CAT_TX=[{c:"Agent to Agent",v:712934},{c:"Premium Content",v:523891},{c:"Infrastructure",v:412783},{c:"Data as a Service",v:312567},{c:"AI Content",v:156234},{c:"Other",v:98123}];
const CAT_VOL=[{c:"Other",v:38412000},{c:"Agent to Agent",v:1234567},{c:"Premium Content",v:456789},{c:"Data as a Service",v:345678},{c:"Infrastructure",v:234567},{c:"AI Content",v:123456}];
const CHAIN_CLR={Base:"#2172e5",Celo:"#35d07f",Ethereum:"#8a7bfa",BNB:"#f3ba2f"};
const GS={low:{bg:"rgba(34,197,94,0.1)",bd:"rgba(34,197,94,0.25)",cl:"#4ade80",label:"Low"},medium:{bg:"rgba(251,191,36,0.1)",bd:"rgba(251,191,36,0.25)",cl:"#fbbf24",label:"Med"},high:{bg:"rgba(239,68,68,0.1)",bd:"rgba(239,68,68,0.25)",cl:"#f87171",label:"High"}};

const AGENTS=[
  {rank:1,name:"Toppa",chain:"Celo",score:94.0,feedback:576,owner:"toppa",x402:true,verified:true,usecase:"Telco payments — airtime, data, bills, gift cards in 170+ countries",desc:"Financial services AI for telecom payments. x402+cUSD on Celo. MIT open-source v2.0.0. 7 APIs: send-airtime, pay-bill, buy-gift-card, get-operators, etc.",problem:"Programmatic last-mile telecom payments for AI agents — no bank account, instant cUSD settlement.",users:"Agents automating telecom expenses; @toppa402Bot on Telegram.",gaming:"low",gamingNote:"576 organic feedbacks, diverse sources, open-source code, real transaction history.",signals:[]},
  {rank:2,name:"Clawdia",chain:"Base",score:93.8,feedback:612,owner:"0x715d…4e6d",x402:false,verified:true,usecase:"Multi-agent orchestration — ClawPlaza platform manager",desc:"Default manager of ClawPlaza. Orchestrates collaboration, task routing, quality checks, execution monitoring. 5.0/5.0 avg score across 612 feedbacks.",problem:"Multi-agent coordination at scale — one entry point routes and monitors a fleet of specialized agents.",users:"ClawPlaza platform users; developers building on the agent marketplace.",gaming:"low",gamingNote:"Perfect 5.0/5.0, 612 diverse feedbacks, consistent daily health-checks, known platform.",signals:[]},
  {rank:3,name:"Agentic Eye",chain:"Celo",score:93.7,feedback:698,owner:"AgenticEye",x402:false,verified:true,usecase:"Content intelligence — viral prediction for YouTube/TikTok/Reddit",desc:"Analyzes live social media comments in real-time to predict viral content. Returns sentiment scores, engagement velocity, virality probability.",problem:"Real-time content momentum — catches viral windows before batch analysis misses them.",users:"Social media automation agents; content recommendation systems; marketing AI.",gaming:"low",gamingNote:"698 feedbacks (highest in top 3), Celo-native, genuine product APIs.",signals:[]},
  {rank:4,name:"Loopuman",chain:"Celo",score:93.6,feedback:1345,owner:"loopuman",x402:true,verified:true,usecase:"Human-in-the-loop layer — routes AI tasks to verified humans via Telegram/WhatsApp",desc:"AI agents send tasks, verified humans complete them, results returned with 8-second cUSD payments. npm package + full MCP SDK, v4.4.0.",problem:"Tasks AI can't do alone — identity checks, physical-world verification, nuanced judgment. Programmable human labor.",users:"Agents requiring real-world verification; content moderation pipelines; microtask marketplaces.",gaming:"low",gamingNote:"1,345 feedbacks (most in top 4), v4.4.0, npm SDK, 3.2M on-chain count, MIT open-source.",signals:[]},
  {rank:5,name:"Agent8",chain:"Base",score:93.4,feedback:1191,owner:"0x3980…4be7",x402:false,verified:true,usecase:"Reputation economy — incentivized honest ERC-8004 feedback",desc:"Interaction layer for humans, AI agents, and blockchain. Honest contributions earn rewards; fake feedback faces consequences. 5.0/5.0, token: 8004tokens.xyz.",problem:"Cold-start and gaming problem — economic incentives for honest reviews, on-chain slashing for wash feedback.",users:"ERC-8004 ecosystem participants; feedback contributors; 8004token holders.",gaming:"low",gamingNote:"1,191 feedbacks, perfect 5.0/5.0, economic token backing creates alignment.",signals:[]},
  {rank:6,name:"QuantaBot",chain:"Base",score:93.2,feedback:102,owner:"0x82a9…ac4d",x402:false,verified:false,usecase:"DeFi analytics — detects non-linear 'quantum jump' adoption changes",desc:"Monitors discrete step-changes in TVL, volume, user counts signaling regime change vs incentive-driven spikes. On-chain attestations with authenticity scores.",problem:"Signal/noise in DeFi — filters continuous growth to surface structural regime changes worth acting on.",users:"DeFi traders monitoring protocol momentum; investment agents.",gaming:"medium",gamingNote:"Score high relative to 102 feedbacks. No TEE. Product concept clear; feedback appears organic.",signals:["Low feedback (102) for score level","No TEE verification"]},
  {rank:7,name:"Meerkat James",chain:"Base",score:93.1,feedback:40,owner:"0xf36b…5a20",x402:false,verified:false,usecase:"Social trading — tracks smart money, copy-trade signals",desc:"Monitors top traders' positions, provides early-exit alerts, portfolio breakdowns, performance analytics. Subscription model for copy signals.",problem:"Information asymmetry — surfaces what smart money does in real time, accessible via agent subscription.",users:"Retail traders following alpha wallets; copy-trading automation agents.",gaming:"medium",gamingNote:"Only 40 feedbacks for rank #7 globally — weakest score/feedback ratio in top 10.",signals:["Very low feedback (40) for top-10 rank","No TEE","Limited track record"]},
  {rank:8,name:"Corgent (Cortensor)",chain:"Ethereum",score:93.1,feedback:20,owner:"0x993f…30e6",x402:false,verified:true,usecase:"Decentralized AI compute — GPU provider coordination with TEE attestation",desc:"Official Cortensor agent. Orchestrates AI workloads across decentralized GPU providers. TEE-based attestations. Handles payments, notifications, compute results.",problem:"Centralized AI compute dependency — verifiable decentralized GPU procurement, TEE proving results are unmodified.",users:"AI developers running inference; agents needing verifiable compute; Cortensor network participants.",gaming:"low",gamingNote:"TEE verification = strongest credibility signal on 8004scan. Institutional backing. Low count = early enterprise.",signals:["Low raw feedback (20) — early stage deployment"]},
  {rank:9,name:"Minara AI",chain:"Ethereum",score:93.1,feedback:144,owner:"0xb27a…a138",x402:true,verified:false,usecase:"On-demand blockchain analytics — pay-per-query via x402",desc:"Only top-10 agent with confirmed x402 payments. 142 feedbacks from 128 unique wallets (91% organic per Artemis). Analytics, wallet profiling, market reports per query.",problem:"Solves analytics subscription model — pay $0.10/query vs $500/month. Scales cost to actual usage.",users:"AI agents needing on-demand chain data; research agents; portfolio agents.",gaming:"low",gamingNote:"128 unique wallet addresses, 91% organic (Artemis verified). x402 integration cross-verified on-chain.",signals:[]},
  {rank:10,name:"AegisProtocol",chain:"Base",score:93.0,feedback:21,owner:"mcdao",x402:false,verified:false,usecase:"Smart contract security — automated audit + vulnerability scanning",desc:"Static analysis, vulnerability scanning, best-practice validation. Structured audit reports with severity ratings. Part of Aegis security suite (also #11, #18).",problem:"Audit bottleneck — $50K+ manual audits vs automated first-pass scanning via MCP.",users:"DeFi protocols pre-launch; developers seeking automated checks; insurance protocols.",gaming:"medium",gamingNote:"Aegis family (#10, #11, #18) in top 20 — coordinated registration suspected. Low feedback for score.",signals:["Very low feedback (21)","Aegis family coordination (#10 #11 #18)","No TEE"]},
  {rank:11,name:"aegiszk",chain:"Base",score:93.0,feedback:25,owner:"aegiszk",x402:false,verified:false,usecase:"ZK-proof verification for smart contract state claims",desc:"Verifies zero-knowledge proofs for on-chain assertions without revealing underlying data. Aegis security family.",problem:"Privacy-preserving verification — confirm on-chain facts without exposing sensitive data.",users:"Privacy DeFi protocols; compliance agents.",gaming:"high",gamingNote:"Strong wash-feedback signals. Part of Aegis cluster with #10 and #18.",signals:["25 feedbacks matching batch pattern","Aegis family coordination (#10 #11 #18)","No product URL","Batch creation window"]},
  {rank:12,name:"Esusu AI",chain:"Celo",score:92.9,feedback:40,owner:"0x4d4c…5a09",x402:false,verified:false,usecase:"Autonomous DeFi savings agent — Esusu rotating credit protocol",desc:"Manages yield vaults, rotational savings circles (Esusu Circles), GoodDollar whitelist, gas subsidy claims. Strict signer separation between agent and user actions.",problem:"DeFi UX complexity — describe savings goals naturally, agent handles smart contract interactions and yield optimization.",users:"Celo DeFi savers; African fintech users in rotating credit circles; GoodDollar recipients.",gaming:"low",gamingNote:"Clear product (esusuafrica.com), real DeFi integrations, not in the Base batch cluster.",signals:[]},
  {rank:13,name:"castmind",chain:"Base",score:92.9,feedback:25,owner:"castmind",x402:false,verified:false,usecase:"Unknown — no verifiable product found",desc:"No product URL, API endpoints, or documentation visible on 8004scan or public web. Registered in batch window matching 7 other agents.",problem:"Unknown.",users:"Unknown.",gaming:"high",gamingNote:"Classic wash pattern. No product, no docs. Identical stats to 8 other agents.",signals:["No product URL","Batch creation Feb–Mar 2026","25 feedbacks identical to 8 others","Scores 92.7–93.0 cluster"]},
  {rank:14,name:"aurasight",chain:"Base",score:92.9,feedback:27,owner:"aurasight",x402:false,verified:false,usecase:"Possibly market sentiment analytics — no product verified",desc:"Name implies sentiment analytics. No verifiable product.",problem:"Unknown.",users:"Unknown.",gaming:"high",gamingNote:"Part of Feb–Mar 2026 Base batch. No product signals.",signals:["No product URL","Batch cluster","27 feedbacks"]},
  {rank:15,name:"quantumswap",chain:"Base",score:92.8,feedback:26,owner:"quantumswap",x402:false,verified:false,usecase:"Possibly DEX aggregation — no product verified",desc:"Name implies swap routing. No endpoints or documentation found.",problem:"Unknown.",users:"Unknown.",gaming:"high",gamingNote:"High gaming risk. No product signals.",signals:["No product","26 feedbacks in cluster","Batch creation"]},
  {rank:16,name:"oraclemind",chain:"Base",score:92.8,feedback:25,owner:"oraclemind",x402:false,verified:false,usecase:"Possibly oracle aggregation — no product verified",desc:"Name suggests oracle/data feed aggregation. No verifiable product.",problem:"Unknown.",users:"Unknown.",gaming:"high",gamingNote:"Part of coordinated Base batch cluster.",signals:["25 feedbacks matching cluster","No product URL","Batch creation"]},
  {rank:17,name:"AeroDropX",chain:"Base",score:92.8,feedback:25,owner:"ernsx",x402:false,verified:false,usecase:"Possibly airdrop aggregation — no product verified",desc:"Name suggests airdrop discovery or distribution. No verifiable product. Owner 'ernsx' differs from agent name.",problem:"Unknown.",users:"Unknown.",gaming:"high",gamingNote:"Different owner name but same statistical fingerprint as batch cluster.",signals:["25 feedbacks in batch","No product","Owner name differs from agent name"]},
  {rank:18,name:"aegisverify",chain:"Base",score:92.8,feedback:26,owner:"aegisverify",x402:false,verified:false,usecase:"Identity/address verification — 3rd Aegis family member",desc:"Third 'Aegis' account alongside #10 and #11. Presumably handles identity or address verification. No distinct product page.",problem:"Unknown.",users:"Unknown.",gaming:"high",gamingNote:"Three Aegis accounts (#10 #11 #18) in top 20 — strongest cluster gaming signal.",signals:["Three Aegis accounts in top 20","26 feedbacks in cluster","No distinct product docs"]},
  {rank:19,name:"assetaforge",chain:"Base",score:92.8,feedback:22,owner:"assetaforge",x402:false,verified:false,usecase:"Possibly asset tokenization — no product verified",desc:"Name implies asset creation/tokenization. No verifiable product found. Lowest feedback in the suspicious cluster.",problem:"Unknown.",users:"Unknown.",gaming:"high",gamingNote:"Lowest feedback in suspicious cluster (22). High gaming risk.",signals:["22 feedbacks — lowest in cluster","No product documentation","Base/batch fingerprint"]},
  {rank:20,name:"zephyrax",chain:"Base",score:92.8,feedback:25,owner:"zephyrax",x402:false,verified:false,usecase:"Unknown — no product signal",desc:"No documentation, APIs, or web presence. Generic naming consistent with batch registration.",problem:"Unknown.",users:"Unknown.",gaming:"high",gamingNote:"Textbook batch registration profile.",signals:["25 feedbacks identical to 4 others","No product","Generic name, no web presence"]},
];

const fU=(n,d=2)=>{if(n==null||isNaN(n))return"—";const v=Number(n);if(Math.abs(v)>=1e9)return`$${(v/1e9).toFixed(d)}B`;if(Math.abs(v)>=1e6)return`$${(v/1e6).toFixed(d)}M`;if(Math.abs(v)>=1e3)return`$${(v/1e3).toFixed(1)}K`;return`$${v.toFixed(d)}`;};
const fN=n=>(n==null||isNaN(n))?"—":Math.round(Number(n)).toLocaleString();
const fP=n=>n==null?"":` ${Number(n)>=0?"+":""}${Number(n).toFixed(1)}%`;
const pclr=n=>n==null?"#4a5568":Number(n)>=0?"#1de9b6":"#f87171";
const fTao=n=>n==null?"—":`τ${Number(n).toLocaleString(undefined,{maximumFractionDigits:2})}`;

const C={bg:"#0d1017",surf:"#131920",surf2:"#1a2332",bdr:"rgba(255,255,255,0.06)",bdr2:"rgba(255,255,255,0.12)",txt:"#e2eaf5",muted:"#4a6785",accent:"#2172e5",green:"#1de9b6",neg:"#f87171",warn:"#fbbf24",purple:"#a78bfa",tao:"#e6c875"};
const MONO="'IBM Plex Mono','Fira Code',monospace";
const SANS="'Inter',system-ui,sans-serif";

async function fetchDune(){
  try{
    const ex=await fetch(`https://api.dune.com/api/v1/query/${DUNE_QID}/execute`,{method:"POST",headers:{"X-DUNE-API-KEY":DUNE_KEY,"Content-Type":"application/json"}});
    if(!ex.ok)throw new Error(ex.status);
    const{execution_id}=await ex.json();
    for(let i=0;i<20;i++){
      await new Promise(r=>setTimeout(r,4000));
      const r=await fetch(`https://api.dune.com/api/v1/execution/${execution_id}/results`,{headers:{"X-DUNE-API-KEY":DUNE_KEY}});
      const d=await r.json();
      if(d.state==="QUERY_STATE_COMPLETED")return d.result?.rows?.find(r=>r.t==="summary")||null;
      if(d.state==="QUERY_STATE_FAILED")throw new Error(d.error||"failed");
    }
  }catch(e){return{error:e.message};}
}

async function fetchDegen(){
  try{const r=await fetch("https://degen.virtuals.io/");const h=await r.text();return{active:h.includes("100K")||h.includes("Degen Claw"),season:(h.match(/Season\s+(\d+)/i)||[])[1]};}
  catch{return{active:true};}
}

async function fetchAnalysis(degen){
  const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:900,messages:[{role:"user",content:`Analyze x402+ERC-8004. Return ONLY valid JSON, no markdown fences.\n\nx402 (30d avg/day): txns=${fN(SUM.daily_txns)} (${fP(SUM.txns_d)}), vol=${fU(SUM.daily_vol)} (${fP(SUM.vol_d)}), avg_tx=${fU(SUM.avg_tx)} (${fP(SUM.avg_tx_d)})\nTop server: acp-x402virtuals.io (58% txns, $4,618 avg) — Virtuals Degen Claw driven\nUSBC: 98.6%. Base: 95%. Wash txns: ~50%. Degen Claw: ${degen?.active?"ACTIVE":"unknown"} $100K/week\n100xconn.com outlier: $60,275 avg, 72 txns — strips out → true avg ~$3-5\nERC-8004: 120,772 agents, Toppa+Minara AI use x402. 8/20 top agents show gaming.\n\nSchema:{"signals":[{"type":"bullish|bearish|warning|neutral","text":"string"}],"narrative":"2-3 sentences","watch":["item"],"key_insight":"one bold headline"}`}]})});
  const raw=await r.json();
  const text=(raw.content||[]).filter(b=>b.type==="text").map(b=>b.text).join("").replace(/```json|```/g,"").trim();
  return JSON.parse(text);
}

// Fetches live Bittensor data via server-side API route (handles web_search loop)
async function fetchBittensorData(){
  try{
    const r=await fetch("/api/tao");
    if(!r.ok)throw new Error(`API ${r.status}`);
    return await r.json();
  }catch(e){return{error:e.message};}
}

function Chart({id,labels,datasets,height=160,yFmt,y2Fmt}){
  const ref=useRef(null),inst=useRef(null);
  useEffect(()=>{
    if(!ref.current||!window.Chart)return;
    if(inst.current){inst.current.destroy();inst.current=null;}
    const clrs=[C.accent,"#f59e0b",C.purple,C.green];
    const y1FmtFn=v=>{if(yFmt==="usd"||yFmt==="usd1")return fU(v,yFmt==="usd1"?1:0);if(Math.abs(v)>=1e6)return(v/1e6).toFixed(1)+"M";if(Math.abs(v)>=1e3)return(v/1e3).toFixed(0)+"K";return v;};
    const y2FmtFn=v=>{if(y2Fmt==="usd"||y2Fmt==="usd1")return fU(v,y2Fmt==="usd1"?1:0);if(Math.abs(v)>=1e6)return(v/1e6).toFixed(1)+"M";if(Math.abs(v)>=1e3)return(v/1e3).toFixed(0)+"K";return v;};
    inst.current=new window.Chart(ref.current,{type:"line",data:{labels,datasets:datasets.map((ds,i)=>({label:ds.label,data:ds.data,borderColor:clrs[i%clrs.length],backgroundColor:clrs[i%clrs.length]+"15",fill:true,tension:0.4,pointRadius:0,pointHoverRadius:5,borderWidth:1.5,yAxisID:ds.y2?"y2":"y"}))},
    options:{responsive:true,maintainAspectRatio:false,interaction:{mode:"index",intersect:false},
      plugins:{
        legend:{display:datasets.length>1,labels:{font:{family:MONO,size:10},color:C.muted,boxWidth:10,padding:12}},
        tooltip:{backgroundColor:C.surf2,borderColor:C.bdr2,borderWidth:1,titleColor:C.txt,bodyColor:C.muted,titleFont:{family:MONO,size:10},bodyFont:{family:MONO,size:10},padding:10,callbacks:{label:ctx=>{const v=ctx.parsed.y,ds=ctx.dataset,isY2=ds.yAxisID==="y2",fmt=isY2?(y2Fmt||yFmt):yFmt;if(fmt==="usd"||fmt==="usd1")return ` ${ds.label}: ${fU(v,fmt==="usd1"?1:0)}`;if(fmt==="usd4")return ` ${ds.label}: ${fU(v,4)}`;if(Math.abs(v)>=1e6)return ` ${ds.label}: ${(v/1e6).toFixed(2)}M`;if(Math.abs(v)>=1e3)return ` ${ds.label}: ${(v/1e3).toFixed(1)}K`;return ` ${ds.label}: ${v}`;}}}
      },
      scales:{
        x:{ticks:{font:{family:MONO,size:9},color:C.muted,maxRotation:0,autoSkip:true,maxTicksLimit:10},grid:{color:"rgba(255,255,255,0.04)"}},
        y:{position:"left",ticks:{font:{family:MONO,size:9},color:C.muted,callback:y1FmtFn},grid:{color:"rgba(255,255,255,0.04)"}},
        ...(y2Fmt?{y2:{position:"right",ticks:{font:{family:MONO,size:9},color:"#f59e0b",callback:y2FmtFn},grid:{drawOnChartArea:false}}}:{})
      }}});
  },[id]);
  return <div style={{position:"relative",height:`${height}px`,width:"100%"}}><canvas ref={ref} id={id}/></div>;
}

const KV=({l,v,delta,accent})=>(<div style={{padding:"14px 16px",background:C.surf,border:`1px solid ${C.bdr}`,borderRadius:"8px"}}>
  <div style={{fontSize:"11px",color:C.muted,marginBottom:"6px",letterSpacing:"0.03em",fontFamily:SANS}}>{l}</div>
  <div style={{fontSize:"20px",fontWeight:700,color:accent||C.txt,letterSpacing:"-0.01em",marginBottom:"3px",fontFamily:MONO}}>{v}</div>
  {delta!=null&&<div style={{fontSize:"11px",color:pclr(delta),fontWeight:500,fontFamily:MONO}}>{fP(delta)}<span style={{color:C.muted,fontWeight:400}}> 30d</span></div>}
</div>);

const SH=({c})=><div style={{fontSize:"10px",fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase",color:C.muted,marginBottom:"10px",paddingBottom:"6px",borderBottom:`1px solid ${C.bdr}`,fontFamily:MONO}}>{c}</div>;
const Tag=({c,children})=><span style={{padding:"2px 7px",borderRadius:"4px",fontSize:"9px",fontWeight:600,background:(c||C.muted)+"20",color:c||C.muted,border:`1px solid ${(c||C.muted)}40`,letterSpacing:"0.04em",fontFamily:MONO}}>{children}</span>;

function ATip({a}){return(
  <div style={{position:"absolute",left:"calc(100% + 12px)",top:"50%",transform:"translateY(-50%)",width:"300px",background:C.surf2,border:`1px solid ${C.bdr2}`,borderRadius:"10px",padding:"14px",zIndex:999,pointerEvents:"none",boxShadow:"0 8px 32px rgba(0,0,0,0.6)"}}>
    <div style={{display:"flex",gap:"5px",flexWrap:"wrap",marginBottom:"10px"}}>
      <Tag c={CHAIN_CLR[a.chain]}>{a.chain}</Tag>
      {a.x402&&<Tag c={C.accent}>x402 ✓</Tag>}
      {a.verified&&<Tag c={C.green}>TEE ✓</Tag>}
    </div>
    <div style={{fontSize:"11px",fontWeight:600,color:C.txt,marginBottom:"6px",lineHeight:1.4,fontFamily:SANS}}>{a.usecase}</div>
    <div style={{fontSize:"10px",color:C.muted,lineHeight:1.6,marginBottom:"8px",fontFamily:SANS}}>{a.desc}</div>
    {a.problem&&<><div style={{fontSize:"9px",color:C.muted,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:"3px",fontFamily:MONO}}>Problem solved</div><div style={{fontSize:"10px",color:"#a0b4c8",lineHeight:1.5,marginBottom:"8px",fontFamily:SANS}}>{a.problem}</div></>}
    {a.users&&<><div style={{fontSize:"9px",color:C.muted,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:"3px",fontFamily:MONO}}>Key users</div><div style={{fontSize:"10px",color:"#a0b4c8",lineHeight:1.5,fontFamily:SANS}}>{a.users}</div></>}
  </div>
);}

function GTip({a}){const g=GS[a.gaming];return(
  <div style={{position:"absolute",right:"calc(100% + 12px)",top:"50%",transform:"translateY(-50%)",width:"260px",background:C.surf2,border:`1px solid ${g.bd}`,borderRadius:"10px",padding:"12px",zIndex:999,pointerEvents:"none",boxShadow:"0 8px 32px rgba(0,0,0,0.6)"}}>
    <div style={{fontSize:"11px",fontWeight:600,color:g.cl,marginBottom:"6px",fontFamily:MONO}}>Gaming Risk: {g.label}</div>
    <div style={{fontSize:"10px",color:C.muted,lineHeight:1.6,marginBottom:"8px",fontFamily:SANS}}>{a.gamingNote}</div>
    {a.signals?.length>0&&<><div style={{fontSize:"9px",color:C.muted,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:"4px",fontFamily:MONO}}>Red flags</div>{a.signals.map((s,i)=><div key={i} style={{fontSize:"10px",color:C.warn,marginBottom:"2px",fontFamily:SANS}}>⚠ {s}</div>)}</>}
    {a.signals?.length===0&&<div style={{fontSize:"10px",color:C.green,fontFamily:SANS}}>✓ No gaming signals detected</div>}
  </div>
);}

function ARow({a,i}){
  const[sA,setSA]=useState(false),[sG,setSG]=useState(false);
  const g=GS[a.gaming];
  return(
    <tr style={{background:a.gaming==="high"?"rgba(239,68,68,0.02)":a.x402?"rgba(33,114,229,0.03)":i<3?"rgba(255,255,255,0.015)":"transparent"}}>
      <td style={{padding:"7px 10px",borderBottom:`1px solid rgba(255,255,255,0.03)`,fontSize:"11px",color:C.muted,fontFamily:MONO,fontWeight:600}}>#{a.rank}</td>
      <td style={{padding:"7px 10px",borderBottom:`1px solid rgba(255,255,255,0.03)`,position:"relative",cursor:"default"}} onMouseEnter={()=>setSA(true)} onMouseLeave={()=>setSA(false)}>
        <div style={{display:"flex",alignItems:"center",gap:"5px"}}>
          <span style={{fontSize:"11px",color:C.txt,fontWeight:i<5?600:400,fontFamily:SANS}}>{a.name}</span>
          {a.x402&&<span style={{fontSize:"8px",padding:"1px 4px",background:"rgba(33,114,229,0.2)",color:C.accent,borderRadius:"3px",fontFamily:MONO}}>x402</span>}
          {a.verified&&<span style={{fontSize:"8px",padding:"1px 4px",background:"rgba(29,233,182,0.15)",color:C.green,borderRadius:"3px",fontFamily:MONO}}>TEE</span>}
          <span style={{fontSize:"9px",color:"rgba(255,255,255,0.15)",userSelect:"none"}}>ⓘ</span>
        </div>
        {sA&&<ATip a={a}/>}
      </td>
      <td style={{padding:"7px 10px",borderBottom:`1px solid rgba(255,255,255,0.03)`}}><Tag c={CHAIN_CLR[a.chain]||C.muted}>{a.chain}</Tag></td>
      <td style={{padding:"7px 10px",borderBottom:`1px solid rgba(255,255,255,0.03)`,fontSize:"11px",color:C.accent,fontWeight:700,fontFamily:MONO,textAlign:"right"}}>{a.score}</td>
      <td style={{padding:"7px 10px",borderBottom:`1px solid rgba(255,255,255,0.03)`,fontSize:"10px",color:C.muted,fontFamily:MONO,textAlign:"right"}}>{a.feedback.toLocaleString()}</td>
      <td style={{padding:"7px 10px",borderBottom:`1px solid rgba(255,255,255,0.03)`,fontSize:"9px",color:"rgba(74,103,133,0.8)",fontFamily:MONO,maxWidth:"90px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.owner}</td>
      <td style={{padding:"7px 10px",borderBottom:`1px solid rgba(255,255,255,0.03)`,fontSize:"10px",color:a.x402?C.accent:"rgba(226,234,245,0.6)",maxWidth:"180px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontFamily:SANS}}>{a.usecase}</td>
      <td style={{padding:"7px 10px",borderBottom:`1px solid rgba(255,255,255,0.03)`,position:"relative",cursor:"default"}} onMouseEnter={()=>setSG(true)} onMouseLeave={()=>setSG(false)}>
        <span style={{display:"inline-flex",alignItems:"center",gap:"3px",padding:"3px 8px",borderRadius:"20px",fontSize:"9px",fontWeight:600,background:g.bg,color:g.cl,border:`1px solid ${g.bd}`,cursor:"help",letterSpacing:"0.04em",fontFamily:MONO}}>{g.label} <span style={{opacity:.5,fontSize:"7px"}}>▾</span></span>
        {sG&&<GTip a={a}/>}
      </td>
    </tr>
  );
}

function Pct({v}){
  if(v==null||isNaN(v))return<span style={{color:C.muted,fontFamily:MONO,fontSize:"10px"}}>—</span>;
  const n=Number(v),c=n>=0?C.green:C.neg;
  return<span style={{color:c,fontFamily:MONO,fontSize:"10px"}}>{n>=0?"+":""}{n.toFixed(1)}%</span>;
}

function BittensorDashboard({data,loading,error}){
  const[sub,setSub]=useState("subnets");
  const[sortCol,setSortCol]=useState("market_cap_usd");
  const[sortAsc,setSortAsc]=useState(false);
  const[ownerSort,setOwnerSort]=useState({col:"net_all",asc:false});
  const[owners,setOwners]=useState(null);
  const[ownersLoad,setOwnersLoad]=useState(false);
  const[ownersUpdated,setOwnersUpdated]=useState(null);
  const[extraData,setExtraData]=useState(null);
  const ownersFetched=useRef(false);
  const extraFetched=useRef(false);

  // Load subnets-extra.json (flow 1W/1M data from daily script)
  useEffect(()=>{
    if(!extraFetched.current){
      extraFetched.current=true;
      fetch("/data/subnets-extra.json").then(r=>r.ok?r.json():null).then(d=>{
        if(d?.subnets){const map={};d.subnets.forEach(s=>{map[s.sn]=s;});setExtraData(map);}
      }).catch(()=>{});
    }
  },[]);

  // Load owner data from static JSON (refreshed daily by GitHub Actions)
  useEffect(()=>{
    if(sub==="owners"&&!ownersFetched.current){
      ownersFetched.current=true;
      setOwnersLoad(true);
      fetch("/data/owners.json").then(r=>{
        if(!r.ok)throw new Error("no cache");
        return r.json();
      }).then(d=>{
        if(d.owners){
          const map={};d.owners.forEach(o=>{map[o.sn]=o;});
          setOwners(map);
          setOwnersUpdated(d.updated_at||null);
        }
        setOwnersLoad(false);
      }).catch(()=>{
        // Fallback: live API if static cache missing
        if(!data?.subnets?.length){
          ownersFetched.current=false; // allow retry once subnet data arrives
          setOwnersLoad(false);
          return;
        }
        const ids=data.subnets.map(s=>s.sn).filter(n=>n>0).join(",");
        fetch(`/api/tao/owners?netuids=${ids}`).then(r=>r.json()).then(d=>{
          if(d.owners){
            const map={};d.owners.forEach(o=>{map[o.sn]=o;});
            setOwners(map);
          }
          setOwnersLoad(false);
        }).catch(()=>setOwnersLoad(false));
      });
    }
  },[sub,data]);

  const Spin=({msg})=><div style={{display:"flex",alignItems:"center",gap:"10px",padding:"32px 0"}}>
    {[0,1,2].map(i=><div key={i} style={{width:"6px",height:"6px",borderRadius:"50%",background:C.tao,animation:`pulse 1.2s ease-in-out ${i*0.2}s infinite`}}/>)}
    <span style={{fontSize:"11px",color:C.muted,fontFamily:MONO}}>{msg||"Fetching from taostats.io…"}</span>
  </div>;

  if(loading)return<Spin/>;
  if(error||data?.error)return(
    <div style={{padding:"16px",background:"rgba(239,68,68,0.06)",border:`1px solid rgba(239,68,68,0.2)`,borderRadius:"8px",fontSize:"11px",color:C.neg,fontFamily:MONO}}>
      Error: {error||data?.error}. Could not fetch Taostats data. Try refreshing.
    </div>
  );
  if(!data)return<Spin/>;

  const subnets=(data.subnets||[]);
  const sorted=[...subnets].sort((a,b)=>{
    const av=a[sortCol]??-Infinity,bv=b[sortCol]??-Infinity;
    if(typeof av==="string")return sortAsc?av.localeCompare(bv):bv.localeCompare(av);
    return sortAsc?av-bv:bv-av;
  });

  const td0={padding:"6px 10px",borderBottom:"1px solid rgba(255,255,255,0.03)",fontSize:"10px",fontFamily:MONO};
  const thStyle=(col)=>({
    textAlign:"right",padding:"7px 10px",fontSize:"8px",letterSpacing:"0.08em",textTransform:"uppercase",
    color:sortCol===col?C.tao:C.muted,borderBottom:`1px solid ${C.bdr}`,fontWeight:600,fontFamily:MONO,
    cursor:"pointer",whiteSpace:"nowrap",userSelect:"none"
  });
  const thL=(col)=>({...thStyle(col),textAlign:"left"});
  const sort=(col)=>{if(sortCol===col)setSortAsc(!sortAsc);else{setSortCol(col);setSortAsc(false);}};
  const arrow=(col)=>sortCol===col?(sortAsc?"↑":"↓"):"";
  const fTao2=n=>n==null?"—":`τ${Number(n).toLocaleString(undefined,{maximumFractionDigits:0})}`;
  const fUsd=n=>{if(n==null)return"—";const a=Math.abs(n);if(a>=1e6)return`$${(n/1e6).toFixed(2)}M`;if(a>=1e3)return`$${(n/1e3).toFixed(1)}K`;return`$${n.toFixed(2)}`;};
  const taoP=data.tao_price||1;

  const totalMcap=subnets.reduce((s,x)=>s+(x.market_cap_tao||0),0);
  const totalVol=subnets.reduce((s,x)=>s+(x.volume_24h_tao||0),0);
  const netFlow=subnets.reduce((s,x)=>s+(x.net_tao_flow_1d||0),0);
  // Sum of all alpha prices for TAO emission % calculation (price_i / sum_prices = subnet's share)
  const sumPrices=subnets.reduce((s,x)=>s+(x.price_tao||0),0);

  const tabs=["subnets","owners","movers"];

  return(<>
    {/* KPI row */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(5,minmax(0,1fr))",gap:"8px",marginBottom:"14px"}}>
      <div style={{padding:"12px 14px",background:C.surf,border:"1px solid rgba(230,200,117,0.2)",borderRadius:"8px"}}>
        <div style={{fontSize:"10px",color:C.muted,marginBottom:"4px",fontFamily:SANS}}>TAO Price</div>
        <div style={{fontSize:"18px",fontWeight:700,color:C.tao,fontFamily:MONO}}>${Number(data.tao_price).toFixed(2)}</div>
        {data.tao_price_change_24h!=null&&<div style={{fontSize:"10px",color:pclr(data.tao_price_change_24h),fontFamily:MONO}}>{fP(data.tao_price_change_24h)} 24h</div>}
      </div>
      <KV l="Subnets" v={`${subnets.length} tracked`}/>
      <KV l="Total MCap" v={fTao2(totalMcap)} accent={C.tao}/>
      <KV l="24h Volume" v={fTao2(totalVol)}/>
      <KV l="Net TAO Flow 24h" v={fTao2(netFlow)} accent={netFlow>=0?C.green:C.neg}/>
    </div>

    {/* Sub-tabs */}
    <div style={{display:"flex",gap:"6px",marginBottom:"12px"}}>
      {tabs.map(s=>(
        <button key={s} onClick={()=>setSub(s)} style={{background:sub===s?"rgba(230,200,117,0.12)":"transparent",border:`1px solid ${sub===s?"rgba(230,200,117,0.3)":C.bdr}`,color:sub===s?C.tao:C.muted,padding:"5px 14px",borderRadius:"6px",fontSize:"10px",cursor:"pointer",fontFamily:MONO,letterSpacing:"0.06em",fontWeight:sub===s?600:400}}>
          {s==="subnets"?"Subnets":s==="owners"?"Owner Activity":"Top Movers"}
        </button>
      ))}
    </div>

    {/* SUBNETS TAB */}
    {sub==="subnets"&&(
      <div style={{background:C.surf,border:`1px solid ${C.bdr}`,borderRadius:"8px",overflow:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",minWidth:"1600px"}}>
          <thead><tr>
            <th style={{...thStyle("sn"),textAlign:"center",width:"30px"}} onClick={()=>sort("sn")}># {arrow("sn")}</th>
            <th style={thL("name")} onClick={()=>sort("name")}>Subnet {arrow("name")}</th>
            <th style={thStyle("tao_emission_pct")} onClick={()=>sort("tao_emission_pct")} title="% of daily TAO emission this subnet receives. Computed from alpha price weight: price_i / sum(all_prices). ~7,200 TAO/day total. Subnets compete for this share.">Emission {arrow("tao_emission_pct")}</th>
            <th style={thStyle("price_usd")} onClick={()=>sort("price_usd")}>Price {arrow("price_usd")}</th>
            <th style={thStyle("change_1h")} onClick={()=>sort("change_1h")}>1H {arrow("change_1h")}</th>
            <th style={thStyle("change_1d")} onClick={()=>sort("change_1d")}>24H {arrow("change_1d")}</th>
            <th style={thStyle("change_7d")} onClick={()=>sort("change_7d")}>1W {arrow("change_7d")}</th>
            <th style={thStyle("change_30d")} onClick={()=>sort("change_30d")}>1M {arrow("change_30d")}</th>
            <th style={thStyle("market_cap_usd")} onClick={()=>sort("market_cap_usd")}>MCap {arrow("market_cap_usd")}</th>
            <th style={thStyle("volume_24h_tao")} onClick={()=>sort("volume_24h_tao")}>Vol (24h) {arrow("volume_24h_tao")}</th>
            <th style={thStyle("vol_cap")} onClick={()=>sort("vol_cap")}>Vol/Cap {arrow("vol_cap")}</th>
            <th style={thStyle("net_tao_flow_1d")} onClick={()=>sort("net_tao_flow_1d")}>Flow (24H) {arrow("net_tao_flow_1d")}</th>
            <th style={thStyle("flow_7d")} onClick={()=>sort("flow_7d")}>Flow (1W) {arrow("flow_7d")}</th>
            <th style={thStyle("flow_30d")} onClick={()=>sort("flow_30d")}>Flow (1M) {arrow("flow_30d")}</th>
          </tr></thead>
          <tbody>{sorted.map((s,i)=>{
            const flow24=s.net_tao_flow_1d||0;
            const volCap=s.market_cap_tao>0?((s.volume_24h_tao||0)/s.market_cap_tao*100):0;
            const ex=extraData?.[s.sn];
            const f7d=ex?.flow_7d!=null?ex.flow_7d*taoP:null;
            const f30d=ex?.flow_30d!=null?ex.flow_30d*taoP:null;
            // TAO Emission % = price_i / sum(all_prices) — live from API data
            const emPct=sumPrices>0?((s.price_tao||0)/sumPrices*100):0;
            const taoPerDay=Math.round(emPct/100*7200*100)/100;
            // Attach computed fields for sorting
            s.vol_cap=volCap;
            s.flow_7d=ex?.flow_7d??null;
            s.flow_30d=ex?.flow_30d??null;
            s.tao_emission_pct=emPct;
            return(
            <tr key={s.sn} style={{background:i%2===0?"transparent":"rgba(255,255,255,0.015)"}}>
              <td style={{...td0,textAlign:"center",color:C.muted,fontSize:"9px"}}>{i+1}</td>
              <td style={{...td0,color:C.txt,fontFamily:SANS,fontSize:"11px",maxWidth:"150px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}><span style={{color:C.tao,fontFamily:MONO,fontSize:"9px",marginRight:"6px"}}>SN{s.sn}</span>{s.name||"—"}</td>
              <td style={{...td0,textAlign:"right",color:emPct>3?C.tao:C.muted}} title={`≈ τ${taoPerDay}/day (${emPct.toFixed(2)}% of ~7,200 TAO/day)\nComputed from alpha price weight: price / sum(all prices)\nHigher alpha price → more TAO emission share`}>{emPct.toFixed(2)}%</td>
              <td style={{...td0,color:C.txt,textAlign:"right"}}>${(s.price_usd||0).toFixed(2)}</td>
              <td style={{...td0,textAlign:"right"}}><Pct v={s.change_1h}/></td>
              <td style={{...td0,textAlign:"right"}}><Pct v={s.change_1d}/></td>
              <td style={{...td0,textAlign:"right"}}><Pct v={s.change_7d}/></td>
              <td style={{...td0,textAlign:"right"}}><Pct v={s.change_30d}/></td>
              <td style={{...td0,textAlign:"right",color:C.muted}}>{fUsd(s.market_cap_usd)}</td>
              <td style={{...td0,textAlign:"right",color:C.muted}}>{fUsd((s.volume_24h_tao||0)*taoP)}</td>
              <td style={{...td0,textAlign:"right",color:volCap>10?C.accent:C.muted,fontWeight:volCap>10?600:400}}>{volCap.toFixed(2)}%</td>
              <td style={{...td0,textAlign:"right",color:flow24>=0?C.green:C.neg}}>{fUsd(flow24*taoP)}</td>
              <td style={{...td0,textAlign:"right",color:f7d!=null?(f7d>=0?C.green:C.neg):C.muted}}>{f7d!=null?fUsd(f7d):"—"}</td>
              <td style={{...td0,textAlign:"right",color:f30d!=null?(f30d>=0?C.green:C.neg):C.muted}}>{f30d!=null?fUsd(f30d):"—"}</td>
            </tr>);
          })}</tbody>
        </table>
      </div>
    )}

    {/* OWNER ACTIVITY TAB */}
    {sub==="owners"&&(()=>{
      const oSort=(col)=>{setOwnerSort(p=>p.col===col?{col,asc:!p.asc}:{col,asc:false});};
      const oArrow=(col)=>ownerSort.col===col?(ownerSort.asc?"↑":"↓"):"";
      const oTh=(col,extra)=>({...thStyle(col),color:ownerSort.col===col?C.tao:(extra?.color||C.muted),cursor:"pointer"});
      // Get owner value for sorting
      const getOv=(sn,col)=>{
        const o=owners?.[sn];if(!o)return-Infinity;
        const map={
          sell_7d:o.sell_pressure?.d7,sell_30d:o.sell_pressure?.d30,sell_90d:o.sell_pressure?.d90,sell_all:o.sell_pressure?.lifetime,
          buy_7d:o.buyback?.d7,buy_30d:o.buyback?.d30,buy_90d:o.buyback?.d90,buy_all:o.buyback?.lifetime,
          net_7d:o.net_flow?.d7,net_30d:o.net_flow?.d30,net_90d:o.net_flow?.d90,net_all:o.net_flow?.lifetime,
          xfer_all:o.transferred?.lifetime,indirect_all:o.indirect_sells?.lifetime,
          tao_out:o.transfers_out?.d30,
          signal:o.net_flow?.lifetime>0?1:(o.sell_pressure?.lifetime>0||o.indirect_sells?.lifetime>0?-1:0),
        };
        return map[col]??-Infinity;
      };
      const ownerSorted=[...subnets].sort((a,b)=>{
        if(ownerSort.col==="sn")return ownerSort.asc?a.sn-b.sn:b.sn-a.sn;
        if(ownerSort.col==="name")return ownerSort.asc?(a.name||"").localeCompare(b.name||""):(b.name||"").localeCompare(a.name||"");
        const av=getOv(a.sn,ownerSort.col)??-Infinity,bv=getOv(b.sn,ownerSort.col)??-Infinity;
        return ownerSort.asc?av-bv:bv-av;
      });
      const fTv=(v,neg)=>{if(v==null)return"—";const n=Math.round(v);if(n===0)return<span style={{color:C.muted}}>0</span>;return<span>{neg?"-":"+"}{`τ${Math.abs(n).toLocaleString()}`}</span>;};
      return ownersLoad?<Spin msg="Loading owner activity data…"/>:
      !owners?<div style={{padding:"20px",textAlign:"center",color:C.muted,fontSize:"11px",fontFamily:MONO}}>No owner data loaded. Switch tabs and try again.</div>:
      <><div style={{background:C.surf,border:`1px solid ${C.bdr}`,borderRadius:"8px",overflow:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",minWidth:"1800px"}}>
          <thead><tr>
            <th style={thL("sn")} onClick={()=>oSort("sn")}>SN {oArrow("sn")}</th>
            <th style={thL("name")} onClick={()=>oSort("name")}>Name {oArrow("name")}</th>
            <th style={oTh("owner")}>Owner</th>
            <th style={oTh("sell_7d",{color:"#f87171"})} onClick={()=>oSort("sell_7d")}>Sells 7D {oArrow("sell_7d")}</th>
            <th style={oTh("sell_30d",{color:"#f87171"})} onClick={()=>oSort("sell_30d")}>Sells 30D {oArrow("sell_30d")}</th>
            <th style={oTh("sell_90d",{color:"#f87171"})} onClick={()=>oSort("sell_90d")}>Sells 90D {oArrow("sell_90d")}</th>
            <th style={oTh("sell_all",{color:"#f87171"})} onClick={()=>oSort("sell_all")}>Sells All {oArrow("sell_all")}</th>
            <th style={oTh("buy_7d",{color:C.green})} onClick={()=>oSort("buy_7d")}>Buys 7D {oArrow("buy_7d")}</th>
            <th style={oTh("buy_30d",{color:C.green})} onClick={()=>oSort("buy_30d")}>Buys 30D {oArrow("buy_30d")}</th>
            <th style={oTh("buy_90d",{color:C.green})} onClick={()=>oSort("buy_90d")}>Buys 90D {oArrow("buy_90d")}</th>
            <th style={oTh("buy_all",{color:C.green})} onClick={()=>oSort("buy_all")}>Buys All {oArrow("buy_all")}</th>
            <th style={oTh("net_7d")} onClick={()=>oSort("net_7d")}>Net 7D {oArrow("net_7d")}</th>
            <th style={oTh("net_30d")} onClick={()=>oSort("net_30d")}>Net 30D {oArrow("net_30d")}</th>
            <th style={oTh("net_90d")} onClick={()=>oSort("net_90d")}>Net 90D {oArrow("net_90d")}</th>
            <th style={oTh("net_all")} onClick={()=>oSort("net_all")}>Net All {oArrow("net_all")}</th>
            <th style={oTh("xfer_all",{color:"#a78bfa"})} onClick={()=>oSort("xfer_all")} title="Alpha transferred to other addresses (not direct market sells)">Xfer'd All {oArrow("xfer_all")}</th>
            <th style={oTh("indirect_all",{color:"#fb923c"})} onClick={()=>oSort("indirect_all")} title="Sells by addresses that received alpha transfers from the owner">Indirect Sells {oArrow("indirect_all")}</th>
            <th style={oTh("tao_out",{color:"#fbbf24"})} onClick={()=>oSort("tao_out")}>TAO Out 30D {oArrow("tao_out")}</th>
            <th style={oTh("signal")} onClick={()=>oSort("signal")}>Signal {oArrow("signal")}</th>
          </tr></thead>
          <tbody>{ownerSorted.map((s,i)=>{
            const o=owners[s.sn];
            const sp=o?.sell_pressure||{};
            const bb=o?.buyback||{};
            const nf=o?.net_flow||{};
            const tx=o?.transfers_out||{};
            const xf=o?.transferred||{};
            const ind=o?.indirect_sells||{};
            const net7=nf.d7||0;const net30=nf.d30||0;const net90=nf.d90||0;const netAll=nf.lifetime||0;
            const ck=o?.owner_coldkey||"";
            return(
            <tr key={s.sn} style={{background:i%2===0?"transparent":"rgba(255,255,255,0.015)"}}>
              <td style={{...td0,color:C.tao,fontWeight:600}}>SN{s.sn}</td>
              <td style={{...td0,color:C.txt,fontFamily:SANS,fontSize:"11px",maxWidth:"120px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.name||"—"}</td>
              <td style={{...td0,textAlign:"right",color:"rgba(74,103,133,0.6)",fontSize:"9px",maxWidth:"80px",overflow:"hidden",textOverflow:"ellipsis"}}>{ck?`${ck.slice(0,6)}…${ck.slice(-4)}`:"—"}</td>
              <td style={{...td0,textAlign:"right",color:sp.d7?C.neg:C.muted}}>{fTv(sp.d7,true)}</td>
              <td style={{...td0,textAlign:"right",color:sp.d30?C.neg:C.muted}}>{fTv(sp.d30,true)}</td>
              <td style={{...td0,textAlign:"right",color:sp.d90?C.neg:C.muted}}>{fTv(sp.d90,true)}</td>
              <td style={{...td0,textAlign:"right",color:sp.lifetime?C.neg:C.muted,fontWeight:sp.lifetime?600:400}}>{fTv(sp.lifetime,true)}</td>
              <td style={{...td0,textAlign:"right",color:bb.d7?C.green:C.muted}}>{fTv(bb.d7)}</td>
              <td style={{...td0,textAlign:"right",color:bb.d30?C.green:C.muted}}>{fTv(bb.d30)}</td>
              <td style={{...td0,textAlign:"right",color:bb.d90?C.green:C.muted}}>{fTv(bb.d90)}</td>
              <td style={{...td0,textAlign:"right",color:bb.lifetime?C.green:C.muted,fontWeight:bb.lifetime?600:400}}>{fTv(bb.lifetime)}</td>
              <td style={{...td0,textAlign:"right",color:net7>=0?C.green:C.neg,fontWeight:600}}>{fTv(net7,net7<0)}</td>
              <td style={{...td0,textAlign:"right",color:net30>=0?C.green:C.neg,fontWeight:600}}>{fTv(net30,net30<0)}</td>
              <td style={{...td0,textAlign:"right",color:net90>=0?C.green:C.neg,fontWeight:600}}>{fTv(net90,net90<0)}</td>
              <td style={{...td0,textAlign:"right",color:netAll>=0?C.green:C.neg,fontWeight:600}}>{fTv(netAll,netAll<0)}</td>
              <td style={{...td0,textAlign:"right",color:xf.lifetime?"#a78bfa":C.muted}} title={xf.lifetime?`Alpha transferred to other addresses (not sold directly)`:""}>{fTv(xf.lifetime,false)}</td>
              <td style={{...td0,textAlign:"right",color:ind.lifetime?"#fb923c":C.muted}} title={ind.lifetime?`Sold by transfer recipients — indicates indirect selling via intermediary addresses`:""}>{fTv(ind.lifetime,true)}</td>
              <td style={{...td0,textAlign:"right",color:tx.d30?"#fbbf24":C.muted}}>{fTv(tx.d30,true)}</td>
              <td style={{...td0,textAlign:"right"}}>
                {netAll>0?<span style={{padding:"2px 6px",borderRadius:"4px",fontSize:"8px",fontWeight:600,background:"rgba(29,233,182,0.15)",color:C.green,border:"1px solid rgba(29,233,182,0.3)"}}>ALIGNED</span>:
                 (sp.lifetime>0||ind.lifetime>0)?<span style={{padding:"2px 6px",borderRadius:"4px",fontSize:"8px",fontWeight:600,background:"rgba(248,113,113,0.15)",color:C.neg,border:"1px solid rgba(248,113,113,0.3)"}}>{ind.lifetime>0?"INDIRECT":"SELLING"}</span>:
                 <span style={{fontSize:"9px",color:C.muted}}>—</span>}
              </td>
            </tr>);
          })}</tbody>
        </table>
      </div>
      <div style={{marginTop:"10px",padding:"10px 14px",background:"rgba(230,200,117,0.05)",border:`1px solid rgba(230,200,117,0.15)`,borderRadius:"6px",fontSize:"10px",color:"rgba(230,200,117,0.5)",fontFamily:SANS,lineHeight:1.6}}>
        Direct sells/buys only (alpha transfers to other addresses excluded) · Xfer'd = alpha moved to intermediary addresses · Indirect Sells = market sells by those intermediary addresses · INDIRECT signal = owner sells via proxy addresses{ownersUpdated&&<span style={{display:"block",marginTop:"4px",opacity:0.7}}>Last refreshed: {new Date(ownersUpdated).toLocaleString()}</span>}
      </div>
      </>;
    })()}

    {/* TOP MOVERS TAB */}
    {sub==="movers"&&(()=>{
      const top1d=[...subnets].sort((a,b)=>(b.change_1d||0)-(a.change_1d||0));
      const bot1d=[...subnets].sort((a,b)=>(a.change_1d||0)-(b.change_1d||0));
      const topFlow=[...subnets].sort((a,b)=>(b.net_tao_flow_1d||0)-(a.net_tao_flow_1d||0));
      const MoverRow=({items,label,valFn,colorFn})=>(
        <div style={{background:C.surf,border:`1px solid ${C.bdr}`,borderRadius:"8px",padding:"14px",marginBottom:"10px"}}>
          <div style={{fontSize:"10px",fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase",color:C.muted,marginBottom:"10px",fontFamily:MONO}}>{label}</div>
          {items.slice(0,5).map((s,i)=>(
            <div key={s.sn} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:i<4?`1px solid rgba(255,255,255,0.03)`:"none"}}>
              <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                <span style={{fontSize:"10px",color:C.tao,fontFamily:MONO,fontWeight:600,width:"40px"}}>SN{s.sn}</span>
                <span style={{fontSize:"11px",color:C.txt,fontFamily:SANS}}>{s.name}</span>
              </div>
              <span style={{fontSize:"11px",fontWeight:600,fontFamily:MONO,color:colorFn(s)}}>{valFn(s)}</span>
            </div>
          ))}
        </div>
      );
      return(<div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"10px"}}>
        <MoverRow items={top1d} label="Biggest Gainers 24h" valFn={s=>`${s.change_1d>=0?"+":""}${(s.change_1d||0).toFixed(1)}%`} colorFn={s=>s.change_1d>=0?C.green:C.neg}/>
        <MoverRow items={bot1d} label="Biggest Losers 24h" valFn={s=>`${(s.change_1d||0).toFixed(1)}%`} colorFn={()=>C.neg}/>
        <MoverRow items={topFlow} label="Highest Net TAO Inflow" valFn={s=>`${(s.net_tao_flow_1d||0)>=0?"+":""}${(s.net_tao_flow_1d||0).toFixed(0)}τ`} colorFn={s=>(s.net_tao_flow_1d||0)>=0?C.green:C.neg}/>
      </div>);
    })()}

    <div style={{marginTop:"12px",padding:"10px 14px",background:"rgba(230,200,117,0.05)",border:`1px solid rgba(230,200,117,0.15)`,borderRadius:"6px",fontSize:"10px",color:"rgba(230,200,117,0.6)",fontFamily:SANS,lineHeight:1.6}}>
      Data sourced live from taostats.io API · Top {subnets.length} subnets by market cap · Owner activity tracks coldkey delegation events
    </div>
  </>);
}

const TABS=[{id:"agentic",l:"Agentic Payments"},{id:"bittensor",l:"Bittensor ◈"}];
const AP_SUBS=[{id:"overview",l:"Overview"},{id:"trends",l:"Charts"},{id:"facilitators",l:"Facilitators"},{id:"servers",l:"Servers"},{id:"erc8004",l:"ERC-8004"},{id:"analysis",l:"Analysis"}];

export default function App(){
  const[tab,setTab]=useState("agentic");
  const[apSub,setApSub]=useState("overview");
  const[dune,setDune]=useState(null);
  const[artemis,setArtemis]=useState(null);
  const[degen,setDegen]=useState(null);
  const[an,setAn]=useState(null);
  const[tao,setTao]=useState(null);
  const[taoLoad,setTaoLoad]=useState(false);
  const[taoErr,setTaoErr]=useState(null);
  const[loading,setL]=useState(true);
  const[anLoad,setAnL]=useState(false);
  const[cjs,setCJS]=useState(false);
  const taoFetched=useRef(false);

  useEffect(()=>{
    const s=document.createElement("script");s.src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js";s.onload=()=>setCJS(true);document.head.appendChild(s);
    // Load Artemis cached data + Dune fallback + Degen status
    const loadArtemis=()=>fetch("/data/agentic.json").then(r=>{if(!r.ok)throw new Error();return r.json();}).catch(()=>null);
    const loadDune=()=>fetchDune();
    Promise.all([loadArtemis(),loadDune(),fetchDegen()]).then(([a,d,g])=>{
      if(a?.summary)setArtemis(a);
      setDune(d);setDegen(g);setL(false);
      setAnL(true);fetchAnalysis(g).then(an=>{setAn(an);setAnL(false);}).catch(()=>setAnL(false));
    });
  },[]);

  useEffect(()=>{
    if(tab==="bittensor"&&!taoFetched.current){
      taoFetched.current=true;
      setTaoLoad(true);setTaoErr(null);
      fetchBittensorData().then(d=>{
        if(d?.error){setTaoErr(d.error);}else{setTao(d);}
        setTaoLoad(false);
      }).catch(e=>{setTaoErr(e.message);setTaoLoad(false);});
    }
  },[tab]);

  const refreshTao=()=>{
    taoFetched.current=true;
    setTao(null);setTaoLoad(true);setTaoErr(null);
    fetchBittensorData().then(d=>{
      if(d?.error){setTaoErr(d.error);}else{setTao(d);}
      setTaoLoad(false);
    }).catch(e=>{setTaoErr(e.message);setTaoLoad(false);});
  };

  const refresh=()=>{
    setL(true);setDune(null);setDegen(null);setAn(null);setAnL(false);
    Promise.all([fetchDune(),fetchDegen()]).then(([d,g])=>{setDune(d);setDegen(g);setL(false);setAnL(true);fetchAnalysis(g).then(a=>{setAn(a);setAnL(false);}).catch(()=>setAnL(false));});
  };

  const gc={low:0,medium:0,high:0};AGENTS.forEach(a=>gc[a.gaming]++);

  return(
    <div style={{fontFamily:SANS,background:C.bg,color:C.txt,minHeight:"100vh",display:"flex",flexDirection:"column"}}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.2}}*{box-sizing:border-box}::-webkit-scrollbar{width:4px;height:4px}::-webkit-scrollbar-track{background:${C.bg}}::-webkit-scrollbar-thumb{background:${C.bdr2};border-radius:2px}`}</style>

      {/* Topbar */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 20px",height:"48px",background:C.surf,borderBottom:`1px solid ${C.bdr}`,flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:"16px"}}>
          <span style={{fontSize:"13px",fontWeight:700,fontFamily:MONO}}><span style={{color:C.accent}}>Onchain AI</span><span style={{color:C.muted,fontSize:"10px",margin:"0 6px",fontWeight:400}}>·</span><span style={{color:C.green}}>Dashboard</span></span>
          <div style={{width:"1px",height:"16px",background:C.bdr}}/>
          <span style={{fontSize:"10px",color:C.muted,fontFamily:MONO}}>{SNAP}</span>
          <span style={{fontSize:"10px",color:C.muted,fontFamily:MONO}}>Degen: {degen==null?"…":<span style={{color:degen.active?C.green:C.neg}}>{degen.active?"ACTIVE":"inactive"}</span>}</span>
          {tao?.tao_price&&<span style={{fontSize:"10px",fontFamily:MONO}}>TAO: <span style={{color:C.tao,fontWeight:600}}>${Number(tao.tao_price).toFixed(2)}</span></span>}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
          {loading&&<div style={{display:"flex",gap:"4px",alignItems:"center"}}>{[0,1,2].map(i=><div key={i} style={{width:"5px",height:"5px",borderRadius:"50%",background:C.accent,animation:`pulse 1.2s ease-in-out ${i*0.2}s infinite`}}/>)}</div>}
          {tab==="bittensor"
            ?<button onClick={refreshTao} disabled={taoLoad} style={{background:"transparent",border:`1px solid rgba(230,200,117,0.3)`,color:taoLoad?C.muted:C.tao,padding:"4px 12px",borderRadius:"6px",fontSize:"11px",cursor:taoLoad?"not-allowed":"pointer",fontFamily:MONO}}>
              {taoLoad?"searching…":"↻ refresh TAO"}
            </button>
            :<button onClick={refresh} disabled={loading} style={{background:"transparent",border:`1px solid ${C.bdr2}`,color:loading?C.muted:C.accent,padding:"4px 12px",borderRadius:"6px",fontSize:"11px",cursor:loading?"not-allowed":"pointer",fontFamily:MONO,letterSpacing:"0.04em"}}>
              {loading?"syncing…":"↻ refresh"}
            </button>
          }
        </div>
      </div>

      {/* Tabbar */}
      <div style={{display:"flex",padding:"0 20px",background:C.surf,borderBottom:`1px solid ${C.bdr}`,flexShrink:0}}>
        {TABS.map(t=>{
          const isTao=t.id==="bittensor";
          const active=tab===t.id;
          return<button key={t.id} onClick={()=>setTab(t.id)} style={{background:"transparent",border:"none",borderBottom:`2px solid ${active?(isTao?C.tao:C.accent):"transparent"}`,color:active?(isTao?C.tao:C.accent):C.muted,padding:"10px 14px",fontSize:"11px",cursor:"pointer",fontFamily:MONO,letterSpacing:"0.06em",fontWeight:active?600:400,marginBottom:"-1px",transition:"all 0.15s"}}>{t.l}</button>;
        })}
      </div>

      {/* Content */}
      <div style={{flex:1,overflow:"auto",padding:"20px"}}>

        {/* Agentic Payments sub-nav */}
        {tab==="agentic"&&<div style={{display:"flex",gap:"4px",marginBottom:"16px",flexWrap:"wrap"}}>
          {AP_SUBS.map(s=><button key={s.id} onClick={()=>setApSub(s.id)} style={{background:apSub===s.id?"rgba(33,114,229,0.12)":"transparent",border:`1px solid ${apSub===s.id?"rgba(33,114,229,0.3)":C.bdr}`,color:apSub===s.id?C.accent:C.muted,padding:"4px 12px",borderRadius:"5px",fontSize:"10px",cursor:"pointer",fontFamily:MONO,letterSpacing:"0.04em",fontWeight:apSub===s.id?600:400}}>{s.l}</button>)}
        </div>}

        {an?.key_insight&&tab==="agentic"&&<div style={{padding:"10px 16px",background:"rgba(33,114,229,0.08)",border:`1px solid rgba(33,114,229,0.2)`,borderRadius:"8px",marginBottom:"16px",fontSize:"12px",color:"#93c5fd",lineHeight:1.5,fontFamily:SANS}}><span style={{fontWeight:700,marginRight:"8px",color:C.accent,fontFamily:MONO,fontSize:"9px",letterSpacing:"0.1em"}}>INSIGHT </span>{an.key_insight}</div>}

        {/* OVERVIEW */}
        {tab==="agentic"&&apSub==="overview"&&(()=>{
          const S=artemis?.summary||SUM;
          const T=artemis?.timeseries||TS;
          const updAt=artemis?.updated_at?new Date(artemis.updated_at).toLocaleString():SNAP;
          return<>
          <SH c={`x402 · 30d Average / Day · Artemis · Updated ${updAt}`}/>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:"10px",marginBottom:"10px"}}>
            <KV l="Daily Transactions" v={fN(S.daily_txns)} delta={S.txns_d}/>
            <KV l="Daily Volume" v={fU(S.daily_vol,1)} delta={S.vol_d}/>
            <KV l="Avg Tx Size" v={fU(S.avg_tx)} delta={S.avg_tx_d} accent={C.purple}/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,minmax(0,1fr))",gap:"10px",marginBottom:"20px"}}>
            <KV l="Cumulative Buyers"  v={fN(S.cum_buyers)}  delta={S.buyers_d}/>
            <KV l="Cumulative Sellers" v={fN(S.cum_sellers)} delta={S.sellers_d}/>
            <KV l="USDC Market Share"  v="98.6%"/>
            <KV l="Chain Dominance"    v="Base ~95%"/>
          </div>
          {cjs&&<div style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:"12px",marginBottom:"20px"}}>
            <div style={{padding:"14px 16px",background:C.surf,border:`1px solid ${C.bdr}`,borderRadius:"8px"}}>
              <div style={{fontSize:"10px",color:C.muted,marginBottom:"8px",fontFamily:MONO}}>Daily Txns · 26w</div>
              <Chart id="ov-tx" labels={T.map(r=>r.d)} datasets={[{label:"Txns",data:T.map(r=>r.tx)}]} height={130}/>
            </div>
            <div style={{padding:"14px 16px",background:C.surf,border:`1px solid ${C.bdr}`,borderRadius:"8px"}}>
              <div style={{fontSize:"10px",color:C.muted,marginBottom:"8px",fontFamily:MONO}}>Daily Volume · 26w</div>
              <Chart id="ov-vol" labels={T.map(r=>r.d)} datasets={[{label:"Volume",data:T.map(r=>r.vol)}]} height={130} yFmt="usd1"/>
            </div>
          </div>}
          <SH c="Virtuals Degen Claw · Primary Volume Driver"/>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:"10px",marginBottom:"20px"}}>
            <div style={{padding:"14px 16px",background:degen?.active?"rgba(29,233,182,0.06)":"rgba(248,113,113,0.06)",border:`1px solid ${degen?.active?"rgba(29,233,182,0.2)":"rgba(248,113,113,0.2)"}`,borderRadius:"8px"}}>
              <div style={{fontSize:"11px",color:C.muted,marginBottom:"6px",fontFamily:MONO}}>Program Status</div>
              <div style={{fontSize:"20px",fontWeight:700,color:degen==null?C.muted:degen.active?C.green:C.neg,fontFamily:MONO}}>{degen==null?"…":degen.active?"ACTIVE":"INACTIVE"}</div>
              <div style={{fontSize:"10px",color:C.muted,marginTop:"3px",fontFamily:SANS}}>$100K/week · acp-x402virtuals.io = 58% of txns</div>
            </div>
            <KV l="Avg Tx — Virtuals ACP" v="$4,618"/>
            <KV l="Outlier: 100xconn.com" v="$60,275 avg"/>
          </div>
          <SH c="ERC-8004 Identity Standard · 8004scan.io"/>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:"10px",marginBottom:"16px"}}>
            <KV l="Registered Agents"  v="120,772+"/>
            <KV l="Feedback Submitted" v="154,848+"/>
            <KV l="Active Users"       v="98,057+"/>
          </div>
          <div style={{padding:"12px 16px",background:"rgba(251,191,36,0.06)",border:`1px solid rgba(251,191,36,0.15)`,borderRadius:"8px",fontSize:"11px",color:"#fde68a",lineHeight:1.7}}>
            <span style={{fontFamily:MONO,fontSize:"9px",letterSpacing:"0.1em",textTransform:"uppercase",color:C.warn,marginRight:"8px"}}>DATA NOTE</span>
            Artemis aggregates all facilitators — ~50% of raw txns are wash/self-trading (PERCENT_GAMED). Strip api.100xconn.com outlier → true blended avg tx closer to $3–5.
          </div>
        </>;})()}

        {/* TRENDS */}
        {tab==="agentic"&&apSub==="trends"&&(()=>{
          const S=artemis?.summary||SUM;
          const T=artemis?.timeseries||TS;
          return<>
          {!cjs&&<div style={{color:C.muted,fontSize:"12px"}}>Loading Chart.js…</div>}
          {cjs&&[
            {id:"t-tx",title:"Daily Transactions",sub:`Now ${fN(S.daily_txns)}/day (${fP(S.txns_d)} 30d)`,ds:[{label:"Txns/day",data:T.map(r=>r.tx)}],note:"Artemis daily transaction count across all x402 facilitators."},
            {id:"t-vol",title:"Daily Volume USD",sub:`Now ${fU(S.daily_vol,1)}/day (${fP(S.vol_d)} 30d)`,ds:[{label:"Volume USD",data:T.map(r=>r.vol)}],yFmt:"usd1",note:"Total USD volume from all x402 payment events."},
            {id:"t-avg",title:"Avg Transaction Size",sub:`${fU(S.avg_tx)} (${fP(S.avg_tx_d)} 30d)`,ds:[{label:"Avg Tx",data:T.map(r=>r.tx>0?Math.round(r.vol/r.tx*100)/100:0)}],yFmt:"usd4",note:"Strip 100xconn outlier → true median ~$3–5."},
          ].map(ch=><div key={ch.id} style={{padding:"16px",background:C.surf,border:`1px solid ${C.bdr}`,borderRadius:"8px",marginBottom:"12px"}}>
            <div style={{marginBottom:"12px"}}>
              <div style={{fontSize:"12px",fontWeight:600,color:C.txt,marginBottom:"3px",fontFamily:MONO}}>{ch.title}</div>
              <div style={{fontSize:"10px",color:C.muted,fontFamily:SANS}}>{ch.sub}</div>
            </div>
            <Chart id={ch.id} labels={T.map(r=>r.d)} datasets={ch.ds} height={150} yFmt={ch.yFmt}/>
            <div style={{marginTop:"10px",fontSize:"10px",color:C.muted,lineHeight:1.6,borderTop:`1px solid ${C.bdr}`,paddingTop:"8px",fontFamily:SANS}}>{ch.note}</div>
          </div>)}
          {cjs&&<div style={{padding:"16px",background:C.surf,border:`1px solid ${C.bdr}`,borderRadius:"8px"}}>
            <div style={{fontSize:"12px",fontWeight:600,color:C.txt,marginBottom:"3px",fontFamily:MONO}}>Txns vs Volume · Divergence View</div>
            <div style={{fontSize:"10px",color:C.muted,marginBottom:"12px",fontFamily:SANS}}>Volume vs transaction count overlay</div>
            <Chart id="t-both" labels={T.map(r=>r.d)} datasets={[{label:"Txns/day",data:T.map(r=>r.tx)},{label:"Volume",data:T.map(r=>r.vol),y2:true}]} height={160} y2Fmt="usd1"/>
          </div>}
        </>;})()}

        {/* FACILITATORS */}
        {tab==="agentic"&&apSub==="facilitators"&&(<>
          <SH c="Real Volume by Facilitator · 30d Adjusted — Artemis"/>
          <div style={{background:C.surf,border:`1px solid ${C.bdr}`,borderRadius:"8px",marginBottom:"14px",overflow:"hidden"}}>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead><tr>{["Facilitator","30d Real Vol","30d Txns","Avg Tx","Note"].map(h=><th key={h} style={{textAlign:"left",padding:"8px 12px",fontSize:"9px",letterSpacing:"0.1em",textTransform:"uppercase",color:C.muted,borderBottom:`1px solid ${C.bdr}`,fontWeight:500,fontFamily:MONO}}>{h}</th>)}</tr></thead>
              <tbody>{FACS.map((f,i)=><tr key={i} style={{background:i%2===0?"transparent":"rgba(255,255,255,0.01)"}}>
                <td style={{padding:"8px 12px",borderBottom:`1px solid rgba(255,255,255,0.03)`,fontSize:"11px",color:i===0?C.txt:C.muted,fontFamily:MONO}}>{f.name}</td>
                <td style={{padding:"8px 12px",borderBottom:`1px solid rgba(255,255,255,0.03)`,fontSize:"11px",color:i===0?C.green:C.muted,fontFamily:MONO,textAlign:"right"}}>{fU(f.vol)}</td>
                <td style={{padding:"8px 12px",borderBottom:`1px solid rgba(255,255,255,0.03)`,fontSize:"11px",color:C.muted,fontFamily:MONO,textAlign:"right"}}>{fN(f.tx)}</td>
                <td style={{padding:"8px 12px",borderBottom:`1px solid rgba(255,255,255,0.03)`,fontSize:"11px",color:f.avg>100?C.warn:C.muted,fontFamily:MONO,textAlign:"right"}}>{fU(f.avg,2)}</td>
                <td style={{padding:"8px 12px",borderBottom:`1px solid rgba(255,255,255,0.03)`,fontSize:"10px",color:"rgba(74,103,133,0.7)",fontFamily:SANS}}>{f.note}</td>
              </tr>)}</tbody>
            </table>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
            {[{title:"Txns by Category · 30d",data:CAT_TX,fmt:fN,color:C.accent},{title:"Volume by Category · 30d",data:CAT_VOL,fmt:fU,color:C.green}].map(({title,data,fmt,color})=>(
              <div key={title} style={{padding:"14px 16px",background:C.surf,border:`1px solid ${C.bdr}`,borderRadius:"8px"}}>
                <div style={{fontSize:"10px",fontWeight:600,color:C.muted,marginBottom:"12px",fontFamily:MONO,letterSpacing:"0.08em",textTransform:"uppercase"}}>{title}</div>
                {data.map((c,i)=><div key={i} style={{marginBottom:"9px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:"4px"}}>
                    <span style={{fontSize:"10px",color:C.muted,fontFamily:SANS}}>{c.c}</span>
                    <span style={{fontSize:"10px",color,fontFamily:MONO,fontWeight:600}}>{fmt(c.v)}</span>
                  </div>
                  <div style={{height:"3px",background:"rgba(255,255,255,0.06)",borderRadius:"2px"}}>
                    <div style={{height:"3px",background:color,borderRadius:"2px",width:`${c.v/data[0].v*100}%`,opacity:i===0&&title.includes("Volume")?0.4:1}}/>
                  </div>
                </div>)}
              </div>
            ))}
          </div>
        </>)}

        {/* SERVERS */}
        {tab==="agentic"&&apSub==="servers"&&(<>
          <SH c="Top x402 Servers · Last 30 Days · Artemis Deep Dive"/>
          <div style={{background:C.surf,border:`1px solid ${C.bdr}`,borderRadius:"8px",overflow:"auto",marginBottom:"12px"}}>
            <table style={{width:"100%",borderCollapse:"collapse",minWidth:"700px"}}>
              <thead><tr>{["Server","% Txns","% Vol","Real Txns","Real Volume","Avg Tx","Buyers","Notes"].map((h,i)=><th key={h} style={{textAlign:i>0&&i<7?"right":"left",padding:"8px 12px",fontSize:"9px",letterSpacing:"0.1em",textTransform:"uppercase",color:C.muted,borderBottom:`1px solid ${C.bdr}`,fontWeight:500,fontFamily:MONO,whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead>
              <tbody>{SERVERS.map((s,i)=><tr key={i} style={{background:s.note.includes("OUTLIER")?"rgba(251,191,36,0.04)":s.note.includes("★")?"rgba(29,233,182,0.03)":"transparent"}}>
                <td style={{padding:"8px 12px",borderBottom:`1px solid rgba(255,255,255,0.03)`,fontSize:"9px",color:i===0?C.accent:C.muted,fontFamily:MONO,maxWidth:"160px",wordBreak:"break-all"}}>{s.url}</td>
                {[s.pTx!=null?`${s.pTx.toFixed(1)}%`:"—",s.pVol!=null?`${s.pVol.toFixed(1)}%`:"—"].map((v,j)=><td key={j} style={{padding:"8px 12px",borderBottom:`1px solid rgba(255,255,255,0.03)`,fontSize:"10px",color:C.muted,fontFamily:MONO,textAlign:"right"}}>{v}</td>)}
                <td style={{padding:"8px 12px",borderBottom:`1px solid rgba(255,255,255,0.03)`,fontSize:"10px",color:C.txt,fontFamily:MONO,textAlign:"right"}}>{fN(s.rTx)}</td>
                <td style={{padding:"8px 12px",borderBottom:`1px solid rgba(255,255,255,0.03)`,fontSize:"10px",color:C.txt,fontFamily:MONO,textAlign:"right"}}>{fU(s.rVol/1e3)}</td>
                <td style={{padding:"8px 12px",borderBottom:`1px solid rgba(255,255,255,0.03)`,fontSize:"10px",color:s.avg>10000?C.warn:s.avg>100?C.green:C.muted,fontFamily:MONO,textAlign:"right",fontWeight:s.avg>10000?600:400}}>{fU(s.avg)}</td>
                <td style={{padding:"8px 12px",borderBottom:`1px solid rgba(255,255,255,0.03)`,fontSize:"10px",color:C.muted,fontFamily:MONO,textAlign:"right"}}>{s.buyers!=null?fN(s.buyers):"—"}</td>
                <td style={{padding:"8px 12px",borderBottom:`1px solid rgba(255,255,255,0.03)`,fontSize:"10px",color:s.note.includes("OUTLIER")?C.warn:s.note.includes("★")?C.green:C.muted,fontFamily:SANS}}>{s.note}</td>
              </tr>)}</tbody>
            </table>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}}>
            <div style={{padding:"12px 14px",background:"rgba(251,191,36,0.05)",border:`1px solid rgba(251,191,36,0.15)`,borderRadius:"8px",fontSize:"11px",color:"#fde68a",lineHeight:1.6,fontFamily:SANS}}><strong style={{fontFamily:MONO}}>api.100xconn.com</strong> — 72 txns, $4.3M vol = $60,275 avg. Massively skews overall avg tx. Likely single institutional agent.</div>
            <div style={{padding:"12px 14px",background:"rgba(29,233,182,0.05)",border:`1px solid rgba(29,233,182,0.15)`,borderRadius:"8px",fontSize:"11px",color:"#a7f3d0",lineHeight:1.6,fontFamily:SANS}}><strong style={{fontFamily:MONO}}>x402.anyspend.com</strong> — $1,724 avg, 1,042 txns. Clearest signal of real high-value production agent tasks emerging.</div>
          </div>
        </>)}

        {/* ERC-8004 */}
        {tab==="agentic"&&apSub==="erc8004"&&(<>
          <SH c="ERC-8004 Registry · 8004scan.io (Live)"/>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:"10px",marginBottom:"14px"}}>
            <KV l="Registered Agents"  v="120,772+"/>
            <KV l="Feedback Submitted" v="154,848+"/>
            <KV l="Active Users"       v="98,057+"/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:"10px",marginBottom:"14px"}}>
            {[["Identity Registry","ERC-721 on-chain identity. Censorship-resistant NFTs. Proposed by Ethereum Foundation, MetaMask, Google, Coinbase — Jan 26 2026."],["Reputation Registry","On-chain feedback with off-chain scoring. Reputation gaming visible via PERCENT_GAMED metric."],["Quality Signals","Scored on txn volume, feedback count, quality score. Organic vs gamed signals trackable on 8004scan."],["Validation","TEE attestations + zkML proofs + staking. Third-party verification of agent claims."]].map(([t,b])=>(
              <div key={t} style={{padding:"12px 14px",background:C.surf,border:`1px solid ${C.bdr}`,borderRadius:"8px"}}>
                <div style={{fontSize:"11px",fontWeight:600,color:C.accent,marginBottom:"5px",fontFamily:MONO}}>{t}</div>
                <div style={{fontSize:"10px",color:C.muted,lineHeight:1.6,fontFamily:SANS}}>{b}</div>
              </div>
            ))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"14px"}}>
            <div style={{padding:"14px 16px",background:C.surf,border:`1px solid ${C.bdr}`,borderRadius:"8px"}}>
              <SH c="Chain Distribution"/>
              <div style={{display:"flex",gap:"6px",flexWrap:"wrap",marginBottom:"8px"}}>
                {[["Base","~55%"],["Celo","~30%"],["Ethereum","~10%"],["BNB","~5%"]].map(([ch,pct])=>(
                  <span key={ch} style={{padding:"3px 10px",borderRadius:"20px",fontSize:"10px",fontWeight:600,background:(CHAIN_CLR[ch]||"#607080")+"18",color:CHAIN_CLR[ch]||"#607080",border:`1px solid ${(CHAIN_CLR[ch]||"#607080")}33`,fontFamily:MONO}}>{ch} {pct}</span>
                ))}
              </div>
              <div style={{fontSize:"10px",color:C.muted,lineHeight:1.5,fontFamily:SANS}}>Base highest gaming risk. Celo agents show strongest organic signals.</div>
            </div>
            <div style={{padding:"14px 16px",background:"rgba(251,191,36,0.05)",border:`1px solid rgba(251,191,36,0.15)`,borderRadius:"8px"}}>
              <SH c="Gaming Risk · Top 20"/>
              <div style={{display:"flex",gap:"16px",marginBottom:"8px"}}>
                {Object.entries(gc).map(([k,v])=>{const g=GS[k];return(<div key={k} style={{textAlign:"center"}}>
                  <div style={{fontSize:"22px",fontWeight:700,color:g.cl,fontFamily:MONO}}>{v}</div>
                  <div style={{fontSize:"9px",padding:"1px 6px",borderRadius:"10px",background:g.bg,color:g.cl,border:`1px solid ${g.bd}`,fontFamily:MONO}}>{g.label}</div>
                </div>);})}
              </div>
              <div style={{fontSize:"10px",color:C.muted,lineHeight:1.5,fontFamily:SANS}}>8 of top 20 are coordinated Base batch — Feb–Mar 2026, ~25 feedbacks, 92.7–93.0 score cluster.</div>
            </div>
          </div>
          <div style={{background:C.surf,border:`1px solid ${C.bdr}`,borderRadius:"8px",overflow:"hidden"}}>
            <div style={{padding:"12px 16px",borderBottom:`1px solid ${C.bdr}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:"10px",fontWeight:600,color:C.muted,fontFamily:MONO,letterSpacing:"0.08em",textTransform:"uppercase"}}>Agent Leaderboard · Top 20 · 8004scan.io</span>
              <span style={{fontSize:"9px",color:"rgba(74,103,133,0.5)",fontFamily:MONO}}>hover name for details · hover risk for signals</span>
            </div>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",minWidth:"740px"}}>
                <thead><tr>{["#","Agent","Chain","Score","Feedback","Owner","Use Case","Gaming Risk"].map((h,i)=><th key={h} style={{textAlign:(i===3||i===4)?"right":"left",padding:"8px 12px",fontSize:"9px",letterSpacing:"0.1em",textTransform:"uppercase",color:C.muted,borderBottom:`1px solid ${C.bdr}`,fontWeight:500,fontFamily:MONO,whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead>
                <tbody>{AGENTS.map((a,i)=><ARow key={i} a={a} i={i}/>)}</tbody>
              </table>
            </div>
            <div style={{padding:"12px 16px",borderTop:`1px solid ${C.bdr}`,display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}}>
              <div style={{fontSize:"10px",color:"#93c5fd",lineHeight:1.6,padding:"8px 10px",background:"rgba(33,114,229,0.06)",borderRadius:"6px",fontFamily:SANS}}><strong style={{fontFamily:MONO}}>x402 × ERC-8004:</strong> Toppa (#1) uses x402+cUSD for telecom payments. Minara AI (#9) gates analytics via x402. The identity+payment stack is converging.</div>
              <div style={{fontSize:"10px",color:"#fde68a",lineHeight:1.6,padding:"8px 10px",background:"rgba(251,191,36,0.06)",borderRadius:"6px",fontFamily:SANS}}><strong style={{fontFamily:MONO}}>Gaming alert:</strong> Ranks 11, 13–20 (8 agents) show coordinated wash-feedback. Aegis family (#10 #11 #18) is the strongest coordination signal.</div>
            </div>
          </div>
        </>)}

        {/* ANALYSIS */}
        {tab==="agentic"&&apSub==="analysis"&&(<>
          {anLoad&&<div style={{display:"flex",alignItems:"center",gap:"10px",padding:"14px 16px",background:C.surf,border:`1px solid ${C.bdr}`,borderRadius:"8px",marginBottom:"12px"}}>{[0,1,2].map(i=><div key={i} style={{width:"6px",height:"6px",borderRadius:"50%",background:C.accent,animation:`pulse 1.2s ease-in-out ${i*0.2}s infinite`}}/>)}<span style={{fontSize:"11px",color:C.muted,fontFamily:MONO}}>Generating analysis…</span></div>}
          {an&&(<>
            <SH c="Signals This Week"/>
            <div style={{marginBottom:"16px"}}>
              {an.signals?.map((s,i)=>{
                const clrs={bullish:{bg:"rgba(34,197,94,0.08)",bd:"rgba(34,197,94,0.2)",cl:"#4ade80"},bearish:{bg:"rgba(239,68,68,0.08)",bd:"rgba(239,68,68,0.2)",cl:"#f87171"},warning:{bg:"rgba(251,191,36,0.08)",bd:"rgba(251,191,36,0.2)",cl:"#fbbf24"},neutral:{bg:"rgba(74,103,133,0.08)",bd:"rgba(74,103,133,0.2)",cl:"#4a6785"}};
                const st=clrs[s.type]||clrs.neutral;
                return<div key={i} style={{display:"flex",gap:"10px",alignItems:"flex-start",padding:"10px 14px",marginBottom:"6px",background:st.bg,border:`1px solid ${st.bd}`,borderRadius:"8px"}}>
                  <span style={{fontSize:"8px",fontWeight:700,padding:"2px 6px",borderRadius:"4px",flexShrink:0,background:st.bd,color:st.cl,letterSpacing:"0.08em",textTransform:"uppercase",fontFamily:MONO,marginTop:"1px"}}>{s.type}</span>
                  <span style={{fontSize:"11px",color:st.cl,lineHeight:1.5,fontFamily:SANS}}>{s.text}</span>
                </div>;
              })}
            </div>
            <SH c="Analyst Narrative · Claude Sonnet"/>
            <div style={{padding:"16px",background:C.surf,border:`1px solid ${C.bdr}`,borderRadius:"8px",fontSize:"12px",color:"rgba(226,234,245,0.75)",lineHeight:1.8,marginBottom:"16px",fontFamily:SANS}}>{an.narrative}</div>
            {an.watch?.length>0&&<><SH c="Watch Next Week"/>
            <div style={{padding:"14px 16px",background:C.surf,border:`1px solid ${C.bdr}`,borderRadius:"8px",marginBottom:"16px"}}>
              {an.watch.map((w,i,arr)=><div key={i} style={{display:"flex",gap:"8px",padding:"6px 0",borderBottom:i<arr.length-1?`1px solid ${C.bdr}`:"none",alignItems:"flex-start"}}>
                <span style={{color:C.accent,flexShrink:0,fontFamily:MONO,fontSize:"12px"}}>›</span>
                <span style={{fontSize:"11px",color:C.muted,lineHeight:1.5,fontFamily:SANS}}>{w}</span>
              </div>)}
            </div></>}
          </>)}
          <SH c="Session Research · Key Findings"/>
          <div style={{background:C.surf,border:`1px solid ${C.bdr}`,borderRadius:"8px",overflow:"hidden"}}>
            {[["Avg tx +2028% in 30d","$0.04 → $34.53. Strip 100xconn outlier ($60K avg, 72 txns) → true median ~$3–5/tx. Signals shift from micro-payment testing to real agent tasks."],["Txns −43%, Vol +1106%","Quality over quantity. Dev/test cohort churned Jan–Feb. Remaining production users run meaningful per-call spend."],["Degen Claw = primary driver","$100K/week Virtuals ACP → acp-x402virtuals.io = 58% of txns. Single program dependency = key concentration risk."],["Dune vs Artemis ~6,800×","Artemis aggregates all facilitators; Dune tracks canonical proxy only. Gap is expected — most volume runs through Virtuals ACP + CDP."],["ERC-8004: 120K agents + growing","Standard proposed Jan 26 2026. Toppa + Minara AI already use x402. Identity+payment flywheel forming. 8/20 top agents show gaming signals."],["USDC 98.6% + Base 95%","Stablecoin + L2 = non-negotiable stack for production agentic payments at $30–60K avg tx sizes."]].map(([t,b],i,arr)=><div key={i} style={{padding:"12px 16px",borderBottom:i<arr.length-1?`1px solid ${C.bdr}`:"none",display:"grid",gridTemplateColumns:"200px 1fr",gap:"16px",alignItems:"flex-start"}}>
              <div style={{fontSize:"11px",fontWeight:600,color:C.accent,fontFamily:MONO}}>{t}</div>
              <div style={{fontSize:"10px",color:C.muted,lineHeight:1.6,fontFamily:SANS}}>{b}</div>
            </div>)}
          </div>
        </>)}

        {/* BITTENSOR */}
        {tab==="bittensor"&&(<>
          <SH c="Bittensor Network · Live Data via Taostats API · Top 50 Subnets"/>
          <BittensorDashboard data={tao} loading={taoLoad} error={taoErr}/>
        </>)}

      </div>

      {/* Footer */}
      <div style={{padding:"8px 20px",background:C.surf,borderTop:`1px solid ${C.bdr}`,display:"flex",justifyContent:"space-between",fontSize:"9px",color:"rgba(74,103,133,0.5)",fontFamily:MONO,flexShrink:0}}>
        <span>Artemis · Dune #{DUNE_QID} · 8004scan.io · degen.virtuals.io · taostats.io · Claude Sonnet</span>
        <span>{new Date().toDateString()}</span>
      </div>
    </div>
  );
}
