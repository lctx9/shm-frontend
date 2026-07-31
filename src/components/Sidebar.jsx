import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import logoFpt from '../assets/fpt.jpg';

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

export default function Sidebar() {
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
            fetchPendingStudents();

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
        <aside className="dashboard-sidebar shadow-xl" style={{ background: '#ffffff', borderRight: '1px solid #e2e8f0' }}>
            <div className="flex h-20 items-center gap-3 px-5" style={{ borderBottom: '1px solid #e2e8f0' }}>
                <Link to="/" className="flex items-center gap-2">
                    <img src={logoFpt} alt="FPT Logo" style={{ width: '40px', height: '30px' }} className="object-contain rounded" />
                    <div className="h-6 border-l border-slate-300"></div>
                    <div className="flex flex-col relative -top-[1px]">
                        <span className="text-[20px] font-black leading-none text-slate-900 brand-mark-text">seal.</span>
                        <span className="text-[10px] font-black uppercase leading-none tracking-widest text-[#2c4e66] mt-0.5">Hackathon</span>
                    </div>
                </Link>
            </div>

            <nav className="flex-1 space-y-5 overflow-y-auto p-4">
                {(['STAFF', 'MENTOR', 'JUDGE'].includes(role) ? getStaffGroups(assignments) : getGroups(role)).map((group) => (
                    <section key={group.title}>
                        <p className="sidebar-label mb-2 px-3 text-[11px] font-black uppercase tracking-[0.16em] text-[#0f63c9]">
                            {group.title}
                        </p>
                        <div className="space-y-1">
                            {group.items.map((item) => (
                                <Link 
                                    key={item.to} 
                                    to={item.to} 
                                    className={navClass(item)} 
                                    title={item.label}
                                >
                                    <span>{item.label}</span>
                                    {item.to === '/dashboard/student-approval' && pendingCount > 0 && (
                                        <span className="ml-2 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white shadow-sm">
                                            {pendingCount}
                                        </span>
                                    )}
                                    {item.to === '/dashboard/grading' && pendingGradingCount > 0 && (
                                        <span className="ml-2 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white shadow-sm">
                                            {pendingGradingCount}
                                        </span>
                                    )}
                                    {item.to === '/dashboard/chat' && pendingChatCount > 0 && (
                                        <span className="ml-2 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white shadow-sm">
                                            {pendingChatCount}
                                        </span>
                                    )}
                                </Link>
                            ))}
                        </div>
                    </section>
                ))}
            </nav>

            <div className="p-4 space-y-3" style={{ borderTop: '1px solid #e2e8f0' }}>
                <div className="flex items-center gap-2.5 rounded-xl p-2.5" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-black" style={{ background: '#eaf3ff', border: '1px solid #d7e6f8', color: '#0f63c9' }}>
                        {(email || 'U').charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold text-[#0b1f3f]" title={email}>{email}</p>
                        <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#0f63c9] mt-0.5">{role}</p>
                    </div>
                </div>

                <Link to="/dashboard/profile" className={`block rounded-lg px-3 py-2 text-sm font-bold ${navClass({ to: '/dashboard/profile' })}`}>
                    Hồ sơ
                </Link>
                <button type="button" onClick={logout} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-black uppercase tracking-wider text-slate-700 hover:bg-rose-600 hover:text-white hover:border-rose-500 transition-all shadow-sm">Đăng xuất</button>
            </div>
        </aside>
    );
}
