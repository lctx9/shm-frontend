import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import Toast from '../components/Toast';

export default function Notifications() {
    const navigate = useNavigate();
    const email = localStorage.getItem('email');
    const role = localStorage.getItem('role');
    const isParticipant = !['ADMIN', 'COORDINATOR', 'STAFF', 'JUDGE', 'MENTOR'].includes(role);
    const canSend = role === 'COORDINATOR' || role === 'ADMIN';

    const [notifications, setNotifications] = useState([]);
    const [invitations, setInvitations] = useState([]);
    const [acceptedInvId, setAcceptedInvId] = useState(null);
    const [processingInvId, setProcessingInvId] = useState(null);
    const [form, setForm] = useState({ title: '', body: '', targetRole: 'USER' });
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const ROLE_LABELS = { USER: 'Participant', STAFF: 'Staff', null: 'All', '': 'All' };

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const [notifRes, invRes] = await Promise.allSettled([
                axiosClient.get('/notifications'),
                isParticipant ? axiosClient.get('/teams/my-invitations') : Promise.resolve({ result: [] }),
            ]);
            const data = notifRes.status === 'fulfilled' ? notifRes.value.result || [] : [];
            setNotifications(data);
            setInvitations(invRes.status === 'fulfilled' ? invRes.value.result || [] : []);
            setError('');

            const hasUnread = data.some((item) => !item.read);
            if (hasUnread) {
                await axiosClient.patch('/notifications/read-all');
                setNotifications(data.map((item) => ({ ...item, read: true })));
                window.dispatchEvent(new Event('notifications:refresh'));
            }
        } catch (err) {
            setError(err.message || 'Unable to load notifications.');
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
            setError(err.message || 'Unable to update notification.');
            fetchNotifications();
        }
    };

    const markAllAsRead = async () => {
        try {
            await axiosClient.patch('/notifications/read-all');
            setNotifications((current) => current.map((item) => ({ ...item, read: true })));
            window.dispatchEvent(new Event('notifications:refresh'));
        } catch (err) {
            setError(err.message || 'Unable to update notification.');
        }
    };

    const deleteSingleNotification = async (id, e) => {
        if (e) e.stopPropagation();
        try {
            await axiosClient.delete(`/notifications/${id}`);
            setNotifications((current) => current.filter((item) => item.id !== id));
            window.dispatchEvent(new Event('notifications:refresh'));
        } catch (err) {
            setError(err.message || 'Notification cannot be deleted.');
        }
    };

    const deleteAllNotifications = async () => {
        setDeleting(true);
        setError('');
        try {
            await axiosClient.delete('/notifications/my');
            setNotifications([]);
            setSuccess('All notifications removed.');
            window.dispatchEvent(new Event('notifications:refresh'));
        } catch (err) {
            setError(err.message || 'Notification cannot be deleted.');
        } finally {
            setDeleting(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const handleAcceptInvitation = async (inv) => {
        if (acceptedInvId || processingInvId) return;
        setProcessingInvId(inv.id);
        try {
            await axiosClient.post(`/teams/invitations/${inv.id}/accept`);
            setAcceptedInvId(inv.id);
            // Mark accepted, disable all others permanently
            setInvitations((prev) => prev.map((i) =>
                i.id === inv.id ? { ...i, status: 'APPROVED' } : { ...i, status: 'DISABLED' }
            ));
            setSuccess('Joined team successfully! Redirecting to your team...');
            window.dispatchEvent(new Event('notifications:refresh'));
            setTimeout(() => navigate('/my-team'), 1500);
        } catch (err) {
            setError(err.message || 'Unable to accept invitation.');
        } finally {
            setProcessingInvId(null);
        }
    };

    const handleRejectInvitation = async (inv) => {
        if (processingInvId) return;
        setProcessingInvId(inv.id);
        try {
            await axiosClient.post(`/teams/invitations/${inv.id}/reject`);
            setInvitations((prev) => prev.filter((i) => i.id !== inv.id));
            window.dispatchEvent(new Event('notifications:refresh'));
        } catch (err) {
            setError(err.message || 'Unable to reject invitation.');
        } finally {
            setProcessingInvId(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSending(true);
        setError('');
        setSuccess('');
        try {
            await axiosClient.post('/notifications', {
                ...form,
                targetRole: form.targetRole === '' ? null : form.targetRole,
            });
            setForm({ title: '', body: '', targetRole: 'USER' });
            setSuccess('Notification has been sent successfully!');
            await fetchNotifications();
        } catch (err) {
            setError(err.message || 'Unable to send notification.');
        } finally {
            setSending(false);
        }
    };

    const pendingInvitations = invitations.filter(
        (inv) => inv.status === 'PENDING' || inv.status === 'DISABLED' || inv.status === 'APPROVED'
    );

    return (
        <div className="mx-auto max-w-5xl space-y-6">
            <Toast error={error} success={success} onClose={() => { setError(''); setSuccess(''); }} />

            {/* Team Invitations Section */}
            {isParticipant && pendingInvitations.length > 0 && (
                <section className="rounded-lg border-2 border-blue-400 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="flex h-3 w-3 rounded-full bg-blue-500 animate-ping" />
                        <h2 className="text-xl font-black uppercase tracking-wide text-[#071936]">
                            Team Invitations
                        </h2>
                        <span className="rounded-full bg-blue-500 text-white text-xs font-black px-2 py-0.5">
                            {pendingInvitations.filter(i => i.status === 'PENDING').length} pending
                        </span>
                    </div>
                    <p className="text-sm text-[#5c6d83] mb-5 font-medium">
                        You can only join one team per event. Accepting an invitation will automatically invalidate all other pending invitations.
                    </p>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {pendingInvitations.map((inv) => {
                            const isDisabled = inv.status === 'DISABLED';
                            const isAccepted = inv.id === acceptedInvId || inv.status === 'APPROVED';
                            const isProcessing = processingInvId === inv.id;
                            return (
                                <div
                                    key={inv.id}
                                    className={`rounded-xl border bg-white p-5 shadow-sm flex flex-col justify-between transition-all duration-200 ${
                                        isDisabled ? 'opacity-40 border-slate-200 grayscale' :
                                        isAccepted ? 'border-emerald-300 bg-emerald-50/30' :
                                        'border-[#d7e6f8] hover:border-blue-300'
                                    }`}
                                >
                                    <div>
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <h3 className="font-black text-[#071936] text-base leading-tight">{inv.teamName}</h3>
                                            {inv.trackName && (
                                                <span className="rounded-full bg-blue-50 border border-blue-100 px-2 py-0.5 text-[10px] font-bold text-[#0f63c9] shrink-0 uppercase tracking-wider">
                                                    {inv.trackName}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-[#5c6d83] font-semibold">
                                            Event: <strong className="text-[#071936]">{inv.eventName || 'Unknown Event'}</strong>
                                        </p>
                                        {inv.inviterName && (
                                            <p className="mt-1 text-xs text-[#5c6d83] font-semibold">
                                                Invited by: <strong className="text-[#071936]">{inv.inviterName}</strong>
                                            </p>
                                        )}
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-[#f0f4f8]">
                                        {isAccepted ? (
                                            <div className="text-center text-sm font-black text-emerald-600 flex items-center justify-center gap-1.5 py-1">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                                </svg>
                                                Joined successfully!
                                            </div>
                                        ) : isDisabled ? (
                                            <div className="text-center text-sm font-bold text-slate-400 py-1">
                                                No longer available
                                            </div>
                                        ) : (
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    disabled={isProcessing || !!acceptedInvId}
                                                    onClick={() => handleAcceptInvitation(inv)}
                                                    className="flex-1 py-2 rounded-lg bg-emerald-600 text-white text-xs font-black hover:bg-emerald-700 transition-colors disabled:opacity-60 cursor-pointer"
                                                >
                                                    {isProcessing ? 'Joining...' : '✓ Accept'}
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={isProcessing || !!acceptedInvId}
                                                    onClick={() => handleRejectInvitation(inv)}
                                                    className="flex-1 py-2 rounded-lg border border-red-200 text-red-600 text-xs font-black hover:bg-red-50 transition-colors disabled:opacity-60 cursor-pointer"
                                                >
                                                    ✕ Decline
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}

            {canSend && (
                <section className="rounded-lg border border-blue-100 bg-white p-8 shadow-sm">
                    <h2 className="text-xl font-black uppercase tracking-wide text-[#071936]">Send notification</h2>
                    <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                        <div className="grid gap-4 md:grid-cols-[1fr_180px]">
                            <input required className="input-custom" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title" />
                            <select className="input-custom" value={form.targetRole} onChange={(e) => setForm({ ...form, targetRole: e.target.value })}>
                                <option value="USER">Participant</option>
                                <option value="STAFF">Staff</option>
                                <option value="">All users</option>
                            </select>
                        </div>
                        <textarea required rows="4" className="input-custom" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="Notification content" />
                        <button type="submit" disabled={sending} className="btn-primary disabled:opacity-60">
                            {sending ? 'Sending...' : 'Send notification'}
                        </button>
                    </form>
                </section>
            )}

            <section className="rounded-lg border border-blue-100 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-blue-100 bg-blue-50 px-6 py-4">
                    <h2 className="text-xl font-black uppercase tracking-wide text-slate-900">My notifications</h2>
                    <div className="flex gap-2">
                        {notifications.some((item) => !item.read) && (
                            <button type="button" onClick={markAllAsRead} className="btn-secondary">Read them all</button>
                        )}
                        {notifications.length > 0 && (
                            <button
                                type="button"
                                onClick={deleteAllNotifications}
                                disabled={deleting}
                                title="Delete all notifications"
                                className="btn-secondary flex items-center gap-1.5 !text-red-600 hover:!bg-red-50 hover:!border-red-200 transition-colors disabled:opacity-50"
                            >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                {deleting ? 'Deleting...' : 'Delete all'}
                            </button>
                        )}
                        <button type="button" onClick={fetchNotifications} title="Refresh" className="btn-secondary h-9 w-9 p-0 inline-flex items-center justify-center text-sm font-bold">↻</button>
                    </div>
                </div>
                <div className="divide-y divide-blue-50">
                    {loading ? (
                        <div className="p-8 text-center text-slate-500">Loading...</div>
                    ) : notifications.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">No announcement yet.</div>
                    ) : notifications.map((item) => (
                        <article key={item.id} onClick={() => markAsRead(item.id)} className={`cursor-pointer px-6 py-5 ${item.read ? 'bg-white' : 'bg-blue-50/70'}`}>
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                                <div className="flex items-center gap-2">
                                    <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-600">
                                        {ROLE_LABELS[item.targetRole] ?? item.targetRole ?? 'Individual'}
                                    </p>
                                    {item.senderEmail && item.senderEmail === email && (
                                        <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                                            Sent
                                        </span>
                                    )}
                                    {item.senderEmail && item.senderEmail !== email && (
                                        <span className="text-[10px] text-slate-400">← from {item.senderEmail}</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-3">
                                    {item.actionUrl && (
                                        <a href={item.actionUrl} className="text-xs font-bold text-[#0f63c9] hover:underline flex items-center gap-1">
                                            See details →
                                        </a>
                                    )}
                                    <button
                                        type="button"
                                        onClick={(e) => deleteSingleNotification(item.id, e)}
                                        title="Delete this notification"
                                        className="p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                    >
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            <h3 className="mt-2 font-black text-slate-900 break-words">{item.title}</h3>
                            <p className="mt-2 text-sm leading-6 text-slate-600 break-words whitespace-pre-wrap">{item.body}</p>
                            <p className="mt-3 text-xs text-slate-400">{item.createdAt ? new Date(item.createdAt).toLocaleString('en-GB') : ''}</p>
                        </article>
                    ))}
                </div>
            </section>
        </div>
    );
}
