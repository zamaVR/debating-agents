// debate.ts
import 'dotenv/config';
import { OpenAI } from 'openai';

// --- Agent config
type Agent = { name: 'A'|'B'|'Mediator'; baseURL: string; key: string; temp: number; maxTokens: number };
const A: Agent = { name:'A', baseURL: process.env.AGENT_A_BASE_URL!, key: process.env.AGENT_A_KEY!, temp:0.35, maxTokens:800 };
const B: Agent = { name:'B', baseURL: process.env.AGENT_B_BASE_URL!, key: process.env.AGENT_B_KEY!, temp:0.35, maxTokens:800 };
const M: Agent = { name:'Mediator', baseURL: process.env.AGENT_MEDIATOR_BASE_URL!, key: process.env.AGENT_MEDIATOR_KEY!, temp:0.3, maxTokens:700 };
const client = (a: Agent) => new OpenAI({ apiKey: a.key, baseURL: a.baseURL });

// --- Helpers
async function ask(a: Agent, msgs: {role:'system'|'user'|'assistant', content:string}[]) {
  console.log(`🤖 Asking ${a.name} (${a.baseURL})...`);
  console.log(`📝 Last message: ${msgs[msgs.length - 1]?.content?.slice(0, 100)}...`);
  
  const startTime = Date.now();
  
  try {
    const res = await client(a).chat.completions.create({
      model: 'n/a',
      messages: msgs,
      temperature: a.temp,
      max_tokens: a.maxTokens,
      stream: false,
      extra_body: { include_retrieval_info: true }
    } as any);
    
    const responseTime = Date.now() - startTime;
    const text = res.choices[0]?.message?.content || '';
    const retrieval: any = (res as any).retrieval || (res as any).extra?.retrieval || null;
    const cites = retrieval?.items?.slice?.(0, 12)?.map((it: any) => ({
      filename: it.file_name || it.title || 'unknown.txt',
      chunk: typeof it.chunk_index === 'number' ? it.chunk_index : (it.page ?? 0),
      snippet: it.snippet?.slice?.(0, 180)
    })) || [];
    
    // Response analysis
    console.log(`⏱️  ${a.name} response time: ${responseTime}ms`);
    
    if (text.length === 0) {
      console.log(`⚠️  ${a.name} returned EMPTY response!`);
      console.log(`🔍 Full response object:`, JSON.stringify(res, null, 2));
    } else {
    console.log(`✅ ${a.name} responded (${text.length} chars, ${cites.length} citations)`);
    console.log(`📄 Full response:`);
    console.log(`"${text}"`);
    console.log('');
    }
    
    return { text, citations: cites };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`❌ Error asking ${a.name} after ${responseTime}ms:`, error);
    console.error(`🔍 Error details:`, {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      status: (error as any)?.status,
      code: (error as any)?.code
    });
    throw error;
  }
}

