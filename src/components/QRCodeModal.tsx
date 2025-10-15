import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'react-qr-code';
import { X, Link as LinkIcon, Download } from 'lucide-react';
import { toDataURL } from 'qrcode';

interface QRCodeModalProps {
  url: string;
  title?: string;
  onClose: () => void;
  logoUrl?: string;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({ url, title = 'Scan to open', onClose, logoUrl }) => {
  const qrWrapRef = useRef<HTMLDivElement | null>(null);
  const [resolvedLogo, setResolvedLogo] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;
    const src = logoUrl || '/py.png';
    // Preload logo as data URL for CORS-safe html2canvas capture
    const load = async () => {
      try {
        const resp = await fetch(src, { mode: 'cors' });
        const blob = await resp.blob();
        const reader = new FileReader();
        const dataUrl: string = await new Promise((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
        if (isActive) setResolvedLogo(dataUrl);
      } catch {
        if (isActive) setResolvedLogo(null);
      }
    };
    load();
    return () => {
      isActive = false;
    };
  }, [logoUrl]);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      // Optional: toast
    } catch (e) {
      console.error('Failed to copy link', e);
    }
  };

  const handleDownload = async () => {
    try {
      // Create a crisp, high-res QR PNG and compose the logo on a canvas.
      const size = 1024; // final image resolution
      const margin = 12; // quiet zone
      const qrDataUrl = await toDataURL(url, {
        width: size,
        margin,
        errorCorrectionLevel: 'H',
      });

      // Prepare canvas
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas not supported');

      // Draw white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, size, size);

      // Draw QR image
      const qrImg = new Image();
      qrImg.crossOrigin = 'anonymous';
      const loadImage = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      });

      const drawRoundedRect = (x: number, y: number, w: number, h: number, r: number) => {
        const radius = Math.min(r, w / 2, h / 2);
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + w - radius, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
        ctx.lineTo(x + w, y + h - radius);
        ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
        ctx.lineTo(x + radius, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
      };

      const qrImage = await loadImage(qrDataUrl);
      ctx.drawImage(qrImage, 0, 0, size, size);

      // Draw logo badge (about 22% of QR size)
      const badgeSize = Math.round(size * 0.22);
      const badgeX = Math.round((size - badgeSize) / 2);
      const badgeY = Math.round((size - badgeSize) / 2);

      // White rounded background
      drawRoundedRect(badgeX, badgeY, badgeSize, badgeSize, Math.round(badgeSize * 0.25));
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      // Optional white ring
      ctx.lineWidth = Math.max(8, Math.round(size * 0.008));
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      // Draw logo image inside rounded mask
      const logoSrc = resolvedLogo || logoUrl || '/py.png';
      if (logoSrc) {
        try {
          const logoImg = await loadImage(logoSrc);
          const padding = Math.round(badgeSize * 0.12); // keep safe quiet zone around logo
          const logoW = badgeSize - padding * 2;
          const logoH = badgeSize - padding * 2;
          // Clip to rounded rect then draw
          ctx.save();
          drawRoundedRect(badgeX + padding, badgeY + padding, logoW, logoH, Math.round(logoW * 0.2));
          ctx.clip();
          // Center-fit contain
          const ratio = Math.min(logoW / logoImg.width, logoH / logoImg.height);
          const drawW = Math.round(logoImg.width * ratio);
          const drawH = Math.round(logoImg.height * ratio);
          const dx = Math.round(badgeX + padding + (logoW - drawW) / 2);
          const dy = Math.round(badgeY + padding + (logoH - drawH) / 2);
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(logoImg, dx, dy, drawW, drawH);
          ctx.restore();
        } catch (e) {
          // If logo fails, continue with plain QR + badge
          console.warn('Logo draw failed, using plain QR', e);
        }
      }

      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = 'qr-code.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      console.error('Failed to download QR code', e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-white/10 shadow-2xl overflow-hidden">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 p-2 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 text-center">
          <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
          <p className="text-slate-400 text-sm break-all mb-6">{url}</p>
          <div className="mx-auto w-full flex items-center justify-center bg-white p-4 rounded-xl">
            <div ref={qrWrapRef} className="relative bg-white p-2 rounded w-64 h-64">
              <QRCode
                value={url}
                size={256}
                bgColor="#ffffff"
                fgColor="#000000"
                level="H"
                style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
              />
              {/* Center logo overlay with white safety border for scannability */}
              <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-2xl flex items-center justify-center bg-white overflow-hidden w-[22%] h-[22%] ring-8 ring-white shadow-md" aria-hidden>
                {(resolvedLogo || logoUrl) && (
                  <img
                    src={resolvedLogo || logoUrl}
                    alt="Logo"
                    className="object-contain w-[80%] h-[80%]"
                    referrerPolicy="no-referrer"
                    crossOrigin="anonymous"
                    loading="eager"
                  />
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600/20 text-blue-300 hover:bg-blue-600/30"
            >
              <LinkIcon className="w-4 h-4" /> Copy Link
            </button>
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600/20 text-purple-300 hover:bg-purple-600/30"
            >
              <Download className="w-4 h-4" /> Download PNG
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRCodeModal;
