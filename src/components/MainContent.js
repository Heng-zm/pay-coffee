import React, { useCallback, useEffect, useRef, useState } from 'react';
import QRCode from './QRCode';
import PaymentButtons from './PaymentButtons';
import config from '../config/config';

const MainContent = ({ isOnline }) => {
  const [showThankYou, setShowThankYou] = useState(false);
  const [paymentInProgress, setPaymentInProgress] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState('Opening payment app...');
  const [isLoading, setIsLoading] = useState(true);
  const thankYouTimeoutRef = useRef(null);
  const paymentTimeoutRef = useRef(null);
  const mountedRef = useRef(false);

  const clearThankYouTimer = useCallback(() => {
    if (thankYouTimeoutRef.current) {
      window.clearTimeout(thankYouTimeoutRef.current);
      thankYouTimeoutRef.current = null;
    }
  }, []);

  const clearPaymentTimer = useCallback(() => {
    if (paymentTimeoutRef.current) {
      window.clearTimeout(paymentTimeoutRef.current);
      paymentTimeoutRef.current = null;
    }
  }, []);

  const handlePaymentStart = useCallback(({ method } = {}) => {
    clearPaymentTimer();
    clearThankYouTimer();

    setPaymentInProgress(true);
    setShowThankYou(false);
    setPaymentMessage(method ? `Opening ${method} payment app...` : 'Opening payment app...');

    paymentTimeoutRef.current = window.setTimeout(() => {
      if (!mountedRef.current) return;

      setPaymentInProgress(false);
      setPaymentMessage('Payment app opened. Please complete the payment in your bank app.');
      setShowThankYou(true);
      paymentTimeoutRef.current = null;

      thankYouTimeoutRef.current = window.setTimeout(() => {
        if (!mountedRef.current) return;
        setShowThankYou(false);
        thankYouTimeoutRef.current = null;
      }, 4500);
    }, 1800);
  }, [clearPaymentTimer, clearThankYouTimer]);

  useEffect(() => {
    if (!isOnline && paymentInProgress) {
      clearPaymentTimer();
      setPaymentInProgress(false);
      setPaymentMessage('No internet connection. Please reconnect and try again.');
    }
  }, [isOnline, paymentInProgress, clearPaymentTimer]);

  useEffect(() => {
    mountedRef.current = true;
    const loadingTimer = window.setTimeout(() => {
      if (mountedRef.current) setIsLoading(false);
    }, 80);

    return () => {
      mountedRef.current = false;
      window.clearTimeout(loadingTimer);
      clearPaymentTimer();
      clearThankYouTimer();
    };
  }, [clearPaymentTimer, clearThankYouTimer]);

  if (isLoading) {
    return (
      <main className="content loading">
        <div className="loading-spinner" role="status" aria-live="polite">
          <div className="spinner-circle" aria-hidden="true" />
          <span>Loading...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="content">
      <section className="payment-panel" aria-label="Payment QR and bank buttons">
        <div className="qr-panel">
          <QRCode />
        </div>

        <PaymentButtons
          onPaymentStart={handlePaymentStart}
          paymentInProgress={paymentInProgress}
          isOnline={isOnline}
        />
      </section>

      {paymentInProgress && (
        <div className="payment-status processing" role="status" aria-live="polite">
          <div className="spinner" aria-hidden="true" />
          <span>{paymentMessage}</span>
        </div>
      )}

      {showThankYou && (
        <div id="thank-you-gif-container" className="show-thank-you" role="status" aria-live="polite">
          <img
            id="thank-you-gif"
            src={config.assets?.getImageUrl?.('thankYou') || '/Thank.gif'}
            alt="Thank you for opening the payment app"
            width="150"
            height="150"
            loading="lazy"
            decoding="async"
            onError={(event) => {
              event.currentTarget.style.display = 'none';
            }}
          />
          <div className="amount">PLEASE COMPLETE PAYMENT IN BANK APP</div>
        </div>
      )}

      {!isOnline && (
        <div className="offline-notice" role="alert">
          <span>⚠️ No internet connection. Payments may not process.</span>
        </div>
      )}
    </main>
  );
};

export default MainContent;
