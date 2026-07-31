import { Navigate, Outlet, useLocation } from 'react-router-dom';
import NotificationBell from './NotificationBell';
import Sidebar from './Sidebar';

const managerRoles = new Set(['ADMIN', 'COORDINATOR', 'STAFF', 'JUDGE', 'MENTOR']);

const pageTitles = {
    '/dashboard/users': 'Accounts & Permissions',
    '/dashboard/monitoring': 'System Monitoring',
    '/dashboard/backups': 'Backups & Restores',
    '/dashboard/settings': 'System Settings',
    '/dashboard': 'Overview',
    '/dashboard/events': 'Event Management',
    '/dashboard/scoring-config': 'Scoring Configuration',
    '/dashboard/teams': 'Teams',
    '/dashboard/submissions': 'Submissions',
    '/dashboard/student-approval': 'Account Approvals',
    '/dashboard/staff': 'Staff Management',
    '/dashboard/grading': 'Grading',
    '/dashboard/scoring-stats': 'Scoring Statistics',
    '/dashboard/leaderboard': 'Leaderboard',
    '/dashboard/notifications': 'Notifications',
    '/dashboard/audit-logs': 'Scoring Audit',
    '/dashboard/chat': 'Team Chat',
    '/dashboard/profile': 'Profile',
};

export default function DashboardLayout() {
    const location = useLocation();
    const role = localStorage.getItem('role');

    if (!managerRoles.has(role)) {
        return <Navigate to="/my-team" replace />;
    }

    const currentPageTitle = location.pathname === '/dashboard' && role === 'ADMIN'
        ? 'System Overview'
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
