import { useState, useEffect } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  QrCode, 
  Share2, 
  Send, 
  Mail, 
  FileText, 
  Globe, 
  AlertCircle 
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { SharedItem } from '../types';
import { encodePayload, formatBytes } from '../utils';

interface ShareModalProps {
  item: SharedItem | null;
  onClose: () => void;
}

export default function ShareModal({ item, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  useEffect(() => {
    if (!item) return;

    // Build self-contained payload to share
    const payload = {
      title: item.title,
      type: item.type,
      url: item.url,
      description: item.description,
      fileSize: item.fileSize,
      fileType: item.fileType,
      tags: item.tags,
    };

    const encoded = encodePayload(payload);
    
    // Create direct callback URL to the same page
    const protocol = window.location.protocol;
    const host = window.location.host;
    const pathname = window.location.pathname;
    
    // If it's too large, warn or truncate or create a shortened mock share
    const finalUrl = `${protocol}//${host}${pathname}?recv=${encoded}`;
    setShareUrl(finalUrl);
    setCopied(false);
    setShowQR(false);
  }, [item]);

  if (!item) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const isPayloadHuge = shareUrl.length > 2000;

  // Social share urls
  const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`Halo! Lihat file/link menarik "${item.title}" yang saya bagikan di Sure Before Share: ` + shareUrl)}`;
  const teleUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(`Ayo lihat "${item.title}" yang dibagikan!`)}`;
  const mailUrl = `mailto:?subject=${encodeURIComponent(`Membagikan: ${item.title}`)}&body=${encodeURIComponent(`Halo, saya membagikan file/link "${item.title}" dengan Anda melalui Sure Before Share.\n\nKlik tautan di bawah ini untuk mengaksesnya langsung:\n${shareUrl}`)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dark overlay backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        id="share-modal-overlay"
      />

      {/* Modal Dialog card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-10 p-6"
        id="share-modal-content"
      >
        {/* Header bar */}
        <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-brand-50 text-brand-600 rounded-xl">
              <Share2 className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Bagikan Item</h3>
              <p className="text-xs text-slate-400">Siap dibagikan ke platform apa saja</p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Item Info display */}
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-start gap-3 mb-5">
          <div className={`p-3 rounded-xl shrink-0 ${
            item.type === 'file' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-brand-50 text-brand-700 border border-brand-150'
          }`}>
            {item.type === 'file' ? <FileText className="w-6 h-6" /> : <Globe className="w-6 h-6" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-slate-800 break-words line-clamp-1">{item.title}</p>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">
              {item.type === 'file' 
                ? `File • ${item.fileType?.split('/')[1]?.toUpperCase() || 'BIN'} • ${formatBytes(item.fileSize || 0)}`
                : `Tautan Tautan Web`
              }
            </p>
            {item.description && (
              <p className="text-xs text-slate-500 mt-2 italic bg-white/60 p-2 rounded-lg border border-slate-100/50 line-clamp-2">
                &ldquo;{item.description}&rdquo;
              </p>
            )}
          </div>
        </div>

        {/* Warning if URL is incredibly large */}
        {isPayloadHuge && (
          <div className="mb-4 bg-amber-50 border border-amber-100 text-amber-800 p-3 rounded-xl flex items-start gap-2 text-xs">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Perhatian:</span> File ini berukuran lumayan besar. Link berbagi bisa menjadi sangat panjang jika menggunakan format mandiri offline. Kami sarankan membagikan via browser yang sama atau link text ringkas.
            </div>
          </div>
        )}

        {/* Quick link copying container */}
        <div className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Salin Link Berbagi Mandiri (Autonomous URL)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-500 font-mono focus:outline-none overflow-x-auto select-all"
              />
              <button
                onClick={handleCopy}
                className={`px-4 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                  copied 
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-500/10' 
                    : 'bg-brand-800 text-white hover:bg-brand-700 shadow-md'
                }`}
              >
                {copied ? <Check className="w-4 h-4 animate-scale" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Tersalin' : 'Salin'}</span>
              </button>
            </div>
          </div>

          {/* Social Quick Share Grid */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Bagikan Langsung Ke Aplikasi Lain
            </label>
            <div className="grid grid-cols-3 gap-2">
              <a
                href={waUrl}
                target="_blank"
                rel="noreferrer"
                className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-100 bg-emerald-50/20 hover:bg-emerald-50 hover:border-emerald-200 text-emerald-600 transition-colors cursor-pointer group"
              >
                <Send className="w-5 h-5 text-emerald-500 mb-1.5 group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-semibold">WhatsApp</span>
              </a>

              <a
                href={teleUrl}
                target="_blank"
                rel="noreferrer"
                className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-100 bg-sky-50/20 hover:bg-sky-50 hover:border-sky-200 text-sky-600 transition-colors cursor-pointer group"
              >
                <Send className="w-5 h-5 text-sky-500 transform rotate-12 mb-1.5 group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-semibold">Telegram</span>
              </a>

              <a
                href={mailUrl}
                className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-100 bg-rose-50/20 hover:bg-rose-50 hover:border-rose-200 text-rose-600 transition-colors cursor-pointer group"
              >
                <Mail className="w-5 h-5 text-rose-500 mb-1.5 group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-semibold">Email</span>
              </a>
            </div>
          </div>

          {/* Toggle QR Code display */}
          <div className="border-t border-slate-100 pt-4">
            <button
              onClick={() => setShowQR(!showQR)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-100 cursor-pointer"
            >
              <QrCode className="w-4 h-4" />
              <span>{showQR ? 'Sembunyikan QR Code' : 'Ambil QR Code untuk Scan HP'}</span>
            </button>

            <AnimatePresence>
              {showQR && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex flex-col items-center pt-4"
                >
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/50 shadow-sm">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(shareUrl)}`}
                      alt="QR Code Berbagi"
                      className="w-[180px] h-[180px] rounded-lg bg-white"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2">
                    Gunakan kamera ponsel untuk memindai link QR Sure Before Share di atas
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
