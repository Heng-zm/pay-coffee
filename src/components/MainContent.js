import React, { useState, useEffect, useRef, useCallback } from 'react';
import Timer from './Timer';
import QRCode from './QRCode';
import PaymentButtons from './PaymentButtons';
import config from '../config/config';

const MainContent = ({ isExpired, onTimerExpired, onPaymentSuccess, lastPaymentTime, isOnline }) => {
  const [showThankYou, setShowThankYou] = useState(false);
  const [paymentInProgress, setPaymentInProgress] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const thankYouTimeoutRef = useRef(null);
  const mountedRef = useRef(true);

  const handlePaymentSuccess = useCallback((paymentData) => {
    setShowThankYou(true);
    setPaymentInProgress(false);
    
    if (onPaymentSuccess) {
      onPaymentSuccess(paymentData);
    }
    
    if (thankYouTimeoutRef.current) {
      clearTimeout(thankYouTimeoutRef.current);
    }
    
    thankYouTimeoutRef.current = setTimeout(() => {
      setShowThankYou(false);
      thankYouTimeoutRef.current = null;
    }, 5000);
  }, [onPaymentSuccess]);

  const handlePaymentStart = useCallback(() => {
    setPaymentInProgress(true);
  }, []);

  useEffect(() => {
    if (!isExpired) {
      setShowThankYou(false);
      setPaymentInProgress(false);
      if (thankYouTimeoutRef.current) {
        clearTimeout(thankYouTimeoutRef.current);
        thankYouTimeoutRef.current = null;
      }
    }
  }, [isExpired]);

  useEffect(() => {
    if (!isOnline && paymentInProgress) {
      setPaymentInProgress(false);
    }
  }, [isOnline, paymentInProgress]);

  useEffect(() => {
    mountedRef.current = true;
    const loadingTimer = setTimeout(() => {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }, 100);
    
    return () => {
      mountedRef.current = false;
      clearTimeout(loadingTimer);
      if (thankYouTimeoutRef.current) {
        clearTimeout(thankYouTimeoutRef.current);
      }
    };
  }, []);

  if (isLoading) {
    return (
      <main className="content loading">
        <div className="loading-spinner">
          <div className="spinner-circle"></div>
          <span>Loading...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="content">
      <div className="top-bar">
        <span className="title">PAY ME A COFFEE</span>
        <Timer initialTime={config.app.defaultTimer} onExpired={onTimerExpired} />
      </div>

      <div className="recipient-info">
        <div className="recipient-name">{config.app.recipientName}</div>
      </div>

      <hr className="separator" />

      <QRCode isExpired={isExpired} />

      <PaymentButtons 
        isExpired={isExpired} 
        onPaymentSuccess={handlePaymentSuccess}
        onPaymentStart={handlePaymentStart}
        paymentInProgress={paymentInProgress}
        isOnline={isOnline}
      />

      {paymentInProgress && (
        <div className="payment-status processing">
          <div className="spinner"></div>
          <span>Processing payment...</span>
        </div>
      )}

      {showThankYou && (
        <div id="thank-you-gif-container" className="show-thank-you">
          {/* OPTIMIZED IMAGE */}
          <img 
            id="thank-you-gif" 
            src={config.assets.getImageUrl('thankYou')}
            alt="Animated thank you message" 
            width="150"
            height="150"
            loading="lazy"
            decoding="async"
          />
          <div className="amount">
            THANK FOR DONATION<span className="currency"></span>
          </div>
        </div>
      )}

      {!isOnline && (
        <div className="offline-notice">
          <span>⚠️ No internet connection. Payments may not process.</span>
        </div>
      )}

      <p className="footer-text">
        by Ozo. Designer
      </p>
    </main>
  );
};

export default MainContent;
