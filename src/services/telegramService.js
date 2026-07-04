/**
 * Telegram + Supporters service.
 *
 * Browser code never contains Telegram/Supabase secrets. It only calls
 * same-origin API routes such as /api/website/visit and /api/supporters.
 */

import config from '../config/config';

const VISIT_EVENT_STORAGE_KEY = 'ozo_donation_visit_event_v2';
const SUPPORTERS_CACHE_KEY = 'ozo_donation_supporters_cache_v2';
const DEFAULT_REQUEST_TIMEOUT_MS = 8000;

const safeWindow = () => (typeof window !== 'undefined' ? window : null);
const safeNavigator = () => (typeof navigator !== 'undefined' ? navigator : null);
const safeDocument = () => (typeof document !== 'undefined' ? document : null);
const nowIso = () => new Date().toISOString();

const toPositiveNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const getRequestTimeout = () => (
  toPositiveNumber(config.api?.requestTimeoutMs, DEFAULT_REQUEST_TIMEOUT_MS)
);

const readJson = (value, fallback = null) => {
  if (!value) return fallback;

  try {
    return JSON.parse(value);
  } catch (_error) {
    return fallback;
  }
};

const buildSessionId = () => {
  const cryptoObj = safeWindow()?.crypto;

  if (cryptoObj?.randomUUID) {
    return cryptoObj.randomUUID();
  }

  return `visit-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const textEncoder = () => (typeof TextEncoder !== 'undefined' ? new TextEncoder() : null);

const bytesToBinaryString = (bytes) => (
  Array.from(bytes, (byte) => byte.toString(2).padStart(8, '0')).join('')
);

const jsonToBinaryString = (value) => {
  const json = JSON.stringify(value);
  const encoder = textEncoder();

  if (encoder) {
    const bytes = encoder.encode(json);
    return {
      binary: bytesToBinaryString(bytes),
      byteLength: bytes.byteLength,
      charLength: json.length,
    };
  }

  // Legacy fallback for very old browsers. Modern browsers use TextEncoder,
  // which safely preserves Khmer and other Unicode as UTF-8 bytes.
  const escaped = unescape(encodeURIComponent(json));
  const bytes = Array.from(escaped, (char) => char.charCodeAt(0));

  return {
    binary: bytesToBinaryString(bytes),
    byteLength: bytes.length,
    charLength: json.length,
  };
};

export const createBinaryPayloadEnvelope = (eventName, payload = {}) => {
  const encoded = jsonToBinaryString({ event: eventName, payload });

  return {
    event: eventName,
    encrypted: true,
    encryption: 'binary-json-v1',
    payloadBinary: encoded.binary,
    payloadBytes: encoded.byteLength,
    payloadChars: encoded.charLength,
  };
};

const shouldUseBinaryPayload = () => Boolean(config.notifications?.binaryPayloadEnabled);

const shouldThrottleVisit = () => {
  const storage = safeWindow()?.sessionStorage;
  if (!storage) return false;

  const cooldownMinutes = toPositiveNumber(config.notifications?.visitCooldownMinutes, 30);
  const cooldownMs = cooldownMinutes * 60 * 1000;
  const cached = readJson(storage.getItem(VISIT_EVENT_STORAGE_KEY), null);

  return Boolean(cached?.sentAt && Date.now() - Number(cached.sentAt) < cooldownMs);
};

const markVisitSent = () => {
  const storage = safeWindow()?.sessionStorage;
  if (!storage) return;

  try {
    storage.setItem(VISIT_EVENT_STORAGE_KEY, JSON.stringify({ sentAt: Date.now() }));
  } catch (_error) {
    // Ignore private-mode storage errors.
  }
};

const shouldUseBeacon = (url, options = {}) => {
  const nav = safeNavigator();
  if (!options.preferBeacon || !nav?.sendBeacon || typeof Blob === 'undefined') {
    return false;
  }

  if (config.debug) return false;

  const win = safeWindow();
  if (!win?.location) return true;

  try {
    const target = new URL(url, win.location.href);
    return target.origin === win.location.origin;
  } catch (_error) {
    return false;
  }
};

const timeoutFetch = async (url, options = {}, timeoutMs = getRequestTimeout()) => {
  if (typeof fetch !== 'function') {
    throw new Error('Fetch API is not available in this browser.');
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);
  const externalSignal = options.signal;
  const abortFromExternalSignal = () => controller.abort();

  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort();
    } else {
      externalSignal.addEventListener('abort', abortFromExternalSignal, { once: true });
    }
  }

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    window.clearTimeout(timeoutId);
    if (externalSignal) {
      externalSignal.removeEventListener('abort', abortFromExternalSignal);
    }
  }
};

const getNetworkInfo = () => {
  const nav = safeNavigator();
  const connection = nav?.connection || nav?.mozConnection || nav?.webkitConnection;

  if (!connection) {
    return {
      online: nav?.onLine ?? true,
      effectiveType: 'Unknown',
      downlink: 'Unknown',
      saveData: false,
    };
  }

  return {
    online: nav?.onLine ?? true,
    effectiveType: connection.effectiveType || 'Unknown',
    downlink: typeof connection.downlink === 'number' ? `${connection.downlink} Mbps` : 'Unknown',
    saveData: Boolean(connection.saveData),
  };
};

const getViewportInfo = () => {
  const win = safeWindow();
  if (!win) return { width: 0, height: 0, devicePixelRatio: 1 };

  return {
    width: win.innerWidth || 0,
    height: win.innerHeight || 0,
    devicePixelRatio: win.devicePixelRatio || 1,
  };
};

const getLocaleInfo = () => {
  const nav = safeNavigator();
  let timezone = 'Unknown';

  try {
    timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unknown';
  } catch (_error) {
    timezone = 'Unknown';
  }

  return {
    language: nav?.language || 'Unknown',
    languages: Array.isArray(nav?.languages) ? nav.languages.slice(0, 6) : [],
    timezone,
    localTime: new Date().toLocaleString(),
  };
};

const getDeviceInfo = (userAgent = '') => {
  const deviceInfo = {
    deviceName: 'Unknown Device',
    browser: 'Unknown Browser',
    platform: 'Unknown Platform',
    userAgent,
  };

  if (!userAgent) return deviceInfo;

  if (userAgent.includes('Windows NT 10.0')) deviceInfo.platform = 'Windows 10/11';
  else if (userAgent.includes('Windows NT 6.3')) deviceInfo.platform = 'Windows 8.1';
  else if (userAgent.includes('Windows NT 6.1')) deviceInfo.platform = 'Windows 7';
  else if (userAgent.includes('Windows')) deviceInfo.platform = 'Windows';
  else if (userAgent.includes('Mac OS X')) {
    const macMatch = userAgent.match(/Mac OS X ([\d_]+)/);
    deviceInfo.platform = macMatch ? `macOS ${macMatch[1].replace(/_/g, '.')}` : 'macOS';
  } else if (userAgent.includes('Android')) {
    const androidMatch = userAgent.match(/Android ([\d.]+)/);
    deviceInfo.platform = androidMatch ? `Android ${androidMatch[1]}` : 'Android';
  } else if (userAgent.includes('iPhone OS') || userAgent.includes('CPU OS')) {
    const iosMatch = userAgent.match(/OS ([\d_]+)/);
    deviceInfo.platform = iosMatch ? `iOS ${iosMatch[1].replace(/_/g, '.')}` : 'iOS';
  } else if (userAgent.includes('Linux')) {
    deviceInfo.platform = 'Linux';
  }

  if (userAgent.includes('Edg/')) {
    const match = userAgent.match(/Edg\/([\d.]+)/);
    deviceInfo.browser = match ? `Edge ${match[1]}` : 'Edge';
  } else if (userAgent.includes('OPR/')) {
    const match = userAgent.match(/OPR\/([\d.]+)/);
    deviceInfo.browser = match ? `Opera ${match[1]}` : 'Opera';
  } else if (userAgent.includes('Firefox/')) {
    const match = userAgent.match(/Firefox\/([\d.]+)/);
    deviceInfo.browser = match ? `Firefox ${match[1]}` : 'Firefox';
  } else if (userAgent.includes('Chrome/')) {
    const match = userAgent.match(/Chrome\/([\d.]+)/);
    deviceInfo.browser = match ? `Chrome ${match[1]}` : 'Chrome';
  } else if (userAgent.includes('Safari/')) {
    const match = userAgent.match(/Version\/([\d.]+)/);
    deviceInfo.browser = match ? `Safari ${match[1]}` : 'Safari';
  }

  if (userAgent.includes('iPhone')) deviceInfo.deviceName = 'iPhone';
  else if (userAgent.includes('iPad')) deviceInfo.deviceName = 'iPad';
  else if (userAgent.includes('Samsung') || userAgent.includes('SM-')) deviceInfo.deviceName = 'Samsung Galaxy';
  else if (userAgent.includes('Pixel')) deviceInfo.deviceName = 'Google Pixel';
  else if (userAgent.includes('OnePlus')) deviceInfo.deviceName = 'OnePlus';
  else if (userAgent.includes('Huawei')) deviceInfo.deviceName = 'Huawei';
  else if (userAgent.includes('Xiaomi')) deviceInfo.deviceName = 'Xiaomi';
  else if (userAgent.includes('Mobile')) deviceInfo.deviceName = 'Mobile Device';
  else if (userAgent.includes('Windows')) deviceInfo.deviceName = 'Windows PC';
  else if (userAgent.includes('Macintosh')) deviceInfo.deviceName = 'Mac';
  else if (userAgent.includes('Linux')) deviceInfo.deviceName = 'Linux PC';
  else deviceInfo.deviceName = 'Desktop Computer';

  return deviceInfo;
};

const getScreenInfo = () => {
  const win = safeWindow();

  if (!win?.screen) {
    return {
      resolution: 'Unknown',
      availableResolution: 'Unknown',
      type: 'Unknown',
      pixelRatio: 1,
      width: 0,
      height: 0,
    };
  }

  const { width, height, availWidth, availHeight } = win.screen;
  const pixelRatio = win.devicePixelRatio || 1;
  const resolution = `${width}x${height}${pixelRatio > 1 ? ` @${pixelRatio}x` : ''}`;
  const availableResolution = `${availWidth}x${availHeight}`;

  let type = 'Unknown';
  if (width <= 768) type = 'Mobile';
  else if (width <= 1024) type = 'Tablet';
  else if (width <= 1366) type = 'Laptop';
  else if (width <= 1920) type = 'Desktop';
  else if (width <= 2560) type = '2K Monitor';
  else if (width <= 3840) type = '4K Monitor';
  else type = 'Ultra-wide/8K';

  return {
    resolution,
    availableResolution,
    type,
    pixelRatio,
    width,
    height,
  };
};

export const createWebsiteVisitPayload = (visitInfo = {}) => {
  const nav = safeNavigator();
  const win = safeWindow();
  const doc = safeDocument();
  const userAgent = visitInfo.userAgent || nav?.userAgent || '';
  const device = getDeviceInfo(userAgent);
  const screen = getScreenInfo();
  const viewport = getViewportInfo();
  const locale = getLocaleInfo();

  return {
    eventId: visitInfo.eventId || buildSessionId(),
    timestamp: visitInfo.timestamp || nowIso(),
    localTime: locale.localTime,
    url: visitInfo.url || win?.location?.href || '',
    path: win?.location?.pathname || '',
    referrer: visitInfo.referrer || doc?.referrer || 'Direct visit',
    title: doc?.title || '',
    device: device.deviceName,
    browser: device.browser,
    platform: device.platform,
    language: locale.language,
    languages: locale.languages,
    timezone: locale.timezone,
    screen: screen.resolution,
    screenType: screen.type,
    availableScreen: screen.availableResolution,
    viewport,
    network: getNetworkInfo(),
    userAgent: device.userAgent,
  };
};

export const sendNotificationEvent = async (eventName, payload = {}, options = {}) => {
  const endpoint = config.api?.endpoints?.notification;

  if (!config.notifications?.enabled || !endpoint) {
    if (config.debug) console.info('Notifications disabled or notification endpoint missing.');
    return false;
  }

  const url = config.api.buildUrl(endpoint);
  const requestPayload = shouldUseBinaryPayload()
    ? createBinaryPayloadEnvelope(eventName, payload)
    : { event: eventName, payload };
  const body = JSON.stringify(requestPayload);

  try {
    if (shouldUseBeacon(url, options)) {
      const blob = new Blob([body], { type: 'application/json' });
      const queued = safeNavigator().sendBeacon(url, blob);
      if (queued) return true;
    }

    const response = await timeoutFetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body,
      keepalive: Boolean(options.keepalive),
      credentials: config.api?.credentials || 'same-origin',
    }, options.timeoutMs || config.notifications?.requestTimeoutMs || getRequestTimeout());

    if (!response.ok) {
      throw new Error(`Notification endpoint returned ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return await response.json();
    }

    return true;
  } catch (error) {
    const message = error?.name === 'AbortError'
      ? 'Telegram notification timed out.'
      : error?.message || 'Telegram notification failed.';

    if (config.debug) console.error(message, error);
    else console.warn(message);

    return false;
  }
};

