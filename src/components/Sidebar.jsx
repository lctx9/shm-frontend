import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import logoFpt from '../assets/fpt.jpg';

const coordinatorGroups = [
    {
        title: 'Operations',
        items: [
            { to: '/dashboard', label: 'Overview', match: ['/dashboard'] },
            { to: '/dashboard/notifications', label: 'Notifications' },
        ],
    },
    {
        title: 'Tournament Management',
        items: [
            { to: '/dashboard/events?tab=overview', label: 'Event Management', activePath: '/dashboard/events' },
            { to: '/dashboard/scoring-config', label: 'Scoring Configuration' },
            { to: '/dashboard/teams', label: 'Teams' },
            { to: '/dashboard/submissions', label: 'Submissions' },
            { to: '/dashboard/student-approval', label: 'Account Approvals' },
        ],
    },
    {
        title: 'Grading & Results',
        items: [
            { to: '/dashboard/scoring-stats', label: 'Scoring Statistics' },
            { to: '/dashboard/leaderboard', label: 'Leaderboard' },
            { to: '/dashboard/audit-logs', label: 'Scoring Audit' },
        ],
    },
];

const adminGroups = [
    {
        title: 'System Administration',
        items: [
            { to: '/dashboard', label: 'System Overview', match: ['/dashboard'] },
            { to: '/dashboard/users', label: 'Accounts & Permissions' },
            { to: '/dashboard/staff', label: 'Staff Management' },
            { to: '/dashboard/monitoring', label: 'System Monitoring' },
        ],
    },
    {
        title: 'Grading & Results',
        items: [
            { to: '/dashboard/scoring-stats', label: 'Scoring Statistics' },
            { to: '/dashboard/audit-logs', label: 'Scoring Audit' },
        ],
    },
    {
        title: 'Communications',
        items: [
            { to: '/dashboard/notifications', label: 'Notifications (View Only)' },
        ],
    },
    {
        title: 'Data Operations',
        items: [
            { to: '/dashboard/backups', label: 'Backups & Restores' },
            { to: '/dashboard/settings', label: 'System Settings' },
        ],
    },
];

const judgeGroups = [
    {
        title: 'Judge Duties',
        items: [
            { to: '/dashboard', label: 'Overview', match: ['/dashboard'] },
            { to: '/dashboard/grading', label: 'Grading' },
            { to: '/dashboard/scoring-stats', label: 'Scoring Statistics' },
            { to: '/dashboard/leaderboard', label: 'Leaderboard' },
        ],
    },
];

const mentorGroups = [
    {
        title: 'Mentor Duties',
        items: [
            { to: '/dashboard', label: 'Overview', match: ['/dashboard'] },
            { to: '/dashboard/teams', label: 'Assigned Teams' },
            { to: '/dashboard/chat', label: 'Team Chat' },
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
        title: 'Staff Duties',
        items: [
            { to: '/dashboard', label: 'Overview', match: ['/dashboard'] },
        ],
    }];
    if (assignments.mentor) {
        groups.push({
            title: 'Mentor Duties',
            items: [
                { to: '/dashboard/teams', label: 'Assigned Teams' },
                { to: '/dashboard/chat', label: 'Team Chat' },
            ],
        });
    }
    if (assignments.judge) {
        groups.push({
            title: 'Judge Duties',
            items: [
                { to: '/dashboard/grading', label: 'Pending Submissions' },
                { to: '/dashboard/leaderboard', label: 'Leaderboard' },
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
                <Link to="/dashboard" className="flex items-center gap-2">
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
                <Link to="/dashboard/profile" className="flex items-center gap-2.5 rounded-xl p-2.5 hover:bg-[#eaf3ff] border border-transparent hover:border-[#d7e6f8] transition-all cursor-pointer block text-left">
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-black" style={{ background: '#eaf3ff', border: '1px solid #d7e6f8', color: '#0f63c9' }}>
                            {(email || 'U').charAt(0).toUpperCase()}
                        </span>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-bold text-[#0b1f3f]" title={email}>{email}</p>
                            <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#0f63c9] mt-0.5">{role}</p>
                        </div>
                    </div>
                </Link>

                <button type="button" onClick={logout} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-black uppercase tracking-wider text-slate-700 hover:bg-rose-600 hover:text-white hover:border-rose-500 transition-all shadow-sm cursor-pointer">Log Out</button>
            </div>
        </aside>
    );
}
