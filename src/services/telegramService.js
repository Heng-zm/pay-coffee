/**
 * Telegram Service
 * Handles sending notifications to Telegram via Bot API
 */

import axios from 'axios';
import config from '../config/config';

/**
 * Send a message to Telegram
 * @param {string} message - The message to send
 * @param {Object} options - Additional options for the message
 * @returns {Promise} - Promise that resolves when message is sent
 */
export const sendTelegramMessage = async (message, options = {}) => {
  try {
    // Check if Telegram is configured
    if (!config.telegram.isConfigured()) {
      console.warn('Telegram is not configured. Skipping message send.');
      return false;
    }

    const url = config.telegram.buildApiUrl('sendMessage');
    
    const data = {
      chat_id: config.telegram.chatId,
      text: message,
      parse_mode: options.parseMode || 'HTML',
      disable_web_page_preview: options.disableWebPagePreview || true,
      ...options
    };

    const response = await axios.post(url, data);
    
    
    return response.data;
  } catch (error) {
    console.error('Error sending Telegram message:', error.message);
    
    // Log more details in debug mode
    if (config.debug) {
      console.error('Full error:', error);
    }
    
    return false;
  }
};

/**
 * Send website visit notification
 * @param {Object} visitInfo - Information about the visit
 */
export const sendVisitNotification = async (visitInfo = {}) => {
  const {
    userAgent = navigator.userAgent,
    timestamp = new Date().toLocaleString(),
    url = window.location.href,
    referrer = document.referrer || 'Direct visit'
  } = visitInfo;

  const deviceInfo = getDeviceInfo(userAgent);
  const screenInfo = getScreenInfo();

  // Create a formatted message
  const message = `
🌐 <b>Website Visit Alert</b>

📅 <b>Time:</b> ${timestamp}
🔗 <b>URL:</b> ${url}
📱 <b>Device:</b> ${deviceInfo.deviceName}
💻 <b>Browser:</b> ${deviceInfo.browser}
📺 <b>Screen:</b> ${screenInfo.resolution} (${screenInfo.type})
🔄 <b>Referrer:</b> ${referrer}
🌍 <b>Platform:</b> ${deviceInfo.platform}

👤 <b>User opened the donation website!</b>
  `.trim();

  return await sendTelegramMessage(message);
};

/**
 * Send payment notification
 * @param {Object} paymentInfo - Information about the payment
 */
export const sendPaymentNotification = async (paymentInfo = {}) => {
  const {
    amount = 'Unknown',
    method = 'Unknown',
    timestamp = new Date().toLocaleString()
  } = paymentInfo;

  const message = `
💰 <b>Payment Alert</b>

📅 <b>Time:</b> ${timestamp}
💳 <b>Method:</b> ${method}
💵 <b>Amount:</b> ${amount}

✅ <b>Payment successful!</b>
  `.trim();

  return await sendTelegramMessage(message);
};

/**
 * Get detailed device information
 * @param {string} userAgent - The user agent string
 * @returns {Object} - Detailed device information
 */
