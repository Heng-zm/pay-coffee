import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import config from '../config/config';
import { fetchSupporters, readSupportersCache } from '../services/telegramService';

const DonationsList = ({ isOnline }) => {
  const initialSupportersRef = useRef(null);
  if (initialSupportersRef.current === null) {
    initialSupportersRef.current = readSupportersCache();
  }

  const [donations, setDonations] = useState(() => initialSupportersRef.current);
  const [loading, setLoading] = useState(() => initialSupportersRef.current.length === 0);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);
  const abortControllerRef = useRef(null);
  const mountedRef = useRef(true);

  const stopCurrentRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const loadDonations = useCallback(async ({ silent = false } = {}) => {
    if (!isOnline) {
      if (!silent) setLoading(false);
      setError('You are offline. Supporters will refresh when connection returns.');
      return;
    }

    stopCurrentRequest();

    const controller = new AbortController();
    abortControllerRef.current = controller;

    if (!silent) setLoading(true);

    try {
      const supporters = await fetchSupporters({ signal: controller.signal, allowCache: true });

      if (!mountedRef.current) return;
      setDonations(supporters);
      setError(null);
      setLoading(false);
    } catch (err) {
      if (err.name === 'AbortError') return;

      console.error('Error loading supporters:', err);
      if (!mountedRef.current) return;

      const cached = readSupportersCache();
      if (cached.length > 0) {
        setDonations(cached);
        setError(null);
      } else {
        setDonations([]);
        setError('Failed to load supporters');
      }
      setLoading(false);
    }
  }, [isOnline, stopCurrentRequest]);

  useEffect(() => {
    mountedRef.current = true;
    loadDonations({ silent: donations.length > 0 });

    return () => {
      mountedRef.current = false;
      stopCurrentRequest();
    };
    // Initial donations length is intentionally not a dependency; it only controls first render loading UI.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadDonations, stopCurrentRequest]);

  useEffect(() => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!isOnline) return undefined;

    intervalRef.current = window.setInterval(() => {
      loadDonations({ silent: true });
    }, config.app.refreshInterval);

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [loadDonations, isOnline]);

  const totalAmount = useMemo(() => (
    donations.reduce((sum, donation) => sum + donation.amount, 0)
  ), [donations]);

  const donationItems = useMemo(() => (
    donations.map((donation, index) => {
      const itemNumber = index + 1;
      const formattedAmount = `$${donation.amount.toFixed(2)}`;
      const safeName = donation.name;
      const popupId = `supporter-popup-${donation.id || index}`;
      const key = donation.id || `${safeName}-${donation.amount}-${index}`;

      return (
        <li key={key} className="donor-item" style={{ '--item-index': index }}>
          <span className="donor-rank">#{itemNumber}</span>
          <span
            className="donor-name"
            tabIndex={0}
            aria-describedby={popupId}
          >
            {safeName}
            <span className="supporter-popup" id={popupId} role="tooltip">
              <span className="popup-supporter-name">{safeName}</span>
              <span className="popup-supporter-amount">{formattedAmount}</span>
            </span>
          </span>
          <span className="donation-amount">{formattedAmount}</span>
        </li>
      );
    })
  ), [donations]);

  return (
    <section id="supporter-list-section" className="donations-list-section animate-in" aria-label="Supporter list">
      <div className="donations-header">
        <div>
          <span className="section-kicker">Community</span>
          <h3 className="donations-list-title">THANKS FOR SUPPORT</h3>
        </div>
        <div className="supporter-stats" aria-label="Supporter summary">
          <strong>{donations.length}</strong>
          <span>${totalAmount.toFixed(2)}</span>
        </div>
      </div>

      {loading && donations.length === 0 && (
        <p id="no-donations-message" className="no-donations-message" role="status">
          Loading supporters...
        </p>
      )}

      {!loading && donations.length === 0 && (
        <p id="no-donations-message" className="no-donations-message">
          {error || 'No donations yet. Be the first!'}
        </p>
      )}

      {donations.length > 0 && (
        <ul id="donors-list" className="donors-list">
          {donationItems}
        </ul>
      )}
    </section>
  );
};

export default DonationsList;
