import { Link, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';

const managerRoles = new Set(['ADMIN', 'COORDINATOR', 'JUDGE', 'MENTOR']);

const coordinatorGroups = [
    {
        title: 'Vận hành',
        items: [
            { to: '/dashboard', label: 'Tổng quan', match: ['/dashboard'] },
            { to: '/dashboard/notifications', label: 'Thông báo' },
        ],
    },
    {
        title: 'Sự kiện',
        items: [
            { to: '/dashboard/events', label: 'Cấu hình sự kiện' },
            { to: '/dashboard/teams', label: 'Đội thi' },
            { to: '/dashboard/submissions', label: 'Bài nộp' },
        ],
    },
    {
        title: 'Tài khoản',
        items: [
            { to: '/dashboard/student-approval', label: 'Phê duyệt thí sinh' },
            { to: '/dashboard/staff', label: 'Quản lý staff' },
        ],
    },
    {
        title: 'Chấm điểm',
        items: [
            { to: '/dashboard/grading', label: 'Chấm bài' },
            { to: '/dashboard/scoring-stats', label: 'Thống kê điểm' },
            { to: '/dashboard/leaderboard', label: 'Bảng xếp hạng' },
            { to: '/dashboard/audit-logs', label: 'Audit điểm' },
        ],
    },
];

const judgeGroups = [
    {
        title: 'Judge',
        items: [
            { to: '/dashboard', label: 'Tổng quan', match: ['/dashboard'] },
            { to: '/dashboard/grading', label: 'Chấm bài' },
            { to: '/dashboard/leaderboard', label: 'Bảng xếp hạng' },
            { to: '/dashboard/notifications', label: 'Thông báo' },
        ],
    },
];

const mentorGroups = [
    {
        title: 'Mentor',
        items: [
            { to: '/dashboard', label: 'Tổng quan', match: ['/dashboard'] },
            { to: '/dashboard/teams', label: 'Đội phụ trách' },
            { to: '/dashboard/chat', label: 'Trao đổi với đội' },
            { to: '/dashboard/notifications', label: 'Thông báo' },
        ],
    },
];

const pageTitles = {
    '/dashboard': 'Tổng quan',
    '/dashboard/events': 'Cấu hình sự kiện',
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

function getGroups(role) {
    if (role === 'COORDINATOR' || role === 'ADMIN') return coordinatorGroups;
    if (role === 'JUDGE') return judgeGroups;
    return mentorGroups;
}

export default function DashboardLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const role = localStorage.getItem('role');
    const email = localStorage.getItem('email');

    if (!managerRoles.has(role)) {
        return <Navigate to="/my-team" replace />;
    }

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('email');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const isActive = (item) => {
        const activePath = item.activePath || item.to;
        if (item.match) return item.match.includes(location.pathname);
        return location.pathname === activePath;
    };

    const navClass = (item) => (
        isActive(item)
            ? 'dashboard-nav-link is-active'
            : 'dashboard-nav-link'
    );

    return (
        <div className="dashboard-shell">
            <aside className="dashboard-sidebar">
                <div className="flex h-20 items-center gap-3 border-b border-[#d7e6f8] px-5">
                    <Link to="/" className="brand-mark" aria-label="SEAL trang chủ">
                        <span className="brand-mark-text">SEAL</span>
                    </Link>
                    <div className="sidebar-copy min-w-0">
                        <p className="truncate text-sm font-black text-[#071936]">SEAL Dashboard</p>
                        <p className="text-xs font-semibold text-[#5c6d83]">{role}</p>
                    </div>
                </div>

                <nav className="flex-1 space-y-5 overflow-y-auto p-4">
                    {getGroups(role).map((group) => (
                        <section key={group.title}>
                            <p className="sidebar-label mb-2 px-3 text-[11px] font-black uppercase tracking-[0.14em] text-[#748195]">
                                {group.title}
                            </p>
                            <div className="space-y-1">
                                {group.items.map((item) => (
                                    <Link key={item.to} to={item.to} className={navClass(item)} title={item.label}>
                                        {item.label}
                                    </Link>
                                ))}
                            </div>
                        </section>
                    ))}
                </nav>

                <div className="border-t border-[#d7e6f8] p-4">
                    <Link to="/dashboard/profile" className={`mb-3 block rounded-lg px-3 py-2.5 text-sm font-bold ${navClass({ to: '/dashboard/profile' })}`}>
                        Hồ sơ
                    </Link>
                    <button type="button" onClick={logout} className="btn-secondary w-full">Đăng xuất</button>
                </div>
            </aside>

            <div className="flex min-w-0 flex-1 flex-col">
                <header className="dashboard-topbar">
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-[#0f63c9]">SEAL Hackathon</p>
                        <h1 className="mt-1 text-xl font-black text-[#071936]">{pageTitles[location.pathname] || 'Dashboard'}</h1>
                    </div>
                    <p className="account-email max-w-sm truncate text-sm font-semibold text-[#5c6d83]">{email}</p>
                </header>

                <main className="dashboard-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
