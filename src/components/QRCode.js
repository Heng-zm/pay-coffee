import React, { useMemo } from 'react';
import config from '../config/config';

const QRCode = React.memo(({ isExpired }) => {
  // Memoize the QR Code URL to prevent recalculation
  const qrCodeUrl = useMemo(() => config.assets.getImageUrl('qr'), []);

  return (
    <div className="qr-code-container">
      {/* OPTIMIZED IMAGE: fetchpriority="high" forces this to load instantly. No loading="lazy" here! */}
      <img 
        className="qr-code-img" 
        src={qrCodeUrl} 
        alt="Scan to pay QR Code" 
        width="250" 
        height="250" 
        fetchpriority="high" 
        decoding="sync"
      />
      
      {/* Overlay for KHQR or currency icon (defined in your CSS) */}
      <div className="qr-overlay">
        <span>$</span>
      </div>
    </div>
  );
});

export default QRCode;
