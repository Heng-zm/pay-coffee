import React, { useMemo } from 'react';

const SYMBOLS = ['$', '៛'];
const DEFAULT_MONEY_COUNT = 22;
const TABLET_MONEY_COUNT = 16;
const MOBILE_MONEY_COUNT = 10;

const randomBetween = (min, max) => Math.random() * (max - min) + min;
const randomPick = (items) => items[Math.floor(Math.random() * items.length)];

const getAnimationPreference = () => {
  if (typeof window === 'undefined') return { disabled: false, count: DEFAULT_MONEY_COUNT };

  const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  const saveData = Boolean(navigator?.connection?.saveData);

  if (prefersReducedMotion || saveData) {
    return { disabled: true, count: 0 };
  }

  if (window.innerWidth <= 390) return { disabled: false, count: MOBILE_MONEY_COUNT };
  if (window.innerWidth <= 700) return { disabled: false, count: TABLET_MONEY_COUNT };

  return { disabled: false, count: DEFAULT_MONEY_COUNT };
};

const createMoneyItems = (count) => (
  Array.from({ length: count }, (_, index) => {
    const size = Math.round(randomBetween(12, 26));
    const duration = randomBetween(13, 26).toFixed(2);
    const delay = randomBetween(-26, 0).toFixed(2);
    const drift = Math.round(randomBetween(-44, 44));
    const rotate = Math.round(randomBetween(-160, 160));
    const opacity = randomBetween(0.08, 0.22).toFixed(2);
    const blur = randomBetween(0, 0.5).toFixed(2);

    return {
      id: `money-${index}`,
      symbol: randomPick(SYMBOLS),
      left: `${randomBetween(-4, 104).toFixed(2)}%`,
      size: `${size}px`,
      duration: `${duration}s`,
      delay: `${delay}s`,
      drift: `${drift}px`,
      rotate: `${rotate}deg`,
      opacity,
      blur: `${blur}px`,
    };
  })
);

const MoneyRain = React.memo(() => {
  const { disabled, count } = useMemo(getAnimationPreference, []);
  const items = useMemo(() => createMoneyItems(count), [count]);

  if (disabled || items.length === 0) return null;

  return (
    <div className="money-rain optimized-money-rain" aria-hidden="true">
      {items.map((item) => (
        <span
          key={item.id}
          className="money-flake optimized-money-flake"
          style={{
            '--money-left': item.left,
            '--money-size': item.size,
            '--money-duration': item.duration,
            '--money-delay': item.delay,
            '--money-drift': item.drift,
            '--money-rotate': item.rotate,
            '--money-opacity': item.opacity,
            '--money-blur': item.blur,
          }}
        >
          {item.symbol}
        </span>
      ))}
    </div>
  );
});

MoneyRain.displayName = 'MoneyRain';

export default MoneyRain;
