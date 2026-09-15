const MODELSCOPE_URL = 'https://api-inference.modelscope.ai/v1/chat/completions';
const DEFAULT_MODEL = 'Qwen-Ambassador/Qwen3.7-Plus';
const MAX_REQUESTS = 15;
const WINDOW_MS = 10 * 60 * 1000;
const requestWindows = new Map();

const json = (statusCode, body, headers = {}) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    ...headers,
  },
  body: JSON.stringify(body),
});

const getClientAddress = (event) => (event.headers['x-nf-client-connection-ip'] || event.headers['x-forwarded-for'] || 'unknown').split(',')[0].trim();

const isRateLimited = (address) => {
  const now = Date.now();
  const recent = (requestWindows.get(address) || []).filter(timestamp => now - timestamp < WINDOW_MS);
  if (recent.length >= MAX_REQUESTS) return true;
  recent.push(now);
  requestWindows.set(address, recent);
  return false;
};

const isValidMessage = (message) => (
  message &&
  ['system', 'user', 'assistant'].includes(message.role) &&
  typeof message.content === 'string' &&
  message.content.trim().length > 0
);

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return json(204, {}, {
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
  }

  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed.' });

  const address = getClientAddress(event);
  if (isRateLimited(address)) {
    return json(429, { error: 'Too many AI requests. Please wait a few minutes and try again.' });
  }

  let request;
  try {
    request = JSON.parse(event.body || '{}');
  } catch {
    return json(400, { error: 'Invalid request body.' });
  }

  const messages = Array.isArray(request.messages) ? request.messages.filter(isValidMessage) : [];
  const inputLength = messages.reduce((total, message) => total + message.content.length, 0);
  if (!messages.length || messages.length > 30 || inputLength > 30000) {
    return json(400, { error: 'Please send a valid, reasonably sized AI request.' });
  }

  const apiKey = process.env.MODELSCOPE_API_KEY;
  if (!apiKey) {
    console.error('MODELSCOPE_API_KEY is not configured.');
    return json(503, { error: 'AI guidance is not configured yet.' });
  }

  try {
    const response = await fetch(MODELSCOPE_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.MODELSCOPE_MODEL || DEFAULT_MODEL,
        messages,
        temperature: Number.isFinite(request.temperature) ? Math.min(Math.max(request.temperature, 0), 1) : 0.6,
        top_p: 0.9,
        max_tokens: Math.min(Math.max(Number(request.maxTokens) || 900, 128), 3500),
        stream: false,
        enable_thinking: false,
      }),
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      console.error('ModelScope request failed:', response.status, payload?.error?.message || 'Unknown provider error');
      return json(response.status === 429 ? 429 : 502, {
        error: response.status === 429
          ? 'The AI service is busy. Please try again shortly.'
          : 'AI guidance is temporarily unavailable. Please try again.',
      });
    }

    const rawContent = payload?.choices?.[0]?.message?.content;
    const content = Array.isArray(rawContent)
      ? rawContent.map((part) => {
        if (typeof part === 'string') return part;
        if (part && typeof part === 'object' && typeof part.text === 'string') return part.text;
        return '';
      }).join('')
      : rawContent;
    if (typeof content !== 'string' || !content.trim()) {
      console.error('ModelScope returned no assistant content.');
      return json(502, { error: 'AI guidance returned an empty response. Please try again.' });
    }

    return json(200, { content });
  } catch (error) {
    console.error('ModelScope request failed:', error instanceof Error ? error.message : error);
    return json(502, { error: 'AI guidance is temporarily unavailable. Please try again.' });
  }
};
