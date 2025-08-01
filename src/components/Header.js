import React from 'react';

const Header = React.memo(({ isOnline, onReset }) => {
  return (
    <header className="header">
      <div className="header-left">
        <span className="header-brand">OZO. DESIGNER</span>
        {!isOnline && (
          <span className="offline-indicator" title="No internet connection">
            📶❌
          </span>
        )}
      </div>
      
      <div className="header-right">
        <span className="header-khqr-logo">KHQR</span>
      </div>
    </header>
  );
});

Header.displayName = 'Header';

export default Header;