function promptsFrom(mText: string) {
  const a = (mText.match(/\[A_PROMPT\][\s\S]*?\n([\s\S]*?)(?:\n\[|$)/)?.[1] || '').trim();
  const b = (mText.match(/\[B_PROMPT\][\s\S]*?\n([\s\S]*?)(?:\n\[|$)/)?.[1] || '').trim();
  return { a, b };
}

// --- Orchestration
async function runDebate(topic: string, rounds = 4) {
  console.log(`🎯 Starting debate: "${topic}" (${rounds} rounds)`);
  
  // Validate environment variables
  const requiredEnvVars = [
    'AGENT_A_BASE_URL', 'AGENT_A_KEY',
    'AGENT_B_BASE_URL', 'AGENT_B_KEY', 
    'AGENT_MEDIATOR_BASE_URL', 'AGENT_MEDIATOR_KEY'
  ];
  
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
  
  console.log('✅ All environment variables present');
  console.log(`🔗 Agent A: ${A.baseURL}`);
  console.log(`🔗 Agent B: ${B.baseURL}`);
  console.log(`🔗 Mediator: ${M.baseURL}`);
  
  const transcript: any[] = [];
  const baseRules = "Use ONLY the KB; quote short phrases and add [filename, chunk #] for every claim. If evidence is thin, say so. If you have NO relevant content in your knowledge base about the topic, respond with: 'I have no relevant content about this topic in my knowledge base.'";

  let aMsgs: {role:'system'|'user'|'assistant', content:string}[] = [{ role:'system', content: "You are a helpful assistant. Provide general information about literature and cite sources when possible. Keep responses brief and factual." }];
  let bMsgs: {role:'system'|'user'|'assistant', content:string}[] = [{ role:'system', content: baseRules }];
  let mMsgs: {role:'system'|'user'|'assistant', content:string}[] = [{ role:'system', content:
    "You are a neutral moderator. Run a 3–4 round debate. Enforce: brevity (6–10 sentences), short quotes, mandatory [filename, chunk #] for claims, no off-corpus speculation. " +
    "Round 1 Openings → Round 2 Rebuttals → Round 3 Cross-exam → Round 4 Closings. After each round, output a 'Moderator Note' and NEW prompts for A and B as [A_PROMPT]... [B_PROMPT]..." }];

  // Kickoff: Mediator frames Round 1
  console.log('\n🎬 Mediator framing Round 1...');
  const m1 = await ask(M, [...mMsgs, { role:'user', content:
    `We will debate: ${topic}\nPlease restate the question, then produce initial prompts as:\n[A_PROMPT] ...\n[B_PROMPT] ...\n` }]);
  transcript.push({ role:'Mediator', round:1, phase:'Prompts', text:m1.text, citations:m1.citations });
  let { a: aPrompt, b: bPrompt } = promptsFrom(m1.text);

  for (let r = 1; r <= rounds; r++) {
    console.log(`\n🔄 === ROUND ${r} ===`);
    
    // Debater answers
    console.log(`\n💬 Agent Responses:`);
    const [aAns, bAns] = await Promise.all([
      ask(A, [...aMsgs, { role:'user', content: aPrompt || "Opening statement with quotes + citations." }]),
      ask(B, [...bMsgs, { role:'user', content: bPrompt || "Opening statement with quotes + citations." }]),
    ]);
    
    transcript.push({ role:'A', round:r, phase:'Answer', text:aAns.text, citations:aAns.citations });
    transcript.push({ role:'B', round:r, phase:'Answer', text:bAns.text, citations:bAns.citations });
    aMsgs.push({ role:'user', content:aPrompt }, { role:'assistant', content:aAns.text });
    bMsgs.push({ role:'user', content:bPrompt }, { role:'assistant', content:bAns.text });

    // Mediator note + next prompts (except after final round, just summary)
    console.log(`\n🎭 Mediator Response:`);
    const follow = r < rounds
      ? `Summarize agreements/disagreements (with brief citations if needed). Then produce next prompts:\n[A_PROMPT] ...\n[B_PROMPT] ...\n` +
        `For this round, demand a specific passage to support or refute a claim.`
      : `Provide a concise closing Moderator Note (no winner).`;
    const mTurn = await ask(M, [...mMsgs, { role:'user', content:
      `Round ${r} answers:\n[AGENT_A]\n${aAns.text}\n\n[AGENT_B]\n${bAns.text}\n\n${follow}` }]);
    
    transcript.push({ role:'Mediator', round:r, phase:'Moderator Note', text:mTurn.text, citations:mTurn.citations });
    mMsgs.push({ role:'user', content: follow }, { role:'assistant', content: mTurn.text });

    if (r < rounds) {
      const next = promptsFrom(mTurn.text);
      aPrompt = next.a || "Respond briefly with quotes + citations.";
      bPrompt = next.b || "Respond briefly with quotes + citations.";
    }
  }

  console.log(`\n🎉 Debate completed! Generated ${transcript.length} transcript entries`);
  return { topic, transcript };
}


// CLI
const topic = process.argv.slice(2).join(' ') || "Does 'The Grand Inquisitor' claim that freedom is a burden rather than a gift?";
console.log(`🚀 Starting debate system...`);
runDebate(topic, 4)
  .then(o => {
    console.log(`\n🎉 Debate Complete!`);
    console.log(`📊 Topic: ${o.topic}`);
    console.log(`📝 Total transcript entries: ${o.transcript.length}`);
    console.log(`\n📋 Debate Summary:`);
    
    o.transcript.forEach((entry, i) => {
      if (entry.role === 'Mediator' && entry.phase === 'Moderator Note') {
        console.log(`\n🎭 Round ${entry.round} - ${entry.role}:`);
        console.log(entry.text);
        console.log('');
      } else if (entry.role === 'A' || entry.role === 'B') {
        console.log(`\n💬 Round ${entry.round} - Agent ${entry.role}:`);
        console.log(entry.text);
        if (entry.citations && entry.citations.length > 0) {
          console.log(`📚 Citations: ${entry.citations.length}`);
        }
        console.log('');
      }
    });
  })
  .catch(e => { 
    console.error(`\n💥 Fatal error:`, e.message || e);
    console.error(`Stack trace:`, e.stack);
    process.exit(1); 
  });
