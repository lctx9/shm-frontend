import { useMemo } from 'react';

export default function PasswordStrengthBar({ password = '' }) {
    const strength = useMemo(() => {
        if (!password) return { score: 0, label: '', color: 'bg-slate-200' };
        
        let score = 0;
        if (password.length >= 6) score += 1;
        if (password.length >= 10) score += 1;
        if (/[A-Z]/.test(password)) score += 1;
        if (/[0-9]/.test(password)) score += 1;
        if (/[^A-Za-z0-9]/.test(password)) score += 1;

        if (score <= 2) {
            return { score: 1, label: 'Weak', color: 'bg-red-500', text: 'text-red-600' };
        } else if (score <= 4) {
            return { score: 2, label: 'Medium', color: 'bg-amber-500', text: 'text-amber-600' };
        } else {
            return { score: 3, label: 'Strong', color: 'bg-emerald-500', text: 'text-emerald-600' };
        }
    }, [password]);

    if (!password) return null;

    return (
        <div className="mt-2 space-y-1">
            <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-500">Password Strength</span>
                <span className={`font-extrabold ${strength.text}`}>{strength.label}</span>
            </div>
            <div className="flex gap-1 h-1.5 w-full">
                <div className={`h-full flex-1 rounded-full transition-colors ${strength.score >= 1 ? strength.color : 'bg-slate-200'}`} />
                <div className={`h-full flex-1 rounded-full transition-colors ${strength.score >= 2 ? strength.color : 'bg-slate-200'}`} />
                <div className={`h-full flex-1 rounded-full transition-colors ${strength.score >= 3 ? strength.color : 'bg-slate-200'}`} />
            </div>
        </div>
    );
}
