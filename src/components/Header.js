import React from 'react';
import config from '../config/config';

const Header = React.memo(({ isOnline }) => {
  const stickerSrc = config.assets?.getImageUrl?.('moneySticker') || '/money.png';

  return (
    <header className="header no-timer-header">
      <div className="header-main">
        <div className="header-brand-block">
          <span className="header-eyebrow">Donation Page</span>
          <span className="header-brand">OZO. DESIGNER</span>
          <span className="header-khqr-logo">KHQR</span>
        </div>

        <div className="header-right-zone">
          {!isOnline && (
            <span className="offline-indicator" title="No internet connection" aria-label="Offline">
              Offline
            </span>
          )}

          <img
            src={stickerSrc}
            alt=""
            className="header-money-sticker"
            aria-hidden="true"
            loading="lazy"
            decoding="async"
            width="112"
            height="112"
            onError={(event) => {
              event.currentTarget.style.display = 'none';
            }}
          />
        </div>
      </div>
    </header>
  );
});

Header.displayName = 'Header';

export default Header;
