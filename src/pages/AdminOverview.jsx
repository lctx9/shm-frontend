import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';

export default function AdminOverview() {
    const [data, setData] = useState(null);
    const [error, setError] = useState('');
    const load = async () => {
        try { setError(''); setData((await axiosClient.get('/admin/overview')).result); }
        catch (reason) { setError(reason?.message || 'Không thể tải dữ liệu quản trị.'); }
    };
    useEffect(() => { load(); }, []);
    const cards = [
        ['Người dùng', data?.totalUsers, `${data?.pendingUsers || 0} chờ duyệt`],
        ['Sự kiện', data?.totalEvents, `${data?.activeEvents || 0} đang hoạt động`],
        ['Đội thi', data?.totalTeams, 'Toàn hệ thống'],
        ['Phân công staff', data?.staffAssignments, 'Mentor + Judge'],
    ];
    return <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-lg border border-blue-100 bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-[#0f63c9]">System administration</p><h2 className="mt-2 text-2xl font-black text-slate-900">Tổng quan hệ thống</h2><p className="mt-2 text-sm text-slate-600">Tình trạng vận hành của toàn bộ nền tảng SEAL.</p></div><button type="button" onClick={load} title="Làm mới tổng quan" className="btn-secondary h-9 w-9 p-0 inline-flex items-center justify-center text-sm font-bold">↻</button></div></section>
        {error && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>}
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{cards.map(([label, value, helper]) => <article key={label} className="rounded-lg border border-blue-100 bg-white p-5 shadow-sm"><p className="text-sm font-bold text-slate-600">{label}</p><p className="mt-2 text-4xl font-black text-slate-900">{data ? value || 0 : '...'}</p><p className="mt-2 text-xs font-semibold text-slate-500">{helper}</p></article>)}</section>
        <section className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
            <article className="rounded-lg border border-blue-100 bg-white p-6 shadow-sm"><h3 className="font-black text-slate-900">Phân bổ vai trò</h3><div className="mt-4 space-y-3">{Object.entries(data?.roles || {}).map(([role, count]) => <div key={role} className="flex items-center justify-between rounded-lg bg-blue-50 px-4 py-3"><span className="text-sm font-bold text-slate-700">{role}</span><span className="font-black text-[#0f63c9]">{count}</span></div>)}</div></article>
            <article className="rounded-lg border border-blue-100 bg-white p-6 shadow-sm"><h3 className="font-black text-slate-900">Truy cập nhanh</h3><div className="mt-4 grid gap-3 sm:grid-cols-2">{[['/dashboard/users','Tài khoản & phân quyền'],['/dashboard/monitoring','Giám sát hệ thống'],['/dashboard/backups','Sao lưu dữ liệu'],['/dashboard/settings','Cấu hình hệ thống']].map(([to,label]) => <Link key={to} to={to} className="rounded-lg border border-blue-100 p-4 text-sm font-black text-[#0f63c9] transition hover:bg-blue-50">{label} →</Link>)}</div></article>
        </section>
    </div>;
}
