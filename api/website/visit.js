const TELEGRAM_API_BASE = 'https://api.telegram.org';
const MAX_TEXT_LENGTH = 3900;

const escapeHtml = (value = '') => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const trimValue = (value, max = 700) => {
  const text = String(value ?? '').trim();
  if (text.length <= max) return text || 'Unknown';
  return `${text.slice(0, max - 1)}…`;
};

const getClientIp = (request) => {
  const forwardedFor = request.headers['x-forwarded-for'];
  if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
    return forwardedFor.split(',')[0].trim();
  }

  return request.headers['x-real-ip'] || request.socket?.remoteAddress || 'Unknown';
};

const isAllowedOrigin = (request) => {
  const allowedOrigin = process.env.WEBSITE_VISIT_ALLOWED_ORIGIN || process.env.APP_ORIGIN || '';
  if (!allowedOrigin) return true;

  const origin = request.headers.origin || '';
  return origin === allowedOrigin;
};

const parseBody = (request) => new Promise((resolve, reject) => {
  let data = '';

  request.on('data', (chunk) => {
    data += chunk;
    if (data.length > 32 * 1024) {
      reject(new Error('Payload too large'));
      request.destroy();
    }
  });

  request.on('end', () => {
    if (!data) {
      resolve({});
      return;
    }

    try {
      resolve(JSON.parse(data));
    } catch (_error) {
      reject(new Error('Invalid JSON body'));
    }
  });

  request.on('error', reject);
});

const buildTelegramMessage = (payload, request) => {
  const screen = payload.screen || {};
  const connection = payload.connection || {};
  const ip = getClientIp(request);
  const lines = [
    '🌐 <b>Website Visit Alert</b>',
    '',
    `📅 <b>Time:</b> ${escapeHtml(trimValue(payload.localTime || payload.timestamp))}`,
    `🔗 <b>URL:</b> ${escapeHtml(trimValue(payload.url, 900))}`,
    `↪️ <b>Referrer:</b> ${escapeHtml(trimValue(payload.referrer || 'Direct visit', 900))}`,
    `📱 <b>Device:</b> ${escapeHtml(trimValue(payload.device))}`,
    `💻 <b>Browser:</b> ${escapeHtml(trimValue(payload.browser))}`,
    `🖥️ <b>Platform:</b> ${escapeHtml(trimValue(payload.platform))}`,
    `📺 <b>Screen:</b> ${escapeHtml(`${screen.width || 0}x${screen.height || 0} @${screen.devicePixelRatio || 1}x`)}`,
    `📐 <b>Viewport:</b> ${escapeHtml(`${screen.viewportWidth || 0}x${screen.viewportHeight || 0}`)}`,
    `🌍 <b>Language:</b> ${escapeHtml(trimValue(payload.language))}`,
    `🕒 <b>Timezone:</b> ${escapeHtml(trimValue(payload.timezone))}`,
    `📶 <b>Network:</b> ${escapeHtml(trimValue(connection.effectiveType || 'Unknown'))}${connection.saveData ? ' / Save-Data' : ''}`,
    `🔐 <b>IP:</b> ${escapeHtml(trimValue(ip))}`,
    '',
    '👤 User opened the donation website.',
  ];

  const message = lines.join('\n');
  return message.length > MAX_TEXT_LENGTH ? `${message.slice(0, MAX_TEXT_LENGTH - 1)}…` : message;
};

const sendTelegramMessage = async (text) => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return { ok: false, status: 500, body: { ok: false, error: 'Telegram environment variables are missing.' } };
  }

  const response = await fetch(`${TELEGRAM_API_BASE}/bot${token}/sendMessage`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    }),
  });

  const result = await response.json().catch(() => ({}));

  return {
    ok: response.ok && result.ok !== false,
    status: response.status,
    body: result,
  };
};

module.exports = async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    response.status(405).json({ ok: false, error: 'Method not allowed.' });
    return;
  }

  if (!isAllowedOrigin(request)) {
    response.status(403).json({ ok: false, error: 'Origin not allowed.' });
    return;
  }

  try {
    const payload = await parseBody(request);
    const text = buildTelegramMessage(payload, request);
    const telegram = await sendTelegramMessage(text);

    if (!telegram.ok) {
      const safeError = telegram.body?.description || telegram.body?.error || 'Telegram send failed.';
      response.status(telegram.status || 500).json({ ok: false, error: safeError });
      return;
    }

    response.status(200).json({ ok: true, sent: true });
  } catch (error) {
    response.status(400).json({ ok: false, error: error.message || 'Bad request.' });
  }
};
