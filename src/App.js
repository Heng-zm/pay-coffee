import React, { useEffect, useRef, useState } from 'react';
import Header from './components/Header';
import MoneyRain from './components/MoneyRain';
import MainContent from './components/MainContent';
import DonationsList from './components/DonationsList';
import Footer from './components/Footer';
import { validateConfig } from './config/config';
import { sendWebsiteOpenNotification } from './services/telegramVisitService';
import './style.css';

function App() {
  const notificationStartedRef = useRef(false);
  const [isOnline, setIsOnline] = useState(() => (
    typeof navigator !== 'undefined' ? navigator.onLine : true
  ));
  const [configValid, setConfigValid] = useState(true);

  useEffect(() => {
    setConfigValid(validateConfig());
  }, []);

  useEffect(() => {
    if (!configValid || notificationStartedRef.current) {
      return undefined;
    }

    notificationStartedRef.current = true;
    const timer = window.setTimeout(() => {
      sendWebsiteOpenNotification().catch(() => undefined);
    }, 700);

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
      <DonationsList />
      <Footer />
    </div>
  );
}

export default App;
