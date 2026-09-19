import React, { useRef, useState, useEffect } from 'react';
import { 
  UploadCloud, 
  File, 
  FileText, 
  Image as ImageIcon, 
  Film, 
  Music, 
  Archive, 
  Download, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Send, 
  Link as LinkIcon, 
  Copy, 
  Check, 
  ExternalLink, 
  Laptop, 
  Smartphone, 
  FolderUp, 
  Camera, 
  Clock, 
  ShieldCheck, 
  Zap,
  ArrowUpRight,
  ArrowDownLeft,
  CloudUpload,
  HardDrive
} from 'lucide-react';
import { DeviceInfo, FileTransferItem, TextTransferItem } from '../types.ts';
import { formatBytes, formatSpeed, formatEta, isValidUrl } from '../lib/crypto.ts';

interface TransferDashboardProps {
  localDeviceInfo: DeviceInfo;
  peerDeviceInfo?: DeviceInfo;
  files: FileTransferItem[];
  texts: TextTransferItem[];
  incomingOffer: FileTransferItem | null;
  onSendFiles: (files: FileList | File[]) => void;
  onSendText: (text: string) => void;
  onAcceptFile: (item: FileTransferItem) => void;
  onRejectFile: (itemId: string) => void;
  onCancelTransfer: (itemId: string) => void;
  autoAccept: boolean;
  onToggleAutoAccept: (value: boolean) => void;
  sessionRole?: 'host' | 'joiner';
  onUploadCloudFallback?: (file: File) => Promise<void>;
}

