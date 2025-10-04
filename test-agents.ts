// test-agents.ts
import 'dotenv/config';
import { OpenAI } from 'openai';

// --- Agent config
type Agent = { name: 'A'|'B'|'M'; baseURL: string; key: string; temp: number; maxTokens: number };
const A: Agent = { name:'A', baseURL: process.env.AGENT_A_BASE_URL!, key: process.env.AGENT_A_KEY!, temp:0.35, maxTokens:800 };
const B: Agent = { name:'B', baseURL: process.env.AGENT_B_BASE_URL!, key: process.env.AGENT_B_KEY!, temp:0.35, maxTokens:800 };
const M: Agent = { name:'M', baseURL: process.env.AGENT_MEDIATOR_BASE_URL!, key: process.env.AGENT_MEDIATOR_KEY!, temp:0.3, maxTokens:700 };
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

// Test individual agents
async function testAgent(agentName: 'A'|'B'|'M') {
  const agent = agentName === 'A' ? A : agentName === 'B' ? B : M;
  console.log(`🧪 Testing ${agent.name} agent...`);
  
  try {
    const result = await ask(agent, [
      { role: 'system', content: 'You are a helpful assistant. Respond with a simple test message.' },
      { role: 'user', content: 'Say "Hello, I am working!" and nothing else.' }
    ]);
    
    console.log(`✅ ${agent.name} test successful:`, result.text);
    return true;
  } catch (error) {
    console.error(`❌ ${agent.name} test failed:`, error);
    return false;
  }
}

// Test agent with debate-style prompts
async function testAgentDebate(agentName: 'A'|'B'|'M') {
  const agent = agentName === 'A' ? A : agentName === 'B' ? B : M;
  console.log(`🧪 Testing ${agent.name} with debate-style prompt...`);
  
  const baseRules = "Use ONLY the KB; quote short phrases and add [filename, chunk #] for every claim. If evidence is thin, say so.";
  const debatePrompt = "Present your opening claim that Raskolnikov is redeemed, citing specific passages that illustrate the mechanism of his redemption.";
  
  try {
    const result = await ask(agent, [
      { role: 'system', content: baseRules },
      { role: 'user', content: debatePrompt }
    ]);
    
    console.log(`✅ ${agent.name} debate test successful:`, result.text);
    console.log(`📊 Response length: ${result.text.length} chars`);
    console.log(`📚 Citations: ${result.citations.length}`);
    return true;
  } catch (error) {
    console.error(`❌ ${agent.name} debate test failed:`, error);
    return false;
  }
}

// Test agent with playground-style parameters (no extra_body)
async function testAgentPlayground(agentName: 'A'|'B'|'M') {
  const agent = agentName === 'A' ? A : agentName === 'B' ? B : M;
  console.log(`🧪 Testing ${agent.name} with playground-style parameters...`);
  
  const debatePrompt = "Present your opening claim that Raskolnikov is redeemed, citing specific passages that illustrate the mechanism of his redemption.";
  
  try {
    console.log(`🤖 Asking ${agent.name} (${agent.baseURL})...`);
    console.log(`📝 Message: ${debatePrompt.slice(0, 100)}...`);
    
    const startTime = Date.now();
    const res = await client(agent).chat.completions.create({
      model: 'n/a',
      messages: [
        { role: 'user', content: debatePrompt }
      ],
      temperature: agent.temp,
      max_tokens: agent.maxTokens,
      stream: false
      // No extra_body parameter
    } as any);
    
    const responseTime = Date.now() - startTime;
    const text = res.choices[0]?.message?.content || '';
    
    console.log(`⏱️  ${agent.name} response time: ${responseTime}ms`);
    console.log(`📊 ${agent.name} raw response structure:`, {
      hasChoices: !!res.choices,
      choicesLength: res.choices?.length || 0,
      firstChoiceContent: res.choices?.[0]?.message?.content ? 'present' : 'missing',
      contentLength: text.length
    });
    
    if (text.length === 0) {
      console.log(`⚠️  ${agent.name} returned EMPTY response!`);
      console.log(`🔍 Full response object:`, JSON.stringify(res, null, 2));
    } else {
      console.log(`✅ ${agent.name} responded (${text.length} chars)`);
      console.log(`📄 Response preview: "${text.slice(0, 200)}${text.length > 200 ? '...' : ''}"`);
    }
    
    return text.length > 0;
  } catch (error) {
    console.error(`❌ ${agent.name} playground test failed:`, error);
    return false;
  }
}

