import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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

  // Handle payment success with enhanced state management
  const handlePaymentSuccess = useCallback((paymentData) => {
    setShowThankYou(true);
    setPaymentInProgress(false);
    
    // Call parent handler
    if (onPaymentSuccess) {
      onPaymentSuccess(paymentData);
    }
    
    // Clear any existing timeout
    if (thankYouTimeoutRef.current) {
      clearTimeout(thankYouTimeoutRef.current);
    }
    
    // Hide after 5 seconds
    thankYouTimeoutRef.current = setTimeout(() => {
      setShowThankYou(false);
      thankYouTimeoutRef.current = null;
    }, 5000);
  }, [onPaymentSuccess]);

  // Handle payment start
  const handlePaymentStart = useCallback(() => {
    setPaymentInProgress(true);
  }, []);

  // Reset thank you display when timer resets
  useEffect(() => {
    if (!isExpired) {
      setShowThankYou(false);
      setPaymentInProgress(false);
      // Clear timeout when timer resets
      if (thankYouTimeoutRef.current) {
        clearTimeout(thankYouTimeoutRef.current);
        thankYouTimeoutRef.current = null;
      }
    }
  }, [isExpired]);

  // Reset payment in progress if offline
  useEffect(() => {
    if (!isOnline && paymentInProgress) {
      setPaymentInProgress(false);
    }
  }, [isOnline, paymentInProgress]);

  // Initialize loading state and component mounting
  useEffect(() => {
    mountedRef.current = true;
    // Simulate component loading for smooth transitions
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

  // Memoize recipient name to prevent unnecessary re-renders
  const recipientName = useMemo(() => config.app.recipientName, []);
  
  // Memoize container class names
  const containerClasses = useMemo(() => {
    return `content ${isLoading ? 'loading' : 'loaded'} ${isExpired ? 'expired' : ''} ${!isOnline ? 'offline' : ''}`;
  }, [isLoading, isExpired, isOnline]);

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
      {/* Top Bar */}
      <div className="top-bar">
        <span className="title">PAY ME A COFFEE</span>
        <Timer initialTime={config.app.defaultTimer} onExpired={onTimerExpired} />
      </div>

      {/* Recipient Info */}
      <div className="recipient-info">
        <div className="recipient-name">{config.app.recipientName}</div>
      </div>

      {/* Separator */}
      <hr className="separator" />

      {/* QR Code Container */}
      <QRCode isExpired={isExpired} />

      {/* Payment Buttons with Instructions */}
      <PaymentButtons 
        isExpired={isExpired} 
        onPaymentSuccess={handlePaymentSuccess}
        onPaymentStart={handlePaymentStart}
        paymentInProgress={paymentInProgress}
        isOnline={isOnline}
      />

      {/* Payment Status */}
      {paymentInProgress && (
        <div className="payment-status processing">
          <div className="spinner"></div>
          <span>Processing payment...</span>
        </div>
      )}

      {/* Thank You GIF Container */}
      {showThankYou && (
        <div id="thank-you-gif-container" className="show-thank-you">
          <img 
            id="thank-you-gif" 
            src={config.assets.getImageUrl('thankYou')}
            alt="Animated thank you message with celebratory graphics." 
          />
          <div className="amount">
            THANK FOR DONATION<span className="currency"></span>
          </div>
          {lastPaymentTime && (
            <div className="payment-time">
              Received at {lastPaymentTime.toLocaleTimeString()}
            </div>
          )}
        </div>
      )}

      {/* Offline Notice */}
      {!isOnline && (
        <div className="offline-notice">
          <span>⚠️ No internet connection. Payments may not process.</span>
        </div>
      )}

      {/* Footer Text (Signature) */}
      <p className="footer-text">
        by Ozo. Designer
      </p>
    </main>
  );
};

export default MainContent;
