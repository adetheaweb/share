import { useState, useEffect } from 'react';
import { 
  Download, 
  Globe, 
  FileText, 
  Save, 
  ArrowLeft, 
  AlertTriangle, 
  Check, 
  Clock, 
  Tag, 
  Sparkles, 
  ExternalLink 
} from 'lucide-react';
import { motion } from 'motion/react';
import { SharedItem } from '../types';
import { decodePayload, formatBytes, getFaviconUrl } from '../utils';

interface LandingReceivedProps {
  payloadBase64: string;
  onImportItem: (item: SharedItem) => void;
  onGoHome: () => void;
}

export default function LandingReceived({ payloadBase64, onImportItem, onGoHome }: LandingReceivedProps) {
  const [decodedItem, setDecodedItem] = useState<SharedItem | null>(null);
  const [errorParsing, setErrorParsing] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);

  useEffect(() => {
    if (!payloadBase64) return;
    
    const parsed = decodePayload(payloadBase64);
    if (parsed && parsed.title && parsed.type && parsed.url) {
      setDecodedItem({
        id: 'shared_' + Date.now(),
        type: parsed.type,
        title: parsed.title,
        url: parsed.url,
        description: parsed.description,
        fileSize: parsed.fileSize,
        fileType: parsed.fileType,
        tags: parsed.tags || [],
        clicks: 0,
        createdAt: new Date().toISOString()
      });
      setErrorParsing(false);
    } else {
      setErrorParsing(true);
    }
  }, [payloadBase64]);

  const handleDownloadFile = () => {
    if (!decodedItem || decodedItem.type !== 'file') return;
    
    try {
      const link = document.createElement('a');
      link.href = decodedItem.url;
      link.download = decodedItem.title;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to download file:', err);
    }
  };

  const handleOpenLink = () => {
    if (!decodedItem || decodedItem.type !== 'link') return;
    window.open(decodedItem.url, '_blank', 'noopener,noreferrer');
  };

  const handleImport = () => {
    if (!decodedItem) return;
    onImportItem(decodedItem);
    setHasSaved(true);
    setTimeout(() => {
      onGoHome();
    }, 1500);
  };

  if (errorParsing) {
    return (
      <div className="flex flex-col items-center justify-center p-6 min-h-[70vh] max-w-md mx-auto text-center" id="parse-error-screen">
        <div className="p-4 bg-orange-50 text-orange-500 rounded-full mb-4 border border-orange-100 shadow-sm animate-bounce">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Tautan Berbagi Kedaluwarsa / Rusak</h2>
        <p className="text-slate-500 text-sm mt-2 leading-relaxed">
          Payload data yang dikirimkan di dalam URL link tidak terbaca atau rusak karena terpotong. Silakan minta pengirim mengirimkan salinan tautannya kembali.
        </p>
        <button
          onClick={onGoHome}
          className="mt-6 flex items-center gap-2 bg-brand-800 border border-brand-800 text-white font-semibold text-xs px-5 py-2.5 rounded-xl hover:bg-brand-700 hover:border-brand-700 transition-colors shadow-md cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Buka Dashboard Utama
        </button>
      </div>
    );
  }

  if (!decodedItem) {
    return (
      <div className="flex flex-col items-center justify-center p-6 min-h-[70vh] text-center" id="parsing-loader-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-200 border-t-brand-500 mb-3"></div>
        <p className="text-slate-500 text-sm">Membongkar isi paket data transfer...</p>
      </div>
    );
  }

  const isFile = decodedItem.type === 'file';

  return (
    <div className="max-w-2xl mx-auto py-12 px-4" id="item-received-view">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden"
      >
        {/* Header Ribbon bar */}
        <div className="p-6 bg-gradient-to-r from-brand-900 via-brand-800 to-emerald-950 text-white font-bold text-lg text-center flex items-center justify-center gap-2 border-b border-brand-700/20">
          <div className="inline-flex items-center gap-1.5 bg-brand-50/80 border border-brand-100 px-3.5 py-1.5 rounded-full text-xs font-semibold text-brand-700 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>Menerima File Berbagi Mandiri</span>
          </div>
        </div>

        {/* Content detail panel */}
        <div className="p-6 md:p-8">
          <div className="flex flex-col items-center text-center">
            {/* Immersive centered thumbnail category banner */}
            <div className={`p-5 rounded-3xl shadow-sm mb-5 border select-none ${
              isFile 
                ? 'bg-orange-50 border-orange-100 text-orange-600' 
                : 'bg-brand-50 border-brand-100 text-brand-600'
            }`}>
              {isFile ? (
                decodedItem.fileType?.startsWith('image/') ? (
                  <img
                    src={decodedItem.url}
                    alt="Preview"
                    className="w-16 h-16 object-cover rounded-xl"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <FileText className="w-14 h-14" />
                )
              ) : (
                <img
                  src={getFaviconUrl(decodedItem.url)}
                  alt="Web Icon"
                  onError={(e) => {
                    // fallbacks
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                  className="w-14 h-14 object-contain rounded-xl bg-white p-1"
                  referrerPolicy="no-referrer"
                />
              )}
            </div>

            <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-2 ${
              isFile 
                ? 'bg-orange-100 text-orange-850 border border-orange-200' 
                : 'bg-brand-100 text-brand-850 border border-brand-200'
            }`}>
              {isFile ? 'Item: File Dokumen' : 'Item: Tautan Tautan Web'}
            </span>

            <h2 className="text-xl md:text-2xl font-extrabold text-slate-800 break-words max-w-lg leading-tight">
              {decodedItem.title}
            </h2>

            {/* Sizes & Details */}
            <div className="flex items-center justify-center gap-4 text-xs font-medium text-slate-400 mt-2 font-mono">
              {isFile && (
                <span className="bg-slate-50 border border-slate-100 rounded-lg px-2 py-1">
                  Ukuran: {formatBytes(decodedItem.fileSize || 0)}
                </span>
              )}
              <span className="bg-slate-50 border border-slate-100 rounded-lg px-2 py-1 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Dikirim Baru Saja
              </span>
            </div>

            {/* Description panel */}
            <div className="w-full mt-6 bg-slate-50 border border-slate-100 p-4 rounded-2xl max-w-lg text-left">
              <span className="text-[10px] font-bold font-mono tracking-wider text-slate-400 block mb-1 uppercase">Catatan Tambahan Pengirim:</span>
              <p className="text-slate-600 text-sm italic">
                {decodedItem.description || 'Tidak ada deskripsi tambahan dari pengirim.'}
              </p>
              
              {/* Render small tag array */}
              {decodedItem.tags && decodedItem.tags.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap mt-3.5 pt-3 border-t border-slate-200/45">
                  <Tag className="w-3 h-3 text-slate-400" />
                  {decodedItem.tags.map(tag => (
                    <span key={tag} className="bg-slate-200/60 text-slate-600 font-medium text-[10px] px-2 py-0.5 rounded-md">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Action buttons list */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-lg mt-8">
              {/* Primary action */}
              {isFile ? (
                <button
                  onClick={handleDownloadFile}
                  className="w-full bg-brand-800 border border-brand-800 hover:bg-brand-700 hover:border-brand-700 text-white font-bold text-sm py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md active:scale-95"
                >
                  <Download className="w-4.5 h-4.5" />
                  <span>Unduh File Langsung</span>
                </button>
              ) : (
                <button
                  onClick={handleOpenLink}
                  className="w-full bg-brand-800 border border-brand-800 hover:bg-brand-700 hover:border-brand-700 text-white font-bold text-sm py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md active:scale-95"
                >
                  <ExternalLink className="w-4.5 h-4.5" />
                  <span>Buka Tautan Link</span>
                </button>
              )}

              {/* Persist in Collection */}
              <button
                onClick={handleImport}
                disabled={hasSaved}
                className={`w-full font-bold text-sm py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 border transition-all active:scale-95 cursor-pointer ${
                  hasSaved
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200 shadow-inner'
                    : 'bg-white text-brand-700 border-brand-200 hover:bg-brand-50'
                }`}
              >
                {hasSaved ? (
                  <>
                    <Check className="w-4.5 h-4.5 text-emerald-600 animate-scale" />
                    <span>Tersimpan di Dasbor!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4.5 h-4.5" />
                    <span>Simpan ke Koleksi Saya</span>
                  </>
                )}
              </button>
            </div>

            {/* Return home link */}
            <button
              onClick={onGoHome}
              className="mt-6 text-xs text-slate-400 hover:text-slate-600 font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Dasbor Utama Tanpa Menyimpan</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
