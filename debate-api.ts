// debate-api.ts
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
      name: error.name,
      message: error.message,
      status: error.status,
      code: error.code
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
export async function runDebateStreaming(topic: string, rounds = 4, onMessage: (entry: any) => void) {
  console.log(`🎯 Starting streaming debate: "${topic}" (${rounds} rounds)`);
  
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
    "You are a debate moderator addressing the debaters directly. Structure your responses as follows:\n" +
    "1. Round framing: 'Debaters, the user wants to know [restated topic]. Let's begin round X!'\n" +
    "2. Round recap: Summarize what each debater said and note agreements/disagreements\n" +
    "3. Next round prompt: 'Debaters, time for round X+1! [Specific instruction for next round]'\n" +
    "Keep responses brief (6-10 sentences), require citations, and address debaters as 'Debaters'." }];

  // Kickoff: Mediator frames Round 1
  console.log('\n🎬 Mediator framing Round 1...');
  const m1 = await ask(M, [...mMsgs, { role:'user', content:
    `The user wants to debate: ${topic}\nPlease address the debaters directly and say "Debaters, the user wants to know [restate the topic]. Let's begin round 1!"` }]);
  
  // Send the mediator's initial framing (just the restated question)
  const framingText = m1.text.split('[A_PROMPT]')[0].trim();
  const mediatorFramingEntry = { role:'Mediator', round:1, phase:'Framing', text:framingText, citations:m1.citations };
  transcript.push(mediatorFramingEntry);
  onMessage(mediatorFramingEntry);
  
  let { a: aPrompt, b: bPrompt } = promptsFrom(m1.text);

  for (let r = 1; r <= rounds; r++) {
    console.log(`\n🔄 === ROUND ${r} ===`);
    
    // Debater answers
    console.log(`\n💬 Agent Responses:`);
    const [aAns, bAns] = await Promise.all([
      ask(A, [...aMsgs, { role:'user', content: aPrompt || "Opening statement with quotes + citations." }]),
      ask(B, [...bMsgs, { role:'user', content: bPrompt || "Opening statement with quotes + citations." }]),
    ]);
    
    const aEntry = { role:'A', round:r, phase:'Answer', text:aAns.text, citations:aAns.citations };
    const bEntry = { role:'B', round:r, phase:'Answer', text:bAns.text, citations:bAns.citations };
    
    transcript.push(aEntry);
    transcript.push(bEntry);
    
    // Stream the responses with conversational delays
    onMessage(aEntry);
    
    // Add delay before Agent B's response
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
    onMessage(bEntry);
    
    aMsgs.push({ role:'user', content:aPrompt }, { role:'assistant', content:aAns.text });
    bMsgs.push({ role:'user', content:bPrompt }, { role:'assistant', content:bAns.text });

    // Mediator round recap
    console.log(`\n🎭 Mediator Round Recap:`);
    const recapPrompt = `Round ${r} is complete. Here's what the debaters said:\n[AGENT_A]\n${aAns.text}\n\n[AGENT_B]\n${bAns.text}\n\nPlease provide a brief recap of round ${r}. Summarize what each debater said and note any agreements or disagreements.`;
    const mRecap = await ask(M, [...mMsgs, { role:'user', content: recapPrompt }]);
    
    const mediatorRecapEntry = { role:'Mediator', round:r, phase:'Round Recap', text:mRecap.text, citations:mRecap.citations };
    transcript.push(mediatorRecapEntry);
    
    // Add delay before mediator's recap
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));
    onMessage(mediatorRecapEntry);
    
    // Declare variables for next round
    let mNextRound: any = null;
    let nextRoundPrompt = '';
    
    // If not the final round, send next round prompt
    if (r < rounds) {
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
      
      const nextRoundInstructions = [
        "Now it's time for rebuttals! Challenge each other's claims with concrete quotes and citations.",
        "Cross-examine the evidence! Find weaknesses in your opponent's arguments and present counter-evidence.",
        "Final arguments! Make your strongest case and address your opponent's key points."
      ];
      
      nextRoundPrompt = `Debaters, time for round ${r + 1}! ${nextRoundInstructions[r - 1]}`;
      mNextRound = await ask(M, [...mMsgs, { role:'user', content: nextRoundPrompt }]);
      
      const mediatorNextRoundEntry = { role:'Mediator', round:r, phase:'Next Round', text:mNextRound.text, citations:mNextRound.citations };
      transcript.push(mediatorNextRoundEntry);
      onMessage(mediatorNextRoundEntry);
    }
    
    // Update message history for mediator
    mMsgs.push({ role:'user', content: recapPrompt }, { role:'assistant', content: mRecap.text });
    if (r < rounds && mNextRound) {
      mMsgs.push({ role:'user', content: nextRoundPrompt }, { role:'assistant', content: mNextRound.text });
    }

    // Set prompts for next round
    if (r < rounds) {
      aPrompt = "Present your argument for round " + (r + 1) + " with specific quotes and citations.";
      bPrompt = "Present your argument for round " + (r + 1) + " with specific quotes and citations.";
    }
  }

  console.log(`\n🎉 Streaming debate completed! Generated ${transcript.length} transcript entries`);
  return { topic, transcript };
}

export async function runDebate(topic: string, rounds = 4) {
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
    "You are a debate moderator addressing the debaters directly. Structure your responses as follows:\n" +
    "1. Round framing: 'Debaters, the user wants to know [restated topic]. Let's begin round X!'\n" +
    "2. Round recap: Summarize what each debater said and note agreements/disagreements\n" +
    "3. Next round prompt: 'Debaters, time for round X+1! [Specific instruction for next round]'\n" +
    "Keep responses brief (6-10 sentences), require citations, and address debaters as 'Debaters'." }];

  // Kickoff: Mediator frames Round 1
  console.log('\n🎬 Mediator framing Round 1...');
  const m1 = await ask(M, [...mMsgs, { role:'user', content:
    `The user wants to debate: ${topic}\nPlease address the debaters directly and say "Debaters, the user wants to know [restate the topic]. Let's begin round 1!"` }]);
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
