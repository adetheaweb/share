import { useState, FormEvent } from 'react';
import { Plus, Globe, Tag, Link2, AlertCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { SharedItem } from '../types';

interface AddLinkCardProps {
  onLinkAdded: (link: Omit<SharedItem, 'id' | 'createdAt' | 'clicks'>) => void;
}

const COMMON_TAGS = ['Artikel', 'Video', 'Tutorial', 'Desain', 'Repository', 'Alat'];

export default function AddLinkCard({ onLinkAdded }: AddLinkCardProps) {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Auto clean URL to have protocol
  const sanitizeUrl = (input: string): string => {
    let clean = input.trim();
    if (!clean) return '';
    if (!/^https?:\/\//i.test(clean)) {
      clean = 'https://' + clean;
    }
    return clean;
  };

  const validateUrl = (testUrl: string): boolean => {
    try {
      new URL(testUrl);
      return true;
    } catch {
      return false;
    }
  };

  const handleChipClick = (tag: string) => {
    if (selectedChips.includes(tag)) {
      setSelectedChips(selectedChips.filter((t) => t !== tag));
    } else {
      setSelectedChips([...selectedChips, tag]);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setSuccess(false);

    const formattedUrl = sanitizeUrl(url);

    if (!formattedUrl) {
      setValidationError('Silakan masukkan URL link terlebih dahulu.');
      return;
    }

    if (!validateUrl(formattedUrl)) {
      setValidationError('Format URL tidak valid. Contoh: https://google.com');
      return;
    }

    // Determine final tags
    const typedTags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
    const finalTags = Array.from(new Set([...selectedChips, ...typedTags]));

    // Determine final title
    let finalTitle = title.trim();
    if (!finalTitle) {
      try {
        finalTitle = new URL(formattedUrl).hostname.replace('www.', '');
      } catch {
        finalTitle = 'Tautan Baru';
      }
    }

    // Attempt to save link asynchronously so we can handle errors gracefully
    const saveLink = async () => {
      try {
        await onLinkAdded({
          type: 'link',
          title: finalTitle,
          url: formattedUrl,
          description: description.trim() || `Tautan web ke ${formattedUrl}`,
          tags: finalTags.length > 0 ? finalTags : ['web'],
        });

        // Reset Form upon successful DB save
        setUrl('');
        setTitle('');
        setDescription('');
        setTagsInput('');
        setSelectedChips([]);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } catch (err: any) {
        console.error("Failed to add link:", err);
        setValidationError('Gagal menyimpan link ke database. Silakan periksa jaringan Anda.');
      }
    };

    saveLink();
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
      <h2 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-4">
        <Link2 className="w-4.5 h-4.5 text-amber-500" />
        <span>Tambah Tautan Link</span>
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4" id="add-link-form">
        {/* URL Input */}
        <div>
          <label htmlFor="link-url" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            Format URL Tautan / Link
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              <Globe className="w-4 h-4" />
            </span>
            <input
              type="text"
              id="link-url"
              placeholder="https://example.com/artikel-keren"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-brand-500 focus:bg-white focus:ring-1 focus:ring-brand-500/20 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none transition-all duration-200 placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Title & Description side by side or stacked */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="link-title" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Judul Tautan (Opsional)
            </label>
            <input
              type="text"
              id="link-title"
              placeholder="Contoh: Belajar ReactJS"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-brand-500 focus:bg-white focus:ring-1 focus:ring-brand-500/20 rounded-xl px-4 py-2.5 text-sm outline-none transition-all duration-200"
            />
          </div>

          <div>
            <label htmlFor="link-desc" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Deskripsi Singkat (Opsional)
            </label>
            <input
              type="text"
              id="link-desc"
              placeholder="Contoh: Dokumentasi resmi framework"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-brand-500 focus:bg-white focus:ring-1 focus:ring-brand-500/20 rounded-xl px-4 py-2.5 text-sm outline-none transition-all duration-200"
            />
          </div>
        </div>

        {/* Tags input & chips */}
        <div>
          <label htmlFor="link-tags" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            Tag / Kategori
          </label>
          <div className="relative mb-2">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              <Tag className="w-4 h-4" />
            </span>
            <input
              type="text"
              id="link-tags"
              placeholder="Tulis tag dipisah koma (contoh: react, web, js)"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-brand-500 focus:bg-white focus:ring-1 focus:ring-brand-500/20 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none transition-all duration-200"
            />
          </div>

          {/* Preset chips */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {COMMON_TAGS.map((tag) => {
              const isSelected = selectedChips.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleChipClick(tag)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-all duration-200 font-medium cursor-pointer ${
                    isSelected
                      ? 'bg-brand-50 text-brand-700 border-brand-200 ring-2 ring-brand-500/10'
                      : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100 hover:text-slate-700'
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        {/* Feedbacks Panel */}
        <AnimatePresence>
          {validationError && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="flex items-center gap-2 text-rose-700 bg-rose-50 border border-rose-100 p-3 rounded-xl text-xs font-medium"
              id="link-error"
            >
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{validationError}</span>
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="flex items-center gap-2 text-emerald-800 bg-emerald-50 border border-emerald-100 p-3 rounded-xl text-xs font-medium"
              id="link-success"
            >
              <Plus className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Tautan link berhasil tersimpan!</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit */}
        <button
          type="submit"
          className="w-full bg-brand-800 text-white font-semibold text-sm hover:bg-brand-700 transition-all duration-300 py-3 rounded-xl flex items-center justify-center gap-1.5 shadow-md active:scale-[0.98] cursor-pointer group"
          id="btn-add-link"
        >
          <Plus className="w-4.5 h-4.5 group-hover:rotate-90 transition-transform duration-200" />
          <span>Simpan Tautan Tadi</span>
        </button>
      </form>
    </div>
  );
}
