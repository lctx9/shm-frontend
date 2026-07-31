import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import Toast from '../components/Toast';
import AdminOverview from './AdminOverview';
import DemographicsDashboard from '../components/DemographicsDashboard';

const roleCopy = {
    ADMIN: 'System Administrator',
    COORDINATOR: 'Event Coordinator',
    STAFF: 'Event Staff',
    JUDGE: 'Judge',
    MENTOR: 'Team Mentor',
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
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchDashboardStats = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const [statsRes, subsRes, eventsRes] = await Promise.allSettled([
                axiosClient.get('/stats'),
                axiosClient.get('/submissions'),
                axiosClient.get('/events')
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

        } catch (err) {
            setError("Unable to load statistical data. Please check the backend or access permissions.");
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
        { label: 'Active Events', value: stats.activeEvents, helper: 'Currently open or ongoing events', to: '/dashboard/events?tab=overview', color: 'border-l-4 border-l-[var(--shield-blue)]' },
        { label: 'Registered Teams', value: stats.totalTeams, helper: 'Total team rosters in system', to: '/dashboard/teams', color: 'border-l-4 border-l-[var(--shield-green)]' },
        { label: 'Pending Submissions', value: stats.pendingSubmissions, helper: 'Submissions awaiting score', to: '/dashboard/submissions', color: 'border-l-4 border-l-amber-500' },
    ];

    return (
        <div className="mx-auto max-w-7xl space-y-6">
            {/* Compact Greeting Header */}
            <section className="rounded-xl border border-[#d7e6f8] bg-[#f8fafc]/80 px-6 py-4 sm:px-7 sm:py-5 text-slate-800 shadow-xs">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#0f63c9]">SEAL Management System</p>
                        <h2 className="mt-1 text-xl sm:text-2xl font-black text-[#071936]">Operational Dashboard</h2>
                        <p className="mt-1 text-xs sm:text-sm text-[#5c6d83]">
                            Welcome back! You are operating as <span className="font-extrabold text-[#0f63c9]">{roleCopy[role] || role || 'Guest'}</span>.
                        </p>
                    </div>
                    <button type="button" onClick={fetchDashboardStats} disabled={loading} title="Refresh data" className="btn-secondary h-8 w-8 p-0 inline-flex items-center justify-center text-xs font-bold bg-white text-slate-700 border-slate-200 hover:bg-slate-50 transition-all active:scale-95 cursor-pointer">
                        {loading ? <span className="animate-spin">↻</span> : '↻'}
                    </button>
                </div>
            </section>

            <Toast error={error} onClose={() => setError('')} />

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
                                Manage Details 
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
                        <h2 className="text-base font-black text-[var(--shield-ink)]">Submissions Grading Progress</h2>
                        <p className="text-xs text-[var(--shield-copy)] mt-1">Ratio of graded submissions relative to total entries</p>
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
                                <span className="text-[9px] font-black uppercase text-[var(--shield-copy)] tracking-wider">Completed</span>
                            </div>
                        </div>

                        {/* Chart stats info */}
                        <div className="flex-1 space-y-3">
                            <div className="flex items-center justify-between border-b border-[#edf3fa] pb-2">
                                <span className="text-xs font-semibold text-[var(--shield-copy)]">Total Submissions</span>
                                <span className="text-sm font-black text-[var(--shield-ink)]">{loading ? '...' : totalSubmissions}</span>
                            </div>
                            <div className="flex items-center justify-between border-b border-[#edf3fa] pb-2">
                                <span className="text-xs font-semibold text-[var(--shield-copy)] flex items-center gap-1.5">
                                    <span className="h-2 w-2 rounded-full bg-[var(--shield-blue)]"></span> Graded
                                </span>
                                <span className="text-sm font-black text-[var(--shield-green)]">{loading ? '...' : gradedSubmissions}</span>
                            </div>
                            <div className="flex items-center justify-between border-b border-[#edf3fa] pb-2">
                                <span className="text-xs font-semibold text-[var(--shield-copy)] flex items-center gap-1.5">
                                    <span className="h-2 w-2 rounded-full bg-amber-500"></span> Pending
                                </span>
                                <span className="text-sm font-black text-amber-600">{loading ? '...' : pendingSubmissions}</span>
                            </div>
                        </div>
                    </div>
                    
                    <Link to="/dashboard/submissions" className="btn-secondary w-full text-center text-xs font-bold py-2.5">
                        View Submissions Registry &rarr;
                    </Link>
                </div>

                {/* Chart 2: Teams registered per event */}
                <div className="rounded-xl border border-[var(--shield-line)] bg-white p-6 shadow-sm flex flex-col justify-between">
                    <div>
                        <h2 className="text-base font-black text-[var(--shield-ink)]">Teams Registered per Event</h2>
                        <p className="text-xs text-[var(--shield-copy)] mt-1">Registered team rosters across recent hackathons</p>
                    </div>

                    {/* SVG Bar Chart */}
                    <div className="my-6 min-h-[140px] flex items-end gap-3 px-2 border-b border-l border-[#e2e8f0] pb-2 pt-4">
                        {loading ? (
                            <div className="w-full text-center text-xs text-[var(--shield-copy)] py-12 animate-pulse">Loading visualization...</div>
                        ) : chartEvents.length === 0 ? (
                            <div className="w-full text-center text-xs text-[var(--shield-copy)] py-12">No event metrics database found.</div>
                        ) : (
                            chartEvents.map((event) => {
                                const heightPercent = Math.max(10, Math.round(((event.teamCount || 0) / maxTeams) * 100));
                                return (
                                    <div key={event.id} className="flex-1 flex flex-col items-center group relative">
                                        {/* Tooltip on hover */}
                                        <div className="absolute -top-7 scale-0 group-hover:scale-100 transition-all duration-150 bg-[var(--shield-ink)] text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm z-10 pointer-events-none">
                                            {event.teamCount || 0} teams
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

                    <Link to="/dashboard/events?tab=overview" className="btn-secondary w-full text-center text-xs font-bold py-2.5">
                        Manage Events Directory &rarr;
                    </Link>
                </div>
            </section>

            {/* Advanced demographics metrics */}
            <DemographicsDashboard />

            {/* Quick Actions & Navigation Link section */}
            <section className="rounded-xl border border-[var(--shield-line)] bg-white p-6 shadow-sm">
                <h2 className="text-base font-black text-[var(--shield-ink)]">Quick Actions Panel</h2>
                <p className="text-xs text-[var(--shield-copy)] mt-1">Fast-track pathways to event coordinator workspaces</p>
                
                <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                    <Link to="/dashboard/scoring-config" className="flex items-center justify-between rounded-xl bg-[var(--shield-blue-soft)] p-4 text-xs font-bold text-[var(--shield-blue)] hover:bg-blue-100 transition-all">
                        <span>Scoring Config</span>
                        <span>&rarr;</span>
                    </Link>
                    <Link to="/dashboard/notifications" className="flex items-center justify-between rounded-xl bg-[var(--shield-blue-soft)] p-4 text-xs font-bold text-[var(--shield-blue)] hover:bg-blue-100 transition-all">
                        <span>Broadcast Notification</span>
                        <span>&rarr;</span>
                    </Link>
                    <Link to="/dashboard/leaderboard" className="flex items-center justify-between rounded-xl bg-[var(--shield-blue-soft)] p-4 text-xs font-bold text-[var(--shield-blue)] hover:bg-blue-100 transition-all">
                        <span>View Leaderboard</span>
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
    const [assignedTeams, setAssignedTeams] = useState([]);
    const [assignedMatrices, setAssignedMatrices] = useState([]);
    const [assignedEventsList, setAssignedEventsList] = useState([]);

    useEffect(() => {
        let active = true;
        
        const loadAssignmentsAndStats = async () => {
            try {
                const assignmentsRes = await axiosClient.get('/users/me/assignments');
                const userAssignments = assignmentsRes.result || { mentor: false, judge: false };
                
                if (active) {
                    setAssignments(userAssignments);
                }

                // Fetch everything unified to compute assignments by event
                const [eventsRes, teamsRes, submissionsRes] = await Promise.all([
                    axiosClient.get('/events').catch(() => ({ result: [] })),
                    axiosClient.get('/teams').catch(() => ({ result: [] })),
                    axiosClient.get('/submissions').catch(() => ({ result: [] }))
                ]);

                const evts = eventsRes.result || [];
                const teams = teamsRes.result || [];
                const subs = submissionsRes.result || [];

                // Compute judge matrices
                const judgeMatricesList = [];
                const matrixMap = new Map();
                evts.forEach((event) => {
                    (event.matrices || []).forEach((matrix) => {
                        matrixMap.set(String(matrix.id), matrix);
                        if ((matrix.judges || []).some(j => j.email === email)) {
                            judgeMatricesList.push({
                                id: matrix.id,
                                roundName: matrix.roundName,
                                trackName: matrix.trackName,
                                eventName: event.name,
                                eventId: event.id
                            });
                        }
                    });
                });

                // Compute mentor teams
                const trackIds = new Set(
                    evts
                        .flatMap((event) => event.matrices || [])
                        .filter((matrix) => (matrix.mentors || []).some((mentor) => mentor.email === email))
                        .map((matrix) => String(matrix.trackId))
                );
                const myTeams = teams.filter((team) => trackIds.has(String(team.trackId)));

                // Group by Event ID
                const groupedMap = new Map();
                evts.forEach(event => {
                    const isMentorForEvent = (event.matrices || []).some(matrix => 
                        (matrix.mentors || []).some(m => m.email === email)
                    );
                    const isJudgeForEvent = (event.matrices || []).some(matrix => 
                        (matrix.judges || []).some(j => j.email === email)
                    );

                    if (isMentorForEvent || isJudgeForEvent) {
                        const eventTeams = myTeams.filter(team => String(team.eventId) === String(event.id));
                        const eventMatrices = judgeMatricesList.filter(matrix => String(matrix.eventId) === String(event.id));

                        groupedMap.set(String(event.id), {
                            id: event.id,
                            name: event.name,
                            season: event.season,
                            year: event.year,
                            status: event.status || 'ACTIVE',
                            isMentor: isMentorForEvent,
                            isJudge: isJudgeForEvent,
                            teams: eventTeams,
                            matrices: eventMatrices
                        });
                    }
                });

                if (active) {
                    setAssignedTeams(myTeams);
                    setAssignedMatrices(judgeMatricesList);
                    setAssignedEventsList(Array.from(groupedMap.values()));
                    
                    // Compute pending counts
                    if (userAssignments.judge) {
                        const visible = subs.filter((sub) => {
                            const matrix = matrixMap.get(String(sub.matrixId));
                            return (matrix?.judges || []).some((judge) => judge.email === email);
                        });
                        const count = visible.filter((sub) => !sub.graded).length;
                        setPendingGradingCount(count);
                    }

                    if (userAssignments.mentor) {
                        // Calculate unread chat messages
                        const chatPromises = myTeams.map(team => 
                            axiosClient.get(`/chat/teams/${team.id}`)
                                .then(res => ({ teamId: team.id, messages: res.result || [] }))
                                .catch(() => ({ teamId: team.id, messages: [] }))
                        );
                        const chatResults = await Promise.all(chatPromises);
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
            {/* Compact Greeting Header */}
            <section className="rounded-xl border border-[#d7e6f8] bg-[#f8fafc]/80 px-6 py-4 sm:px-7 sm:py-5 text-slate-800 shadow-xs">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#0f63c9]">SEAL Staff Portal</p>
                    <h2 className="mt-1 text-xl sm:text-2xl font-black text-[#071936]">Staff Dashboard</h2>
                    <p className="mt-1 text-xs sm:text-sm text-[#5c6d83]">
                        Welcome back, <span className="font-extrabold text-[#0f63c9]">{email}</span>. Here is the breakdown of your assigned event deliverables.
                    </p>
                </div>
            </section>

            {loading ? (
                <div className="text-center text-sm text-slate-500 py-12 animate-pulse">
                    Verifying assignments information...
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Workspace Summary Cards */}
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
                            <div>
                                <p className="text-xs font-black uppercase tracking-wider text-slate-400">Assigned Roles</p>
                                <div className="flex gap-1.5 mt-2">
                                    {assignments.mentor && <span className="bg-emerald-50 border border-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-black uppercase">Mentor</span>}
                                    {assignments.judge && <span className="bg-blue-50 border border-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] font-black uppercase">Judge</span>}
                                    {!assignments.mentor && !assignments.judge && <span className="bg-slate-50 border border-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-black uppercase">No Roles</span>}
                                </div>
                            </div>
                            <p className="text-xs text-slate-400 mt-4 font-semibold">Roles active on your account</p>
                        </div>
                        {assignments.mentor && (
                            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
                                <div>
                                    <p className="text-xs font-black uppercase tracking-wider text-slate-400">Assigned Teams</p>
                                    <p className="mt-2 text-3xl font-black text-[#071936]">{assignedTeams.length}</p>
                                </div>
                                <p className="text-xs text-slate-400 mt-4 font-semibold">Active team guilds you are guiding</p>
                            </div>
                        )}
                        {assignments.judge && (
                            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
                                <div>
                                    <p className="text-xs font-black uppercase tracking-wider text-slate-400">Grading Duties</p>
                                    <p className="mt-2 text-3xl font-black text-[#071936]">{assignedMatrices.length} Rounds</p>
                                </div>
                                <p className="text-xs text-slate-400 mt-4 font-semibold">{pendingGradingCount} submissions awaiting score</p>
                            </div>
                        )}
                    </div>

                    {/* Detailed Assignments Grouped by Event/Tournament */}
                    {assignedEventsList.length > 0 ? (
                        <div className="space-y-6 mt-6">
                            <div className="border-b border-slate-200 pb-3">
                                <h3 className="text-base font-black text-[#071936] tracking-tight">Active Tournament Duty Schedule</h3>
                                <p className="text-xs text-slate-500 mt-0.5">List of tournaments and specific deliverables assigned to your staff profile.</p>
                            </div>

                            <div className="grid gap-6">
                                {assignedEventsList.map((evt) => (
                                    <div key={evt.id} className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs hover:shadow-sm transition-all space-y-5">
                                        {/* Tournament Header */}
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse"></span>
                                                    <h4 className="text-base font-black text-[#071936]">{evt.name}</h4>
                                                </div>
                                                <p className="text-xs text-slate-400 font-semibold mt-1">Season: {evt.season} {evt.year}</p>
                                            </div>
                                            <div className="flex flex-wrap gap-1.5">
                                                {evt.isMentor && (
                                                    <span className="bg-emerald-50 border border-emerald-100 text-emerald-700 px-2.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider">Mentor</span>
                                                )}
                                                {evt.isJudge && (
                                                    <span className="bg-blue-50 border border-blue-100 text-blue-700 px-2.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider">Judge</span>
                                                )}
                                                <span className={`px-2.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                                                    evt.status === 'ONGOING' || evt.status === 'ACTIVE'
                                                        ? 'bg-amber-50 border border-amber-100 text-amber-700'
                                                        : 'bg-slate-50 border border-slate-100 text-slate-600'
                                                }`}>
                                                    {evt.status}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Columns for Duties */}
                                        <div className="grid gap-6 md:grid-cols-2">
                                            {/* Mentor Duty Details */}
                                            {evt.isMentor && (
                                                <div className="space-y-3">
                                                    <p className="text-xs font-black uppercase tracking-wider text-slate-400">Mentor Workload ({evt.teams.length} Teams)</p>
                                                    {evt.teams.length > 0 ? (
                                                        <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
                                                            {evt.teams.map((team) => (
                                                                <div key={team.id} className="rounded-lg border border-slate-100 bg-[#f8fafc] p-3.5 flex items-center justify-between gap-3 text-xs">
                                                                    <div className="min-w-0">
                                                                        <p className="font-extrabold text-[#071936] truncate">{team.name}</p>
                                                                        <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Track: {team.trackName || 'Chung'}</p>
                                                                        {team.skillsNeeded && (
                                                                            <div className="flex flex-wrap gap-1 mt-1.5">
                                                                                {team.skillsNeeded.split(',').slice(0, 2).map((s) => (
                                                                                    <span key={s} className="bg-amber-50 border border-amber-100 text-amber-700 px-1 py-0.2 rounded text-[8px] font-black uppercase">{s.trim()}</span>
                                                                                ))}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex gap-1.5 shrink-0">
                                                                        <Link to={`/dashboard/chat?teamId=${team.id}`} className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-black px-2.5 py-1 rounded text-[10px] uppercase transition-colors cursor-pointer">Chat</Link>
                                                                        <Link to={`/events/${evt.id}?tab=teams`} className="bg-blue-600 border border-blue-600 text-white hover:bg-blue-700 font-black px-2.5 py-1 rounded text-[10px] uppercase transition-colors cursor-pointer">Details</Link>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p className="text-xs text-slate-400 italic">No team rosters assigned under your track.</p>
                                                    )}
                                                </div>
                                            )}

                                            {/* Judge Duty Details */}
                                            {evt.isJudge && (
                                                <div className="space-y-3">
                                                    <p className="text-xs font-black uppercase tracking-wider text-slate-400">Judge Workload ({evt.matrices.length} Rounds)</p>
                                                    {evt.matrices.length > 0 ? (
                                                        <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
                                                            {evt.matrices.map((matrix) => (
                                                                <div key={matrix.id} className="rounded-lg border border-slate-100 bg-[#f8fafc] p-3.5 flex items-center justify-between gap-3 text-xs">
                                                                    <div className="min-w-0">
                                                                        <p className="font-extrabold text-[#071936] truncate">Round: {matrix.roundName}</p>
                                                                        <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Track: {matrix.trackName || 'Chung'}</p>
                                                                    </div>
                                                                    <div className="shrink-0">
                                                                        <Link to={`/dashboard/grading?matrixId=${matrix.id}`} className="bg-blue-600 border border-blue-600 text-white hover:bg-blue-700 font-black px-3.5 py-1 rounded text-[10px] uppercase transition-colors cursor-pointer block text-center">Grade</Link>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p className="text-xs text-slate-400 italic">No evaluation round matrices assigned to your panel.</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-xl bg-amber-50 border border-amber-200 p-6 text-center mt-6">
                            <p className="text-sm font-semibold text-amber-800">
                                You have not been assigned to any hackathon events or duties yet.
                            </p>
                            <p className="text-xs text-amber-600 mt-2">
                                Please contact the event Coordinator to receive your assignments.
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
