import http from 'http';
import url from 'url';
import fetch from 'node-fetch';

// ── Guard: fail fast if key is missing ─────────────────────────
const GROQ_API_KEY = process.env.GROQ_API_KEY;
if (!GROQ_API_KEY) {
  console.error('ERROR: GROQ_API_KEY environment variable is not set.');
  process.exit(1);
}

// ── Ask Groq with a structured JSON prompt ─────────────────────
async function askGroq(query) {
  const prompt = `You are Bazaaro, an AI product recommendation engine for Indian buyers.
A user is searching for: "${query}"

Respond ONLY with valid JSON — no markdown, no code fences, no explanation.
Use exactly this structure:
{
  "title": "Short headline for the best product match",
  "best": "Full product name and variant",
  "reason": "2-3 sentence explanation of why this is the best pick for Indian buyers",
  "price": "Realistic INR price range e.g. ₹1,299 – ₹1,599",
  "platform": "Best platform to buy from e.g. Amazon",
  "link": "https://www.amazon.in/s?k=<url-encoded product name>"
}`;

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + GROQ_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile', // FIX: was deprecated llama3-70b-8192
      max_tokens: 400,
      temperature: 0.4,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(`Groq API error ${res.status}: ${errBody.error?.message || 'unknown'}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content || '';

  // Strip any accidental markdown fences before parsing
  const clean = text.replace(/```json|```/g, '').trim();
  return JSON.parse(clean); // throws if AI returned bad JSON → caught below
}

// ── HTTP Server ────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsed = url.parse(req.url, true);

  if (parsed.pathname === '/api/search') {
    const q = (parsed.query.q || '').trim();

    if (!q) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing query parameter: q' }));
      return;
    }

    try {
      const result = await askGroq(q);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    } catch (err) {
      console.error('askGroq failed:', err.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message || 'AI response failed' }));
    }

  } else if (parsed.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));

  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Bazaaro server running on port ${PORT}`));
