import React, { useState, useEffect, useRef, useCallback } from 'react';

const DEFAULT_SECONDS = 10 * 60 + 53;

const formatSeconds = (totalSeconds) => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const Timer = ({ initialTime = '10:53', onExpired }) => {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [isExpired, setIsExpired] = useState(false);
  const intervalRef = useRef(null);
  const totalSecondsRef = useRef(0);
  const hasExpiredRef = useRef(false);

  const parseTime = useCallback((timeString) => {
    if (typeof timeString !== 'string') {
      console.warn('Timer initialTime must be a MM:SS string. Using default 10:53.');
      return DEFAULT_SECONDS;
    }

    const parts = timeString.trim().split(':');
    if (parts.length !== 2) {
      console.warn(`Could not parse time string "${timeString}". Using default 10:53.`);
      return DEFAULT_SECONDS;
    }

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

    console.warn(`Invalid time string "${timeString}". Use MM:SS with seconds from 00 to 59. Using default 10:53.`);
    return DEFAULT_SECONDS;
  }, []);

  const handleExpiration = useCallback(() => {
    if (hasExpiredRef.current) return;
    hasExpiredRef.current = true;
    setIsExpired(true);
    setTimeLeft('Expired');
    if (onExpired) {
      onExpired();
    }
  }, [onExpired]);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    hasExpiredRef.current = false;
    totalSecondsRef.current = parseTime(initialTime);

    if (totalSecondsRef.current <= 0) {
      handleExpiration();
      return undefined;
    }

    setIsExpired(false);
    setTimeLeft(formatSeconds(totalSecondsRef.current));

    intervalRef.current = setInterval(() => {
      totalSecondsRef.current -= 1;

      if (totalSecondsRef.current <= 0) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        handleExpiration();
        return;
      }

      setTimeLeft(formatSeconds(totalSecondsRef.current));
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [initialTime, parseTime, handleExpiration]);

  return (
    <div className={`timer ${isExpired ? 'expired' : ''}`}>
      <span className="timer-icon" aria-hidden="true" />
      <span id="time-left" aria-live="polite" aria-atomic="true">
        {timeLeft}
      </span>
    </div>
  );
};

export default Timer;
