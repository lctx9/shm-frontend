import { Navigate, Outlet, useLocation } from 'react-router-dom';
import NotificationBell from './NotificationBell';
import Sidebar from './Sidebar';

const managerRoles = new Set(['ADMIN', 'COORDINATOR', 'STAFF', 'JUDGE', 'MENTOR']);

const pageTitles = {
    '/dashboard/users': 'Tài khoản & phân quyền',
    '/dashboard/monitoring': 'Giám sát hệ thống',
    '/dashboard/backups': 'Sao lưu & khôi phục',
    '/dashboard/settings': 'Cấu hình hệ thống',
    '/dashboard': 'Tổng quan',
    '/dashboard/events': 'Quản lý sự kiện',
    '/dashboard/scoring-config': 'Cấu hình chấm điểm',
    '/dashboard/teams': 'Đội thi',
    '/dashboard/submissions': 'Bài nộp',
    '/dashboard/student-approval': 'Phê duyệt thí sinh',
    '/dashboard/staff': 'Quản lý staff',
    '/dashboard/grading': 'Chấm bài',
    '/dashboard/scoring-stats': 'Thống kê điểm',
    '/dashboard/leaderboard': 'Bảng xếp hạng',
    '/dashboard/notifications': 'Thông báo',
    '/dashboard/audit-logs': 'Audit điểm',
    '/dashboard/chat': 'Trao đổi với đội',
    '/dashboard/profile': 'Hồ sơ',
};

export default function DashboardLayout() {
    const location = useLocation();
    const role = localStorage.getItem('role');

    if (!managerRoles.has(role)) {
        return <Navigate to="/my-team" replace />;
    }

    const currentPageTitle = location.pathname === '/dashboard' && role === 'ADMIN'
        ? 'Tổng quan hệ thống'
        : pageTitles[location.pathname] || 'Dashboard';

    return (
        <div className="dashboard-shell">
            <Sidebar />

            <div className="flex min-w-0 flex-1 flex-col">
                <header className="dashboard-topbar">
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-[#0f63c9]">SEAL Hackathon</p>
                        <h1 className="mt-1 text-xl font-black text-[#071936]">{currentPageTitle}</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <NotificationBell />
                    </div>
                </header>

                <main className="dashboard-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
