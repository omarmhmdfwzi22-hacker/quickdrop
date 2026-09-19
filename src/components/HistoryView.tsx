import React, { useState } from 'react';
import { 
  History, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Download,
  File,
  MessageSquare,
  Copy,
  Check,
  ExternalLink,
  Clock,
  ShieldCheck,
  Filter
} from 'lucide-react';
import { FileTransferItem, TextTransferItem } from '../types.ts';
import { formatBytes } from '../lib/crypto.ts';

interface HistoryViewProps {
  files: FileTransferItem[];
  texts?: TextTransferItem[];
  onClearHistory: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  files,
  texts = [],
  onClearHistory,
}) => {
  const [filter, setFilter] = useState<'all' | 'files' | 'texts'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const totalCount = files.length + texts.length;

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return '';
    try {
      const date = new Date(timestamp);
      return date.toLocaleDateString('ar-EG', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return new Date(timestamp).toLocaleTimeString();
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <History className="w-5 h-5" />
            </div>
            <span>سجل التحويلات (Transfer History)</span>
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            يتم حفظ كافة الملفات والنصوص المنقولة محلياً على هذا الجهاز تلقائياً للرجوع إليها في أي وقت.
          </p>
        </div>

        {totalCount > 0 && (
          <button
            type="button"
            onClick={onClearHistory}
            className="self-start sm:self-center flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 transition-colors cursor-pointer shadow-2xs"
            id="clear-history-btn"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>مسح السجل (Clear)</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      {totalCount > 0 && (
        <div className="flex items-center gap-2 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-900 w-fit text-xs font-semibold">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              filter === 'all'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            الكل ({totalCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('files')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              filter === 'files'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <File className="w-3.5 h-3.5" />
            <span>الملفات ({files.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilter('texts')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              filter === 'texts'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>النصوص ({texts.length})</span>
          </button>
        </div>
      )}

      {/* Empty State */}
      {totalCount === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-4 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 mx-auto flex items-center justify-center">
            <History className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <div className="font-bold text-base text-zinc-800 dark:text-zinc-200">
              لا توجد عمليات تحويل مسجلة بعد
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
              عند إرسال أو استلام أي ملفات أو نصوص، ستظهر هنا فوراً مع كافة تفاصيل الحجم والوقت والتحقق المشفر وتبقى محفوظة على هذا الجهاز.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Files List */}
          {(filter === 'all' || filter === 'files') && files.length > 0 && (
            <div className="space-y-2">
              {filter === 'all' && (
                <div className="text-xs font-bold uppercase tracking-wider text-zinc-400 px-1">
                  الملفات المنقولة ({files.length})
                </div>
              )}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-xs divide-y divide-zinc-100 dark:divide-zinc-800/80">
                {files.map((item) => (
                  <div key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-50/50 dark:hover:bg-zinc-850/50 transition-colors">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">
                        <File className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100 truncate max-w-[240px] sm:max-w-md" title={item.name}>
                            {item.name}
                          </span>
                          {item.isIncoming ? (
                            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 font-bold border border-cyan-500/20">
                              <ArrowDownLeft className="w-3 h-3" /> مستلم (Received)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold border border-blue-500/20">
                              <ArrowUpRight className="w-3 h-3" /> مرسل (Sent)
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-zinc-500 dark:text-zinc-400 flex flex-wrap items-center gap-2 mt-1">
                          <span className="font-medium">{formatBytes(item.size)}</span>
                          {item.endTime && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatDate(item.endTime)}
                              </span>
                            </>
                          )}
                          {item.sha256 && (
                            <>
                              <span>•</span>
                              <span className="font-mono text-[10px] text-zinc-400 truncate max-w-[120px] sm:max-w-xs" title={`SHA-256: ${item.sha256}`}>
                                SHA-256: {item.sha256.substring(0, 10)}...
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Status & Actions */}
                    <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                      {(item.state === 'completed' || item.progress === 100) && (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>مكتمل</span>
                          </span>
                          {item.blobUrl && (
                            <a
                              href={item.blobUrl}
                              download={item.name}
                              className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/60 dark:hover:text-blue-400 text-zinc-700 dark:text-zinc-300 transition-colors"
                              title="تنزيل الملف"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      )}

                      {item.state === 'transferring' && (
                        <span className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 font-semibold bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 rounded-lg">
                          <Clock className="w-3.5 h-3.5 animate-spin" />
                          <span>جاري النقل ({item.progress}%)</span>
                        </span>
                      )}

                      {item.state === 'failed' && (
                        <span className="inline-flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400 font-semibold bg-rose-50 dark:bg-rose-950/40 px-2.5 py-1 rounded-lg border border-rose-500/20">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>فشل</span>
                        </span>
                      )}

                      {item.state === 'cancelled' && (
                        <span className="inline-flex items-center gap-1 text-xs text-zinc-500 font-semibold bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-lg">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>ملغي</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Texts List */}
          {(filter === 'all' || filter === 'texts') && texts.length > 0 && (
            <div className="space-y-2">
              {filter === 'all' && (
                <div className="text-xs font-bold uppercase tracking-wider text-zinc-400 px-1 pt-3">
                  النصوص والرسائل المشتركة ({texts.length})
                </div>
              )}
              <div className="space-y-2">
                {texts.map((item) => (
                  <div key={item.id} className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-2.5">
                    <div className="flex items-center justify-between text-xs text-zinc-500">
                      <div className="flex items-center gap-2">
                        {item.isIncoming ? (
                          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 font-bold border border-cyan-500/20">
                            <ArrowDownLeft className="w-3 h-3" /> نص مستلم
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold border border-blue-500/20">
                            <ArrowUpRight className="w-3 h-3" /> نص مرسل
                          </span>
                        )}
                        <span className="text-zinc-400 text-[11px]">{formatDate(item.timestamp)}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {item.isUrl && (
                          <a
                            href={item.text}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900 text-xs font-semibold flex items-center gap-1 transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>فتح</span>
                          </a>
                        )}

                        <button
                          type="button"
                          onClick={() => handleCopy(item.id, item.text)}
                          className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          {copiedId === item.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-500" />
                              <span className="text-emerald-500">تم النسخ</span>
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

                    <div className="text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap font-mono break-all p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800/80 select-text">
                      {item.text}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
