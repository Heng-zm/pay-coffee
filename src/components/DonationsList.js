import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import config from '../config/config';

const DonationsList = ({ isExpired, isOnline }) => {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Load donations function that can be called multiple times
  const loadDonations = useCallback(async () => {
    // Don't fetch if offline
    if (!isOnline) {
      return;
    }

    // Abort previous request if still in progress
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    // Use API endpoint if available, fallback to local file
    const jsonUrl = config.api.endpoints.donations.startsWith('/api') 
      ? config.api.buildUrl(config.api.endpoints.donations)
      : 'supporters.json';
    try {
      const response = await fetch(jsonUrl, {
        signal: abortControllerRef.current.signal
      });
      
      if (!response.ok) {
        console.warn(`Failed to fetch ${jsonUrl}: ${response.status} ${response.statusText}.`);
        if (response.status === 404) {
        } else {
          console.error(`Server error ${response.status} fetching supporters file.`);
        }
        setDonations([]);
        setError('Failed to load supporters');
        setLoading(false);
        return;
      }
      
      const data = await response.json();
      if (!Array.isArray(data)) {
        console.error(`Data from ${jsonUrl} is not an array.`, data);
        setDonations([]);
        setError('Invalid data format');
        setLoading(false);
        return;
      }
      
      // Sort by amount (highest first)
      const sortedData = [...data].sort((a, b) => b.amount - a.amount);
      setDonations(sortedData);
      setError(null);
      setLoading(false);
      
    } catch (error) {
      if (error.name === 'AbortError') {
        return;
      }
      console.error('Error loading or parsing donations:', error);
      setDonations([]);
      setError('Failed to load supporters');
      setLoading(false);
    }
  }, [isOnline]);

  // Initial load
  useEffect(() => {
    loadDonations();
  }, [loadDonations]);

  // Set up periodic refresh to check for new donations
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      loadDonations();
    }, config.app.refreshInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [loadDonations]);

  const renderDonationItem = useCallback((donation, index) => {
    if (!donation || typeof donation.name !== 'string' || typeof donation.amount !== 'number') {
      console.warn("Skipping invalid donation data:", donation);
      return null;
    }

    const itemNumber = index + 1;
    const formattedAmount = `$${donation.amount.toFixed(2)}`;
    const popupId = `supporter-popup-${index}`;

    return (
      <li key={index} className="donor-item">
        <span className="donor-item-number">{itemNumber}.</span>
        <span 
          className="donor-name"
          tabIndex={isExpired ? -1 : 0}
          role="button"
          aria-describedby={popupId}
        >
          {donation.name}
          <div className="supporter-popup" id={popupId} role="tooltip">
            <span className="popup-supporter-name">{donation.name}</span>
            <span className="popup-supporter-amount">{formattedAmount}</span>
          </div>
        </span>
        <span className="donation-amount">{formattedAmount}</span>
      </li>
    );
  }, [isExpired]);

  // Memoize the donation items to prevent unnecessary re-renders
  const donationItems = useMemo(() => {
    return donations.map((donation, index) => renderDonationItem(donation, index));
  }, [donations, renderDonationItem]);

  return (
    <section id="supporter-list-section" className="donations-list-section animate-in">
      <h3 className="donations-list-title">THANKS FOR SUPPORT</h3>
      
      {loading && (
        <p id="no-donations-message" className="no-donations-message">
          Loading supporters...
        </p>
      )}
      
      {!loading && donations.length === 0 && (
        <p id="no-donations-message" className="no-donations-message">
          {error || "No donations yet. Be the first!"}
        </p>
      )}
      
      {!loading && donations.length > 0 && (
        <ul id="donors-list" className="donors-list">
          {donationItems}
        </ul>
      )}
    </section>
  );
};

export default DonationsList;
