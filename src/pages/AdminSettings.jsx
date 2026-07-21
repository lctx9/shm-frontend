import { useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient';
import Toast from '../components/Toast';

const initial = { systemName: '', supportEmail: '', maintenanceMode: 'false', registrationEnabled: 'true', sessionTimeoutMinutes: '120' };

export default function AdminSettings() {
    const [form, setForm] = useState(initial);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);
    useEffect(() => { axiosClient.get('/admin/settings').then((response) => setForm({ ...initial, ...response.result })).catch(() => setMessage({ error: true, text: 'Không thể tải cấu hình.' })); }, []);
    const save = async (event) => {
        event.preventDefault();
        try { setSaving(true); const response = await axiosClient.put('/admin/settings', form); setForm(response.result); setMessage({ text: 'Đã lưu cấu hình hệ thống.' }); }
        catch (error) { setMessage({ error: true, text: error?.message || 'Không thể lưu cấu hình.' }); }
        finally { setSaving(false); }
    };
    return <div className="mx-auto max-w-4xl space-y-6">
        <section className="rounded-lg border border-blue-100 bg-white p-6 shadow-sm"><p className="text-xs font-black uppercase tracking-[0.18em] text-[#0f63c9]">System configuration</p><h2 className="mt-2 text-2xl font-black text-slate-900">Cấu hình hệ thống</h2><p className="mt-2 text-sm text-slate-600">Các thiết lập dùng chung cho toàn bộ nền tảng.</p></section>
        <Toast message={message} onClose={() => setMessage(null)} />
        <form onSubmit={save} className="rounded-lg border border-blue-100 bg-white p-6 shadow-sm">
            <div className="grid gap-5 md:grid-cols-2"><label className="space-y-2"><span className="text-sm font-black text-slate-700">Tên hệ thống</span><input required className="input-custom" value={form.systemName} onChange={(e) => setForm({ ...form, systemName: e.target.value })} /></label><label className="space-y-2"><span className="text-sm font-black text-slate-700">Email hỗ trợ</span><input required type="email" className="input-custom" value={form.supportEmail} onChange={(e) => setForm({ ...form, supportEmail: e.target.value })} /></label><label className="space-y-2"><span className="text-sm font-black text-slate-700">Thời hạn phiên đăng nhập (phút)</span><input required min="15" type="number" className="input-custom" value={form.sessionTimeoutMinutes} onChange={(e) => setForm({ ...form, sessionTimeoutMinutes: e.target.value })} /></label></div>
            <div className="mt-6 space-y-3 border-t border-blue-50 pt-6"><label className="flex items-center justify-between rounded-lg bg-blue-50 p-4"><span><b className="block text-sm text-slate-900">Cho phép đăng ký tài khoản</b><span className="text-xs text-slate-500">Tắt cổng đăng ký công khai khi cần.</span></span><input type="checkbox" checked={form.registrationEnabled === 'true'} onChange={(e) => setForm({ ...form, registrationEnabled: String(e.target.checked) })} className="h-5 w-5" /></label><label className="flex items-center justify-between rounded-lg bg-amber-50 p-4"><span><b className="block text-sm text-slate-900">Chế độ bảo trì</b><span className="text-xs text-slate-500">Đánh dấu hệ thống đang được bảo trì.</span></span><input type="checkbox" checked={form.maintenanceMode === 'true'} onChange={(e) => setForm({ ...form, maintenanceMode: String(e.target.checked) })} className="h-5 w-5" /></label></div>
            <div className="mt-6 flex justify-end"><button disabled={saving} className="btn-primary">{saving ? 'Đang lưu...' : 'Lưu cấu hình'}</button></div>
        </form>
    </div>;
}
