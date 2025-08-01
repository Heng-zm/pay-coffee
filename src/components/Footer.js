import React from 'react';
import config from '../config/config';

const Footer = React.memo(({ isExpired }) => {
  return (
    <footer className="footer-social">
      <a
        href="https://t.me/m11mmm112"
        target="_blank"
        rel="noopener noreferrer"
        className="social-link telegram-link"
        aria-label="Join Ozo. Designer's Telegram channel"
      >
        <img 
          src={config.assets.getImageUrl('telegram')} 
          alt="Telegram Icon" 
          loading="lazy"
        />
        <span>Join on Telegram</span>
      </a>
      <a
        href="https://www.behance.net/anhheng"
        target="_blank"
        rel="noopener noreferrer"
        className="social-link behance-link"
        aria-label="View Ozo. Designer's Behance Profile"
      >
        <img 
          src={config.assets.getImageUrl('behance')} 
          alt="Behance Icon" 
          loading="lazy"
        />
        <span>View on Behance</span>
      </a>
    </footer>
  );
});

Footer.displayName = 'Footer';

export default Footer;

