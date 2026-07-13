import { useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient';

const bytes = (value = 0) => `${(value / 1024 / 1024).toFixed(1)} MB`;
const duration = (value = 0) => `${Math.floor(value / 3600000)}h ${Math.floor((value % 3600000) / 60000)}m`;

export default function AdminMonitoring() {
    const [data, setData] = useState(null);
    const [error, setError] = useState('');
    const load = async () => { try { setData((await axiosClient.get('/admin/monitoring')).result); setError(''); } catch (reason) { setError(reason?.message || 'Không thể kiểm tra hệ thống.'); } };
    useEffect(() => { load(); const timer = setInterval(load, 30000); return () => clearInterval(timer); }, []);
    const memoryPercent = data ? Math.round((data.usedMemoryBytes / data.maxMemoryBytes) * 100) : 0;
    return <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-lg border border-blue-100 bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-[#0f63c9]">Realtime health</p><h2 className="mt-2 text-2xl font-black text-slate-900">Giám sát hệ thống</h2><p className="mt-2 text-sm text-slate-600">Tự làm mới mỗi 30 giây.</p></div><button onClick={load} className="btn-secondary">Kiểm tra ngay</button></div></section>
        {error && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>}
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{[['Trạng thái',data?.status],['Database',data?.database],['Uptime',data ? duration(data.uptimeMs) : '...'],['CPU khả dụng',data?.processors]].map(([label,value]) => <article key={label} className="rounded-lg border border-blue-100 bg-white p-5 shadow-sm"><p className="text-sm font-bold text-slate-500">{label}</p><p className="mt-3 text-2xl font-black text-slate-900">{value ?? '...'}</p></article>)}</section>
        <section className="grid gap-5 lg:grid-cols-2"><article className="rounded-lg border border-blue-100 bg-white p-6 shadow-sm"><div className="flex justify-between"><h3 className="font-black text-slate-900">Bộ nhớ JVM</h3><span className="font-black text-[#0f63c9]">{memoryPercent}%</span></div><div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-[#0f63c9]" style={{ width: `${Math.min(memoryPercent, 100)}%` }} /></div><p className="mt-3 text-sm text-slate-500">{bytes(data?.usedMemoryBytes)} / {bytes(data?.maxMemoryBytes)}</p></article><article className="rounded-lg border border-blue-100 bg-white p-6 shadow-sm"><h3 className="font-black text-slate-900">Bản ghi dữ liệu</h3><div className="mt-4 grid grid-cols-2 gap-3">{Object.entries(data?.records || {}).map(([key,value]) => <div key={key} className="rounded-lg bg-blue-50 p-3"><p className="text-xs font-bold uppercase text-slate-500">{key}</p><p className="text-xl font-black text-slate-900">{value}</p></div>)}</div></article></section>
        <section className="rounded-lg border border-blue-100 bg-white p-6 shadow-sm"><h3 className="font-black text-slate-900">Hoạt động quản trị gần đây</h3><div className="mt-4 divide-y divide-blue-50">{(data?.recentActivities || []).map((item) => <div key={item.id} className="py-3"><div className="flex justify-between gap-4"><span className="text-sm font-black text-[#0f63c9]">{item.action}</span><time className="text-xs text-slate-400">{item.createdAt ? new Date(item.createdAt).toLocaleString('vi-VN') : ''}</time></div><p className="mt-1 text-sm text-slate-600">{item.detail}</p><p className="mt-1 text-xs text-slate-400">{item.actorEmail}</p></div>)}{data && !data.recentActivities?.length && <p className="py-4 text-sm text-slate-500">Chưa có hoạt động quản trị.</p>}</div></section>
    </div>;
}
