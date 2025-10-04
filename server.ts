import 'dotenv/config';
import express from 'express';
import { runDebateStreaming } from './debate-api';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// API endpoint for running debates with streaming
app.post('/api/debate', async (req, res) => {
  try {
    const { topic } = req.body;
    
    if (!topic || typeof topic !== 'string') {
      res.status(400).json({ error: 'Topic is required and must be a string' });
      return;
    }

    console.log(`🎯 Starting debate via API: "${topic}"`);
    
    // Set up Server-Sent Events
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    // Send initial event
    res.write(`data: ${JSON.stringify({ type: 'start', topic })}\n\n`);

    // Run debate with streaming callback
    await runDebateStreaming(topic, 4, (entry) => {
      res.write(`data: ${JSON.stringify({ type: 'message', entry })}\n\n`);
    });

    // Send completion event
    res.write(`data: ${JSON.stringify({ type: 'complete' })}\n\n`);
    res.end();
  } catch (error) {
    console.error('❌ Error in debate API:', error);
    res.write(`data: ${JSON.stringify({ type: 'error', message: error instanceof Error ? error.message : 'Unknown error' })}\n\n`);
    res.end();
  }
});

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📝 Debate API available at http://localhost:${PORT}/api/debate`);
});
