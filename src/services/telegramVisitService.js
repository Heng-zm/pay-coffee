import config from '../config/config';

const STORAGE_KEY = 'ozo_visit_notification_sent_at';
const DEFAULT_TIMEOUT_MS = 6000;

const safeWindow = () => (typeof window !== 'undefined' ? window : null);
const safeNavigator = () => (typeof navigator !== 'undefined' ? navigator : null);
const safeDocument = () => (typeof document !== 'undefined' ? document : null);

const toPositiveNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const readStorageNumber = (key) => {
  const win = safeWindow();
  if (!win?.sessionStorage) return 0;

  try {
    return Number(win.sessionStorage.getItem(key) || 0);
  } catch (_error) {
    return 0;
  }
};

const writeStorageNumber = (key, value) => {
  const win = safeWindow();
  if (!win?.sessionStorage) return;

  try {
    win.sessionStorage.setItem(key, String(value));
  } catch (_error) {
    // Ignore private browsing / blocked storage errors.
  }
};

const shouldThrottleVisit = () => {
  const cooldownMinutes = toPositiveNumber(config.notifications?.visitCooldownMinutes, 30);
  const cooldownMs = cooldownMinutes * 60 * 1000;
  const sentAt = readStorageNumber(STORAGE_KEY);

  return sentAt > 0 && Date.now() - sentAt < cooldownMs;
};

const timeoutFetch = async (url, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) => {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    window.clearTimeout(timeoutId);
  }
};

const getDeviceInfo = (userAgent = '') => {
  const info = {
    device: 'Unknown Device',
    browser: 'Unknown Browser',
    platform: 'Unknown Platform',
    userAgent,
  };

  if (!userAgent) return info;

  if (/iPhone/i.test(userAgent)) info.device = 'iPhone';
  else if (/iPad/i.test(userAgent)) info.device = 'iPad';
  else if (/Android/i.test(userAgent)) info.device = 'Android';
  else if (/Windows/i.test(userAgent)) info.device = 'Windows PC';
  else if (/Macintosh|Mac OS X/i.test(userAgent)) info.device = 'Mac';

  if (/Edg\//i.test(userAgent)) info.browser = 'Microsoft Edge';
  else if (/OPR\//i.test(userAgent)) info.browser = 'Opera';
  else if (/Chrome\//i.test(userAgent) && !/Chromium/i.test(userAgent)) info.browser = 'Chrome';
  else if (/Firefox\//i.test(userAgent)) info.browser = 'Firefox';
  else if (/Safari\//i.test(userAgent)) info.browser = 'Safari';

  if (/Windows NT 10/i.test(userAgent)) info.platform = 'Windows 10/11';
  else if (/Windows/i.test(userAgent)) info.platform = 'Windows';
  else if (/Android ([\d.]+)/i.test(userAgent)) info.platform = `Android ${userAgent.match(/Android ([\d.]+)/i)?.[1] || ''}`.trim();
  else if (/iPhone OS|CPU OS/i.test(userAgent)) info.platform = 'iOS';
  else if (/Mac OS X/i.test(userAgent)) info.platform = 'macOS';
  else if (/Linux/i.test(userAgent)) info.platform = 'Linux';

  return info;
};

const buildVisitPayload = (extra = {}) => {
  const win = safeWindow();
  const nav = safeNavigator();
  const doc = safeDocument();
  const userAgent = nav?.userAgent || '';
  const device = getDeviceInfo(userAgent);
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unknown';

  return {
    event: 'website_visit',
    timestamp: new Date().toISOString(),
    localTime: new Date().toLocaleString(),
    url: win?.location?.href || '',
    path: win?.location?.pathname || '/',
    referrer: doc?.referrer || 'Direct visit',
    title: doc?.title || 'Donation Page',
    language: nav?.language || 'Unknown',
    timezone,
    screen: {
      width: win?.screen?.width || win?.innerWidth || 0,
      height: win?.screen?.height || win?.innerHeight || 0,
      viewportWidth: win?.innerWidth || 0,
      viewportHeight: win?.innerHeight || 0,
      devicePixelRatio: win?.devicePixelRatio || 1,
    },
    connection: {
      online: nav?.onLine ?? true,
      effectiveType: nav?.connection?.effectiveType || 'Unknown',
      saveData: Boolean(nav?.connection?.saveData),
    },
    ...device,
    ...extra,
  };
};

export const sendWebsiteOpenNotification = async (extra = {}) => {
  if (!config.notifications?.websiteVisitEnabled) return false;
  if (typeof window === 'undefined' || typeof fetch !== 'function') return false;
  if (shouldThrottleVisit()) return false;

  const endpoint = config.notifications?.visitEndpoint || '/api/website/visit';
  const payload = buildVisitPayload(extra);

  try {
    const response = await timeoutFetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      keepalive: true,
    }, toPositiveNumber(config.notifications?.requestTimeoutMs, DEFAULT_TIMEOUT_MS));

    if (response.ok) {
      writeStorageNumber(STORAGE_KEY, Date.now());
      return true;
    }

    if (config.debug) {
      console.warn('Telegram visit notification was not sent.', response.status);
    }

    return false;
  } catch (error) {
    if (config.debug && error?.name !== 'AbortError') {
      console.warn('Telegram visit notification failed.', error);
    }
    return false;
  }
};

export default sendWebsiteOpenNotification;
