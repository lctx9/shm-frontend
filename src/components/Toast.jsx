import { useEffect } from 'react';

export default function Toast({ message, onClose }) {
    useEffect(() => {
        if (message && message.text) {
            const timer = setTimeout(() => {
                onClose();
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [message, onClose]);

    if (!message || !message.text) return null;

    const isError = message.error === true || message.type === 'error' || message.type === 'danger';
    const isSuccess = !isError;

    return (
        <div className={`fixed bottom-5 right-5 z-50 max-w-sm rounded-lg border p-4 shadow-lg text-sm font-semibold transition-all duration-300 transform translate-y-0 ${
            isSuccess 
                ? 'border-green-200 bg-green-50 text-green-700' 
                : 'border-red-200 bg-red-50 text-red-700'
        }`}>
            <div className="flex items-center gap-3">
                {isSuccess ? (
                    <svg className="h-5 w-5 text-green-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                ) : (
                    <svg className="h-5 w-5 text-red-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                )}
                <p className="flex-1 text-[#071936]">{message.text}</p>
                <button type="button" onClick={onClose} className="ml-auto text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
