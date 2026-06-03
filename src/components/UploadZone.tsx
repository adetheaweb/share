import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { Upload, FileUp, AlertTriangle, CheckCircle2, ShieldCheck } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { SharedItem } from '../types';

interface UploadZoneProps {
  onFilesUploaded: (files: Omit<SharedItem, 'id' | 'createdAt' | 'clicks'>[]) => void;
}

export default function UploadZone({ onFilesUploaded }: UploadZoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const processFile = async (file: File): Promise<Omit<SharedItem, 'id' | 'createdAt' | 'clicks'>> => {
    return new Promise((resolve, reject) => {
      // 700KB limit statement
      if (file.size > 700 * 1024) {
        reject(new Error(`File "${file.name}" melebihi batas 700 KB untuk penyimpanan cloud serverless.`));
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        resolve({
          type: 'file',
          title: file.name,
          url: reader.result as string, // Base64 Data URL
          fileSize: file.size,
          fileType: file.type || 'application/octet-stream',
          tags: [file.type ? file.type.split('/')[0] : 'other'],
          description: `Diunggah secara lokal. Mime-type: ${file.type || 'Unknown'}`
        });
      };
      reader.onerror = () => {
        reject(new Error(`Gagal membaca file: ${file.name}`));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFiles = async (filesList: FileList) => {
    setIsReading(true);
    setErrorMessage(null);
    setSuccessCount(0);
    const convertedItems: Omit<SharedItem, 'id' | 'createdAt' | 'clicks'>[] = [];
    let errorMsg: string | null = null;

    for (let i = 0; i < filesList.length; i++) {
      try {
        const item = await processFile(filesList[i]);
        convertedItems.push(item);
      } catch (err: any) {
        errorMsg = err.message || 'Gagal membaca file.';
      }
    }

    if (convertedItems.length > 0) {
      try {
        await onFilesUploaded(convertedItems);
        setSuccessCount(convertedItems.length);
        setTimeout(() => setSuccessCount(0), 4000);
      } catch (err: any) {
        console.error("Firestore write failed:", err);
        errorMsg = 'Gagal menyimpan ke database serverless. Pastikan ukuran file kecil.';
      }
    }

    if (errorMsg) {
      setErrorMessage(errorMsg);
      setTimeout(() => setErrorMessage(null), 6000);
    }
    
    setIsReading(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 relative overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <Upload className="w-4.5 h-4.5 text-brand-600" />
          <span>Unggah File</span>
        </h2>
        <span className="text-[11px] text-slate-400 font-medium px-2 py-1 bg-slate-100 rounded-md flex items-center gap-1" title="Disimpan secara lokal terenkripsi di dalam database cloud gratis Anda">
          <ShieldCheck className="w-3.5 h-3.5 text-brand-600" /> Max 700 KB
        </span>
      </div>

      <div
        id="drop-zone"
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={onButtonClick}
        className={`group relative overflow-hidden transition-all duration-300 cursor-pointer h-48 rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-6 text-center ${
          isDragActive
            ? 'border-brand-500 bg-brand-500/5 scale-[0.99] shadow-inner shadow-brand-500/5'
            : 'border-slate-200 hover:border-brand-400 hover:bg-slate-50/50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          multiple
          onChange={handleInputChange}
          id="file-input-field"
        />

        <AnimatePresence mode="wait">
          {isReading ? (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="flex flex-col items-center gap-3"
              id="uploading-state"
            >
              <div className="relative flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-200 border-t-brand-500"></div>
                <FileUp className="w-5 h-5 text-brand-500 absolute" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700">Membaca file...</p>
                <p className="text-xs text-slate-400 mt-1">Mengonversi file ke format lokal aman</p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="flex flex-col items-center"
              id="idle-state"
            >
              <div className="p-3 bg-brand-50 group-hover:bg-brand-100/70 text-brand-600 rounded-full transition-colors duration-200 mb-3.5 shadow-sm">
                <Upload className="w-6 h-6 group-hover:scale-110 transition-transform duration-200" />
              </div>
              <p className="text-sm font-semibold text-slate-700">
                Tarik & letakkan file ke sini atau <span className="text-brand-600 group-hover:underline">Pilih File</span>
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Image, PDF, Document, Audio, dll (diproses langsung di browser Anda)
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Slide-out feedbacks */}
      <AnimatePresence>
        {successCount > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0, marginTop: 0 }}
            animate={{ height: 'auto', opacity: 1, marginTop: 12 }}
            exit={{ height: 0, opacity: 0, marginTop: 0 }}
            className="flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-xl p-3 text-xs font-medium"
            id="success-banner"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Berhasil menambahkan {successCount} file ke daftar bagi!</span>
          </motion.div>
        )}

        {errorMessage && (
          <motion.div
            initial={{ height: 0, opacity: 0, marginTop: 0 }}
            animate={{ height: 'auto', opacity: 1, marginTop: 12 }}
            exit={{ height: 0, opacity: 0, marginTop: 0 }}
            className="flex items-center gap-2 bg-rose-50 text-rose-800 border border-rose-100 rounded-xl p-3 text-xs font-medium"
            id="error-banner"
          >
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
