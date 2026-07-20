import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import AdminOverview from './AdminOverview';

const roleCopy = {
    ADMIN: 'Quản trị hệ thống',
    COORDINATOR: 'Điều phối sự kiện',
    STAFF: 'Nhân sự cuộc thi',
    JUDGE: 'Giám khảo',
    MENTOR: 'Mentor hướng dẫn đội thi',
};

function OperationalDashboard() {
    const storedRole = localStorage.getItem('role');
    const role = ['MENTOR', 'JUDGE'].includes(storedRole) ? 'STAFF' : storedRole;
    const [stats, setStats] = useState({
        activeEvents: 0,
        totalTeams: 0,
        pendingSubmissions: 0,
    });
    const [submissions, setSubmissions] = useState([]);
    const [events, setEvents] = useState([]);
    const [pendingStudents, setPendingStudents] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchDashboardStats = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const [statsRes, subsRes, eventsRes, usersRes] = await Promise.allSettled([
                axiosClient.get('/stats'),
                axiosClient.get('/submissions'),
                axiosClient.get('/events'),
                axiosClient.get('/users')
            ]);

            if (statsRes.status === 'fulfilled' && statsRes.value.result) {
                setStats({
                    activeEvents: statsRes.value.result.activeEvents || 0,
                    totalTeams: statsRes.value.result.totalTeams || 0,
                    pendingSubmissions: statsRes.value.result.pendingSubmissions || 0,
                });
            }

            if (subsRes.status === 'fulfilled' && subsRes.value.result) {
                setSubmissions(subsRes.value.result || []);
            }

            if (eventsRes.status === 'fulfilled' && eventsRes.value.result) {
                setEvents(eventsRes.value.result || []);
            }

            if (usersRes.status === 'fulfilled' && usersRes.value.result) {
                const list = usersRes.value.result || [];
                const pendingCount = list.filter(user => user.role === 'USER' && user.status === 'PENDING').length;
                setPendingStudents(pendingCount);
            }
        } catch (err) {
            setError('Không thể tải dữ liệu thống kê. Vui lòng kiểm tra backend hoặc quyền truy cập.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardStats();
    }, []);

    // Calculate Grading Stats
    const totalSubmissions = submissions.length;
    const gradedSubmissions = submissions.filter(s => s.score !== null).length;
    const pendingSubmissions = submissions.filter(s => s.score === null).length;
    const gradingPercentage = totalSubmissions > 0 ? Math.round((gradedSubmissions / totalSubmissions) * 100) : 0;
    const strokeDashoffset = 251.2 - (251.2 * gradingPercentage) / 100;

    // Process events for chart (max 5 events)
    const chartEvents = events.slice(0, 5);
    const maxTeams = Math.max(...chartEvents.map(e => e.teamCount || 0), 5);

    const cards = [
        { label: 'Sự kiện đang hoạt động', value: stats.activeEvents, helper: 'Event đang mở hoặc đang diễn ra', to: '/dashboard/events', color: 'border-l-4 border-l-[var(--shield-blue)]' },
        { label: 'Đội thi đăng ký', value: stats.totalTeams, helper: 'Tổng số đội đã đăng ký thi', to: '/dashboard/teams', color: 'border-l-4 border-l-[var(--shield-green)]' },
        { label: 'Bài nộp chờ chấm', value: stats.pendingSubmissions, helper: 'Submission chưa có điểm số', to: '/dashboard/submissions', color: 'border-l-4 border-l-amber-500' },
    ];

    return (
        <div className="mx-auto max-w-7xl space-y-6">
            {/* Greeting Header */}
            <section className="rounded-2xl border border-[var(--shield-line)] bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--shield-blue)]">Hệ thống quản lý SEAL</p>
                        <h1 className="mt-2 text-2xl font-black tracking-tight text-[var(--shield-ink)]">Bảng điều khiển</h1>
                        <p className="mt-2 text-sm text-[var(--shield-copy)]">
                            Chào mừng quay trở lại! Bạn đang làm việc với vai trò <span className="font-extrabold text-[var(--shield-blue)]">{roleCopy[role] || role || 'Khách'}</span>.
                        </p>
                    </div>
                    <button type="button" onClick={fetchDashboardStats} disabled={loading} className="btn-secondary transition-all active:scale-95 flex items-center gap-2">
                        {loading ? 'Đang làm mới...' : '↻ Làm mới dữ liệu'}
                    </button>
                </div>
            </section>

            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700 animate-pulse">
                    {error}
                </div>
            )}

            {/* Metrics cards grid */}
            <section className="grid gap-4 md:grid-cols-3">
                {cards.map((card) => (
                    <Link 
                        key={card.label} 
                        to={card.to} 
                        className={`group rounded-xl border border-[var(--shield-line)] bg-white p-6 shadow-[0_2px_8px_rgba(11,31,63,0.035)] hover:shadow-md hover:border-blue-300 transition-all duration-200 cursor-pointer flex flex-col justify-between ${card.color}`}
                    >
                        <div>
                            <p className="text-xs font-black uppercase tracking-wider text-[var(--shield-copy)]">{card.label}</p>
                            <p className="mt-3 text-4xl font-black text-[var(--shield-ink)]">
                                {loading ? <span className="animate-pulse">...</span> : card.value}
                            </p>
                            <p className="mt-3 text-xs text-[var(--shield-copy)] leading-relaxed">{card.helper}</p>
                        </div>
                        <div className="mt-5 border-t border-dashed border-[var(--shield-line)] pt-3 flex items-center justify-between">
                            <span className="text-xs font-bold text-[var(--shield-blue)] group-hover:underline flex items-center gap-1">
                                Quản lý chi tiết 
                            </span>
                            <span className="text-[var(--shield-blue)] transform group-hover:translate-x-1 transition-transform">&rarr;</span>
                        </div>
                    </Link>
                ))}
            </section>

            {/* Charts & Visualization Section */}
            <section className="grid gap-6 md:grid-cols-2">
                {/* Chart 1: Grading Circular Gauge */}
                <div className="rounded-xl border border-[var(--shield-line)] bg-white p-6 shadow-sm flex flex-col justify-between">
                    <div>
                        <h2 className="text-base font-black text-[var(--shield-ink)]">Tiến độ chấm điểm bài nộp</h2>
                        <p className="text-xs text-[var(--shield-copy)] mt-1">Tỷ lệ bài nộp đã được chấm điểm trên tổng số bài</p>
                    </div>

                    <div className="my-6 flex flex-col items-center justify-center gap-6 sm:flex-row">
                        {/* SVG circular progress bar */}
                        <div className="relative flex items-center justify-center">
                            <svg width="120" height="120" viewBox="0 0 100 100" className="-rotate-90">
                                <circle cx="50" cy="50" r="40" stroke="#f3f4f6" strokeWidth="8" fill="transparent" />
                                <circle 
                                    cx="50" 
                                    cy="50" 
                                    r="40" 
                                    stroke="var(--shield-blue)" 
                                    strokeWidth="8" 
                                    fill="transparent" 
                                    strokeDasharray="251.2" 
                                    strokeDashoffset={loading ? 251.2 : strokeDashoffset} 
                                    strokeLinecap="round" 
                                    className="transition-all duration-700 ease-out" 
                                />
                            </svg>
                            <div className="absolute flex flex-col items-center justify-center text-center">
                                <span className="text-2xl font-black text-[var(--shield-ink)]">{loading ? '...' : `${gradingPercentage}%`}</span>
                                <span className="text-[9px] font-black uppercase text-[var(--shield-copy)] tracking-wider">Hoàn thành</span>
                            </div>
                        </div>

                        {/* Chart stats info */}
                        <div className="flex-1 space-y-3">
                            <div className="flex items-center justify-between border-b border-[#edf3fa] pb-2">
                                <span className="text-xs font-semibold text-[var(--shield-copy)]">Tổng số bài nộp</span>
                                <span className="text-sm font-black text-[var(--shield-ink)]">{loading ? '...' : totalSubmissions}</span>
                            </div>
                            <div className="flex items-center justify-between border-b border-[#edf3fa] pb-2">
                                <span className="text-xs font-semibold text-[var(--shield-copy)] flex items-center gap-1.5">
                                    <span className="h-2 w-2 rounded-full bg-[var(--shield-blue)]"></span> Đã chấm điểm
                                </span>
                                <span className="text-sm font-black text-[var(--shield-green)]">{loading ? '...' : gradedSubmissions}</span>
                            </div>
                            <div className="flex items-center justify-between border-b border-[#edf3fa] pb-2">
                                <span className="text-xs font-semibold text-[var(--shield-copy)] flex items-center gap-1.5">
                                    <span className="h-2 w-2 rounded-full bg-amber-500"></span> Chờ chấm
                                </span>
                                <span className="text-sm font-black text-amber-600">{loading ? '...' : pendingSubmissions}</span>
                            </div>
                        </div>
                    </div>
                    
                    <Link to="/dashboard/submissions" className="btn-secondary w-full text-center text-xs font-bold py-2.5">
                        Xem danh sách bài nộp &rarr;
                    </Link>
                </div>

                {/* Chart 2: Teams registered per event */}
                <div className="rounded-xl border border-[var(--shield-line)] bg-white p-6 shadow-sm flex flex-col justify-between">
                    <div>
                        <h2 className="text-base font-black text-[var(--shield-ink)]">Quy mô đội thi theo giải đấu</h2>
                        <p className="text-xs text-[var(--shield-copy)] mt-1">Số lượng đội thi đăng ký tham gia các sự kiện gần đây</p>
                    </div>

                    {/* SVG Bar Chart */}
                    <div className="my-6 min-h-[140px] flex items-end gap-3 px-2 border-b border-l border-[#e2e8f0] pb-2 pt-4">
                        {loading ? (
                            <div className="w-full text-center text-xs text-[var(--shield-copy)] py-12 animate-pulse">Đang tải biểu đồ...</div>
                        ) : chartEvents.length === 0 ? (
                            <div className="w-full text-center text-xs text-[var(--shield-copy)] py-12">Chưa có dữ liệu giải đấu.</div>
                        ) : (
                            chartEvents.map((event) => {
                                const heightPercent = Math.max(10, Math.round(((event.teamCount || 0) / maxTeams) * 100));
                                return (
                                    <div key={event.id} className="flex-1 flex flex-col items-center group relative">
                                        {/* Tooltip on hover */}
                                        <div className="absolute -top-7 scale-0 group-hover:scale-100 transition-all duration-150 bg-[var(--shield-ink)] text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm z-10 pointer-events-none">
                                            {event.teamCount || 0} đội
                                        </div>
                                        <div 
                                            style={{ height: `${heightPercent}%`, minHeight: '12px' }} 
                                            className="w-full bg-[var(--shield-blue)] hover:bg-[var(--shield-blue-dark)] rounded-t-sm transition-all duration-500 cursor-pointer"
                                        />
                                        <p className="mt-2 text-[9px] font-bold text-[var(--shield-copy)] truncate w-full text-center" title={event.name}>
                                            {event.season} {event.year}
                                        </p>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    <Link to="/dashboard/events" className="btn-secondary w-full text-center text-xs font-bold py-2.5">
                        Quản lý danh sách sự kiện &rarr;
                    </Link>
                </div>
            </section>

            {/* Quick Actions & Navigation Link section */}
            <section className="rounded-xl border border-[var(--shield-line)] bg-white p-6 shadow-sm">
                <h2 className="text-base font-black text-[var(--shield-ink)]">Phím tắt thao tác nhanh</h2>
                <p className="text-xs text-[var(--shield-copy)] mt-1">Truy cập nhanh các phân hệ chức năng dành cho Điều phối viên</p>
                
                <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                    <Link to="/dashboard/student-approval" className="flex items-center justify-between rounded-xl bg-[var(--shield-blue-soft)] p-4 text-xs font-bold text-[var(--shield-blue)] hover:bg-blue-100 transition-all">
                        <span>Phê duyệt thí sinh mới</span>
                        {pendingStudents > 0 && (
                            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white">
                                {pendingStudents}
                            </span>
                        )}
                    </Link>
                    <Link to="/dashboard/scoring-config" className="flex items-center justify-between rounded-xl bg-[var(--shield-blue-soft)] p-4 text-xs font-bold text-[var(--shield-blue)] hover:bg-blue-100 transition-all">
                        <span>Cấu hình chấm điểm</span>
                        <span>&rarr;</span>
                    </Link>
                    <Link to="/dashboard/notifications" className="flex items-center justify-between rounded-xl bg-[var(--shield-blue-soft)] p-4 text-xs font-bold text-[var(--shield-blue)] hover:bg-blue-100 transition-all">
                        <span>Gửi thông báo mới</span>
                        <span>&rarr;</span>
                    </Link>
                    <Link to="/dashboard/leaderboard" className="flex items-center justify-between rounded-xl bg-[var(--shield-blue-soft)] p-4 text-xs font-bold text-[var(--shield-blue)] hover:bg-blue-100 transition-all">
                        <span>Xem bảng xếp hạng</span>
                        <span>&rarr;</span>
                    </Link>
                </div>
            </section>
        </div>
    );
}

function StaffDashboard() {
    const email = localStorage.getItem('email');
    const [assignments, setAssignments] = useState({ mentor: false, judge: false });
    const [loading, setLoading] = useState(true);
    const [pendingGradingCount, setPendingGradingCount] = useState(0);
    const [pendingChatCount, setPendingChatCount] = useState(0);

    useEffect(() => {
        let active = true;
        
        const loadAssignmentsAndStats = async () => {
            try {
                const assignmentsRes = await axiosClient.get('/users/me/assignments');
                const userAssignments = assignmentsRes.result || { mentor: false, judge: false };
                
                if (active) {
                    setAssignments(userAssignments);
                }
                
                const promises = [];
                
                if (userAssignments.judge) {
                    promises.push(
                        Promise.all([
                            axiosClient.get('/submissions'),
                            axiosClient.get('/events').catch(() => ({ result: [] })),
                        ]).then(([subRes, eventRes]) => {
                            if (!active) return;
                            const subs = subRes.result || [];
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
                        }).catch(() => {})
                    );
                }
                
                if (userAssignments.mentor) {
                    promises.push(
                        Promise.all([
                            axiosClient.get('/teams'),
                            axiosClient.get('/events'),
                        ]).then(async ([teamRes, eventRes]) => {
                            if (!active) return;
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
                        }).catch(() => {})
                    );
                }
                
                if (promises.length > 0) {
                    await Promise.allSettled(promises);
                }
            } catch (err) {
                // Ignore
            } finally {
                if (active) setLoading(false);
            }
        };

        const handleChatRead = () => {
            loadAssignmentsAndStats();
        };
        window.addEventListener('chatRead', handleChatRead);

        loadAssignmentsAndStats();
        return () => {
            active = false;
            window.removeEventListener('chatRead', handleChatRead);
        };
    }, [email]);

    return (
        <div className="mx-auto max-w-7xl space-y-6">
            {/* Greeting Header */}
            <section className="rounded-2xl border border-[var(--shield-line)] bg-white p-6 shadow-sm">
                <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--shield-blue)]">Hệ thống SEAL Staff</p>
                    <h1 className="mt-2 text-2xl font-black tracking-tight text-[var(--shield-ink)]">Bảng điều khiển Staff</h1>
                    <p className="mt-2 text-sm text-[var(--shield-copy)]">
                        Chào mừng quay trở lại, <span className="font-extrabold text-[var(--shield-blue)]">{email}</span>. Dưới đây là các phân hệ nhiệm vụ dành riêng cho bạn.
                    </p>
                </div>
            </section>

            {loading ? (
                <div className="text-center text-sm text-[var(--shield-copy)] py-12 animate-pulse">
                    Đang xác thực thông tin phân công...
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Mentor Section */}
                    {assignments.mentor && (
                        <section className="rounded-xl border border-[var(--shield-line)] bg-white p-6 shadow-sm flex flex-col justify-between">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="h-2.5 w-2.5 rounded-full bg-[var(--shield-green)]"></span>
                                    <h2 className="text-lg font-black text-[var(--shield-ink)]">Nhiệm vụ Mentor</h2>
                                </div>
                                <p className="text-xs text-[var(--shield-copy)] mt-1">Hướng dẫn và hỗ trợ các đội thi được phân công</p>
                                
                                <div className="mt-6 space-y-3 text-sm text-[var(--shield-copy)] leading-relaxed">
                                    <p>• Xem thông tin chi tiết các đội thi bạn phụ trách.</p>
                                    <p>• Trao đổi trực tiếp, giải đáp thắc mắc của đội thi qua kênh chat thời gian thực.</p>
                                </div>
                            </div>
                            
                            <div className="mt-8 space-y-3">
                                <Link to="/dashboard/teams" className="btn-primary w-full text-center text-xs font-bold py-2.5 block">
                                    Xem danh sách đội thi phụ trách &rarr;
                                </Link>
                                <Link to="/dashboard/chat" className="btn-secondary w-full text-center text-xs font-bold py-2.5 block">
                                    <span className="flex items-center justify-center gap-2">
                                        Mở kênh Chat thảo luận
                                        {pendingChatCount > 0 && (
                                            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white">
                                                {pendingChatCount}
                                            </span>
                                        )}
                                    </span>
                                </Link>
                            </div>
                        </section>
                    )}

                    {/* Judge Section */}
                    {assignments.judge && (
                        <section className="rounded-xl border border-[var(--shield-line)] bg-white p-6 shadow-sm flex flex-col justify-between">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="h-2.5 w-2.5 rounded-full bg-[var(--shield-blue)]"></span>
                                    <h2 className="text-lg font-black text-[var(--shield-ink)]">Nhiệm vụ Giám khảo (Judge)</h2>
                                </div>
                                <p className="text-xs text-[var(--shield-copy)] mt-1">Đánh giá và chấm điểm các bài dự thi</p>
                                
                                <div className="mt-6 space-y-3 text-sm text-[var(--shield-copy)] leading-relaxed">
                                    <p>• Xem danh sách bài nộp và tài liệu dự thi được phân công chấm.</p>
                                    <p>• Cho điểm và ghi nhận xét (feedback) dựa trên tiêu chí (rubric) của vòng thi.</p>
                                </div>
                            </div>
                            
                            <div className="mt-8 space-y-3">
                                <Link to="/dashboard/grading" className="btn-primary w-full text-center text-xs font-bold py-2.5 block">
                                    <span className="flex items-center justify-center gap-2">
                                        Bắt đầu chấm bài thi
                                        {pendingGradingCount > 0 && (
                                            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white">
                                                {pendingGradingCount}
                                            </span>
                                        )}
                                    </span>
                                </Link>
                                <Link to="/dashboard/leaderboard" className="btn-secondary w-full text-center text-xs font-bold py-2.5 block">
                                    Xem bảng xếp hạng cuộc thi &rarr;
                                </Link>
                            </div>
                        </section>
                    )}

                    {/* Fallback if somehow they have no assignments yet */}
                    {!assignments.mentor && !assignments.judge && (
                        <div className="col-span-2 rounded-xl bg-amber-50 border border-amber-200 p-6 text-center">
                            <p className="text-sm font-semibold text-amber-800">
                                Tài khoản của bạn chưa được Coordinator phân công làm Mentor hoặc Judge cho bất kỳ bảng/vòng thi nào.
                            </p>
                            <p className="text-xs text-amber-600 mt-2">
                                Vui lòng liên hệ Ban tổ chức (Coordinator) để được phân công nhiệm vụ.
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default function Dashboard() {
    const role = localStorage.getItem('role');
    if (role === 'ADMIN') return <AdminOverview />;
    if (role === 'COORDINATOR') return <OperationalDashboard />;
    return <StaffDashboard />;
}