export const sendWebsiteOpenNotification = async (visitInfo = {}) => {
  if (shouldThrottleVisit()) return true;

  const payload = createWebsiteVisitPayload(visitInfo);
  const result = await sendNotificationEvent('website_open', payload, {
    keepalive: true,
    preferBeacon: false,
    timeoutMs: config.notifications?.requestTimeoutMs || getRequestTimeout(),
  });

  if (result) markVisitSent();
  return result;
};

export const sendVisitNotification = sendWebsiteOpenNotification;

export const sendPaymentNotification = async (paymentInfo = {}) => {
  const payload = {
    amount: paymentInfo.amount || 'Unknown',
    method: paymentInfo.method || 'Unknown',
    timestamp: paymentInfo.timestamp || nowIso(),
    localTime: new Date().toLocaleString(),
    url: safeWindow()?.location?.href || '',
  };

  return sendNotificationEvent('payment_event', payload, {
    keepalive: true,
    preferBeacon: true,
  });
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
    avatar: item.avatar || item.photo || '',
    createdAt: item.createdAt || item.created_at || item.date || '',
  };
};

const writeSupportersCache = (supporters) => {
  const storage = safeWindow()?.localStorage;
  if (!storage) return;

  try {
    storage.setItem(SUPPORTERS_CACHE_KEY, JSON.stringify({
      timestamp: Date.now(),
      supporters,
    }));
  } catch (_error) {
    // Ignore quota/private-mode storage errors.
  }
};

