import React, { useCallback, useMemo, useState } from 'react';
import config from '../config/config';

const BankIcon = React.memo(({ src, fallback, alt }) => {
  const [failed, setFailed] = useState(false);

  return (
    <span className="bank-icon-wrap" aria-hidden="true">
      {src && !failed && (
        <img
          className="bank-icon"
          src={src}
          alt={alt}
          width="30"
          height="30"
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
        />
      )}
      {(failed || !src) && <span className="bank-icon-fallback">{fallback}</span>}
    </span>
  );
});

BankIcon.displayName = 'BankIcon';

const PaymentButtons = React.memo(({ onPaymentStart, paymentInProgress, isOnline }) => {
  const banks = useMemo(() => ([
    {
      id: 'open-aba-scanner-btn',
      className: 'aba-pay-btn',
      name: 'ABA PAY',
      method: 'ABA',
      helper: 'Open ABA app',
      url: config.payment?.aba?.url || '',
      icon: config.assets?.getImageUrl?.('aba') || '/aba.PNG',
      fallback: 'ABA',
      alt: 'ABA Bank Icon',
    },
    {
      id: 'open-acleda-scanner-btn',
      className: 'acleda-pay-btn',
      name: 'ACLEDA PAY',
      method: 'ACLEDA',
      helper: 'Open ACLEDA app',
      url: config.payment?.acleda?.fullUrl || '',
      icon: config.assets?.getImageUrl?.('acleda') || '/acleda.PNG',
      fallback: 'A',
      alt: 'ACLEDA Bank Icon',
    },
    {
      id: 'open-wing-scanner-btn',
      className: 'wing-pay-btn',
      name: 'WING PAY',
      method: 'Wing Bank',
      helper: 'Open Wing app',
      url: config.payment?.wing?.url || '',
      icon: config.assets?.getImageUrl?.('wing') || '/wing.png',
      fallback: 'W',
      alt: 'Wing Bank Icon',
    },
  ]), []);

  const renderButtonContent = useCallback((bank) => (
    <>
      <BankIcon src={bank.icon} fallback={bank.fallback} alt={bank.alt} />
      <span className="bank-button-text">
        <strong>{bank.name}</strong>
        <small>{bank.helper}</small>
      </span>
      <span className="button-arrow" aria-hidden="true">›</span>
    </>
  ), []);

  const renderDisabledButton = useCallback((bank, reason) => (
    <button
      key={bank.id}
      id={bank.id}
      className={`bank-scanner-link ${bank.className} disabled`}
      aria-label={`Pay with ${bank.method} (${reason})`}
      disabled
      type="button"
    >
      {renderButtonContent(bank)}
    </button>
  ), [renderButtonContent]);

  const getDisabledReason = useCallback((bank) => {
    if (!isOnline) return 'Offline';
    if (paymentInProgress) return 'Payment app opening';
    if (!bank.url) return 'Link not configured';
    return '';
  }, [isOnline, paymentInProgress]);

  const handleButtonClick = useCallback((bank) => {
    onPaymentStart?.({ method: bank.method });
  }, [onPaymentStart]);

  return (
    <div className="payment-actions">
      <div className="instructions">
        <div className="scan-text">SCAN TO PAY</div>
        <div className="or-text">OR OPEN BANK APP</div>
      </div>

      <div className="payment-button-grid">
        {banks.map((bank) => {
          const disabledReason = getDisabledReason(bank);

          if (disabledReason) {
            return renderDisabledButton(bank, disabledReason);
          }

          return (
            <a
              key={bank.id}
              id={bank.id}
              className={`bank-scanner-link ${bank.className}`}
              href={bank.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Pay with ${bank.method}`}
              onClick={() => handleButtonClick(bank)}
            >
              {renderButtonContent(bank)}
            </a>
          );
        })}
      </div>
    </div>
  );
});

PaymentButtons.displayName = 'PaymentButtons';

export default PaymentButtons;
