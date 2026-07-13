import { useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient';

const size = (bytes) => bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

export default function BackupRestore() {
    const [backups, setBackups] = useState([]);
    const [busy, setBusy] = useState('');
    const [message, setMessage] = useState(null);
    const load = async () => { try { setBackups((await axiosClient.get('/admin/backups')).result || []); } catch (error) { setMessage({ error: true, text: error?.message || 'Không thể tải bản sao lưu.' }); } };
    useEffect(() => { load(); }, []);
    const createBackup = async () => { try { setBusy('create'); setMessage(null); await axiosClient.post('/admin/backups'); await load(); setMessage({ text: 'Đã tạo bản sao lưu mới.' }); } catch (error) { setMessage({ error: true, text: error?.message || 'Sao lưu thất bại.' }); } finally { setBusy(''); } };
    const restore = async (backup) => {
        if (!window.confirm(`Khôi phục dữ liệu từ ${backup.fileName}? Hệ thống sẽ tự tạo một bản sao an toàn trước khi khôi phục.`)) return;
        try { setBusy(backup.fileName); setMessage(null); await axiosClient.post(`/admin/backups/${encodeURIComponent(backup.fileName)}/restore`); setMessage({ text: `Đã khôi phục ${backup.fileName}. Hãy đăng nhập lại nếu phiên hiện tại thay đổi.` }); await load(); }
        catch (error) { setMessage({ error: true, text: error?.message || 'Khôi phục thất bại.' }); }
        finally { setBusy(''); }
    };
    return <div className="mx-auto max-w-5xl space-y-6">
        <section className="rounded-lg border border-blue-100 bg-white p-6 shadow-sm"><div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-[#0f63c9]">Data protection</p><h2 className="mt-2 text-2xl font-black text-slate-900">Sao lưu & khôi phục</h2><p className="mt-2 text-sm text-slate-600">Bản sao PostgreSQL đầy đủ, gồm cấu trúc và dữ liệu hệ thống.</p></div><button disabled={Boolean(busy)} onClick={createBackup} className="btn-primary">{busy === 'create' ? 'Đang sao lưu...' : 'Tạo bản sao lưu'}</button></div></section>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"><b>Lưu ý:</b> khi khôi phục, hệ thống tự tạo một bản backup hiện tại trước rồi mới thay thế dữ liệu.</div>
        {message && <div className={`rounded-lg border p-4 text-sm font-semibold ${message.error ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>{message.text}</div>}
        <section className="overflow-hidden rounded-lg border border-blue-100 bg-white shadow-sm"><div className="border-b border-blue-100 bg-blue-50 px-5 py-4"><h3 className="font-black text-slate-900">Lịch sử sao lưu</h3></div><div className="divide-y divide-blue-50">{backups.map((backup) => <div key={backup.fileName} className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between"><div><p className="font-black text-slate-900">{backup.fileName}</p><p className="mt-1 text-sm text-slate-500">{new Date(backup.createdAt).toLocaleString('vi-VN')} · {size(backup.size)}</p></div><button type="button" disabled={Boolean(busy)} onClick={() => restore(backup)} className="btn-secondary">{busy === backup.fileName ? 'Đang khôi phục...' : 'Khôi phục'}</button></div>)}{backups.length === 0 && <p className="p-8 text-center text-sm text-slate-500">Chưa có bản sao lưu nào.</p>}</div></section>
    </div>;
}
