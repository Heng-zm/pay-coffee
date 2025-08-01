import React, { useCallback, useMemo } from 'react';
import config from '../config/config';

const PaymentButtons = React.memo(({ isExpired, onPaymentSuccess, onPaymentStart, paymentInProgress, isOnline }) => {
  // Memoized URLs to prevent recalculation on every render
  const abaUrl = useMemo(() => config.payment.aba.url, []);
  const acledaUrl = useMemo(() => config.payment.acleda.fullUrl, []);
  const abaIcon = useMemo(() => config.assets.getImageUrl('aba'), []);
  const acledaIcon = useMemo(() => config.assets.getImageUrl('acleda'), []);
  
  // Memoized click handler to prevent unnecessary re-renders
  const handleButtonClick = useCallback((buttonId, href, event) => {
    if (isExpired || !isOnline || paymentInProgress) {
      event.preventDefault();
      const reason = isExpired ? 'expired' : !isOnline ? 'offline' : 'payment in progress';
      console.log(`Action blocked: Button (${buttonId}) clicked when ${reason}.`);
      return;
    }
    
    console.log(`Action initiated: Button (${buttonId}) clicked. Href: ${href}`);
    
    // Notify payment start
    if (onPaymentStart) {
      onPaymentStart();
    }
    
    // Simulate payment success after a delay (in real app, this would be triggered by payment confirmation)
    // This is just for demonstration - remove in production
    if (onPaymentSuccess) {
      setTimeout(() => {
        onPaymentSuccess({ buttonId, amount: 5.00 }); // Mock payment data
      }, 2000); // Simulate 2 second payment processing
    }
  }, [isExpired, isOnline, paymentInProgress, onPaymentSuccess, onPaymentStart]);
  
  // Memoized button state to reduce computation
  const isButtonDisabled = useMemo(() => 
    isExpired || !isOnline || paymentInProgress, 
    [isExpired, isOnline, paymentInProgress]
  );

  return (
    <>
      {/* Instructions */}
      <div className="instructions">
        <div className="scan-text">SCAN TO PAY</div>
        <div className="or-text">OR</div>
      </div>

      {/* Open ABA Scanner Button */}
      {isButtonDisabled ? (
        <button
          id="open-aba-scanner-btn"
          className={`bank-scanner-link ${isButtonDisabled ? 'disabled' : ''}`}
          aria-label={`Pay with ABA Bank ${isButtonDisabled ? '(Disabled)' : ''}`}
          onClick={(e) => handleButtonClick('open-aba-scanner-btn', abaUrl, e)}
          disabled={isButtonDisabled}
          type="button"
        >
          <img className="bank-icon" src={abaIcon} alt="ABA Bank Icon" loading="lazy" />
          <span>ABA PAY</span>
        </button>
      ) : (
        <a
          id="open-aba-scanner-btn"
          className="bank-scanner-link"
          href={abaUrl}
          aria-label="Pay with ABA Bank"
          onClick={(e) => handleButtonClick('open-aba-scanner-btn', abaUrl, e)}
        >
          <img className="bank-icon" src={abaIcon} alt="ABA Bank Icon" loading="lazy" />
          <span>ABA PAY</span>
        </a>
      )}

      {/* Open ACLEDA Scanner Button */}
      {isButtonDisabled ? (
        <button
          id="open-acleda-scanner-btn"
          className={`bank-scanner-link ${isButtonDisabled ? 'disabled' : ''}`}
          aria-label={`Pay with ACLEDA Bank ${isButtonDisabled ? '(Disabled)' : ''}`}
          onClick={(e) => handleButtonClick('open-acleda-scanner-btn', acledaUrl, e)}
          disabled={isButtonDisabled}
          type="button"
        >
          <img className="bank-icon" src={acledaIcon} alt="ACLEDA Bank Icon" loading="lazy" />
          <span>ACLEDA PAY</span>
        </button>
      ) : (
        <a
          id="open-acleda-scanner-btn"
          className="bank-scanner-link"
          href={acledaUrl}
          aria-label="Pay with ACLEDA Bank"
          onClick={(e) => handleButtonClick('open-acleda-scanner-btn', acledaUrl, e)}
        >
          <img className="bank-icon" src={acledaIcon} alt="ACLEDA Bank Icon" loading="lazy" />
          <span>ACLEDA PAY</span>
        </a>
      )}
    </>
  );
});

export default PaymentButtons;
