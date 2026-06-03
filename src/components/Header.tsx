import { Share2, FileText, Globe, Info, Sparkles, Shield, Lock, LogOut } from 'lucide-react';
import { motion } from 'motion/react';

interface HeaderProps {
  totalFiles: number;
  totalLinks: number;
  isAdmin: boolean;
  onLoginClick: () => void;
  onLogout: () => void;
}

export default function Header({ totalFiles, totalLinks, isAdmin, onLoginClick, onLogout }: HeaderProps) {
  return (
    <header className="relative w-full overflow-hidden bg-gradient-to-r from-brand-900 via-brand-800 to-emerald-950 text-white border-b border-brand-700/30 py-10 md:py-14 shadow-lg mb-8">
      {/* Decorative grid lines */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#15803d_1px,transparent_1px),linear-gradient(to_bottom,#15803d_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30" />
      
      {/* Dynamic ambient lights */}
      <div className="absolute -top-24 -right-24 w-60 h-60 bg-brand-500/20 rounded-full blur-3xl" />
      <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl" />
      
      <div className="max-w-7xl mx-auto px-4 md:px-8 relative flex flex-col md:flex-row md:items-center md:justify-between gap-6 w-full">
        <div>
          <div className="inline-flex items-center gap-2 bg-brand-500/15 text-brand-300 border border-brand-500/20 px-3 py-1 rounded-full text-xs font-medium mb-3 backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>Berbagi File & Link Tanpa Batas</span>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-brand-200 bg-clip-text text-transparent">
            Sure Before Share<span className="text-brand-400">.</span>
          </h1>
          <p className="text-emerald-100/70 text-sm md:text-base mt-2 max-w-xl font-light italic uppercase">
            SALAM TANGGUH TANPA MENGELUH
          </p>
          <p className="text-brand-300/80 text-xs md:text-sm mt-1 max-w-xl font-semibold uppercase tracking-wider">
            hanya untuk lingkungan sendiri
          </p>
        </div>
        
        {/* Right section: live counters and admin controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 md:self-end">
          {/* Simple live counters */}
          <div className="flex items-center gap-4 bg-brand-950/40 border border-brand-700/30 backdrop-blur-md p-4 rounded-2xl">
            <div className="flex items-center gap-3 border-r border-brand-700/40 pr-4">
              <div className="p-2.5 bg-brand-500/10 text-brand-400 rounded-xl">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div id="stat-files" className="text-lg font-bold font-mono tracking-tight text-white">{totalFiles}</div>
                <div className="text-brand-200 text-[10px] font-medium tracking-wide uppercase">File Tersimpan</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <div id="stat-links" className="text-lg font-bold font-mono tracking-tight text-white">{totalLinks}</div>
                <div className="text-brand-200 text-[10px] font-medium tracking-wide uppercase">Link Tersimpan</div>
              </div>
            </div>
          </div>

          {/* Admin Mode Controls */}
          {isAdmin ? (
            <div className="flex items-center justify-between gap-3 bg-teal-500/10 border border-teal-500/30 px-4 py-4 rounded-2xl backdrop-blur-md">
              <div className="flex items-center gap-1.5 text-teal-300 font-bold text-xs uppercase tracking-wider select-none">
                <Shield className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span>Admin Aktif</span>
              </div>
              <button
                onClick={onLogout}
                className="bg-rose-500/20 hover:bg-rose-500/35 active:scale-95 text-rose-300 font-black text-[10px] uppercase tracking-widest px-2.5 py-1.5 rounded-lg border border-rose-500/35 transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                title="Keluar dari Akses Admin"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Keluar</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onLoginClick}
              className="flex items-center justify-center gap-2 bg-brand-500/10 hover:bg-brand-500/20 active:scale-95 border border-brand-500/20 px-4 py-4 rounded-2xl text-brand-300 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer backdrop-blur-md text-sm"
            >
              <Lock className="w-4 h-4 text-brand-400" />
              <span>Akses Admin</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
