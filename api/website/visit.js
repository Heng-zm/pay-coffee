const MAX_BODY_BYTES = 32 * 1024;

const jsonResponse = (res, statusCode, data) => {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(data));
};

const getAllowedOrigins = () => (
  String(process.env.FRONTEND_ALLOWED_ORIGINS || process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
);

const setCorsHeaders = (req, res) => {
  const origin = req.headers.origin;
  const allowedOrigins = getAllowedOrigins();

  if (origin && (allowedOrigins.length === 0 || allowedOrigins.includes(origin))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }

  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
};

const readRawBody = (req) => new Promise((resolve, reject) => {
  if (req.body && typeof req.body === 'object') {
    resolve(req.body);
    return;
  }

  if (typeof req.body === 'string') {
    try {
      resolve(JSON.parse(req.body));
    } catch (error) {
      reject(new Error('Invalid JSON body'));
    }
    return;
  }

  let raw = '';
  req.on('data', (chunk) => {
    raw += chunk;
    if (Buffer.byteLength(raw, 'utf8') > MAX_BODY_BYTES) {
      reject(new Error('Request body is too large'));
      req.destroy();
    }
  });

  req.on('end', () => {
    if (!raw) {
      resolve({});
      return;
    }

    try {
      resolve(JSON.parse(raw));
    } catch (error) {
      reject(new Error('Invalid JSON body'));
    }
  });

  req.on('error', reject);
});

const binaryToJson = (binaryString = '') => {
  if (!/^[01]+$/.test(binaryString) || binaryString.length % 8 !== 0) {
    throw new Error('Invalid binary payload');
  }

  const bytes = [];
  for (let index = 0; index < binaryString.length; index += 8) {
    bytes.push(parseInt(binaryString.slice(index, index + 8), 2));
  }

  return JSON.parse(Buffer.from(bytes).toString('utf8'));
};

const extractEventPayload = (body = {}) => {
  if (body.encrypted && body.encryption === 'binary-json-v1') {
    const decoded = binaryToJson(String(body.payloadBinary || ''));
    return {
      event: decoded.event || body.event || 'unknown',
      payload: decoded.payload || {},
    };
  }

  return {
    event: body.event || 'unknown',
    payload: body.payload && typeof body.payload === 'object' ? body.payload : body,
  };
};

const textValue = (value, fallback = 'Unknown') => {
  const text = String(value ?? '').trim();
  return text || fallback;
};

const buildScreenLine = (payload) => {
  const screen = textValue(payload.screen, 'Unknown');
  const type = textValue(payload.screenType, '');
  return type ? `${screen} (${type})` : screen;
};

const formatWebsiteVisitMessage = (payload = {}) => [
  '🌐 Website Visit Alert',
  '',
  `📅 Time: ${textValue(payload.localTime || payload.timestamp)}`,
  `🔗 URL: ${textValue(payload.url)}`,
  `📱 Device: ${textValue(payload.device)}`,
  `💻 Browser: ${textValue(payload.browser)}`,
  `📺 Screen: ${buildScreenLine(payload)}`,
  `🔄 Referrer: ${textValue(payload.referrer, 'Direct visit')}`,
  `🌍 Platform: ${textValue(payload.platform)}`,
  '',
  '👤 User opened the donation website!',
].join('\n');

const formatPaymentMessage = (payload = {}) => [
  '💳 Payment Button Alert',
  '',
  `📅 Time: ${textValue(payload.localTime || payload.timestamp)}`,
  `🏦 Method: ${textValue(payload.method)}`,
  `💵 Amount: ${textValue(payload.amount)}`,
  `🔗 URL: ${textValue(payload.url)}`,
  '',
  '👤 User tapped a payment button.',
].join('\n');

const buildTelegramMessage = (event, payload) => {
  if (event === 'website_open') return formatWebsiteVisitMessage(payload);
  if (event === 'payment_event') return formatPaymentMessage(payload);

  return [
    '🔔 Website Event',
    '',
    `Event: ${textValue(event)}`,
    `Time: ${textValue(payload.localTime || payload.timestamp || new Date().toISOString())}`,
  ].join('\n');
};

const sendTelegramMessage = async (text) => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return {
      ok: false,
      configured: false,
      message: 'Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID in Vercel environment variables.',
    };
  }

  const telegramPayload = {
    chat_id: chatId,
    text,
    disable_web_page_preview: true,
  };

  if (process.env.TELEGRAM_MESSAGE_THREAD_ID) {
    telegramPayload.message_thread_id = process.env.TELEGRAM_MESSAGE_THREAD_ID;
  }

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(telegramPayload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.ok === false) {
    return {
      ok: false,
      configured: true,
      telegramStatus: response.status,
      telegramDescription: data.description || 'Telegram sendMessage failed',
    };
  }

  return { ok: true, configured: true, sent: 1 };
};

module.exports = async (req, res) => {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    jsonResponse(res, 405, { ok: false, error: 'Method not allowed' });
    return;
  }

  try {
    const body = await readRawBody(req);
    const { event, payload } = extractEventPayload(body);
    const text = buildTelegramMessage(event, payload);
    const result = await sendTelegramMessage(text);

    // Return 200 even when Telegram env is missing so the donation page never
    // breaks or retries aggressively. Check Vercel Function Logs if ok=false.
    jsonResponse(res, 200, result);
  } catch (error) {
    jsonResponse(res, 400, {
      ok: false,
      error: error.message || 'Invalid request',
    });
  }
};
