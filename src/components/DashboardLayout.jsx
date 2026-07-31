import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import NotificationBell from './NotificationBell';

const managerRoles = new Set(['ADMIN', 'COORDINATOR', 'STAFF', 'JUDGE', 'MENTOR']);

const coordinatorGroups = [
    {
        title: 'Vận hành',
        items: [
            { to: '/dashboard', label: 'Tổng quan', match: ['/dashboard'] },
            { to: '/dashboard/notifications', label: 'Thông báo' },
        ],
    },
    {
        title: 'Quản lý Giải đấu',
        items: [
            { to: '/dashboard/events', label: 'Quản lý sự kiện' },
            { to: '/dashboard/scoring-config', label: 'Cấu hình chấm điểm' },
            { to: '/dashboard/teams', label: 'Đội thi' },
            { to: '/dashboard/submissions', label: 'Bài nộp' },
        ],
    },
    {
        title: 'Chấm điểm & Kết quả',
        items: [
            { to: '/dashboard/scoring-stats', label: 'Thống kê điểm' },
            { to: '/dashboard/leaderboard', label: 'Bảng xếp hạng' },
            { to: '/dashboard/audit-logs', label: 'Audit điểm' },
        ],
    },
];

const adminGroups = [
    {
        title: 'Quản trị hệ thống',
        items: [
            { to: '/dashboard', label: 'Tổng quan hệ thống', match: ['/dashboard'] },
            { to: '/dashboard/users', label: 'Tài khoản & phân quyền' },
            { to: '/dashboard/student-approval', label: 'Phê duyệt tài khoản' },
            { to: '/dashboard/staff', label: 'Quản lý staff' },
            { to: '/dashboard/monitoring', label: 'Giám sát hệ thống' },
        ],
    },
    {
        title: 'Vận hành cuộc thi',
        items: [
            { to: '/dashboard/events', label: 'Sự kiện (chỉ xem)' },
            { to: '/dashboard/scoring-config', label: 'Cấu hình điểm (chỉ xem)' },
            { to: '/dashboard/submissions', label: 'Bài nộp' },
        ],
    },
    {
        title: 'Chấm điểm & kết quả',
        items: [
            { to: '/dashboard/grading', label: 'Tiến độ chấm (chỉ xem)' },
            { to: '/dashboard/scoring-stats', label: 'Thống kê điểm' },
            { to: '/dashboard/leaderboard', label: 'Bảng xếp hạng' },
            { to: '/dashboard/audit-logs', label: 'Audit điểm' },
        ],
    },
    {
        title: 'Truyền thông',
        items: [
            { to: '/dashboard/notifications', label: 'Thông báo (chỉ xem)' },
        ],
    },
    {
        title: 'Vận hành dữ liệu',
        items: [
            { to: '/dashboard/backups', label: 'Sao lưu & khôi phục' },
            { to: '/dashboard/settings', label: 'Cấu hình hệ thống' },
        ],
    },
];

const judgeGroups = [
    {
        title: 'Judge',
        items: [
            { to: '/dashboard', label: 'Tổng quan', match: ['/dashboard'] },
            { to: '/dashboard/grading', label: 'Chấm bài' },
            { to: '/dashboard/scoring-stats', label: 'Thống kê điểm' },
            { to: '/dashboard/leaderboard', label: 'Bảng xếp hạng' },
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
        ],
    },
];

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

function getGroups(role) {
    if (role === 'ADMIN') return adminGroups;
    if (role === 'COORDINATOR') return coordinatorGroups;
    if (role === 'JUDGE') return judgeGroups;
    if (role === 'MENTOR') return mentorGroups;
    return [];
}

function getStaffGroups(assignments) {
    const groups = [{
        title: 'Staff',
        items: [
            { to: '/dashboard', label: 'Tổng quan', match: ['/dashboard'] },
        ],
    }];
    if (assignments.mentor) {
        groups.push({
            title: 'Nhiệm vụ Mentor',
            items: [
                { to: '/dashboard/teams', label: 'Đội được hướng dẫn' },
                { to: '/dashboard/chat', label: 'Chat với đội' },
            ],
        });
    }
    if (assignments.judge) {
        groups.push({
            title: 'Nhiệm vụ Judge',
            items: [
                { to: '/dashboard/grading', label: 'Bài cần chấm' },
                { to: '/dashboard/leaderboard', label: 'Bảng xếp hạng' },
            ],
        });
    }
    return groups;
}

