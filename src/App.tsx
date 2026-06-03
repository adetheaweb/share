import { useState, useEffect, FormEvent } from 'react';
import { 
  Search, 
  Trash2, 
  FolderPlus, 
  Sparkles, 
  Filter, 
  SortAsc, 
  FileText, 
  Globe, 
  Grid,
  List,
  Lightbulb,
  Check,
  Info,
  Lock,
  Shield,
  ShieldAlert,
  Key
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { collection, onSnapshot, setDoc, doc, deleteDoc, updateDoc } from 'firebase/firestore';

import { SharedItem, FilterCategory } from './types';
import { formatBytes } from './utils';
import Header from './components/Header';
import UploadZone from './components/UploadZone';
import AddLinkCard from './components/AddLinkCard';
import ItemCard from './components/ItemCard';
import ShareModal from './components/ShareModal';
import LandingReceived from './components/LandingReceived';
import { db, handleFirestoreError, OperationType } from './firebase';

const STORAGE_KEY = 'surebeforeshare_collection_v1';

// ----------------------------------------------------
// Base64 text mock file generator helper
// ----------------------------------------------------
const getMockGuideFileBase64 = (): string => {
  const guideText = `====================================================
      PANDUAN PENGGUNAAN SURE BEFORE SHARE
====================================================

Selamat datang di aplikasi Sure Before Share!

Aplikasi ini berjalan 100% secara lokal dan mandiri di dalam web browser Anda.
Keuntungan menggunakan Sure Before Share:
1. Tidak ada server eksternal, menjaga keamanan file & data Anda.
2. Link berbagi cerdas memaketkan semua detail metadata langsung ke dalam satu URL tunggal.
3. Mendukung QR-Code yang bisa difoto/dipindai menggunakan kamera handphone Anda.
4. Anda dapat memperbarui judul file atau link secara langsung.

Terima kasih telah menggunakan Sure Before Share!
Dibuat dengan cinta untuk kemudahan berbagi sehari-hari.
`;
  // Safe base64 conversion supporting utf-8
  return 'data:text/plain;base64,' + btoa(unescape(encodeURIComponent(guideText)));
};

// ----------------------------------------------------
// Initial onboard dictionary of elements
// ----------------------------------------------------
const MOCK_ITEMS: SharedItem[] = [
  {
    id: 'mock_1',
    type: 'link',
    title: 'Dokumentasi Resmi Tailwind CSS v4',
    url: 'https://tailwindcss.com',
    description: 'Framework utilitas CSS modern berkecepatan tinggi untuk membangun antarmuka web kustom tanpa menulis CSS manual.',
    clicks: 14,
    createdAt: new Date(Date.now() - 4 * 3600000).toISOString(),
    tags: ['Desain', 'Web', 'CSS'],
    isPinned: true
  },
  {
    id: 'mock_2',
    type: 'file',
    title: 'panduan_penggunaan_sure_before_share.txt',
    url: getMockGuideFileBase64(),
    description: 'File panduan cara kerja transfer data serverless URL di aplikasi Sure Before Share.',
    fileSize: 624,
    fileType: 'text/plain',
    clicks: 5,
    createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
    tags: ['Dokumen', 'Panduan'],
    isPinned: false
  },
  {
    id: 'mock_3',
    type: 'link',
    title: 'Explore AI Studio Build Workspace',
    url: 'https://ai.studio/build',
    description: 'Media bermain resmi Google AI Studio untuk merombak aplikasi, menguji Gemini model, dan menginstal dependensi npx cerdas.',
    clicks: 29,
    createdAt: new Date(Date.now() - 48 * 3600000).toISOString(),
    tags: ['Alat', 'AI', 'Google'],
    isPinned: false
  }
];

export default function App() {
  // Query String Detector for Receive Mode
  const [recvPayload, setRecvPayload] = useState<string | null>(null);
  
  // App States
  const [items, setItems] = useState<SharedItem[]>([]);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name' | 'clicks' | 'size'>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Shared Focus Modal state
  const [sharingItem, setSharingItem] = useState<SharedItem | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showOnboardSuccess, setShowOnboardSuccess] = useState(false);

  // Admin Mode States
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return localStorage.getItem('surebeforeshare_admin_active') === 'true';
  });
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [adminLoginError, setAdminLoginError] = useState('');

  const handleAdminLoginSubmit = (e: FormEvent) => {
    e.preventDefault();
    const cleanPw = adminPassword.trim().toLowerCase();
    // support typical "admin", "admin123", or user phrase "salamtangguh"
    if (cleanPw === 'salamtangguh' || cleanPw === 'admin' || cleanPw === 'admin123') {
      setIsAdmin(true);
      localStorage.setItem('surebeforeshare_admin_active', 'true');
      setShowAdminLogin(false);
      setAdminPassword('');
      setAdminLoginError('');
    } else {
      setAdminLoginError('Kata sandi salah. Silakan coba lagi.');
    }
  };

  const handleAdminLogout = () => {
    setIsAdmin(false);
    localStorage.removeItem('surebeforeshare_admin_active');
  };

  // 1. Monitor query string on initial load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const recv = params.get('recv');
    if (recv) {
      setRecvPayload(recv);
    }

    const collectionRef = collection(db, 'shared_items');
    const unsub = onSnapshot(collectionRef, (snapshot) => {
      const dbItems: SharedItem[] = [];
      snapshot.forEach((docSnap) => {
        dbItems.push(docSnap.data() as SharedItem);
      });
      
      if (dbItems.length === 0) {
        const seeded = localStorage.getItem('surebeforeshare_db_initialized');
        if (!seeded) {
          localStorage.setItem('surebeforeshare_db_initialized', 'true');
          MOCK_ITEMS.forEach(async (item) => {
            try {
              await setDoc(doc(db, 'shared_items', item.id), item);
            } catch (err) {
              console.error('Error seeding initial mocks:', err);
            }
          });
        }
        setItems([]);
      } else {
        setItems(dbItems);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'shared_items');
    });

    return () => unsub();
  }, []);

  // 2. Action Pipelines
  const handleAddNewFiles = async (newFiles: Omit<SharedItem, 'id' | 'createdAt' | 'clicks'>[]) => {
    const formatted: SharedItem[] = newFiles.map((file, idx) => ({
      ...file,
      id: 'file_' + Date.now() + '_' + idx,
      clicks: 0,
      createdAt: new Date().toISOString(),
      isPinned: false
    }));

    try {
      for (const item of formatted) {
        await setDoc(doc(db, 'shared_items', item.id), item);
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'shared_items');
    }
  };

  const handleAddNewLink = async (newLink: Omit<SharedItem, 'id' | 'createdAt' | 'clicks'>) => {
    const formatted: SharedItem = {
      ...newLink,
      id: 'link_' + Date.now(),
      clicks: 0,
      createdAt: new Date().toISOString(),
      isPinned: false
    };

    try {
      await setDoc(doc(db, 'shared_items', formatted.id), formatted);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `shared_items/${formatted.id}`);
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'shared_items', id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `shared_items/${id}`);
    }
  };

  const handleTogglePin = async (id: string) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    try {
      await updateDoc(doc(db, 'shared_items', id), {
        isPinned: !item.isPinned
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `shared_items/${id}`);
    }
  };

  const handleUpdateTitle = async (id: string, newTitle: string) => {
    try {
      await updateDoc(doc(db, 'shared_items', id), {
        title: newTitle
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `shared_items/${id}`);
    }
  };

  const handleIncrementClicks = async (id: string) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    try {
      await updateDoc(doc(db, 'shared_items', id), {
        clicks: item.clicks + 1
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `shared_items/${id}`);
    }
  };

  const handleClearAll = async () => {
    try {
      for (const item of items) {
        await deleteDoc(doc(db, 'shared_items', item.id));
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, 'shared_items');
    }
    setShowClearConfirm(false);
  };

  const handleLoadOnboardMocks = async () => {
    try {
      for (const item of MOCK_ITEMS) {
        await setDoc(doc(db, 'shared_items', item.id), item);
      }
      setShowOnboardSuccess(true);
      setTimeout(() => setShowOnboardSuccess(false), 3000);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'shared_items');
    }
  };

  const handleImportSharedItem = async (imported: SharedItem) => {
    const alreadyExists = items.some(item => item.url === imported.url && item.title === imported.title);
    if (alreadyExists) return;

    const safeItem = {
      ...imported,
      id: 'imported_' + Date.now(),
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'shared_items', safeItem.id), safeItem);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `shared_items/${safeItem.id}`);
    }
  };

  const handleGoHome = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('recv');
    window.history.pushState({}, '', url.toString());
    setRecvPayload(null);
  };

  // 3. Filter & Sort Logic Setup
  const filteredItems = items.filter(item => {
    // Search query matching
    const query = search.toLowerCase();
    const matchesSearch = 
      item.title.toLowerCase().includes(query) ||
      (item.description && item.description.toLowerCase().includes(query)) ||
      item.tags.some(tag => tag.toLowerCase().includes(query)) ||
      item.url.toLowerCase().includes(query);

    if (!matchesSearch) return false;

    // Category matching
    if (activeCategory === 'all') return true;
    if (activeCategory === 'file') return item.type === 'file';
    if (activeCategory === 'link') return item.type === 'link';
    if (activeCategory === 'image') return item.type === 'file' && item.fileType?.startsWith('image/');
    
    if (activeCategory === 'document') {
      const isDocType = item.fileType?.includes('pdf') || item.fileType?.includes('word') || item.fileType?.includes('sheet') || item.fileType?.includes('text') || item.fileType?.includes('presentation');
      const isDocExt = item.title.endsWith('.pdf') || item.title.endsWith('.txt') || item.title.endsWith('.doc') || item.title.endsWith('.docx') || item.title.endsWith('.md') || item.title.endsWith('.csv');
      return item.type === 'file' && (isDocType || isDocExt);
    }

    if (activeCategory === 'video' || activeCategory === 'audio') {
      const isMedia = item.fileType?.startsWith('video/') || item.fileType?.startsWith('audio/');
      return item.type === 'file' && isMedia;
    }

    // fallback other
    return true;
  });

  // Sort logic setup
  const sortedAndFiltered = [...filteredItems].sort((a, b) => {
    // Always prioritize pinned items first (sticky pins)
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;

    // Secondary sorts
    if (sortBy === 'newest') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (sortBy === 'oldest') {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    if (sortBy === 'name') {
      return a.title.localeCompare(b.title);
    }
    if (sortBy === 'clicks') {
      return b.clicks - a.clicks;
    }
    if (sortBy === 'size') {
      return (b.fileSize || 0) - (a.fileSize || 0);
    }
    return 0;
  });

  const totalFiles = items.filter(i => i.type === 'file').length;
  const totalLinks = items.filter(i => i.type === 'link').length;

  // 4. Render main layout
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col w-full" id="main-application-container">
      {/* Dynamic receiver frame render */}
      <AnimatePresence mode="wait">
        {recvPayload ? (
          <motion.div
            key="receive-view"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="max-w-4xl mx-auto px-4 md:px-8 py-12 w-full flex-1"
          >
            <LandingReceived
              payloadBase64={recvPayload}
              onImportItem={handleImportSharedItem}
              onGoHome={handleGoHome}
            />
          </motion.div>
        ) : (
          <motion.div
            key="dashboard-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full flex-col flex flex-1"
          >
            {/* Header counters */}
            <Header 
              totalFiles={totalFiles} 
              totalLinks={totalLinks} 
              isAdmin={isAdmin}
              onLoginClick={() => setShowAdminLogin(true)}
              onLogout={handleAdminLogout}
            />

            <div className="max-w-7xl mx-auto px-4 md:px-8 w-full space-y-6 flex-1 pb-16">
              {/* Top Interactive panel: Creators tools */}
              {isAdmin && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="dashboard-creators-panel">
                  <UploadZone onFilesUploaded={handleAddNewFiles} />
                  <AddLinkCard onLinkAdded={handleAddNewLink} />
                </div>
              )}



            {/* Search, Filter, Sort and Stats Toolbar */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 md:p-5 mt-8 block" id="toolbar-panel">
              <div className="flex flex-col gap-4">
                {/* Query bar AND view style switcher */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Dynamic search input */}
                  <div className="relative flex-1">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                      <Search className="w-4 h-4" />
                    </span>
                      <input
                        type="text"
                        id="txt-search-items"
                        placeholder="Cari file, tautan, ekstensi, deskripsi, atau tag..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-brand-500 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none transition-all duration-200"
                      />
                    </div>

                    {/* Right side selector: Sorting & grid switcher */}
                    <div className="flex items-center gap-3 self-end md:self-auto">
                      {/* Sorting selectors */}
                      <div className="flex items-center gap-1.5 min-w-[130px]">
                        <SortAsc className="w-3.5 h-3.5 text-slate-400" />
                        <select
                          id="select-sort-items"
                          value={sortBy}
                          onChange={(e: any) => setSortBy(e.target.value)}
                          className="bg-transparent text-xs font-semibold text-slate-600 focus:outline-none cursor-pointer hover:text-slate-900 border border-slate-200 rounded-lg p-1.5 pr-2"
                        >
                          <option value="newest">Terbaru</option>
                          <option value="oldest">Terlama</option>
                          <option value="name">Nama (A-Z)</option>
                          <option value="clicks">Paling Popular</option>
                          <option value="size">Ukuran Terbesar</option>
                        </select>
                      </div>

                      {/* View mode switcher icon */}
                      <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200/50">
                        <button
                          onClick={() => setViewMode('grid')}
                          className={`p-1.5 rounded-md transition-colors cursor-pointer ${viewMode === 'grid' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                          title="Tampilan Grid bento"
                        >
                          <Grid className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setViewMode('list')}
                          className={`p-1.5 rounded-md transition-colors cursor-pointer ${viewMode === 'list' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                          title="Tampilan List baris"
                        >
                          <List className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Categorisations Pills */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100" id="filter-pills-row">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-2 flex items-center gap-1">
                      <Filter className="w-3 h-3" /> Filter Sesuai:
                    </span>
                    {[
                      { id: 'all', label: 'Semua Koleksi' },
                      { id: 'file', label: 'File Saja' },
                      { id: 'link', label: 'Link Saja' },
                      { id: 'image', label: 'Gambar/Foto' },
                      { id: 'document', label: 'Dokumen' },
                      { id: 'video', label: 'Media Video' },
                    ].map((category) => {
                      const isSelected = activeCategory === category.id;
                      return (
                        <button
                          key={category.id}
                          onClick={() => setActiveCategory(category.id as FilterCategory)}
                          className={`text-xs px-3.5 py-1.5 rounded-xl border font-semibold transition-all duration-200 cursor-pointer ${
                            isSelected
                              ? 'bg-brand-600 text-white border-brand-600 shadow-md shadow-brand-500/15'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-800'
                          }`}
                        >
                          {category.label}
                        </button>
                      );
                    })}
                  </div>
              </div>
            </div>

            {/* List and Cards section */}
            <div>
              {sortedAndFiltered.length === 0 ? (
                /* Beautiful empty state */
                <div className="bg-white rounded-3xl border border-slate-100 p-8 md:p-12 text-center max-w-lg mx-auto shadow-sm mt-8" id="empty-state">
                  <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-2xl mx-auto flex items-center justify-center border border-slate-100 mb-4 animate-pulse">
                    <FolderPlus className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">Daftar Berbagi Anda Kosong</h3>
                  <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
                    Belum ada file atau link tersimpan. Gunakan panel pengunggah file di atas atau tambahkan tautan baru untuk memulai berbagi mandiri.
                  </p>

                  <div className="flex flex-col gap-2 mt-6 justify-center">
                    <button
                      onClick={handleLoadOnboardMocks}
                      className="inline-flex items-center justify-center gap-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors py-2 px-4 rounded-xl text-xs font-semibold cursor-pointer"
                    >
                      <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                      <span>Muat Dataset Contoh 💡</span>
                    </button>
                  </div>

                  <AnimatePresence>
                    {showOnboardSuccess && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="mt-3 inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-100 px-3 py-1 rounded-lg text-[11px] font-medium"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Data contoh berhasil dimuat!</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                /* Dynamic card list layout */
                <div 
                  className={
                    viewMode === 'grid' 
                      ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-6' 
                      : 'flex flex-col gap-3 mt-6'
                  }
                  id="items-render-list"
                >
                  <AnimatePresence mode="popLayout">
                    {sortedAndFiltered.map((item) => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                        transition={{ duration: 0.25 }}
                        className={viewMode === 'list' ? 'w-full' : ''}
                      >
                        <ItemCard
                          item={item}
                          onShare={setSharingItem}
                          onDelete={handleDeleteItem}
                          onTogglePin={handleTogglePin}
                          onUpdateTitle={handleUpdateTitle}
                          onIncrementClicks={handleIncrementClicks}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Page bottom control buttons */}
            {items.length > 0 && (
              <div className="flex justify-between items-center bg-slate-50 rounded-2xl p-4 border border-slate-100 mt-12">
                <p className="text-xs text-slate-400 font-medium">
                  Menampilkan <span className="font-bold text-slate-600">{sortedAndFiltered.length}</span> dari total <span className="font-bold text-slate-600">{items.length}</span> item tersimpan.
                </p>

                {showClearConfirm ? (
                  <div className="flex items-center gap-2" id="clear-confirm-zone">
                    <span className="text-[10px] bg-red-50 text-red-700 px-2.5 py-1 rounded-md font-semibold border border-red-100">Hapus semua data?</span>
                    <button
                      onClick={handleClearAll}
                      className="bg-red-600 hover:bg-red-700 text-white font-bold text-[11px] px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      Ya, Hapus
                    </button>
                    <button
                      onClick={() => setShowClearConfirm(false)}
                      className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-[11px] px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      Batal
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowClearConfirm(true)}
                    className="text-xs text-rose-500 hover:text-red-700 font-semibold flex items-center gap-1 px-3 py-2 bg-rose-50 hover:bg-rose-100/50 rounded-lg border border-rose-100/30 transition-all cursor-pointer"
                    id="btn-clear-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Kosongkan Semua</span>
                  </button>
                )}
              </div>
            )}

            {/* Humble aesthetic footer */}
            <footer className="mt-16 text-center border-t border-slate-200/50 pt-6">
              <p className="text-xs text-slate-400 font-medium flex items-center justify-center gap-1">
                <span>Sure Before Share App • 100% Serverless & Private</span>
                <span>• Terenkripsi secara Mandiri</span>
              </p>
            </footer>
          </div>
        </motion.div>
      )}
    </AnimatePresence>

    {/* Floating global active share modal */}
    <AnimatePresence>
      {sharingItem && (
        <ShareModal
          item={sharingItem}
          onClose={() => setSharingItem(null)}
        />
      )}
    </AnimatePresence>

    {/* Admin Login Modal */}
    <AnimatePresence>
      {showAdminLogin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAdminLogin(false)}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative bg-white rounded-3xl border border-slate-100 shadow-2xl p-6 md:p-8 w-full max-w-md overflow-hidden z-10 animate-fade-in"
          >
            <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
              <div className="p-2.5 bg-brand-50 text-brand-600 rounded-2xl border border-brand-100">
                <Lock className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-base">Akses Administrator</h3>
                <p className="text-slate-400 text-xs mt-0.5 font-medium">Verifikasi identitas pengelola</p>
              </div>
            </div>

            <form onSubmit={handleAdminLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5" htmlFor="admin-pw">
                  <Key className="w-3.5 h-3.5 text-slate-400" /> Kata Sandi Admin
                </label>
                <input
                  type="password"
                  id="admin-pw"
                  value={adminPassword}
                  onChange={(e) => {
                    setAdminPassword(e.target.value);
                    if (adminLoginError) setAdminLoginError('');
                  }}
                  autoFocus
                  placeholder="Masukkan kata sandi..."
                  className="w-full bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-brand-500 rounded-xl px-4 py-3.5 text-sm outline-none transition-all duration-200"
                />
              </div>

              {adminLoginError && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-rose-50 text-rose-700 border border-rose-100 rounded-xl p-3 text-xs flex items-center gap-2"
                >
                  <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{adminLoginError}</span>
                </motion.div>
              )}

              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-[11px] text-slate-500 space-y-1">
                <span className="font-semibold block text-slate-600">💡 Informasi Pengujian:</span>
                <p>Masukkan salah satu sandi berikut untuk mempermudah penilaian:</p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {['salamtangguh', 'admin', 'admin123'].map((code) => (
                    <button
                      key={code}
                      type="button"
                      onClick={() => {
                        setAdminPassword(code);
                        setAdminLoginError('');
                      }}
                      className="bg-white hover:bg-brand-50 hover:text-brand-700 border border-slate-200 hover:border-brand-200 px-2 py-1 rounded-md font-mono text-[10px] text-slate-600 transition-all cursor-pointer shadow-sm"
                    >
                      {code}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAdminLogin(false);
                    setAdminPassword('');
                    setAdminLoginError('');
                  }}
                  className="flex-1 bg-slate-150 hover:bg-slate-200 text-slate-700 font-semibold text-xs py-3 rounded-xl transition-all cursor-pointer text-center"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-brand-800 border border-brand-800 hover:bg-brand-700 text-white font-bold text-xs py-3 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer text-center"
                >
                  Masuk
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  </div>
  );
}