export const TransferDashboard: React.FC<TransferDashboardProps> = ({
  localDeviceInfo,
  peerDeviceInfo,
  files,
  texts,
  incomingOffer,
  onSendFiles,
  onSendText,
  onAcceptFile,
  onRejectFile,
  onCancelTransfer,
  autoAccept,
  onToggleAutoAccept,
  sessionRole = 'host',
  onUploadCloudFallback,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);
  const cloudFileInputRef = useRef<HTMLInputElement | null>(null);

  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'files' | 'text'>('files');
  const [copiedTextId, setCopiedTextId] = useState<string | null>(null);
  const [saveNotification, setSaveNotification] = useState<{ message: string; type: 'success' | 'info' } | null>(null);
  const [hasAttemptedMobileAutoPick, setHasAttemptedMobileAutoPick] = useState(false);

  // Detect mobile environment
  const isMobile = localDeviceInfo.type === 'mobile' || 
    (typeof navigator !== 'undefined' && /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent));

  // Check if File System Access API is supported (Desktop Chromium browsers)
  const hasFileSystemAccess = typeof window !== 'undefined' && 'showSaveFilePicker' in window;

  // Folder support detection
  const isFolderSupported = typeof window !== 'undefined' && 'webkitdirectory' in document.createElement('input');

  // Automatic Mobile Picker Attempt upon pairing
  useEffect(() => {
    if (isMobile && !hasAttemptedMobileAutoPick && files.length === 0) {
      setHasAttemptedMobileAutoPick(true);
      // Attempt to open native picker (if allowed by browser's current interaction context)
      try {
        const inputEl = fileInputRef.current;
        if (inputEl) {
          if ('showPicker' in inputEl) {
            (inputEl as any).showPicker();
          } else {
            (inputEl as HTMLInputElement).click();
          }
        }
      } catch {
        // Handled smoothly by the prominent hero action button
      }
    }
  }, [isMobile, hasAttemptedMobileAutoPick, files.length]);

  // Drag and drop listeners on window
  useEffect(() => {
    let dragCounter = 0;

    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      dragCounter++;
      if (e.dataTransfer && e.dataTransfer.types.includes('Files')) {
        setIsDraggingOver(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      dragCounter--;
      if (dragCounter <= 0) {
        setIsDraggingOver(false);
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      dragCounter = 0;
      setIsDraggingOver(false);
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        onSendFiles(e.dataTransfer.files);
      }
    };

    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDrop);
    };
  }, [onSendFiles]);

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    onSendText(textInput.trim());
    setTextInput('');
  };

  const handleCopyText = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedTextId(id);
      setTimeout(() => setCopiedTextId(null), 2000);
    } catch {}
  };

  // Direct Save via File System Access API (showSaveFilePicker)
  const handleSaveWithSystemPicker = async (item: FileTransferItem) => {
    if (!item.blobUrl) return;

    if (!hasFileSystemAccess) {
      triggerAnchorDownload(item);
      return;
    }

    try {
      const ext = item.name.includes('.') ? '.' + item.name.split('.').pop() : '';
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: item.name,
        types: [
          {
            description: 'QuickDrop Received File',
            accept: {
              [item.type || 'application/octet-stream']: ext ? [ext] : [],
            },
          },
        ],
      });

      const writable = await handle.createWritable();
      const response = await fetch(item.blobUrl);
      const blob = await response.blob();
      await writable.write(blob);
      await writable.close();

      setSaveNotification({
        message: `تم حفظ "${item.name}" بنجاح في المسار الذي حددته! ✅`,
        type: 'success',
      });
      setTimeout(() => setSaveNotification(null), 4000);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // User cancelled picker dialog
        return;
      }
      console.warn('showSaveFilePicker failed or restricted, using direct download:', err);
      triggerAnchorDownload(item);
    }
  };

  // Fallback direct anchor download
  const triggerAnchorDownload = (item: FileTransferItem) => {
    if (!item.blobUrl) return;
    try {
      const a = document.createElement('a');
      a.href = item.blobUrl;
      a.download = item.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setSaveNotification({
        message: `تم تنزيل "${item.name}" تلقائياً إلى مجلد التنزيلات! 📥`,
        type: 'success',
      });
      setTimeout(() => setSaveNotification(null), 4000);
    } catch (err) {
      console.error('Anchor download error:', err);
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <ImageIcon className="w-5 h-5 text-blue-500" />;
    if (mimeType.startsWith('video/')) return <Film className="w-5 h-5 text-purple-500" />;
    if (mimeType.startsWith('audio/')) return <Music className="w-5 h-5 text-pink-500" />;
    if (mimeType.includes('pdf')) return <FileText className="w-5 h-5 text-rose-500" />;
    if (mimeType.includes('zip') || mimeType.includes('tar') || mimeType.includes('rar') || mimeType.includes('compressed')) {
      return <Archive className="w-5 h-5 text-amber-500" />;
    }
    return <File className="w-5 h-5 text-zinc-500" />;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Global Drag Overlay */}
      {isDraggingOver && (
        <div className="fixed inset-0 z-50 bg-blue-600/90 backdrop-blur-xs flex flex-col items-center justify-center text-white pointer-events-none animate-in fade-in duration-150">
          <UploadCloud className="w-20 h-20 animate-bounce mb-4" />
          <h2 className="text-3xl font-extrabold tracking-tight">Drop files to send</h2>
          <p className="text-blue-100 text-sm mt-2">
            Files will stream directly to {peerDeviceInfo?.name || 'peer'} via WebRTC
          </p>
        </div>
      )}

      {/* Connected Devices Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
            {peerDeviceInfo?.type === 'mobile' ? (
              <Smartphone className="w-5 h-5" />
            ) : (
              <Laptop className="w-5 h-5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500 dark:text-zinc-400">متصل بـ</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              {peerDeviceInfo?.name || 'الجهاز المقترن (Connected Peer)'}
            </h2>
          </div>
        </div>

        {/* Auto-accept Toggle */}
        <label className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={autoAccept}
            onChange={(e) => onToggleAutoAccept(e.target.checked)}
            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 cursor-pointer"
            id="auto-accept-checkbox"
          />
          <span className="font-medium">قبول وتنزيل الملفات تلقائياً (Auto-Accept)</span>
        </label>
      </div>

      {/* Save Notification Toast */}
      {saveNotification && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs sm:text-sm flex items-center justify-between shadow-md animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-medium">{saveNotification.message}</span>
          </div>
          <button
            onClick={() => setSaveNotification(null)}
            className="text-emerald-600 hover:text-emerald-800 p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* MOBILE HERO ACTION CARD (Fast One-Click File Selection) */}
      {isMobile && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-xl space-y-3.5 border border-blue-400/30 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-bold uppercase tracking-wider text-blue-100">
                اقتران ناجح بالكمبيوتر ⚡
              </span>
            </div>
            <span className="text-xs font-semibold text-blue-100 bg-white/20 px-2.5 py-0.5 rounded-full">
              {peerDeviceInfo?.name || 'الكمبيوتر'}
            </span>
          </div>

          <div>
            <h3 className="text-base sm:text-lg font-bold text-white">
              اختر الملفات أو الصور لإرسالها فوراً إلى الكمبيوتر 📤
            </h3>
            <p className="text-xs text-blue-100 mt-1 leading-relaxed">
              اضغط على الزر أدناه لاختيار الملفات من هاتفك؛ سيبدأ النقل المباشر والسريع تلقائياً دون أي خطوات إضافية!
            </p>
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-4 px-5 rounded-xl bg-white hover:bg-blue-50 active:scale-[0.99] text-blue-700 font-extrabold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-lg transition-all cursor-pointer"
            id="mobile-instant-file-picker-btn"
          >
            <FolderUp className="w-5 h-5 text-blue-600 animate-bounce" />
            <span>📁 فتح الاستوديو والملفات للإرسال الفوري ⚡</span>
          </button>
        </div>
      )}

      {/* Incoming File Prompt Dialog */}
      {incomingOffer && !autoAccept && (
        <div className="p-5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                {getFileIcon(incomingOffer.type)}
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                    ملف وارد
                  </span>
                  <span className="text-xs text-zinc-400">•</span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    من {peerDeviceInfo?.name || 'peer'}
                  </span>
                </div>
                <div className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 truncate max-w-sm">
                  {incomingOffer.name}
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  {formatBytes(incomingOffer.size)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                onClick={() => onRejectFile(incomingOffer.id)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                id="reject-file-btn"
              >
                رفض
              </button>
              <button
                onClick={() => onAcceptFile(incomingOffer)}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors"
                id="accept-file-btn"
              >
                قبول واستلام
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SubTab Navigation */}
      <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2">
        <button
          onClick={() => setActiveSubTab('files')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 ${
            activeSubTab === 'files'
              ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        >
          <File className="w-4 h-4" />
          <span>الملفات ({files.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('text')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 ${
            activeSubTab === 'text'
              ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>نصوص وروابط ({texts.length})</span>
        </button>
      </div>

      {/* SubTab Content: Files */}
      {activeSubTab === 'files' && (
        <div className="space-y-6">
          {/* File Upload / Drop Area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="group relative border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-blue-500 dark:hover:border-blue-500 rounded-3xl p-8 sm:p-12 text-center bg-white dark:bg-zinc-900/60 hover:bg-blue-50/20 dark:hover:bg-blue-950/20 transition-all cursor-pointer shadow-2xs"
          >
            <div className="max-w-md mx-auto space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center border border-blue-100 dark:border-blue-900/60 group-hover:scale-105 transition-transform">
                <UploadCloud className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  {isMobile ? 'اضغط لاختيار الصور والملفات' : 'اضغط لاختيار الملفات أو اسحبها هنا'}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  إرسال مباشر ومشفر P2P عبر WebRTC بسرعة الشبكة المحلية الكاملة
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shadow-sm transition-colors flex items-center gap-1.5 focus:outline-none cursor-pointer"
                  id="select-files-btn"
                >
                  <File className="w-3.5 h-3.5" />
                  <span>تحديد ملفات</span>
                </button>

                {/* Send Photos / Images */}
                <button
                  onClick={() => imageInputRef.current?.click()}
                  className="px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-medium text-xs border border-zinc-200 dark:border-zinc-700 transition-colors flex items-center gap-1.5 focus:outline-none cursor-pointer"
                  id="select-images-btn"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-blue-500" />
                  <span>صور وفيديوهات</span>
                </button>

                {/* Folder Upload where supported */}
                {isFolderSupported && (
                  <button
                    onClick={() => folderInputRef.current?.click()}
                    className="px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-medium text-xs border border-zinc-200 dark:border-zinc-700 transition-colors flex items-center gap-1.5 focus:outline-none cursor-pointer"
                    id="select-folder-btn"
                  >
                    <FolderUp className="w-3.5 h-3.5 text-amber-500" />
                    <span>مجلد كامل</span>
                  </button>
                )}

                {/* Cloud Upload Fallback */}
                {onUploadCloudFallback && (
                  <button
                    onClick={() => cloudFileInputRef.current?.click()}
                    className="px-3.5 py-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-medium text-xs border border-purple-200 dark:border-purple-800 transition-colors flex items-center gap-1.5 focus:outline-none cursor-pointer"
                    title="رفع وتمرير الملف عبر Supabase Storage كبديل إذا تعذر P2P"
                  >
                    <CloudUpload className="w-3.5 h-3.5 text-purple-500" />
                    <span>رفع سحابي (Cloud Relay)</span>
                  </button>
                )}
              </div>

              {/* Hidden Inputs */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    onSendFiles(e.target.files);
                    e.target.value = '';
                  }
                }}
              />
              <input
                ref={imageInputRef}
                type="file"
                multiple
                accept="image/*,video/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    onSendFiles(e.target.files);
                    e.target.value = '';
                  }
                }}
              />
              {isFolderSupported && (
                <input
                  ref={folderInputRef}
                  type="file"
                  multiple
                  // @ts-expect-error webkitdirectory is non-standard but widely supported
                  webkitdirectory=""
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      onSendFiles(e.target.files);
                      e.target.value = '';
                    }
                  }}
                />
              )}
              {onUploadCloudFallback && (
                <input
                  ref={cloudFileInputRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      onUploadCloudFallback(e.target.files[0]);
                      e.target.value = '';
                    }
                  }}
                />
              )}
            </div>
          </div>

          {/* Transfers Queue */}
          {files.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                قائمة النقل والملفات ({files.length})
              </h4>

              <div className="space-y-2.5">
                {files.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs space-y-3"
                  >
                    {/* Top row: Icon, Name, Size, Status */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                          {getFileIcon(item.type)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 truncate max-w-xs sm:max-w-md">
                              {item.name}
                            </span>
                            {item.isIncoming ? (
                              <span className="inline-flex items-center gap-0.5 text-[10px] text-cyan-600 dark:text-cyan-400 font-medium">
                                <ArrowDownLeft className="w-3 h-3" /> مستلم
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-0.5 text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                                <ArrowUpRight className="w-3 h-3" /> مرسل
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                            <span>{formatBytes(item.size)}</span>
                            {item.state === 'transferring' && (
                              <>
                                <span>•</span>
                                <span className="text-blue-600 dark:text-blue-400 font-medium">
                                  {formatSpeed(item.speed)}
                                </span>
                                <span>•</span>
                                <span>{formatEta(item.eta)} remaining</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Action / Status Badge */}
                      <div className="flex items-center gap-2 shrink-0">
                        {item.state === 'completed' && (
                          <div className="flex items-center gap-2">
                            <span className="hidden sm:inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                              <CheckCircle2 className="w-4 h-4" />
                              <span>مكتمل</span>
                            </span>

                            {/* File System Access API Save Button (Desktop Chromium) */}
                            {hasFileSystemAccess && item.blobUrl && (
                              <button
                                type="button"
                                onClick={() => handleSaveWithSystemPicker(item)}
                                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                                title="فتح نافذة مستكشف الملفات لتحديد مجلد واسم الحفظ (Save As...)"
                              >
                                <HardDrive className="w-3.5 h-3.5" />
                                <span>حفظ في مجلد (Save As)</span>
                              </button>
                            )}

                            {/* Direct Download Button */}
                            {item.blobUrl && (
                              <button
                                type="button"
                                onClick={() => triggerAnchorDownload(item)}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                              >
                                <Download className="w-3 h-3" />
                                <span>{hasFileSystemAccess ? 'تنزيل عادي' : 'حفظ'}</span>
                              </button>
                            )}
                          </div>
                        )}

                        {item.state === 'transferring' && (
                          <button
                            onClick={() => onCancelTransfer(item.id)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                            title="إلغاء النقل"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}

                        {item.state === 'failed' && (
                          <span className="inline-flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400 font-medium">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>فشل</span>
                          </span>
                        )}

                        {item.state === 'cancelled' && (
                          <span className="text-xs text-zinc-500">تم الإلغاء</span>
                        )}

                        {item.state === 'verifying' && (
                          <span className="text-xs text-amber-500 animate-pulse">فحص التطابق...</span>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar for Active Transfer */}
                    {(item.state === 'transferring' || item.state === 'preparing' || item.state === 'verifying') && (
                      <div className="space-y-1.5">
                        <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                          <div
                            className="h-full bg-blue-600 rounded-full transition-all duration-200"
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
                          <span>{formatBytes(item.transferredBytes)} / {formatBytes(item.size)}</span>
                          <span>{item.progress}%</span>
                        </div>
                      </div>
                    )}

                    {/* SHA-256 Checksum pill */}
                    {item.sha256 && (
                      <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 font-mono truncate pt-1 border-t border-zinc-100 dark:border-zinc-800/80">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span className="truncate">SHA-256: {item.sha256}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SubTab Content: Text & Links */}
      {activeSubTab === 'text' && (
        <div className="space-y-6">
          {/* Text Compose Card */}
          <form onSubmit={handleTextSubmit} className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3">
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              إرسال نص، كود، أو رابط
            </label>
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="ألصق أي نص هنا: ملاحظات، روابط، أكواد..."
              rows={3}
              className="w-full p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-sans"
              id="text-message-textarea"
            />

            <div className="flex items-center justify-between">
              {isValidUrl(textInput) ? (
                <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 font-medium">
                  <LinkIcon className="w-3.5 h-3.5" />
                  <span>تم اكتشاف رابط صالح</span>
                </div>
              ) : (
                <span className="text-xs text-zinc-400">نقل مباشر فوري</span>
              )}

              <button
                type="submit"
                disabled={!textInput.trim()}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                id="send-text-btn"
              >
                <Send className="w-3.5 h-3.5" />
                <span>إرسال</span>
              </button>
            </div>
          </form>

          {/* Texts Stream */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              النصوص المشتركة ({texts.length})
            </h4>

            {texts.length === 0 ? (
              <div className="p-8 text-center rounded-xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500">
                لم يتم إرسال أو استلام أي رسائل نصية في هذه الجلسة بعد.
              </div>
            ) : (
              <div className="space-y-2.5">
                {texts.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs space-y-2.5"
                  >
                    <div className="flex items-center justify-between text-xs text-zinc-500">
                      <span className="font-medium text-zinc-700 dark:text-zinc-300">
                        {item.isIncoming ? (
                          <span className="text-cyan-600 dark:text-cyan-400">مستلم من {peerDeviceInfo?.name || 'peer'}</span>
                        ) : (
                          <span className="text-blue-600 dark:text-blue-400">مرسل من هذا الجهاز</span>
                        )}
                      </span>
                      <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    <div className="text-sm text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap font-mono break-all p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800/80 select-text">
                      {item.text}
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      {item.isUrl && (
                        <a
                          href={item.text}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-medium flex items-center gap-1 transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>فتح الرابط</span>
                        </a>
                      )}

                      <button
                        onClick={() => handleCopyText(item.id, item.text)}
                        className="px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        {copiedTextId === item.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-500" />
                            <span>تم النسخ</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>نسخ</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
