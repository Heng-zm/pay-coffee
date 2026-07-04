import React, { useMemo } from 'react';
import config from '../config/config';

const DonationsList = () => {
  const donations = useMemo(() => (
    [...(config.app?.supporters || [])]
      .sort((a, b) => Number(b.amount || 0) - Number(a.amount || 0))
      .slice(0, config.app?.maxSupporters || 100)
  ), []);

  const totalAmount = useMemo(() => (
    donations.reduce((sum, donation) => sum + Number(donation.amount || 0), 0)
  ), [donations]);

  const donationItems = useMemo(() => (
    donations.map((donation, index) => {
      const itemNumber = index + 1;
      const amount = Number(donation.amount || 0);
      const formattedAmount = `$${amount.toFixed(2)}`;
      const safeName = donation.name;
      const popupId = `supporter-popup-${donation.id || index}`;
      const key = donation.id || `${safeName}-${amount}-${index}`;

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

  if (!config.app?.showSupporters) {
    return null;
  }

  return (
    <section id="supporter-list-section" className="donations-list-section animate-in" aria-label="Supporter list">
      <div className="donations-header">
        <div>
          <span className="section-kicker">Community</span>
          <h2 className="donations-list-title">THANKS FOR SUPPORT</h2>
        </div>
        <div className="supporter-stats" aria-label="Supporter summary">
          <strong>{donations.length}</strong>
          <span>${totalAmount.toFixed(2)}</span>
        </div>
      </div>

      {donations.length === 0 ? (
        <p id="no-donations-message" className="no-donations-message">
          No donations yet. Be the first!
        </p>
      ) : (
        <ul id="donors-list" className="donors-list">
          {donationItems}
        </ul>
      )}
    </section>
  );
};

export default DonationsList;
