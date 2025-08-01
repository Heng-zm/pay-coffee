/**
 * Application Configuration
 * Centralized configuration management using environment variables
 */

// Validate required environment variables
const requiredEnvVars = [
  'REACT_APP_ABA_PAYMENT_URL',
  'REACT_APP_ACLEDA_PAYMENT_URL',
  'REACT_APP_ACLEDA_PAYMENT_DATA',
  'REACT_APP_RECIPIENT_NAME'
];

// Check for missing required environment variables
const missingEnvVars = requiredEnvVars.filter(
  envVar => !process.env[envVar]
);

if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars);
  console.error('Please check your .env file and ensure all required variables are set.');
}

// Configuration object
const config = {
  // Environment
  environment: process.env.REACT_APP_ENVIRONMENT || 'development',
  isProduction: process.env.REACT_APP_ENVIRONMENT === 'production',
  isDevelopment: process.env.REACT_APP_ENVIRONMENT === 'development',
  debug: process.env.REACT_APP_DEBUG === 'true',

  // Payment Gateway URLs
  payment: {
    aba: {
      url: process.env.REACT_APP_ABA_PAYMENT_URL,
    },
    acleda: {
      url: process.env.REACT_APP_ACLEDA_PAYMENT_URL,
      paymentData: process.env.REACT_APP_ACLEDA_PAYMENT_DATA,
      key: process.env.REACT_APP_ACLEDA_KEY || 'khqr',
      // Construct full URL
      get fullUrl() {
        return `${this.url}?payment_data=${this.paymentData}&key=${this.key}`;
      }
    }
  },

  // Assets Configuration
  assets: {
    images: {
      aba: '/aba.PNG',
      acleda: '/acleda.PNG',
      qr: '/qr.PNG',
      thankYou: '/Thank.gif',
      telegram: '/telegram.png',
      behance: '/behance.png',
      logo: '/logo192.png',
      app: '/app.png'
    },
    // Helper method to get asset URL
    getImageUrl: function(imageName) {
      return this.images[imageName] || null;
    }
  },

  // API Configuration
  api: {
    baseUrl: process.env.REACT_APP_API_BASE_URL || 'https://0zodesigner.github.io',
    endpoints: {
      donations: process.env.REACT_APP_DONATIONS_ENDPOINT || '/donate/supporters.json',
      paymentWebhook: process.env.REACT_APP_PAYMENT_WEBHOOK_URL
    },
    // Helper method to build full API URLs
    buildUrl: function(endpoint) {
      return `${this.baseUrl}${endpoint}`;
    }
  },

  // App Settings
  app: {
    recipientName: process.env.REACT_APP_RECIPIENT_NAME || 'Ozo. Designer',
    defaultTimer: process.env.REACT_APP_DEFAULT_TIMER || '10:53',
    refreshInterval: parseInt(process.env.REACT_APP_REFRESH_INTERVAL) || 30000,
  },

  // Telegram Configuration
  telegram: {
    botToken: process.env.REACT_APP_TELEGRAM_BOT_TOKEN,
    chatId: process.env.REACT_APP_TELEGRAM_CHAT_ID,
    apiUrl: 'https://api.telegram.org/bot',
    // Helper method to build Telegram API URL
    buildApiUrl: function(method) {
      return `${this.apiUrl}${this.botToken}/${method}`;
    },
    // Check if Telegram is configured
    isConfigured: function() {
      return !!(this.botToken && this.chatId);
    }
  },

  // Security Settings
  security: {
    // List of allowed origins for CORS (if implementing backend)
    allowedOrigins: process.env.REACT_APP_ALLOWED_ORIGINS ? 
      process.env.REACT_APP_ALLOWED_ORIGINS.split(',') : 
      ['http://localhost:3000', 'http://localhost:3001'],
  }
};

// Validate configuration
export const validateConfig = () => {
  const errors = [];

  // Check payment URLs
  if (!config.payment.aba.url) {
    errors.push('ABA payment URL is not configured');
  }

  if (!config.payment.acleda.url || !config.payment.acleda.paymentData) {
    errors.push('ACLEDA payment configuration is incomplete');
  }

  if (errors.length > 0) {
    console.error('Configuration validation errors:', errors);
    return false;
  }

  return true;
};

// Debug configuration (only in development)

export default config;
