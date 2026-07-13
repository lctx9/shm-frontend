import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';

const managerRoles = new Set(['ADMIN', 'COORDINATOR', 'STAFF', 'JUDGE', 'MENTOR']);

function formatTime(value) {
    if (!value) return '';
    const date = new Date(value);
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return 'Vừa xong';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} phút trước`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} giờ trước`;
    return date.toLocaleDateString('vi-VN');
}

export default function NotificationBell() {
    const navigate = useNavigate();
    const rootRef = useRef(null);
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const role = localStorage.getItem('role');
    const allNotificationsUrl = managerRoles.has(role) ? '/dashboard/notifications' : '/notifications';
    const unreadCount = notifications.filter((item) => !item.read).length;

    const loadNotifications = async (quiet = false) => {
        if (!quiet) setLoading(true);
        try {
            const response = await axiosClient.get('/notifications');
            setNotifications(response.result || []);
        } catch {
            // The bell stays usable even when a background refresh temporarily fails.
        } finally {
            if (!quiet) setLoading(false);
        }
    };

    useEffect(() => {
        loadNotifications();
        const intervalId = window.setInterval(() => loadNotifications(true), 30000);
        const refresh = () => loadNotifications(true);
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
                loadNotifications(true);
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
            loadNotifications(true);
        }
    };

    return (
        <div ref={rootRef} className="relative">
            <button
                type="button"
                className="notification-bell"
                onClick={() => setOpen((current) => !current)}
                aria-label={unreadCount ? `${unreadCount} thông báo chưa đọc` : 'Thông báo'}
                aria-expanded={open}
            >
                <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
                </svg>
                {unreadCount > 0 && <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
            </button>

            {open && (
                <div className="notification-dropdown" role="dialog" aria-label="Thông báo gần đây">
                    <div className="flex items-center justify-between border-b border-[#d7e6f8] px-4 py-3">
                        <div>
                            <p className="font-black text-[#071936]">Thông báo</p>
                            <p className="mt-0.5 text-xs text-[#718096]">{unreadCount ? `${unreadCount} thông báo chưa đọc` : 'Bạn đã xem tất cả'}</p>
                        </div>
                        {unreadCount > 0 && <button type="button" onClick={markAllAsRead} className="text-xs font-bold text-[#0f63c9] hover:underline">Đọc tất cả</button>}
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {loading ? (
                            <p className="px-4 py-8 text-center text-sm text-[#718096]">Đang tải...</p>
                        ) : notifications.length === 0 ? (
                            <div className="px-6 py-10 text-center">
                                <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#eaf3ff] text-[#0f63c9]">✓</span>
                                <p className="mt-3 text-sm font-bold text-[#334860]">Chưa có thông báo mới</p>
                            </div>
                        ) : notifications.slice(0, 6).map((item) => (
                            <button key={item.id} type="button" onClick={() => markAsRead(item)} className={`notification-item ${item.read ? '' : 'is-unread'}`}>
                                <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${item.read ? 'bg-transparent' : 'bg-[#0f63c9]'}`} />
                                <span className="min-w-0 text-left">
                                    <span className="block truncate text-sm font-extrabold text-[#071936]">{item.title}</span>
                                    <span className="mt-1 line-clamp-2 block text-xs leading-5 text-[#5c6d83]">{item.body}</span>
                                    <span className="mt-1.5 block text-[11px] font-semibold text-[#8a98a9]">{formatTime(item.createdAt)}</span>
                                </span>
                            </button>
                        ))}
                    </div>

                    <Link to={allNotificationsUrl} onClick={() => setOpen(false)} className="block border-t border-[#d7e6f8] px-4 py-3 text-center text-xs font-black text-[#0f63c9] hover:bg-[#f4f8ff]">
                        Xem tất cả thông báo
                    </Link>
                </div>
            )}
        </div>
    );
}
