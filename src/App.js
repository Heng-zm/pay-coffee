import React, { useEffect, useRef, useState } from 'react';
import Header from './components/Header';
import MoneyRain from './components/MoneyRain';
import MainContent from './components/MainContent';
import DonationsList from './components/DonationsList';
import Footer from './components/Footer';
import config, { validateConfig } from './config/config';
import { sendWebsiteOpenNotification } from './services/telegramService';
import './style.css';

function App() {
  const notificationSentRef = useRef(false);

  const [isOnline, setIsOnline] = useState(() => (
    typeof navigator !== 'undefined' ? navigator.onLine : true
  ));
  const [configValid, setConfigValid] = useState(true);

  useEffect(() => {
    setConfigValid(validateConfig());
  }, []);

  useEffect(() => {
    if (notificationSentRef.current || !configValid) {
      return undefined;
    }

    const notifyVisit = async () => {
      notificationSentRef.current = true;
      const ok = await sendWebsiteOpenNotification({
        timestamp: new Date().toISOString(),
        url: typeof window !== 'undefined' ? window.location.href : '',
        referrer: typeof document !== 'undefined' && document.referrer ? document.referrer : 'Direct visit',
      });

      // Do not retry in the same page session. Visit notifications are optional;
      // a backend/Telegram configuration problem must not cause repeated POSTs
      // during React StrictMode or local development.
      void ok;
    };

    const timer = window.setTimeout(notifyVisit, 900);
    return () => window.clearTimeout(timer);
  }, [configValid]);

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
      className={`container${!isOnline ? ' offline' : ''}${!configValid ? ' config-invalid' : ''}`}
      id="payment-container"
    >
      <MoneyRain />
      <Header isOnline={isOnline} />

      {!configValid && (
        <div className="config-warning" role="alert">
          Payment configuration needs attention. Some payment buttons may be unavailable.
        </div>
      )}

      <MainContent isOnline={isOnline} />
      <DonationsList isOnline={isOnline} />
      <Footer />
    </div>
  );
}

export default App;
