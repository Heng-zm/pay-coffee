import React, { useMemo, useState } from 'react';
import config from '../config/config';

const QRCode = React.memo(() => {
  const [imageFailed, setImageFailed] = useState(false);
  const qrCodeUrl = useMemo(() => config.assets.getImageUrl('qr'), []);

  return (
    <div className="qr-code-container">
      <div className="qr-glow" aria-hidden="true" />
      {qrCodeUrl && !imageFailed ? (
        <img
          className="qr-code-img"
          src={qrCodeUrl}
          alt="Payment QR code"
          width="360"
          height="360"
          fetchPriority="high"
          loading="eager"
          decoding="sync"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <div className="qr-fallback-card" role="img" aria-label="KHQR payment QR placeholder">
          <div>
            <strong>KHQR</strong>
            <span>Add your QR image as public/qr.PNG</span>
          </div>
        </div>
      )}
      <div className="qr-overlay" aria-hidden="true">$</div>
    </div>
  );
});

QRCode.displayName = 'QRCode';

export default QRCode;