export const readSupportersCache = ({ ignoreAge = false } = {}) => {
  const storage = safeWindow()?.localStorage;
  if (!storage) return [];

  const cached = readJson(storage.getItem(SUPPORTERS_CACHE_KEY), null);
  if (!Array.isArray(cached?.supporters)) return [];

  const maxAgeMs = config.app?.supportersCacheMaxAgeMs || 6 * 60 * 60 * 1000;
  if (!ignoreAge && cached.timestamp && Date.now() - Number(cached.timestamp) > maxAgeMs) {
    return [];
  }

  return cached.supporters;
};

const extractSupporterRows = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.supporters)) return data.supporters;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.results)) return data.results;
  return null;
};

export const fetchSupporters = async ({ signal, allowCache = true } = {}) => {
  const endpoint = config.api?.endpoints?.supporters || config.api?.endpoints?.donations || '/api/supporters';
  const url = config.api.buildUrl(endpoint);

  try {
    const response = await timeoutFetch(url, {
      method: 'GET',
      signal,
      cache: 'no-store',
      credentials: config.api?.credentials || 'same-origin',
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Supporters endpoint returned ${response.status}`);
    }

    const data = await response.json();
    const rows = extractSupporterRows(data);

    if (!Array.isArray(rows)) {
      throw new Error('Supporters response must be an array or { supporters: [] }.');
    }

    const supporters = rows
      .map(normalizeSupporter)
      .filter(Boolean)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, config.app?.maxSupporters || 100);

    writeSupportersCache(supporters);
    return supporters;
  } catch (error) {
    if (error?.name === 'AbortError') throw error;

    if (allowCache) {
      const cached = readSupportersCache({ ignoreAge: true });
      if (cached.length > 0) return cached;
    }

    throw error;
  }
};

export const getApiDebugInfo = () => ({
  baseUrl: config.api?.baseUrl || '',
  notificationUrl: config.api?.buildUrl?.(config.api?.endpoints?.notification || '') || '',
  supportersUrl: config.api?.buildUrl?.(config.api?.endpoints?.supporters || '') || '',
  notificationsEnabled: Boolean(config.notifications?.enabled),
  binaryPayloadEnabled: Boolean(config.notifications?.binaryPayloadEnabled),
});

const telegramService = {
  createBinaryPayloadEnvelope,
  createWebsiteVisitPayload,
  sendNotificationEvent,
  sendWebsiteOpenNotification,
  sendVisitNotification,
  sendPaymentNotification,
  fetchSupporters,
  readSupportersCache,
  getApiDebugInfo,
};

export default telegramService;