const getDeviceInfo = (userAgent) => {
  if (!userAgent) {
    return {
      deviceName: 'Unknown Device',
      browser: 'Unknown Browser',
      platform: 'Unknown Platform'
    };
  }

  const deviceInfo = {
    deviceName: 'Unknown Device',
    browser: 'Unknown Browser',
    platform: 'Unknown Platform'
  };

  // Platform detection
  if (userAgent.includes('Windows NT 10.0')) deviceInfo.platform = 'Windows 10/11';
  else if (userAgent.includes('Windows NT 6.3')) deviceInfo.platform = 'Windows 8.1';
  else if (userAgent.includes('Windows NT 6.1')) deviceInfo.platform = 'Windows 7';
  else if (userAgent.includes('Windows')) deviceInfo.platform = 'Windows';
  else if (userAgent.includes('Mac OS X')) {
    const macMatch = userAgent.match(/Mac OS X ([\d_]+)/);
    if (macMatch) {
      const version = macMatch[1].replace(/_/g, '.');
      deviceInfo.platform = `macOS ${version}`;
    } else {
      deviceInfo.platform = 'macOS';
    }
  }
  else if (userAgent.includes('Linux')) deviceInfo.platform = 'Linux';
  else if (userAgent.includes('Android')) {
    const androidMatch = userAgent.match(/Android ([\d.]+)/);
    if (androidMatch) {
      deviceInfo.platform = `Android ${androidMatch[1]}`;
    } else {
      deviceInfo.platform = 'Android';
    }
  }
  else if (userAgent.includes('iOS') || userAgent.includes('iPhone OS')) {
    const iosMatch = userAgent.match(/OS ([\d_]+)/);
    if (iosMatch) {
      const version = iosMatch[1].replace(/_/g, '.');
      deviceInfo.platform = `iOS ${version}`;
    } else {
      deviceInfo.platform = 'iOS';
    }
  }

  // Browser detection
  if (userAgent.includes('Edg/')) {
    const edgeMatch = userAgent.match(/Edg\/([\d.]+)/);
    deviceInfo.browser = edgeMatch ? `Edge ${edgeMatch[1]}` : 'Edge';
  } else if (userAgent.includes('Chrome/')) {
    const chromeMatch = userAgent.match(/Chrome\/([\d.]+)/);
    deviceInfo.browser = chromeMatch ? `Chrome ${chromeMatch[1]}` : 'Chrome';
  } else if (userAgent.includes('Firefox/')) {
    const firefoxMatch = userAgent.match(/Firefox\/([\d.]+)/);
    deviceInfo.browser = firefoxMatch ? `Firefox ${firefoxMatch[1]}` : 'Firefox';
  } else if (userAgent.includes('Safari/') && !userAgent.includes('Chrome')) {
    const safariMatch = userAgent.match(/Version\/([\d.]+)/);
    deviceInfo.browser = safariMatch ? `Safari ${safariMatch[1]}` : 'Safari';
  } else if (userAgent.includes('Opera/') || userAgent.includes('OPR/')) {
    const operaMatch = userAgent.match(/(?:Opera\/|OPR\/)([\d.]+)/);
    deviceInfo.browser = operaMatch ? `Opera ${operaMatch[1]}` : 'Opera';
  }

  // Device name detection
  if (userAgent.includes('iPhone')) {
    if (userAgent.includes('iPhone15')) deviceInfo.deviceName = 'iPhone 15';
    else if (userAgent.includes('iPhone14')) deviceInfo.deviceName = 'iPhone 14';
    else if (userAgent.includes('iPhone13')) deviceInfo.deviceName = 'iPhone 13';
    else if (userAgent.includes('iPhone12')) deviceInfo.deviceName = 'iPhone 12';
    else if (userAgent.includes('iPhone11')) deviceInfo.deviceName = 'iPhone 11';
    else if (userAgent.includes('iPhoneX')) deviceInfo.deviceName = 'iPhone X';
    else deviceInfo.deviceName = 'iPhone';
  } else if (userAgent.includes('iPad')) {
    if (userAgent.includes('iPad13')) deviceInfo.deviceName = 'iPad Pro';
    else if (userAgent.includes('iPad11')) deviceInfo.deviceName = 'iPad Air';
    else deviceInfo.deviceName = 'iPad';
  } else if (userAgent.includes('Samsung')) {
    if (userAgent.includes('SM-G')) deviceInfo.deviceName = 'Samsung Galaxy';
    else deviceInfo.deviceName = 'Samsung Device';
  } else if (userAgent.includes('Pixel')) {
    deviceInfo.deviceName = 'Google Pixel';
  } else if (userAgent.includes('OnePlus')) {
    deviceInfo.deviceName = 'OnePlus';
  } else if (userAgent.includes('Huawei')) {
    deviceInfo.deviceName = 'Huawei';
  } else if (userAgent.includes('Xiaomi')) {
    deviceInfo.deviceName = 'Xiaomi';
  } else if (userAgent.includes('Mobile')) {
    deviceInfo.deviceName = 'Mobile Device';
  } else if (userAgent.includes('Windows')) {
    deviceInfo.deviceName = 'Windows PC';
  } else if (userAgent.includes('Macintosh')) {
    if (userAgent.includes('MacBook')) deviceInfo.deviceName = 'MacBook';
    else deviceInfo.deviceName = 'Mac';
  } else if (userAgent.includes('Linux')) {
    deviceInfo.deviceName = 'Linux PC';
  } else {
    deviceInfo.deviceName = 'Desktop Computer';
  }

  return deviceInfo;
};

/**
 * Get screen information
 * @returns {Object} - Screen resolution and type information
 */
const getScreenInfo = () => {
  const screen = window.screen;
  const width = screen.width;
  const height = screen.height;
  const availWidth = screen.availWidth;
  const availHeight = screen.availHeight;
  const pixelRatio = window.devicePixelRatio || 1;

  let screenType = 'Unknown';
  const resolution = `${width}x${height}`;
  const availableResolution = `${availWidth}x${availHeight}`;

  // Determine screen type based on resolution
  if (width <= 768) {
    screenType = 'Mobile';
  } else if (width <= 1024) {
    screenType = 'Tablet';
  } else if (width <= 1366) {
    screenType = 'Laptop';
  } else if (width <= 1920) {
    screenType = 'Desktop';
  } else if (width <= 2560) {
    screenType = '2K Monitor';
  } else if (width <= 3840) {
    screenType = '4K Monitor';
  } else {
    screenType = 'Ultra-wide/8K';
  }

  // Add pixel density info
  let densityInfo = '';
  if (pixelRatio > 1) {
    densityInfo = ` @${pixelRatio}x`;
  }

  return {
    resolution: resolution + densityInfo,
    availableResolution,
    type: screenType,
    pixelRatio,
    width,
    height
  };
};


const telegramService = {
  sendTelegramMessage,
  sendVisitNotification,
  sendPaymentNotification
};

export default telegramService;
