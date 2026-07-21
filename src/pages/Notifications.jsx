import { useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient';
import Toast from '../components/Toast';

export default function Notifications() {
    const role = localStorage.getItem('role');
    const [notifications, setNotifications] = useState([]);
    const [form, setForm] = useState({ title: '', body: '', targetRole: 'USER' });
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const canSend = role === 'COORDINATOR' || role === 'ADMIN';

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const response = await axiosClient.get('/notifications');
            const data = response.result || [];
            setNotifications(data);
            setError('');

            const hasUnread = data.some((item) => !item.read);
            if (hasUnread) {
                await axiosClient.patch('/notifications/read-all');
                setNotifications(data.map((item) => ({ ...item, read: true })));
                window.dispatchEvent(new Event('notifications:refresh'));
            }
        } catch (err) {
            setError(err.message || 'Không thể tải thông báo.');
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id) => {
        setNotifications((current) => current.map((item) => item.id === id ? { ...item, read: true } : item));
        try {
            await axiosClient.patch(`/notifications/${id}/read`);
            window.dispatchEvent(new Event('notifications:refresh'));
        } catch (err) {
            setError(err.message || 'Không thể cập nhật thông báo.');
            fetchNotifications();
        }
    };

    const markAllAsRead = async () => {
        try {
            await axiosClient.patch('/notifications/read-all');
            setNotifications((current) => current.map((item) => ({ ...item, read: true })));
            window.dispatchEvent(new Event('notifications:refresh'));
        } catch (err) {
            setError(err.message || 'Không thể cập nhật thông báo.');
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSending(true);
        setError('');
        setSuccess('');
        try {
            await axiosClient.post('/notifications', form);
            setForm({ title: '', body: '', targetRole: 'USER' });
            setSuccess('Thông báo đã được gửi thành công!');
            await fetchNotifications();
        } catch (err) {
            setError(err.message || 'Không thể gửi thông báo.');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="mx-auto max-w-5xl space-y-6">
            <Toast error={error} success={success} onClose={() => { setError(''); setSuccess(''); }} />
            {canSend && (
                <section className="rounded-lg border border-blue-100 bg-white p-8 shadow-sm">
                    <h2 className="text-xl font-black uppercase tracking-wide text-slate-900">Gửi thông báo</h2>
                    <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                        <div className="grid gap-4 md:grid-cols-[1fr_180px]">
                            <input required className="input-custom" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Tiêu đề" />
                            <select className="input-custom" value={form.targetRole} onChange={(e) => setForm({ ...form, targetRole: e.target.value })}>
                                <option value="USER">Người tham gia</option>
                                <option value="STAFF">Staff</option>
                            </select>
                        </div>
                        <textarea required rows="4" className="input-custom" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="Nội dung thông báo" />
                        <button type="submit" disabled={sending} className="btn-primary disabled:opacity-60">
                            {sending ? 'Đang gửi...' : 'Gửi thông báo'}
                        </button>
                    </form>
                </section>
            )}

            <section className="rounded-lg border border-blue-100 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-blue-100 bg-blue-50 px-6 py-4">
                    <h2 className="text-xl font-black uppercase tracking-wide text-slate-900">Thông báo của tôi</h2>
                    <div className="flex gap-2">
                        {notifications.some((item) => !item.read) && <button type="button" onClick={markAllAsRead} className="btn-secondary">Đọc tất cả</button>}
                        <button type="button" onClick={fetchNotifications} title="Làm mới thông báo" className="btn-secondary h-9 w-9 p-0 inline-flex items-center justify-center text-sm font-bold">↻</button>
                    </div>
                </div>
                <Toast error={error} onClose={() => { setError(''); setSuccess(''); }} />
                <div className="divide-y divide-blue-50">
                    {loading ? (
                        <div className="p-8 text-center text-slate-500">Đang tải...</div>
                    ) : notifications.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">Chưa có thông báo.</div>
                    ) : notifications.map((item) => (
                        <article key={item.id} onClick={() => markAsRead(item.id)} className={`cursor-pointer px-6 py-5 ${item.read ? 'bg-white' : 'bg-blue-50/70'}`}>
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-600">{item.targetRole || 'Cá nhân'}</p>
                                {item.actionUrl && (
                                    <a href={item.actionUrl} className="text-xs font-bold text-[#0f63c9] hover:underline flex items-center gap-1">
                                        Xem chi tiết &rarr;
                                    </a>
                                )}
                            </div>
                            <h3 className="mt-2 font-black text-slate-900 break-words">{item.title}</h3>
                            <p className="mt-2 text-sm leading-6 text-slate-600 break-words whitespace-pre-wrap">{item.body}</p>
                            <p className="mt-3 text-xs text-slate-400">{item.createdAt ? new Date(item.createdAt).toLocaleString('vi-VN') : ''}</p>
                        </article>
                    ))}
                </div>
            </section>
        </div>
    );
}
