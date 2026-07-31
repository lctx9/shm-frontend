import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axiosClient from '../api/axiosClient';

const managerRoles = new Set(['ADMIN', 'COORDINATOR', 'STAFF', 'JUDGE', 'MENTOR']);

function formatTime(value) {
    if (!value) return '';
    const date = new Date(value);
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return date.toLocaleDateString('en-GB');
}

export default function NotificationBell() {
    const navigate = useNavigate();
    const location = useLocation();
    const rootRef = useRef(null);
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [invitations, setInvitations] = useState([]);
    const [loading, setLoading] = useState(true);
    // Track which invitations have been acted on in this session
    const [acceptedInvId, setAcceptedInvId] = useState(null);
    const [processingInvId, setProcessingInvId] = useState(null);
    const role = localStorage.getItem('role');
    const isParticipant = !managerRoles.has(role);
    const allNotificationsUrl = managerRoles.has(role) ? '/dashboard/notifications' : '/notifications';
    const isNotificationPage = location.pathname === allNotificationsUrl;
    const unreadCount = isNotificationPage ? 0 : notifications.filter((item) => !item.read).length;

    const loadData = async (quiet = false) => {
        if (!quiet) setLoading(true);
        try {
            const [notifRes, invRes] = await Promise.allSettled([
                axiosClient.get('/notifications'),
                isParticipant ? axiosClient.get('/teams/my-invitations') : Promise.resolve({ result: [] }),
            ]);
            setNotifications(notifRes.status === 'fulfilled' ? notifRes.value.result || [] : []);
            setInvitations(invRes.status === 'fulfilled' ? invRes.value.result || [] : []);
        } catch {
            // bell stays usable
        } finally {
            if (!quiet) setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
        const intervalId = window.setInterval(() => loadData(true), 30000);
        const refresh = () => loadData(true);
        window.addEventListener('notifications:refresh', refresh);
        return () => {
            window.clearInterval(intervalId);
            window.removeEventListener('notifications:refresh', refresh);
        };
    }, []);

    useEffect(() => {
        const handlePointerDown = (event) => {
            if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false);
        };
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') setOpen(false);
        };
        document.addEventListener('mousedown', handlePointerDown);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handlePointerDown);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    const markAsRead = async (item) => {
        if (!item.read) {
            setNotifications((current) => current.map((row) => row.id === item.id ? { ...row, read: true } : row));
            try {
                await axiosClient.patch(`/notifications/${item.id}/read`);
                window.dispatchEvent(new Event('notifications:refresh'));
            } catch {
                loadData(true);
            }
        }
        setOpen(false);
        navigate(item.actionUrl || allNotificationsUrl);
    };

    const markAllAsRead = async () => {
        setNotifications((current) => current.map((item) => ({ ...item, read: true })));
        try {
            await axiosClient.patch('/notifications/read-all');
            window.dispatchEvent(new Event('notifications:refresh'));
        } catch {
            loadData(true);
        }
    };

    const handleAcceptInvitation = async (inv) => {
        if (acceptedInvId || processingInvId) return;
        setProcessingInvId(inv.id);
        try {
            await axiosClient.post(`/teams/invitations/${inv.id}/accept`);
            setAcceptedInvId(inv.id);
            // Remove all other pending invitations from state (disable them)
            setInvitations((prev) => prev.map((i) =>
                i.id === inv.id
                    ? { ...i, status: 'APPROVED' }
                    : { ...i, status: 'DISABLED' }
            ));
            window.dispatchEvent(new Event('notifications:refresh'));
            // Navigate to team page after a short delay
            setTimeout(() => {
                setOpen(false);
                navigate('/my-team');
            }, 1200);
        } catch (err) {
            console.error('Failed to accept invitation:', err);
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
            console.error('Failed to reject invitation:', err);
        } finally {
            setProcessingInvId(null);
        }
    };

    const pendingInvitations = invitations.filter((inv) => inv.status === 'PENDING' || inv.status === 'DISABLED');
    const totalUnread = unreadCount + (isParticipant ? pendingInvitations.filter(i => i.status === 'PENDING').length : 0);

    return (
        <div ref={rootRef} className="relative">
            <button
                type="button"
                className="notification-bell"
                onClick={() => setOpen((current) => !current)}
                aria-label={totalUnread ? `${totalUnread} unread notification` : "Notification"}
                aria-expanded={open}
            >
                <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
                </svg>
                {totalUnread > 0 && <span className="notification-badge">{totalUnread > 99 ? '99+' : totalUnread}</span>}
            </button>

            {open && (
                <div className="notification-dropdown" role="dialog" aria-label="Recent announcements">
                    <div className="flex items-center justify-between border-b border-[#d7e6f8] px-4 py-3">
                        <div>
                            <p className="font-black text-[#071936]">Notifications</p>
                            <p className="mt-0.5 text-xs text-[#718096]">{totalUnread ? `${totalUnread} unread` : "You're all caught up"}</p>
                        </div>
                        {unreadCount > 0 && <button type="button" onClick={markAllAsRead} className="text-xs font-bold text-[#0f63c9] hover:underline">Read all</button>}
                    </div>

                    <div className="max-h-[480px] overflow-y-auto">
                        {loading ? (
                            <p className="px-4 py-8 text-center text-sm text-[#718096]">Loading...</p>
                        ) : (
                            <>
                                {/* Team Invitation Cards */}
                                {isParticipant && pendingInvitations.length > 0 && (
                                    <div className="border-b border-[#d7e6f8]">
                                        <p className="px-4 pt-3 pb-1 text-[10px] font-black uppercase tracking-widest text-[#0f63c9]">
                                            Team Invitations ({pendingInvitations.filter(i => i.status === 'PENDING').length} pending)
                                        </p>
                                        {pendingInvitations.map((inv) => {
                                            const isDisabled = inv.status === 'DISABLED';
                                            const isAccepted = inv.id === acceptedInvId;
                                            const isProcessing = processingInvId === inv.id;
                                            return (
                                                <div
                                                    key={inv.id}
                                                    className={`px-4 py-3 border-b border-[#f0f5ff] last:border-0 ${isDisabled ? 'opacity-40' : ''}`}
                                                >
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="min-w-0">
                                                            <p className="text-xs font-black text-[#071936] truncate">{inv.teamName}</p>
                                                            <p className="text-[11px] text-[#5c6d83] truncate">{inv.eventName}</p>
                                                            {inv.trackName && (
                                                                <span className="inline-block mt-0.5 text-[10px] font-bold text-[#0f63c9] bg-blue-50 px-1.5 py-0.5 rounded">
                                                                    {inv.trackName}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {isAccepted ? (
                                                            <span className="shrink-0 text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-full">
                                                                ✓ Joined
                                                            </span>
                                                        ) : isDisabled ? (
                                                            <span className="shrink-0 text-[10px] font-bold text-slate-400 bg-slate-50 border border-slate-200 px-2 py-1 rounded-full">
                                                                Unavailable
                                                            </span>
                                                        ) : (
                                                            <div className="flex gap-1.5 shrink-0">
                                                                <button
                                                                    type="button"
                                                                    disabled={isProcessing || !!acceptedInvId}
                                                                    onClick={() => handleAcceptInvitation(inv)}
                                                                    className="text-[11px] font-black px-2.5 py-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-60 cursor-pointer"
                                                                >
                                                                    {isProcessing ? '...' : '✓ Accept'}
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    disabled={isProcessing || !!acceptedInvId}
                                                                    onClick={() => handleRejectInvitation(inv)}
                                                                    className="text-[11px] font-black px-2.5 py-1 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-60 cursor-pointer"
                                                                >
                                                                    ✕
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                    {inv.inviterName && (
                                                        <p className="mt-1 text-[10px] text-[#8a98a9]">from {inv.inviterName}</p>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Regular Notifications */}
                                {notifications.length === 0 && pendingInvitations.length === 0 ? (
                                    <div className="px-6 py-10 text-center">
                                        <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#eaf3ff] text-[#0f63c9]">✓</span>
                                        <p className="mt-3 text-sm font-bold text-[#334860]">No new notifications</p>
                                    </div>
                                ) : notifications.slice(0, 5).map((item) => (
                                    <button key={item.id} type="button" onClick={() => markAsRead(item)} className={`notification-item ${item.read ? '' : 'is-unread'}`}>
                                        <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${item.read ? 'bg-transparent' : 'bg-[#0f63c9]'}`} />
                                        <span className="min-w-0 text-left">
                                            <span className="block truncate text-sm font-extrabold text-[#071936]">{item.title}</span>
                                            <span className="mt-1 line-clamp-2 block text-xs leading-5 text-[#5c6d83]">{item.body}</span>
                                            <span className="mt-1.5 block text-[11px] font-semibold text-[#8a98a9]">{formatTime(item.createdAt)}</span>
                                        </span>
                                    </button>
                                ))}
                            </>
                        )}
                    </div>

                    <Link to={allNotificationsUrl} onClick={() => setOpen(false)} className="block border-t border-[#d7e6f8] px-4 py-3 text-center text-xs font-black text-[#0f63c9] hover:bg-[#f4f8ff]">
                        See all notifications
                    </Link>
                </div>
            )}
        </div>
    );
}
