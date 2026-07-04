/**
 * Donation landing page configuration.
 *
 * React environment variables are public browser settings only. Do not place
 * TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID here. Telegram visit notifications
 * are sent through /api/website/visit, where Vercel Environment Variables stay private.
 * Supporters remain static and do not require an API.
 */

const DEFAULT_ABA_PAYMENT_URL = 'https://pay.ababank.com/oRF8/46g8eilb';
const DEFAULT_WING_PAYMENT_URL = 'https://wingmoney.app.link/Ir9xtksOs4b';
const DEFAULT_ACLEDA_PAYMENT_URL = 'https://acledabank.com.kh/acleda?payment_data=qWY5B2SAUfIhLblxzOtfu5ckLzMHjaSki6Ru0bsOyNK+ylPBgZ0sHH6BeGUscKoEaK6msRM5QuN4T4WvLq020epHT+1WVUtpGCJww3z3aBbPU5LTa09U4Zu9tLeWNUNQnRD7vTxOdM8auhzZmg63PYThaYmyhlmDqJK2hc3hEEU0bJem9tWLx2aNrjGQd0/cPHZptX2v3GDs729jsB9oFdFwP2Hv+8k64jKEArZgUIGuhVdBSU1urPG3y444m/Vo&key=khqr';

const isTruthy = (value) => ['1', 'true', 'yes', 'on'].includes(String(value).trim().toLowerCase());
const isFalsey = (value) => ['0', 'false', 'no', 'off'].includes(String(value).trim().toLowerCase());
const isAbsoluteHttpUrl = (value = '') => /^https?:\/\//i.test(String(value));

const envBoolean = (value, fallback = false) => {
  if (value === undefined || value === null || value === '') return fallback;
  if (isTruthy(value)) return true;
  if (isFalsey(value)) return false;
  return fallback;
};

const parsePositiveInt = (value, fallback, min = 1) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= min ? parsed : fallback;
};

const parseAmount = (value) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const cleaned = String(value ?? '0').replace(/[^0-9.-]/g, '');
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeSupporter = (item, index) => {
  if (!item || typeof item !== 'object') return null;

  const name = String(item.name || item.fullName || item.display_name || item.username || '').trim();
  const amount = parseAmount(item.amount ?? item.total ?? item.value ?? item.donation_amount ?? 0);

  if (!name || amount < 0) return null;

  return {
    id: item.id || item.user_id || item.telegram_id || `${name}-${amount}-${index}`,
    name,
    amount,
  };
};

const parseSupportersJson = (value = '[]') => {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    const rows = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.supporters)
        ? parsed.supporters
        : [];

    return rows.map(normalizeSupporter).filter(Boolean);
  } catch (error) {
    console.error('REACT_APP_STATIC_SUPPORTERS_JSON must be valid JSON.', error);
    return [];
  }
};

const hasQueryParam = (url = '', name = '') => {
  if (!url || !name) return false;

  try {
    const parsed = new URL(url, 'https://example.invalid');
    return parsed.searchParams.has(name);
  } catch (_error) {
    return new RegExp(`[?&]${name}=`).test(String(url));
  }
};

const config = {
  environment: process.env.REACT_APP_ENVIRONMENT || process.env.NODE_ENV || 'development',

  get isProduction() {
    return this.environment === 'production';
  },

  get isDevelopment() {
    return this.environment === 'development';
  },

  debug: envBoolean(process.env.REACT_APP_DEBUG, false),

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

        // Preserve bank-generated URLs exactly when they already contain the payload.
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
      facebook: process.env.REACT_APP_FACEBOOK_ICON_URL || '/facebook.png',
      telegramBot: process.env.REACT_APP_TELEGRAM_BOT_ICON_URL || '/telegram-bot.png',
      telegramChannel: process.env.REACT_APP_TELEGRAM_CHANNEL_ICON_URL || '/telegram-channel.png',
      telegramPersonal: process.env.REACT_APP_TELEGRAM_PERSONAL_ICON_URL || '/telegram-personal.png',
      behance: process.env.REACT_APP_BEHANCE_ICON_URL || '/behance.png',
      logo: process.env.REACT_APP_LOGO_URL || '/logo.svg',
    },

    getImageUrl(imageName) {
      return this.images[imageName] || '';
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
    websiteVisitEnabled: envBoolean(process.env.REACT_APP_WEBSITE_VISIT_NOTIFY_ENABLED, true),
    visitEndpoint: process.env.REACT_APP_WEBSITE_VISIT_ENDPOINT || '/api/website/visit',
    visitCooldownMinutes: parsePositiveInt(process.env.REACT_APP_WEBSITE_VISIT_COOLDOWN_MINUTES, 30, 1),
    requestTimeoutMs: parsePositiveInt(process.env.REACT_APP_NOTIFICATION_TIMEOUT_MS, 6000, 1000),
  },

  app: {
    showSupporters: envBoolean(process.env.REACT_APP_SHOW_SUPPORTERS, true),
    maxSupporters: parsePositiveInt(process.env.REACT_APP_MAX_SUPPORTERS, 100, 1),
    supporters: parseSupportersJson(process.env.REACT_APP_STATIC_SUPPORTERS_JSON || '[]'),
  },
};

const isValidPaymentLink = (url) => {
  if (!url) return false;
  if (isAbsoluteHttpUrl(url)) return true;
  return /^(aba|acleda|wing|intent|bank|khqr|tel|mailto):/i.test(url);
};

export const validateConfig = () => {
  const errors = [];

  if (!isValidPaymentLink(config.payment.aba.url)) {
    errors.push('ABA payment URL is missing or invalid.');
  }

  if (!isValidPaymentLink(config.payment.acleda.fullUrl)) {
    errors.push('ACLEDA payment URL is missing or invalid.');
  }

  if (!isValidPaymentLink(config.payment.wing.url)) {
    errors.push('Wing payment URL is missing or invalid.');
  }

  if (!Number.isFinite(config.app.maxSupporters) || config.app.maxSupporters < 1) {
    errors.push('Max supporters must be at least 1.');
  }

  if (errors.length > 0) {
    console.error('Configuration validation errors:', errors);
    return false;
  }

  return true;
};

export default config;