// Test agent with simple prompt
async function testAgentSimple(agentName: 'A'|'B'|'M') {
  const agent = agentName === 'A' ? A : agentName === 'B' ? B : M;
  console.log(`🧪 Testing ${agent.name} with simple prompt...`);
  
  const simplePrompt = "What is Crime and Punishment about?";
  
  try {
    console.log(`🤖 Asking ${agent.name} (${agent.baseURL})...`);
    console.log(`📝 Message: ${simplePrompt}`);
    
    const startTime = Date.now();
    const res = await client(agent).chat.completions.create({
      model: 'n/a',
      messages: [
        { role: 'user', content: simplePrompt }
      ],
      temperature: agent.temp,
      max_tokens: agent.maxTokens,
      stream: false
    } as any);
    
    const responseTime = Date.now() - startTime;
    const text = res.choices[0]?.message?.content || '';
    
    console.log(`⏱️  ${agent.name} response time: ${responseTime}ms`);
    console.log(`📊 ${agent.name} raw response structure:`, {
      hasChoices: !!res.choices,
      choicesLength: res.choices?.length || 0,
      firstChoiceContent: res.choices?.[0]?.message?.content ? 'present' : 'missing',
      contentLength: text.length
    });
    
    if (text.length === 0) {
      console.log(`⚠️  ${agent.name} returned EMPTY response!`);
      console.log(`🔍 Full response object:`, JSON.stringify(res, null, 2));
    } else {
      console.log(`✅ ${agent.name} responded (${text.length} chars)`);
      console.log(`📄 Response preview: "${text.slice(0, 200)}${text.length > 200 ? '...' : ''}"`);
    }
    
    return text.length > 0;
  } catch (error) {
    console.error(`❌ ${agent.name} simple test failed:`, error);
    return false;
  }
}

// Test agent with modified debate prompt
async function testAgentModified(agentName: 'A'|'B'|'M') {
  const agent = agentName === 'A' ? A : agentName === 'B' ? B : M;
  console.log(`🧪 Testing ${agent.name} with modified debate prompt...`);
  
  const modifiedPrompt = "Analyze the main character's psychological journey in Crime and Punishment.";
  
  try {
    const result = await ask(agent, [
      { role: 'user', content: modifiedPrompt }
    ]);
    
    console.log(`✅ ${agent.name} modified test successful:`, result.text);
    console.log(`📊 Response length: ${result.text.length} chars`);
    console.log(`📚 Citations: ${result.citations.length}`);
    return true;
  } catch (error) {
    console.error(`❌ ${agent.name} modified test failed:`, error);
    return false;
  }
}

// CLI
const args = process.argv.slice(2);
const command = args[0];

if (command === 'test') {
  const agentToTest = args[1] as 'A'|'B'|'M' || 'A';
  console.log(`🚀 Testing ${agentToTest} agent...`);
  testAgent(agentToTest).then(success => {
    process.exit(success ? 0 : 1);
  });
} else if (command === 'test-debate') {
  const agentToTest = args[1] as 'A'|'B'|'M' || 'A';
  console.log(`🚀 Testing ${agentToTest} agent with debate prompt...`);
  testAgentDebate(agentToTest).then(success => {
    process.exit(success ? 0 : 1);
  });
} else if (command === 'test-playground') {
  const agentToTest = args[1] as 'A'|'B'|'M' || 'A';
  console.log(`🚀 Testing ${agentToTest} agent with playground-style parameters...`);
  testAgentPlayground(agentToTest).then(success => {
    process.exit(success ? 0 : 1);
  });
} else if (command === 'test-simple') {
  const agentToTest = args[1] as 'A'|'B'|'M' || 'A';
  console.log(`🚀 Testing ${agentToTest} agent with simple prompt...`);
  testAgentSimple(agentToTest).then(success => {
    process.exit(success ? 0 : 1);
  });
} else if (command === 'test-modified') {
  const agentToTest = args[1] as 'A'|'B'|'M' || 'A';
  console.log(`🚀 Testing ${agentToTest} agent with modified debate prompt...`);
  testAgentModified(agentToTest).then(success => {
    process.exit(success ? 0 : 1);
  });
} else {
  console.log('🧪 Agent Testing Tool');
  console.log('');
  console.log('Usage:');
  console.log('  npx tsx test-agents.ts test [A|B|M]           - Basic functionality test');
  console.log('  npx tsx test-agents.ts test-debate [A|B|M]    - Debate-style prompt test');
  console.log('  npx tsx test-agents.ts test-playground [A|B|M] - Playground-style test');
  console.log('  npx tsx test-agents.ts test-simple [A|B|M]   - Simple prompt test');
  console.log('  npx tsx test-agents.ts test-modified [A|B|M] - Modified debate prompt test');
  console.log('');
  console.log('Examples:');
  console.log('  npx tsx test-agents.ts test A');
  console.log('  npx tsx test-agents.ts test-debate B');
  console.log('  npx tsx test-agents.ts test-simple M');
}
