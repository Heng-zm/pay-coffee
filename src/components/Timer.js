import React, { useCallback, useEffect, useRef, useState } from 'react';

const DEFAULT_SECONDS = 10 * 60 + 53;

const formatSeconds = (totalSeconds) => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const parseTimeString = (timeString) => {
  if (typeof timeString !== 'string') return DEFAULT_SECONDS;

  const parts = timeString.trim().split(':');
  if (parts.length !== 2) return DEFAULT_SECONDS;

  const minutes = Number(parts[0]);
  const seconds = Number(parts[1]);

  if (
    Number.isInteger(minutes) &&
    Number.isInteger(seconds) &&
    minutes >= 0 &&
    seconds >= 0 &&
    seconds < 60
  ) {
    return minutes * 60 + seconds;
  }

  return DEFAULT_SECONDS;
};

const Timer = ({ initialTime = '10:53', onExpired }) => {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [isExpired, setIsExpired] = useState(false);
  const intervalRef = useRef(null);
  const totalSecondsRef = useRef(0);
  const hasExpiredRef = useRef(false);

  const handleExpiration = useCallback(() => {
    if (hasExpiredRef.current) return;

    hasExpiredRef.current = true;
    setIsExpired(true);
    setTimeLeft('Expired');
    onExpired?.();
  }, [onExpired]);

  useEffect(() => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    hasExpiredRef.current = false;
    totalSecondsRef.current = parseTimeString(initialTime);

    if (totalSecondsRef.current <= 0) {
      handleExpiration();
      return undefined;
    }

    setIsExpired(false);
    setTimeLeft(formatSeconds(totalSecondsRef.current));

    intervalRef.current = window.setInterval(() => {
      totalSecondsRef.current -= 1;

      if (totalSecondsRef.current <= 0) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
        handleExpiration();
        return;
      }

      setTimeLeft(formatSeconds(totalSecondsRef.current));
    }, 1000);

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [initialTime, handleExpiration]);

  return (
    <div className={`timer ${isExpired ? 'expired' : ''}`} role="timer" aria-live="polite" aria-atomic="true">
      <span className="timer-icon" aria-hidden="true" />
      <span id="time-left">{timeLeft}</span>
    </div>
  );
};

export default Timer;
