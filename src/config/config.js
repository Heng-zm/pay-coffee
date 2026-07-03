/**
 * Application Configuration
 * Donation landing page frontend.
 *
 * Security:
 * - Payment links and image URLs are public and safe for React env vars.
 * - Never put TELEGRAM_BOT_TOKEN, chat IDs, or any private key in React.
 * - Website-open Telegram notifications use the same-origin /api/website/visit
 *   Vercel serverless function, so no separate backend server is required.
 */

const DEFAULT_ABA_PAYMENT_URL = 'https://pay.ababank.com/oRF8/46g8eilb';
const DEFAULT_WING_PAYMENT_URL = 'https://wingmoney.app.link/Ir9xtksOs4b';
const DEFAULT_ACLEDA_PAYMENT_URL = 'https://acledabank.com.kh/acleda?payment_data=qWY5B2SAUfIhLblxzOtfu5ckLzMHjaSki6Ru0bsOyNK+ylPBgZ0sHH6BeGUscKoEaK6msRM5QuN4T4WvLq020epHT+1WVUtpGCJww3z3aBbPU5LTa09U4Zu9tLeWNUNQnRD7vTxOdM8auhzZmg63PYThaYmyhlmDqJK2hc3hEEU0bJem9tWLx2aNrjGQd0/cPHZptX2v3GDs729jsB9oFdFwP2Hv+8k64jKEArZgUIGuhVdBSU1urPG3y444m/Vo&key=khqr';
const trimTrailingSlash = (value = '') => String(value || '').replace(/\/+$/, '');
const ensureLeadingSlash = (value = '') => (String(value).startsWith('/') ? String(value) : `/${value}`);
const isTruthy = (value) => ['1', 'true', 'yes', 'on'].includes(String(value).trim().toLowerCase());
const isFalsey = (value) => ['0', 'false', 'no', 'off'].includes(String(value).trim().toLowerCase());
const hasQueryParam = (url = '', name = '') => new RegExp(`[?&]${name}=`).test(url);

const parsePositiveInt = (value, fallback, min = 1) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= min ? parsed : fallback;
};

const isBrowser = () => typeof window !== 'undefined' && !!window.location;


const getDefaultApiBaseUrl = () => {
  const explicit = process.env.REACT_APP_API_BASE_URL;
  if (explicit) return trimTrailingSlash(explicit);

  if (!isBrowser()) return '';

  const { protocol, hostname, origin } = window.location;

  // No separate FastAPI/Node server required. By default the frontend calls the
  // same site origin, so Vercel can handle /api/* with serverless functions.
  return trimTrailingSlash(origin || `${protocol}//${hostname}`);
};

const normalizeEndpoint = (value, fallback) => {
  const endpoint = String(value || '').trim();
  return endpoint || fallback;
};

const envBoolean = (value, fallback = false) => {
  if (value === undefined || value === null || value === '') return fallback;
  if (isTruthy(value)) return true;
  if (isFalsey(value)) return false;
  return fallback;
};

