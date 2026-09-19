import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { 
  Copy, 
  Check, 
  RefreshCw, 
  X, 
  Clock, 
  Share2, 
  ExternalLink,
  Smartphone
} from 'lucide-react';
import { SessionData } from '../types.ts';

interface PairingCardProps {
  session: SessionData;
  onRefresh: () => void;
  onCancel: () => void;
  theme: 'dark' | 'light';
}

export const PairingCard: React.FC<PairingCardProps> = ({
  session,
  onRefresh,
  onCancel,
  theme,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const getJoinUrl = () => {
    try {
      const url = new URL(window.location.href);
      url.search = `?join=${encodeURIComponent(session.token)}&code=${encodeURIComponent(session.sessionId)}`;
      url.hash = '';
      return url.toString();
    } catch {
      const base = window.location.href.split('?')[0];
      return `${base}?join=${encodeURIComponent(session.token)}&code=${encodeURIComponent(session.sessionId)}`;
    }
  };
  const joinUrl = getJoinUrl();

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        joinUrl,
        {
          width: 240,
          margin: 2,
          color: {
            dark: theme === 'dark' ? '#09090b' : '#09090b',
            light: '#ffffff',
          },
          errorCorrectionLevel: 'M',
        },
        (error) => {
          if (error) console.error('QR code generation failed:', error);
        }
      );
    }
  }, [joinUrl, theme]);

  useEffect(() => {
    const updateTimer = () => {
      const remaining = Math.max(0, Math.floor((session.expiresAt - Date.now()) / 1000));
      const mins = Math.floor(remaining / 60);
      const secs = remaining % 60;
      setTimeLeft(`${mins}:${secs < 10 ? '0' : ''}${secs}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [session.expiresAt]);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(session.sessionId);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-8 shadow-sm space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="text-center space-y-1">
        <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-100">
          Connect another device
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Scan with your phone camera or use the 8-character code
        </p>
      </div>

      {/* QR Code Container */}
      <div className="flex flex-col items-center justify-center">
        <div className="p-2 sm:p-3 bg-white rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-inner max-w-full overflow-hidden">
          <canvas ref={canvasRef} className="rounded-lg max-w-full h-auto block" />
        </div>

        {/* Expiry Pill */}
        <div className="mt-3 flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
          <Clock className="w-3.5 h-3.5" />
          <span>Expires in <strong className="text-zinc-700 dark:text-zinc-200">{timeLeft}</strong></span>
        </div>
      </div>


      {/* Manual Pairing Code */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 text-center">
          Pairing Code
        </label>
        <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
          <span className="font-mono text-lg font-bold tracking-widest text-blue-600 dark:text-blue-400">
            {session.sessionId}
          </span>
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 transition-colors focus:outline-none"
            id="copy-pairing-code-btn"
          >
            {copiedCode ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Copy Link & Share */}
      <div className="flex gap-2">
        <button
          onClick={handleCopyLink}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-medium bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-750 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 transition-colors focus:outline-none"
          id="copy-link-btn"
        >
          {copiedLink ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              <span>Link Copied</span>
            </>
          ) : (
            <>
              <Share2 className="w-3.5 h-3.5 text-zinc-500" />
              <span>Copy Direct Link</span>
            </>
          )}
        </button>

        <button
          onClick={onRefresh}
          className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 transition-colors focus:outline-none"
          title="Refresh Code"
          id="refresh-qr-btn"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 transition-colors focus:outline-none text-xs font-semibold"
          title="Cancel Session and return home"
          id="cancel-pairing-btn"
        >
          <X className="w-4 h-4" />
          <span>الرئيسية</span>
        </button>
      </div>

      {/* Live Pulsing Waiting State */}
      <div className="flex items-center justify-center gap-2 pt-2 text-xs text-zinc-500 dark:text-zinc-400">
        <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
        <span>Waiting for second device to connect...</span>
      </div>
    </div>
  );
};
