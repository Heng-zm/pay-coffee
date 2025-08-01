import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import Header from './components/Header';
import MainContent from './components/MainContent';
import DonationsList from './components/DonationsList';
import Footer from './components/Footer';
import { validateConfig } from './config/config';
import { sendVisitNotification } from './services/telegramService';
import './style.css';

function App() {
  // Refs for cleanup and performance
  const notificationSentRef = useRef(false);
  const onlineStatusInitialized = useRef(false);
  
  // Core app state management
  const [isExpired, setIsExpired] = useState(false);
  const [appTheme, setAppTheme] = useState('default');
  const [lastPaymentTime, setLastPaymentTime] = useState(null);
  const [isOnline, setIsOnline] = useState(() => {
    // Initialize with current online status
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });
  const [configValid, setConfigValid] = useState(true);

  // Validate configuration on app start
  useEffect(() => {
    const isValid = validateConfig();
    setConfigValid(isValid);
    if (!isValid) {
      console.error('App configuration is invalid. Please check your environment variables.');
    }
  }, []);

  // Send Telegram notification when website is opened (only once)
  useEffect(() => {
    if (notificationSentRef.current || !configValid) {
      return;
    }

    const notifyVisit = async () => {
      try {
        notificationSentRef.current = true;
        await sendVisitNotification({
          timestamp: new Date().toLocaleString(),
          url: window.location.href,
          referrer: document.referrer || 'Direct visit'
        });
      } catch (error) {
        console.error('Failed to send visit notification:', error);
        // Allow retry on next page load if it failed
        notificationSentRef.current = false;
      }
    };

    // Send notification after a short delay to ensure page is fully loaded
    const timer = setTimeout(notifyVisit, 1500);
    
    return () => {
      clearTimeout(timer);
    };
  }, [configValid]);

  // Timer expiration handler with additional state updates
  const handleTimerExpired = useCallback(() => {
    setIsExpired(true);
    setAppTheme('expired');
  }, []);
  
  // Payment success handler
  const handlePaymentSuccess = useCallback((paymentData) => {
    setLastPaymentTime(new Date());
  }, []);


  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div 
      className={`container ${isExpired ? 'expired' : ''} ${appTheme} ${!isOnline ? 'offline' : ''}`} 
      id="payment-container"
    >
      <Header 
        isOnline={isOnline}
      />
      <MainContent 
        isExpired={isExpired} 
        onTimerExpired={handleTimerExpired}
        onPaymentSuccess={handlePaymentSuccess}
        lastPaymentTime={lastPaymentTime}
        isOnline={isOnline}
      />
      <DonationsList 
        isExpired={isExpired}
        isOnline={isOnline}
      />
      <Footer 
        isExpired={isExpired}
      />
    </div>
  );
}

export default App;