const config = {
  environment: process.env.REACT_APP_ENVIRONMENT || process.env.NODE_ENV || 'development',
  get isProduction() {
    return this.environment === 'production';
  },
  get isDevelopment() {
    return this.environment === 'development';
  },
  debug: isTruthy(process.env.REACT_APP_DEBUG),

  payment: {
    aba: {
      url: process.env.REACT_APP_ABA_PAYMENT_URL || DEFAULT_ABA_PAYMENT_URL,
    },
    acleda: {
      url: process.env.REACT_APP_ACLEDA_PAYMENT_URL || DEFAULT_ACLEDA_PAYMENT_URL,
      paymentData: process.env.REACT_APP_ACLEDA_PAYMENT_DATA || '',
      key: process.env.REACT_APP_ACLEDA_KEY || 'khqr',
      get fullUrl() {
        if (!this.url) return '';

        // Preserve bank-generated ACLEDA links exactly, including + and / chars.
        if (hasQueryParam(this.url, 'payment_data') || hasQueryParam(this.url, 'key')) {
          return this.url;
        }

        if (!this.paymentData) return this.url;

        const separator = this.url.includes('?') ? '&' : '?';
        return `${this.url}${separator}payment_data=${encodeURIComponent(this.paymentData)}&key=${encodeURIComponent(this.key)}`;
      },
    },
    wing: {
      url: process.env.REACT_APP_WING_PAYMENT_URL || DEFAULT_WING_PAYMENT_URL,
    },
  },

  assets: {
    images: {
      aba: process.env.REACT_APP_ABA_ICON_URL || '/aba.PNG',
      acleda: process.env.REACT_APP_ACLEDA_ICON_URL || '/acleda.PNG',
      wing: process.env.REACT_APP_WING_ICON_URL || '/wing.png',
      moneySticker: process.env.REACT_APP_MONEY_STICKER_URL || '/money.png',
      qr: process.env.REACT_APP_QR_IMAGE_URL || '/qr.PNG',
      thankYou: process.env.REACT_APP_THANK_YOU_IMAGE_URL || '/Thank.gif',
      telegram: process.env.REACT_APP_TELEGRAM_ICON_URL || '/telegram.png',
      telegramBot: process.env.REACT_APP_TELEGRAM_BOT_ICON_URL || '/telegram-bot.png',
      telegramChannel: process.env.REACT_APP_TELEGRAM_CHANNEL_ICON_URL || '/telegram-channel.png',
      telegramPersonal: process.env.REACT_APP_TELEGRAM_PERSONAL_ICON_URL || '/telegram-personal.png',
      facebook: process.env.REACT_APP_FACEBOOK_ICON_URL || '/facebook.png',
      behance: process.env.REACT_APP_BEHANCE_ICON_URL || '/behance.png',
      logo: process.env.REACT_APP_LOGO_URL || '/logo192.png',
      app: process.env.REACT_APP_APP_IMAGE_URL || '/app.png',
    },
    getImageUrl(imageName) {
      return this.images[imageName] || '';
    },
  },

  api: {
    baseUrl: getDefaultApiBaseUrl(),
    endpoints: {
      // Optional endpoint. For a fully static setup, leave it unavailable and the UI will use cached/empty supporters.
      supporters: normalizeEndpoint(
        process.env.REACT_APP_SUPPORTERS_ENDPOINT || process.env.REACT_APP_DONATIONS_ENDPOINT,
        '/api/supporters'
      ),
      donations: normalizeEndpoint(
        process.env.REACT_APP_DONATIONS_ENDPOINT || process.env.REACT_APP_SUPPORTERS_ENDPOINT,
        '/api/supporters'
      ),
      notification: normalizeEndpoint(process.env.REACT_APP_NOTIFICATION_ENDPOINT, '/api/website/visit'),
      paymentWebhook: process.env.REACT_APP_PAYMENT_WEBHOOK_URL || '',
    },
    requestTimeoutMs: parsePositiveInt(process.env.REACT_APP_API_TIMEOUT_MS, 8000, 1000),
    credentials: process.env.REACT_APP_API_CREDENTIALS || 'same-origin',
    buildUrl(endpoint = '') {
      if (!endpoint) return this.baseUrl;
      if (/^https?:\/\//i.test(endpoint)) return endpoint;
      return `${this.baseUrl}${ensureLeadingSlash(endpoint)}`;
    },
  },

  social: {
    facebook: process.env.REACT_APP_FACEBOOK_URL || '#',
    telegramBot: process.env.REACT_APP_TELEGRAM_BOT_URL || '#',
    telegramChannel: process.env.REACT_APP_TELEGRAM_CHANNEL_URL || '#',
    telegramPersonal: process.env.REACT_APP_TELEGRAM_PERSONAL_URL || 'https://t.me/m11mmm112',
    behance: process.env.REACT_APP_BEHANCE_URL || 'https://www.behance.net/anhheng',
  },

  notifications: {
    enabled: envBoolean(process.env.REACT_APP_NOTIFICATIONS_ENABLED, true),
    // Sends website/user-info events as a binary JSON envelope:
    // { encrypted:true, encryption:'binary-json-v1', payloadBinary:'010101...' }
    // Backend decodes it before sending readable text to Telegram.
    binaryPayloadEnabled: envBoolean(process.env.REACT_APP_BINARY_PAYLOAD_ENABLED, true),
    visitCooldownMinutes: parsePositiveInt(process.env.REACT_APP_VISIT_NOTIFY_COOLDOWN_MINUTES, 30, 1),
    requestTimeoutMs: parsePositiveInt(process.env.REACT_APP_NOTIFICATION_TIMEOUT_MS, 5000, 1000),
  },

  app: {
    recipientName: process.env.REACT_APP_RECIPIENT_NAME || 'Ozo. Designer',
    refreshInterval: parsePositiveInt(process.env.REACT_APP_REFRESH_INTERVAL, 30000, 5000),
    maxSupporters: parsePositiveInt(process.env.REACT_APP_MAX_SUPPORTERS, 100, 1),
  },

  security: {
    allowedOrigins: process.env.REACT_APP_ALLOWED_ORIGINS
      ? process.env.REACT_APP_ALLOWED_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean)
      : [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:5173',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:5173',
      ],
  },
};

export const validateConfig = () => {
  const errors = [];

  if (!config.payment.aba.url) {
    errors.push('ABA payment URL is not configured');
  }

  if (!config.payment.acleda.fullUrl) {
    errors.push('ACLEDA payment URL is not configured');
  }

  if (!config.payment.wing.url) {
    errors.push('Wing payment URL is not configured');
  }

  if (!config.api.baseUrl) {
    errors.push('API base URL is empty. Set REACT_APP_API_BASE_URL or run on a browser origin.');
  }

  if (!Number.isFinite(config.app.refreshInterval) || config.app.refreshInterval < 5000) {
    errors.push('Refresh interval must be at least 5000ms');
  }

  if (!Number.isFinite(config.app.maxSupporters) || config.app.maxSupporters < 1) {
    errors.push('Max supporters must be at least 1');
  }

  if (!Number.isFinite(config.api.requestTimeoutMs) || config.api.requestTimeoutMs < 1000) {
    errors.push('API timeout must be at least 1000ms');
  }

  if (errors.length > 0) {
    console.error('Configuration validation errors:', errors);
    return false;
  }

  return true;
};

export default config;
