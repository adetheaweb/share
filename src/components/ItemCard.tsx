import React, { useState } from 'react';
import { 
  Download, 
  ExternalLink, 
  Share2, 
  Trash2, 
  Tag, 
  Pin, 
  Calendar, 
  Eye, 
  Edit3, 
  Check, 
  ClipboardCopy 
} from 'lucide-react';
import { SharedItem } from '../types';
import { getItemIcon, formatBytes, getFaviconUrl } from '../utils';

interface ItemCardProps {
  item: SharedItem;
  onShare: (item: SharedItem) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
  onUpdateTitle: (id: string, newTitle: string) => void;
  onIncrementClicks: (id: string) => void;
}

export default function ItemCard({
  item,
  onShare,
  onDelete,
  onTogglePin,
  onUpdateTitle,
  onIncrementClicks,
}: ItemCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(item.title);
  const [justCopied, setJustCopied] = useState(false);

  const IconComponent = getItemIcon(item.type, item.fileType, item.title);
  const isImage = item.type === 'file' && item.fileType?.startsWith('image/');
  const formattedDate = new Date(item.createdAt).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const handleAction = () => {
    onIncrementClicks(item.id);
    if (item.type === 'link') {
      window.open(item.url, '_blank', 'noopener,noreferrer');
    } else {
      // Direct base64 download
      try {
        const link = document.createElement('a');
        link.href = item.url;
        link.download = item.title;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (err) {
        console.error('Download error:', err);
      }
    }
  };

  const handleSaveTitle = () => {
    if (editValue.trim() && editValue.trim() !== item.title) {
      onUpdateTitle(item.id, editValue.trim());
    }
    setIsEditing(false);
  };

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(item.url);
      setJustCopied(true);
      setTimeout(() => setJustCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div 
      className={`relative bg-white rounded-2xl border transition-all duration-300 md:hover:-translate-y-1 md:hover:shadow-lg flex flex-col justify-between overflow-hidden group ${
        item.isPinned 
          ? 'border-brand-300 shadow-md shadow-brand-500/[0.02] relative' 
          : 'border-slate-100 hover:border-slate-200 shadow-sm'
      }`}
      id={`card-${item.id}`}
    >
      {/* Pinned background sash / badge */}
      {item.isPinned && (
        <span className="absolute top-0 right-12 z-10 bg-brand-600 text-white px-2 py-0.5 rounded-b-md text-[9px] font-bold uppercase tracking-wider flex items-center gap-0.5">
          <Pin className="w-2.5 h-2.5" /> Pinned
        </span>
      )}

      {/* Main card body section */}
      <div className="p-5">
        {/* Top bar (Category, date, pin toggle) */}
        <div className="flex items-center justify-between gap-1 mb-3">
          <div className="flex items-center gap-2">
            <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
              item.type === 'file' 
                ? 'bg-amber-50 text-amber-800 border border-amber-100' 
                : 'bg-brand-50 text-brand-800 border border-brand-100'
            }`}>
              {item.type === 'file' ? 'File' : 'Link'}
            </span>
            <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
              <Calendar className="w-3 h-3" /> {formattedDate}
            </span>
          </div>

          <button
            onClick={() => onTogglePin(item.id)}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              item.isPinned
                ? 'bg-brand-50 border-brand-100 text-brand-600 hover:bg-slate-100'
                : 'bg-slate-50/50 border-transparent text-slate-300 hover:text-slate-500 hover:bg-slate-100'
            }`}
            title={item.isPinned ? 'Lepas Pin' : 'Sematkan Pin Utama'}
          >
            <Pin className={`w-3.5 h-3.5 ${item.isPinned ? 'fill-brand-600' : ''}`} />
          </button>
        </div>

        {/* Core Detail content */}
        <div className="flex items-start gap-3.5">
          {/* Logo/Icon panel */}
          <div className={`p-2.5 rounded-xl border select-none shrink-0 ${
            item.type === 'file' 
              ? 'bg-amber-500/5 text-amber-600 border-amber-500/10' 
              : 'bg-brand-500/5 text-brand-600 border-brand-500/10'
          }`}>
            {item.type === 'link' ? (
              <img
                src={getFaviconUrl(item.url)}
                alt=""
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
                className="w-8 h-8 object-contain rounded-lg bg-white p-0.5 shrink-0"
                referrerPolicy="no-referrer"
              />
            ) : null}
            {/* Show category fallback icon or if not loaded */}
            <IconComponent className="w-8 h-8 group-hover:scale-110 transition-transform duration-200" style={{ display: item.type === 'link' ? 'none' : 'block' }} />
          </div>

          {/* Title with editing capability */}
          <div className="min-w-0 flex-1">
            {isEditing ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-brand-500 focus:bg-white px-2 py-1 rounded-lg text-xs outline-none"
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                  autoFocus
                />
                <button
                  onClick={handleSaveTitle}
                  className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-lg cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-start gap-1 group/title justify-between">
                <h3 
                  onClick={handleAction}
                  className="font-bold text-slate-800 text-sm leading-snug break-words line-clamp-2 hover:text-brand-600 cursor-pointer"
                >
                  {item.title}
                </h3>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditing(true);
                  }}
                  className="text-slate-400 hover:text-brand-600 p-0.5 opacity-0 group-hover/title:opacity-100 transition-opacity cursor-pointer inline-flex shrink-0 ml-1 mt-0.5"
                  title="Ubah Nama"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Mime & size details for files */}
            {item.type === 'file' && (
              <p className="text-[10px] text-slate-400 font-mono font-medium mt-1">
                {formatBytes(item.fileSize || 0)} • {item.fileType?.split('/')[1]?.toUpperCase() || 'DATA'}
              </p>
            )}
            {item.type === 'link' && (
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="text-[10px] text-brand-600 hover:underline font-mono mt-0.5 block truncate hover:text-brand-800"
              >
                {item.url}
              </a>
            )}
          </div>
        </div>

        {/* Dynamic Image preview if image file */}
        {isImage && (
          <div 
            onClick={handleAction}
            className="mt-4 mb-2 rounded-xl overflow-hidden border border-slate-100 bg-slate-50 h-28 relative cursor-pointer group-hover:border-slate-200 transition-colors"
          >
            <img
              src={item.url}
              alt={item.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-slate-900/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="bg-white/95 backdrop-blur-sm text-[10px] font-bold text-slate-700 px-2.5 py-1 rounded-full shadow-md flex items-center gap-1 border border-slate-100">
                <Download className="w-3 h-3 text-brand-600" /> Unduh Gambar
              </span>
            </div>
          </div>
        )}

        {/* Small Tag visualization */}
        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {item.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md font-medium"
              >
                <Tag className="w-2.5 h-2.5 opacity-60" /> {tag.toLowerCase()}
              </span>
            ))}
          </div>
        )}

        {/* Note / Description panel */}
        {item.description && (
          <p className="text-xs text-slate-500 line-clamp-2 mt-3.5 leading-relaxed bg-slate-50/70 p-2.5 rounded-xl border border-slate-100/50">
            {item.description}
          </p>
        )}
      </div>

      {/* Footer bar buttons info */}
      <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-slate-400 text-xs">
        {/* Click stats indicator */}
        <div className="flex items-center gap-1.5" title="Berapa kali diunduh atau dibuka">
          <Eye className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-semibold text-slate-500 font-mono">{item.clicks}</span>
          <span className="text-[10px] text-slate-400 font-medium">dibuka</span>
        </div>

        {/* Utility buttons row */}
        <div className="flex items-center gap-1.5">
          {/* Quick clipboard copy */}
          <button
            onClick={handleCopyLink}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              justCopied 
                ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                : 'bg-white border-slate-200/60 hover:bg-slate-100 text-slate-500 hover:text-slate-700 shadow-sm'
            }`}
            title="Salin Data Tautan"
          >
            {justCopied ? <Check className="w-3.5 h-3.5" /> : <ClipboardCopy className="w-3.5 h-3.5" />}
          </button>

          {/* Share button */}
          <button
            onClick={() => onShare(item)}
            className="p-2 rounded-xl bg-white border border-slate-200/60 hover:bg-slate-100 text-slate-500 hover:text-brand-600 shadow-sm transition-colors cursor-pointer"
            title="Bagikan Item"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>

          {/* Open / Download trigger */}
          <button
            onClick={handleAction}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              item.type === 'file'
                ? 'bg-amber-500/10 text-amber-700 border-amber-500/20 hover:bg-amber-500/20'
                : 'bg-brand-500/10 text-brand-700 border-brand-500/20 hover:bg-brand-500/20'
            }`}
            title={item.type === 'file' ? 'Unduh File' : 'Buka Link Web'}
          >
            {item.type === 'file' ? <Download className="w-3.5 h-3.5 font-bold" /> : <ExternalLink className="w-3.5 h-3.5 font-bold" />}
          </button>

          {/* Delete triggers */}
          <button
            onClick={() => onDelete(item.id)}
            className="p-2 rounded-xl bg-white border border-slate-200/60 hover:bg-rose-50 hover:border-rose-100 text-slate-400 hover:text-rose-600 shadow-sm transition-all cursor-pointer"
            title="Hapus"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
