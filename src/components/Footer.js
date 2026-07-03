import React from 'react';
import config from '../config/config';

const CONTACT_ITEMS = [
  {
    key: 'facebook',
    href: config.social?.facebook || '#',
    icon: config.assets?.getImageUrl?.('facebook') || '/facebook.png',
    alt: 'Facebook',
    label: 'Facebook',
    fallback: 'f',
  },
  {
    key: 'telegramBot',
    href: config.social?.telegramBot || '#',
    icon: config.assets?.getImageUrl?.('telegramBot') || '/telegram-bot.png',
    alt: 'Telegram Bot',
    label: 'Telegram Bot',
    fallback: '🤖',
  },
  {
    key: 'telegramChannel',
    href: config.social?.telegramChannel || '#',
    icon: config.assets?.getImageUrl?.('telegramChannel') || '/telegram-channel.png',
    alt: 'Telegram Channel',
    label: 'Telegram Channel',
    fallback: '📣',
  },
  {
    key: 'telegramPersonal',
    href: config.social?.telegramPersonal || 'https://t.me/m11mmm112',
    icon: config.assets?.getImageUrl?.('telegramPersonal') || '/telegram-personal.png',
    alt: 'Telegram Personal Account',
    label: 'Telegram Personal Account',
    fallback: '👤',
  },
  {
    key: 'behance',
    href: config.social?.behance || 'https://www.behance.net/anhheng',
    icon: config.assets?.getImageUrl?.('behance') || '/behance.png',
    alt: 'Behance',
    label: 'Behance',
    fallback: 'Be',
  },
];

const isRealLink = (href) => Boolean(href && href !== '#');

const FooterIcon = ({ item }) => {
  const [imageFailed, setImageFailed] = React.useState(false);
  const enabled = isRealLink(item.href);
  const className = `contact-icon-link ${item.key === 'behance' ? 'behance-link' : ''} ${!enabled ? 'is-disabled' : ''}`;

  const content = (
    <>
      {!imageFailed && item.icon ? (
        <img
          src={item.icon}
          alt=""
          aria-hidden="true"
          className="contact-icon-img"
          loading="lazy"
          decoding="async"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <span className="contact-icon-fallback" aria-hidden="true">{item.fallback}</span>
      )}
      <span className="sr-only">{item.label}</span>
    </>
  );

  if (!enabled) {
    return (
      <span
        className={className}
        aria-label={`${item.label} link not configured`}
        title={`${item.label} link not configured`}
        aria-disabled="true"
      >
        {content}
      </span>
    );
  }

  return (
    <a
      href={item.href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      aria-label={item.label}
      title={item.label}
    >
      {content}
    </a>
  );
};

const Footer = React.memo(() => {
  return (
    <footer className="footer-social icon-only-footer">
      <div className="footer-label">Contact</div>
      <div className="footer-links icon-only-links">
        {CONTACT_ITEMS.map((item) => (
          <FooterIcon key={item.key} item={item} />
        ))}
      </div>
    </footer>
  );
});

Footer.displayName = 'Footer';

export default Footer;
