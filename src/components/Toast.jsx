import { useEffect } from 'react';

export default function Toast({ message, error, success, onClose }) {
    const text = message?.text || (typeof message === 'string' ? message : '') || error || success || '';
    const isError = Boolean(error || message?.error === true || message?.type === 'error' || message?.type === 'danger');
    const isSuccess = Boolean(success || message?.type === 'success' || (!isError && text));

    useEffect(() => {
        if (text && onClose) {
            const timer = setTimeout(() => {
                onClose();
            }, 6000);
            return () => clearTimeout(timer);
        }
    }, [text, onClose]);

    if (!text) return null;

    return (
        <aside className="fixed top-20 right-6 z-[9999] max-w-md w-[calc(100%-48px)] pointer-events-none" aria-live="polite">
            <div className={`pointer-events-auto flex items-start justify-between gap-3 p-4 rounded-xl shadow-2xl border transition-all duration-300 transform translate-y-0 ${
                isError 
                    ? 'bg-[#991b1b] border-red-400 text-red-50' 
                    : 'bg-[#065f46] border-emerald-400 text-emerald-50'
            }`}>
                <div className="flex items-start gap-3">
                    <span className="text-lg leading-none mt-0.5 shrink-0">
                        {isError ? '⚠️' : '✓'}
                    </span>
                    <div>
                        <strong className="block text-[11px] font-black uppercase tracking-wider opacity-90">
                            {isError ? 'Thông báo lỗi / Cảnh báo' : 'Thông báo hệ thống'}
                        </strong>
                        <p className="text-xs font-semibold mt-0.5 leading-relaxed">{text}</p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="text-white/80 hover:text-white font-black text-sm px-1.5 py-0.5 leading-none transition-colors cursor-pointer shrink-0"
                    title="Đóng"
                >
                    ✕
                </button>
            </div>
        </aside>
    );
}
