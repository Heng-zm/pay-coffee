import React, { useState, useEffect, useRef, useCallback } from 'react';

const Timer = ({ initialTime = '10:53', onExpired }) => {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [isExpired, setIsExpired] = useState(false);
  const intervalRef = useRef(null);
  const totalSecondsRef = useRef(0);

  const parseTime = useCallback((timeString) => {
    const parts = timeString.split(':');
    if (parts.length === 2) {
      const minutes = parseInt(parts[0], 10);
      const seconds = parseInt(parts[1], 10);
      if (!isNaN(minutes) && !isNaN(seconds)) {
        return minutes * 60 + seconds;
      }
    }
    console.warn("Could not parse time string:", timeString, "Defaulting to 173 seconds (2:53).");
    return 173;
  }, []);

  const handleExpiration = useCallback(() => {
    setIsExpired(true);
    setTimeLeft('Expired');
    if (onExpired) {
      onExpired();
    }
  }, [onExpired]);

  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    totalSecondsRef.current = parseTime(initialTime);
    
    if (totalSecondsRef.current <= 0) {
      handleExpiration();
      return;
    }

    // Reset expired state if timer is restarted
    setIsExpired(false);

    intervalRef.current = setInterval(() => {
      totalSecondsRef.current -= 1;
      
      if (totalSecondsRef.current <= 0) {
        clearInterval(intervalRef.current);
        handleExpiration();
        return;
      }
      
      const minutes = Math.floor(totalSecondsRef.current / 60);
      const seconds = totalSecondsRef.current % 60;
      setTimeLeft(`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [initialTime, parseTime, handleExpiration]);

  return (
    <div className={`timer ${isExpired ? 'expired' : ''}`}>
      <span className="timer-icon"></span>
      <span id="time-left" aria-live="polite" aria-atomic="true">
        {timeLeft}
      </span>
    </div>
  );
};

export default Timer;
