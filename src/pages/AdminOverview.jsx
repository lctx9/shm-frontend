import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import Toast from '../components/Toast';
import DemographicsDashboard from '../components/DemographicsDashboard';

export default function AdminOverview() {
    const [data, setData] = useState(null);
    const [error, setError] = useState('');

    const load = async () => {
        try {
            setError('');
            setData((await axiosClient.get('/admin/overview')).result);
        } catch (reason) {
            setError(reason?.message || 'Unable to load administration data.');
        }
    };

    useEffect(() => { load(); }, []);

    const cards = [
        ['Users', data?.totalUsers, `${data?.pendingUsers || 0} pending approval`],
        ['Events', data?.totalEvents, `${data?.activeEvents || 0} active`],
        ['Teams', data?.totalTeams, 'Across the platform'],
        ['Staff assignments', data?.staffAssignments, 'Mentor + Judge'],
    ];

    const quickLinks = [
        ['/dashboard/users', 'Accounts & permissions'],
        ['/dashboard/monitoring', 'System monitoring'],
        ['/dashboard/backups', 'Data backups'],
        ['/dashboard/settings', 'System settings'],
    ];

    return (
        <div className="mx-auto max-w-7xl space-y-6">
            <section className="rounded-xl border border-[#d7e6f8] bg-[#f8fafc]/80 px-6 py-4 text-slate-800 shadow-xs sm:px-7 sm:py-5">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#0f63c9]">System administration</p>
                        <h2 className="mt-1 text-xl font-black text-[#071936] sm:text-2xl">System overview</h2>
                        <p className="mt-1 text-xs text-[#5c6d83] sm:text-sm">Operational status across the SEAL platform.</p>
                    </div>
                    <button type="button" onClick={load} title="Refresh overview" className="btn-secondary h-8 w-8 p-0 inline-flex items-center justify-center text-xs font-bold bg-white text-slate-700 border-slate-200 hover:bg-slate-50 transition-all active:scale-95 cursor-pointer">↻</button>
                </div>
            </section>

            <Toast error={error} onClose={() => setError('')} />

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {cards.map(([label, value, helper]) => (
                    <article key={label} className="rounded-lg border border-blue-100 bg-white p-5 shadow-sm">
                        <p className="text-sm font-bold text-slate-600">{label}</p>
                        <p className="mt-2 text-4xl font-black text-slate-900">{data ? value || 0 : '...'}</p>
                        <p className="mt-2 text-xs font-semibold text-slate-500">{helper}</p>
                    </article>
                ))}
            </section>

            <DemographicsDashboard />

            <section className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
                <article className="rounded-lg border border-blue-100 bg-white p-6 shadow-sm">
                    <h3 className="font-black text-slate-900">Role distribution</h3>
                    <div className="mt-4 space-y-3">
                        {Object.entries(data?.roles || {}).map(([role, count]) => (
                            <div key={role} className="flex items-center justify-between rounded-lg bg-blue-50 px-4 py-3">
                                <span className="text-sm font-bold text-slate-700">{role}</span>
                                <span className="font-black text-[#0f63c9]">{count}</span>
                            </div>
                        ))}
                    </div>
                </article>
                <article className="rounded-lg border border-blue-100 bg-white p-6 shadow-sm">
                    <h3 className="font-black text-slate-900">Quick access</h3>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        {quickLinks.map(([to, label]) => (
                            <Link key={to} to={to} className="rounded-lg border border-blue-100 p-4 text-sm font-black text-[#0f63c9] transition hover:bg-blue-50">
                                {label} →
                            </Link>
                        ))}
                    </div>
                </article>
            </section>
        </div>
    );
}
