/**
 * ngx-ai-kit — example backend proxy (Node.js / Express)
 *
 * Run:  node server.js
 * Env:  ANTHROPIC_API_KEY=sk-ant-...
 */

const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const MOCK_MODE = !process.env.ANTHROPIC_API_KEY;
let client = null;

if (MOCK_MODE) {
  console.log('\n⚠️  No ANTHROPIC_API_KEY environment variable detected.');
  console.log('🚀 Running in LOCAL MOCK LLM MODE (No API keys required for demo).\n');
} else {
  const Anthropic = require('@anthropic-ai/sdk');
  client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  console.log('\n✅ ANTHROPIC_API_KEY detected. Connected to Anthropic Claude SDK.\n');
}

/**
 * POST /api/ai/chat
 * Body: { messages, system?, model?, max_tokens?, stream? }
 */
app.post('/api/ai/chat', async (req, res) => {
  const {
    messages,
    system,
    model = 'claude-sonnet-4-20250514',
    max_tokens = 1024,
    stream = false,
  } = req.body;

  if (!messages?.length) {
    return res.status(400).json({ error: 'messages array is required' });
  }

  // ─── LOCAL MOCK MODE ──────────────────────────────────────────────────────
  if (MOCK_MODE) {
    const lastMsg = messages[messages.length - 1];
    const isAutocomplete = system && system.includes('autocomplete');

    if (isAutocomplete) {
      // Extract query from prompt
      let query = '';
      const match1 = lastMsg.content.match(/Complete this: "([^"]+)"/i);
      const match2 = lastMsg.content.match(/suggestions for: "([^"]+)"/i);
      if (match1) query = match1[1];
      else if (match2) query = match2[1];
      else query = lastMsg.content;

      const q = query.toLowerCase().trim();
      let suggestions = [];

      if (q.startsWith('dev') || q.includes('developer')) {
        suggestions = ['developer tools', 'developer platform', 'developer workspace'];
      } else if (q.startsWith('ang') || q.includes('angular')) {
        suggestions = ['angular components', 'angular signal state', 'angular routing tutorial'];
      } else if (q.startsWith('saas') || q.includes('saas')) {
        suggestions = ['saas integration platform', 'saas billing system', 'saas analytics dashboard'];
      } else {
        suggestions = [
          `${query} application`,
          `${query} configuration`,
          `${query} service template`
        ];
      }

      const responseText = JSON.stringify(suggestions);
      return res.json({
        content: [{ text: responseText }]
      });
    }

    // Standard Chat completions (streaming or full)
    const userText = lastMsg.content.toLowerCase();
    let reply = '';

    if (userText.includes('angular')) {
      reply = "Angular is an excellent framework for building scalable enterprise web applications. It offers strong typing out of the box, modular design patterns, dependency injection, and a robust component system.";
    } else if (userText.includes('hello') || userText.includes('hi')) {
      reply = "Hello! 👋 I am a local simulated LLM backend running on your machine. I am streaming this response word-by-word to verify that the chat widget, autocomplete, and inline streaming text components work perfectly without requiring an API key.";
    } else if (userText.includes('help')) {
      reply = "I'm here to help you test this library! You can type 'Angular' to test chat responses, use the search field to test autocomplete (try typing 'ang' or 'dev'), or ask anything else to see a streaming response.";
    } else {
      reply = `You asked: "${lastMsg.content}". This is a local simulated response showing that the ngx-ai-kit component successfully connected to the backend proxy and can render real-time streaming text.`;
    }

    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const words = reply.split(' ');
      for (let i = 0; i < words.length; i++) {
        const textSegment = (i === 0 ? '' : ' ') + words[i];
        res.write(`data: ${JSON.stringify({ delta: { text: textSegment } })}\n\n`);
        // Simulate a slight word-by-word network latency
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      res.write('data: [DONE]\n\n');
      res.end();
    } else {
      return res.json({
        content: [{ text: reply }]
      });
    }
    return;
  }

  // ─── REAL ANTHROPIC SDK MODE ────────────────────────────────────────────────
  try {
    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const streamResp = await client.messages.stream({
        model,
        max_tokens,
        ...(system ? { system } : {}),
        messages,
      });

      for await (const event of streamResp) {
        if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
          res.write(`data: ${JSON.stringify({ delta: { text: event.delta.text } })}\n\n`);
        }
      }

      res.write('data: [DONE]\n\n');
      res.end();
    } else {
      const message = await client.messages.create({
        model,
        max_tokens,
        ...(system ? { system } : {}),
        messages,
      });
      res.json(message);
    }
  } catch (err) {
    console.error('AI proxy error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`ngx-ai-kit proxy running on :${PORT}`));
