/**
 * ngx-ai-kit — example backend proxy (Node.js / Express)
 *
 * Run:  node server.js
 * Env:  ANTHROPIC_API_KEY=sk-ant-...
 */

const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const cors = require('cors');

const app = express();
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

app.use(cors());
app.use(express.json());

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
