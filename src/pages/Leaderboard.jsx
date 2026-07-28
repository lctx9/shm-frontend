import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import Toast from '../components/Toast';
import { demoWinners } from '../utils/hackathon';

function PodiumCard({ entry, mode, isGlobal }) {
    if (!entry) return null;

    const isTeam = mode === 'TEAM';
    const name = isTeam ? entry.teamName : entry.fullName;
    const profilePath = !isTeam && entry.userId ? `/profile?userId=${entry.userId}` : '/profile';

    const config = {
        1: {
            medal: '👑',
            medalBg: 'bg-amber-50 text-amber-500 border-amber-200',
            border: 'border-t-4 border-t-amber-500 shadow-sm',
            rankText: 'Champion',
            scoreBg: 'bg-amber-50 text-amber-700',
            scale: 'md:scale-105 z-10 md:-translate-y-1'
        },
        2: {
            medal: '🥈',
            medalBg: 'bg-slate-50 text-slate-500 border-slate-200',
            border: 'border-t-4 border-t-slate-400 shadow-sm',
            rankText: 'Runner-up',
            scoreBg: 'bg-[#f0eefc] text-[#453e66]',
            scale: ''
        },
        3: {
            medal: '🥉',
            medalBg: 'bg-orange-50 text-orange-700 border-orange-200',
            border: 'border-t-4 border-t-orange-600 shadow-sm',
            rankText: 'Third Place',
            scoreBg: 'bg-orange-50 text-orange-800',
            scale: ''
        }
    }[entry.rank] || {
        medal: '🎖️',
        medalBg: 'bg-slate-50 text-slate-600 border-slate-200',
        border: 'border-t-4 border-t-slate-500 shadow-sm',
        rankText: `Rank ${entry.rank}`,
        scoreBg: 'bg-[#f0eefc] text-[#453e66]',
        scale: ''
    };

    return (
        <div className={`bg-white rounded-lg border border-slate-200 p-5 flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm ${config.border} ${config.scale}`}>
            <div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className={`text-[18px] h-9 w-9 rounded-lg border flex items-center justify-center ${config.medalBg}`}>
                            {config.medal}
                        </span>
                        <div>
                            <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#4b4561]">{config.rankText}</p>
                            <p className="text-xs font-bold text-slate-400">Top {entry.rank}</p>
                        </div>
                    </div>
                </div>

                <div className="mt-4 min-w-0">
                    {isTeam ? (
                        <h2 className="text-base font-extrabold text-slate-900 truncate" title={name}>{name}</h2>
                    ) : (
                        <Link to={profilePath} className="text-base font-extrabold text-slate-900 hover:text-[#453e66] hover:underline truncate block" title={name}>
                            {name}
                        </Link>
                    )}
                    <p className="text-xs text-slate-500 mt-1 truncate">
                        {isTeam
                            ? (isGlobal && entry.eventName ? entry.eventName : (entry.track || 'General'))
                            : `${entry.first} 1st · ${entry.second} 2nd · ${entry.third} 3rd`}
                    </p>
                </div>

                {isTeam && entry.members && entry.members.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                        {entry.members.slice(0, 3).map((m, idx) => (
                            <Link 
                                to={m.userId ? `/profile?userId=${m.userId}` : '/profile'}
                                key={m.id || m.email || m.fullName || idx}
                                className="text-[11px] bg-[#f0eefc] hover:bg-[#e4e1f7] text-[#453e66] px-2 py-0.5 rounded font-semibold transition-colors"
                            >
                                {m.fullName || m.email}
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Record</span>
                <span className={`text-xs font-extrabold px-2.5 py-1 rounded ${config.scoreBg}`}>
                    {isTeam ? `${entry.score || 0} pts` : `${entry.total} events`}
                </span>
            </div>
        </div>
    );
}

function RankedList({ rows, mode, isGlobal }) {
    if (!rows.length) return null;

    return (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Remaining Standings</h2>
                <span className="bg-[#453e66] text-white text-[10px] font-extrabold px-2.5 py-1 rounded uppercase tracking-wider shadow-sm">
                    Rank 4 and below
                </span>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-extrabold uppercase text-slate-900 tracking-wider">
                            <th className="py-3 px-5 w-16 text-center">Rank</th>
                            <th className="py-3 px-5">
                                {mode === 'TEAM' ? 'Team & Members' : 'Student'}
                            </th>
                            {mode === 'TEAM' && isGlobal && <th className="py-3 px-5">Event</th>}
                            {mode === 'TEAM' && !isGlobal && <th className="py-3 px-5">Track</th>}
                            <th className="py-3 px-5 text-right pr-6">
                                {mode === 'TEAM' ? 'Score' : 'Awards Won'}
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                        {rows.map((entry) => (
                            <tr key={entry.id || entry.teamName || entry.userId || entry.email || entry.fullName} className="hover:bg-slate-50/60 transition-colors">
                                <td className="py-3.5 px-5 text-center font-extrabold text-slate-400">
                                    #{entry.rank}
                                </td>
                                <td className="py-3.5 px-5">
                                    {mode === 'TEAM' ? (
                                        <div>
                                            <p className="font-extrabold text-slate-900">{entry.teamName}</p>
                                            {entry.members && entry.members.length > 0 && (
                                                <div className="text-xs text-slate-500 mt-1 flex flex-wrap gap-x-1.5 items-center">
                                                    <span className="font-semibold text-slate-400">Members:</span>
                                                    {(entry.members || []).map((m, idx) => (
                                                        <span key={m.userId || m.email || idx} className="inline-flex items-center">
                                                            <Link to={m.userId ? `/profile?userId=${m.userId}` : '/profile'} className="text-[#453e66] hover:underline font-bold">
                                                                {m.fullName || m.email}
                                                            </Link>
                                                            {idx < entry.members.length - 1 && <span className="text-[#a4b4b9] ml-1">,</span>}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div>
                                            <Link to={entry.userId ? `/profile?userId=${entry.userId}` : '/profile'} className="font-extrabold text-slate-900 hover:text-[#453e66] hover:underline">
                                                {entry.fullName}
                                            </Link>
                                            <p className="text-xs text-slate-400 mt-0.5">{entry.email}</p>
                                        </div>
                                    )}
                                </td>
                                {mode === 'TEAM' && isGlobal && (
                                    <td className="py-3.5 px-5 font-semibold text-slate-500">
                                        <span className="text-[10px] font-bold text-[#453e66] bg-[#f0eefc] px-2 py-0.5 rounded">
                                            {entry.eventName || 'Aggregate'}
                                        </span>
                                    </td>
                                )}
                                {mode === 'TEAM' && !isGlobal && (
                                    <td className="py-3.5 px-5 font-semibold text-slate-500">
                                        {entry.track || 'General'}
                                    </td>
                                )}
                                <td className="py-3.5 px-5 text-right pr-6">
                                    {mode === 'TEAM' ? (
                                        <span className="font-extrabold text-white bg-[#453e66] px-2.5 py-1 rounded text-xs shadow-sm">
                                            {entry.score || 0} pts
                                        </span>
                                    ) : (
                                        <span className="text-xs font-semibold text-slate-500">
                                            {entry.first} 1st · {entry.second} 2nd · {entry.third} 3rd
                                        </span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default function Leaderboard() {
    const [rankings, setRankings] = useState([]);
    const [events, setEvents] = useState([]);
    const [selectedEventId, setSelectedEventId] = useState('');
    const [mode, setMode] = useState('TEAM');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Step 1: load events list once on mount
    useEffect(() => {
        axiosClient.get('/events')
            .then(res => {
                const list = [...(res.result || [])].sort((a, b) => (b.id || 0) - (a.id || 0));
                setEvents(list);
                // Auto-select the latest event
                if (list.length > 0) setSelectedEventId(String(list[0].id));
            })
            .catch(() => setEvents([]));
    }, []);

    // Step 2: load leaderboard whenever selectedEventId changes
    const fetchLeaderboard = async (evId) => {
        const id = evId ?? selectedEventId;
        if (!id) return;
        try {
            setLoading(true);
            setError('');
            const url = id === 'ALL' ? '/leaderboard/all' : `/leaderboard?eventId=${id}`;
            const res = await axiosClient.get(url);
            setRankings(res.result || []);
        } catch (err) {
            setError(err.message || 'Unable to load leaderboard data.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedEventId) fetchLeaderboard(selectedEventId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedEventId]);

    const displayRows = rankings.length ? rankings : (selectedEventId ? [] : demoWinners);

    const selectedEventName = useMemo(() => {
        const found = events.find(e => String(e.id) === String(selectedEventId));
        return found ? found.name : 'Event';
    }, [events, selectedEventId]);

    const teamRows = useMemo(() => {
        if (displayRows === demoWinners) {
            return displayRows.map((row, index) => ({ ...row, rank: row.rank || index + 1 }));
        }
        return displayRows.map((row, index) => ({ ...row, rank: row.rank || index + 1 }));
    }, [displayRows]);

    const individualRows = useMemo(() => {
        const stats = new Map();
        const allTeamRows = displayRows.map((row, index) => ({ ...row, rank: row.rank || index + 1 }));

        allTeamRows.forEach((team) => {
            (team.members || []).forEach((member) => {
                const key = member.userId || member.email || member.fullName;
                if (!key) return;
                const current = stats.get(key) || {
                    userId: member.userId,
                    fullName: member.fullName || member.email,
                    email: member.email,
                    first: 0,
                    second: 0,
                    third: 0,
                    total: 0,
                };
                if (team.rank === 1) current.first += 1;
                if (team.rank === 2) current.second += 1;
                if (team.rank === 3) current.third += 1;
                current.total += 1;
                stats.set(key, current);
            });
        });
        return [...stats.values()].sort((a, b) => b.first - a.first || b.second - a.second || b.third - a.third || b.total - a.total);
    }, [displayRows]);

    const rankedRows = useMemo(() => {
        if (mode === 'TEAM') return [...teamRows].sort((a, b) => a.rank - b.rank);
        return individualRows.map((student, index) => ({ ...student, rank: index + 1 }));
    }, [individualRows, mode, teamRows]);

    const podiumEntries = [2, 1, 3].map((rank) => rankedRows.find((entry) => entry.rank === rank));
    const remainingRows = rankedRows.filter((entry) => entry.rank > 3);

    return (
        <main className="bg-white min-h-screen text-slate-800">
            {/* Title Section - Synchronized with Events Page layout but lavender background */}
            <header className="bg-[#f8fafc] py-12 text-center border-b border-slate-200">
                <h1 className="text-[60px] font-black tracking-tight text-[#2b2542] leading-none">Leaderboard</h1>
                <p className="mt-4 text-[#4b4561] max-w-lg mx-auto text-base sm:text-lg">
                    Celebrating the achievements of the top teams and individual student innovators.
                </p>
            </header>

            {/* Filter & Controls section - Synchronized with Events Page search wrap */}
            <section className="max-w-[1220px] mx-auto px-6 mt-12">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-100">
                    <div className="flex-1">
                        {mode === 'TEAM' ? (
                            <div className="flex items-center gap-3">
                                <label htmlFor="leaderboard-season" className="text-xs font-extrabold text-slate-400 uppercase tracking-wider whitespace-nowrap">Filter by Event:</label>
                                <select 
                                    id="leaderboard-season" 
                                    value={selectedEventId} 
                                    onChange={(e) => setSelectedEventId(e.target.value)}
                                    className="bg-white border border-slate-200 rounded px-3 py-1.5 text-xs font-bold text-slate-800 focus:border-[#453e66] focus:outline-none min-w-[220px]"
                                >
                                    {events.length === 0 && <option value="">Loading...</option>}
                                    <option value="ALL">System-wide Standings</option>
                                    {events.map((evt) => <option key={evt.id} value={String(evt.id)}>{evt.name}</option>)}
                                </select>
                            </div>
                        ) : (
                            <div className="inline-flex items-center text-xs font-extrabold text-[#4b4561] bg-[#f0eefc] border border-[#ddd9f0] rounded px-3.5 py-2 shadow-sm">
                                <span>Individual leaderboard aggregates performance points across all hackathons</span>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Mode selectors matched to Events page layout tabs */}
                        <div className="flex gap-2">
                            <button 
                                type="button" 
                                className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded border transition-all ${
                                    mode === 'TEAM' 
                                        ? 'bg-[#453e66] border-[#453e66] text-white' 
                                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`} 
                                onClick={() => setMode('TEAM')}
                            >
                                Teams
                            </button>
                            <button 
                                type="button" 
                                className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded border transition-all ${
                                    mode === 'PERSONAL' 
                                        ? 'bg-[#453e66] border-[#453e66] text-white' 
                                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`} 
                                onClick={() => setMode('PERSONAL')}
                            >
                                Individuals
                            </button>
                        </div>

                        <button 
                            onClick={() => fetchLeaderboard(selectedEventId)} 
                            title="Refresh" 
                            className="h-9 w-9 flex items-center justify-center rounded border border-slate-200 bg-white text-[#453e66] hover:bg-[#f0eefc] font-bold text-sm transition-all shadow-sm" 
                            type="button"
                        >
                            ↻
                        </button>
                    </div>
                </div>
            </section>

            {/* Leaderboard content body matched to Events page body layout */}
            <section className="max-w-[1220px] mx-auto px-6 py-12">
                <Toast error={error} onClose={() => setError('')} />

                {loading ? (
                    <div className="text-center py-16 text-sm text-slate-500 font-bold">
                        Loading leaderboard statistics...
                    </div>
                ) : rankedRows.length ? (
                    <div className="space-y-8">
                        {/* Top 3 Podium Grid */}
                        <div className="grid gap-6 sm:grid-cols-3 items-end max-w-5xl mx-auto pt-2">
                            <PodiumCard entry={podiumEntries[0]} mode={mode} isGlobal={selectedEventId === 'ALL'} />
                            <PodiumCard entry={podiumEntries[1]} mode={mode} isGlobal={selectedEventId === 'ALL'} />
                            <PodiumCard entry={podiumEntries[2]} mode={mode} isGlobal={selectedEventId === 'ALL'} />
                        </div>

                        {/* Table of Ranks 4+ */}
                        <RankedList rows={remainingRows} mode={mode} isGlobal={selectedEventId === 'ALL'} />
                    </div>
                ) : (
                    <div className="text-center py-16 text-sm text-slate-500">
                        No leaderboard data available at the moment.
                    </div>
                )}
            </section>
        </main>
    );
}