export default function DashboardLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const storedRole = localStorage.getItem('role');
    const role = ['MENTOR', 'JUDGE'].includes(storedRole) ? 'STAFF' : storedRole;
    const email = localStorage.getItem('email');
    const [assignments, setAssignments] = useState({ mentor: role === 'MENTOR', judge: role === 'JUDGE' });
    const [pendingCount, setPendingCount] = useState(0);
    const [pendingGradingCount, setPendingGradingCount] = useState(0);
    const [pendingChatCount, setPendingChatCount] = useState(0);

    const fetchPendingStudentsRef = useRef(null);

    useEffect(() => {
        let active = true;

        const fetchPendingStudents = () => {
            if (storedRole !== 'ADMIN') return;
            axiosClient.get('/users')
                .then((response) => {
                    const list = response.result || [];
                    const count = list.filter(user => user.role === 'USER' && user.status === 'PENDING').length;
                    setPendingCount(count);
                })
                .catch(() => {});
        };

        fetchPendingStudentsRef.current = fetchPendingStudents;

        const fetchData = async () => {
            // 1. Fetch pending accounts (Admin only)
            fetchPendingStudents();

            // 2. Fetch pending grading (Judge assignment only)
            if (assignments.judge) {
                try {
                    const [submissionRes, eventRes] = await Promise.all([
                        axiosClient.get('/submissions'),
                        axiosClient.get('/events').catch(() => ({ result: [] })),
                    ]);
                    
                    if (active) {
                        const subs = submissionRes.result || [];
                        const evts = eventRes.result || [];
                        
                        const matrixMap = new Map();
                        evts.forEach((event) => 
                            (event.matrices || []).forEach((matrix) => 
                                matrixMap.set(String(matrix.id), matrix)
                            )
                        );
                        
                        const visible = subs.filter((sub) => {
                            const matrix = matrixMap.get(String(sub.matrixId));
                            return (matrix?.judges || []).some((judge) => judge.email === email);
                        });
                        
                        const count = visible.filter((sub) => !sub.graded).length;
                        setPendingGradingCount(count);
                    }
                } catch (err) {
                    // Ignore
                }
            }

            // 3. Fetch pending chat messages (Mentor assignment only)
            if (assignments.mentor) {
                try {
                    const [teamRes, eventRes] = await Promise.all([
                        axiosClient.get('/teams'),
                        axiosClient.get('/events'),
                    ]);
                    
                    if (active) {
                        const allTeams = teamRes.result || [];
                        const allEvents = eventRes.result || [];
                        
                        const trackIds = new Set(
                            allEvents
                                .flatMap((event) => event.matrices || [])
                                .filter((matrix) => (matrix.mentors || []).some((mentor) => mentor.email === email))
                                .map((matrix) => String(matrix.trackId))
                        );
                        
                        const myTeams = allTeams.filter((team) => trackIds.has(String(team.trackId)));
                        
                        // Fetch chat messages for each team
                        const chatPromises = myTeams.map(team => 
                            axiosClient.get(`/chat/teams/${team.id}`)
                                .then(res => ({ teamId: team.id, messages: res.result || [] }))
                                .catch(() => ({ teamId: team.id, messages: [] }))
                        );
                        
                        const chatResults = await Promise.all(chatPromises);
                        
                        if (active) {
                            let unreadCount = 0;
                            chatResults.forEach(res => {
                                const msgList = res.messages;
                                if (msgList.length > 0) {
                                    const lastMsg = msgList[msgList.length - 1];
                                    if (lastMsg.senderEmail !== email) {
                                        const lastReadId = localStorage.getItem(`lastReadChat_${res.teamId}`);
                                        if (String(lastReadId) !== String(lastMsg.id)) {
                                            unreadCount += 1;
                                        }
                                    }
                                }
                            });
                            setPendingChatCount(unreadCount);
                        }
                    }
                } catch (err) {
                    // Ignore
                }
            }
        };

        const handleChatRead = () => {
            fetchData();
        };
        const handleStatusChanged = (e) => {
            // Đọc trực tiếp từ CustomEvent.detail — không cần gọi thêm API
            if (e.detail && e.detail.pendingCount !== undefined) {
                setPendingCount(e.detail.pendingCount);
            }
        };
        window.addEventListener('chatRead', handleChatRead);
        window.addEventListener('studentStatusChanged', handleStatusChanged);

        fetchData();
        return () => {
            active = false;
            window.removeEventListener('chatRead', handleChatRead);
            window.removeEventListener('studentStatusChanged', handleStatusChanged);
        };

    }, [storedRole, assignments.judge, assignments.mentor, email, location.pathname]);

    useEffect(() => {
        if (!['STAFF', 'MENTOR', 'JUDGE'].includes(role)) return;
        let active = true;
        axiosClient.get('/users/me/assignments')
            .then((response) => {
                if (active) setAssignments(response.result || { mentor: false, judge: false });
            })
            .catch(() => {
                if (active) setAssignments({ mentor: role === 'MENTOR', judge: role === 'JUDGE' });
            });
        return () => { active = false; };
    }, [role]);

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

    const isTabActive = (item) => {
        const activePath = item.activePath || item.to;
        if (item.match) return item.match.includes(location.pathname);
        return location.pathname === activePath;
    };

    const currentPageTitle = location.pathname === '/dashboard' && role === 'ADMIN'
        ? 'Tổng quan hệ thống'
        : pageTitles[location.pathname] || 'Dashboard';

    const currentGroups = (['STAFF', 'MENTOR', 'JUDGE'].includes(role) ? getStaffGroups(assignments) : getGroups(role));
    const allNavItems = currentGroups.flatMap(group => group.items);

    return (
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
            {/* Top Sub-Navigation Bar for Dashboard */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-100 pb-4">
                    <div>
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-[#0f63c9]">
                            {role} DASHBOARD
                        </span>
                        <h1 className="mt-1 text-2xl font-black text-slate-900 tracking-tight">{currentPageTitle}</h1>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                        <span>Đăng nhập bởi: <strong className="text-slate-800">{email}</strong></span>
                    </div>
                </div>

                {/* Subnav Tabs */}
                <div className="mt-4 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    {allNavItems.map((item) => {
                        const active = isTabActive(item);
                        return (
                            <Link
                                key={item.to}
                                to={item.to}
                                className={`inline-flex items-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-extrabold transition-all ${
                                    active
                                        ? 'bg-[#0f63c9] text-white shadow-sm'
                                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                }`}
                            >
                                <span>{item.label}</span>
                                {item.to === '/dashboard/student-approval' && pendingCount > 0 && (
                                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white">
                                        {pendingCount}
                                    </span>
                                )}
                                {item.to === '/dashboard/grading' && pendingGradingCount > 0 && (
                                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white">
                                        {pendingGradingCount}
                                    </span>
                                )}
                                {item.to === '/dashboard/chat' && pendingChatCount > 0 && (
                                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white">
                                        {pendingChatCount}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* Dashboard Main Content Area */}
            <main className="min-h-[500px]">
                <Outlet />
            </main>
        </div>
    );
}
