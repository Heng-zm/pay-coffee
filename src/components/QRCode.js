import React, { useState, useCallback, useMemo } from 'react';
import config from '../config/config';

const QRCode = React.memo(({ isExpired }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
    setImageError(false);
  }, []);

  const handleImageError = useCallback(() => {
    setImageError(true);
    setImageLoaded(false);
    console.error('Failed to load QR code image');
  }, []);

  const qrImageUrl = useMemo(() => config.assets.getImageUrl('qr'), []);
  
  const containerClass = useMemo(() => 
    `qr-code-container ${imageLoaded ? 'loaded' : ''} ${isExpired ? 'expired' : ''} ${imageError ? 'error' : ''}`,
    [imageLoaded, isExpired, imageError]
  );

  return (
    <div className={containerClass} title="Scan QR Code">
      {!imageLoaded && !imageError && (
        <div className="qr-loading">
          <div className="qr-skeleton"></div>
          <span>Loading QR Code...</span>
        </div>
      )}
      
      {imageError ? (
        <div className="qr-error">
          <span>❌ QR Code unavailable</span>
        </div>
      ) : (
        <>
          <img 
            src={qrImageUrl}
            alt="ABA KHQR Code for Donation to Ozo. Designer"
            className="qr-code-img"
            id="qr-code"
            loading="lazy"
            onLoad={handleImageLoad}
            onError={handleImageError}
            style={{ opacity: imageLoaded ? 1 : 0 }}
          />
          {imageLoaded && (
            <div className="qr-overlay">
              <span>$</span>
            </div>
          )}
        </>
      )}
    </div>
  );
});

QRCode.displayName = 'QRCode';

export default QRCode;
