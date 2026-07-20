import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { demoWinners } from '../utils/hackathon';

function PodiumCard({ entry, mode }) {
    if (!entry) return null;

    const isTeam = mode === 'TEAM';
    const name = isTeam ? entry.teamName : entry.fullName;
    const profilePath = !isTeam && entry.userId ? `/profile?userId=${entry.userId}` : '/profile';

    const config = {
        1: {
            medal: '👑',
            medalBg: 'bg-amber-50 text-amber-500 border-amber-200',
            border: 'border-t-4 border-t-amber-500 shadow-md',
            rankText: 'Vô địch',
            scoreBg: 'bg-amber-50 text-amber-700',
            scale: 'md:scale-105 z-10 md:-translate-y-2'
        },
        2: {
            medal: '🥈',
            medalBg: 'bg-slate-50 text-slate-500 border-slate-200',
            border: 'border-t-4 border-t-slate-400 shadow-sm',
            rankText: 'Á quân',
            scoreBg: 'bg-slate-50 text-slate-700',
            scale: ''
        },
        3: {
            medal: '🥉',
            medalBg: 'bg-orange-50 text-orange-700 border-orange-200',
            border: 'border-t-4 border-t-orange-600 shadow-sm',
            rankText: 'Hạng ba',
            scoreBg: 'bg-orange-50 text-orange-800',
            scale: ''
        }
    }[entry.rank] || {
        medal: '🎖️',
        medalBg: 'bg-slate-50 text-slate-600 border-slate-200',
        border: 'border-t-4 border-t-slate-500 shadow-sm',
        rankText: `Hạng ${entry.rank}`,
        scoreBg: 'bg-slate-50 text-slate-700',
        scale: ''
    };

    return (
        <div className={`bg-white rounded-2xl border border-blue-100 p-5 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${config.border} ${config.scale}`}>
            <div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className={`text-[20px] h-10 w-10 rounded-xl border flex items-center justify-center ${config.medalBg}`}>
                            {config.medal}
                        </span>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{config.rankText}</p>
                            <p className="text-xs font-bold text-slate-500">Top {entry.rank}</p>
                        </div>
                    </div>
                </div>

                <div className="mt-4 min-w-0">
                    {isTeam ? (
                        <h2 className="text-base font-black text-slate-900 truncate" title={name}>{name}</h2>
                    ) : (
                        <Link to={profilePath} className="text-base font-black text-slate-900 hover:text-blue-600 hover:underline truncate block" title={name}>
                            {name}
                        </Link>
                    )}
                    <p className="text-xs text-slate-500 mt-1 truncate">
                        {isTeam ? (entry.track || 'Bảng chung') : `${entry.first} nhất · ${entry.second} nhì · ${entry.third} ba`}
                    </p>
                </div>

                {isTeam && entry.members && entry.members.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                        {entry.members.slice(0, 3).map((m, idx) => (
                            <Link 
                                to={m.userId ? `/profile?userId=${m.userId}` : '/profile'}
                                key={m.id || m.email || m.fullName || idx}
                                className="text-[9px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-0.5 rounded-md font-semibold transition-colors"
                            >
                                {m.fullName || m.email}
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Thành tích</span>
                <span className={`text-xs font-black px-2.5 py-1 rounded-lg ${config.scoreBg}`}>
                    {isTeam ? `${entry.score || 0} điểm` : `${entry.total} lần tham gia`}
                </span>
            </div>
        </div>
    );
}

function RankedList({ rows, mode }) {
    if (!rows.length) return null;

    return (
        <div className="bg-white rounded-2xl border border-blue-100 overflow-hidden shadow-sm">
            <div className="px-6 py-4 bg-[#f0f7ff] border-b border-blue-100 flex items-center justify-between">
                <h2 className="text-xs font-black text-[#0f63c9] uppercase tracking-wider">Thứ hạng tiếp theo</h2>
                <span className="bg-blue-100 text-[#0f63c9] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                    Từ hạng 4 trở xuống
                </span>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-blue-100 bg-slate-50 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                            <th className="py-3 px-6 w-20 text-center">Hạng</th>
                            <th className="py-3 px-6">
                                {mode === 'TEAM' ? 'Đội thi & Thành viên' : 'Sinh viên'}
                            </th>
                            {mode === 'TEAM' && <th className="py-3 px-6">Bảng đấu</th>}
                            <th className="py-3 px-6 text-right pr-8">
                                {mode === 'TEAM' ? 'Điểm số' : 'Số giải đạt được'}
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                        {rows.map((entry) => (
                            <tr key={entry.id || entry.teamName || entry.userId || entry.email || entry.fullName} className="hover:bg-slate-50/30 transition-colors">
                                <td className="py-4 px-6 text-center font-bold text-slate-500">
                                    #{entry.rank}
                                </td>
                                <td className="py-4 px-6">
                                    {mode === 'TEAM' ? (
                                        <div>
                                            <p className="font-extrabold text-slate-800">{entry.teamName}</p>
                                            {entry.members && entry.members.length > 0 && (
                                                <div className="text-xs text-slate-500 mt-1 flex flex-wrap gap-x-1.5 items-center">
                                                    <span className="font-semibold text-slate-400">Thành viên:</span>
                                                    {(entry.members || []).map((m, idx) => (
                                                        <span key={m.userId || m.email || idx} className="inline-flex items-center">
                                                            <Link to={m.userId ? `/profile?userId=${m.userId}` : '/profile'} className="text-[var(--shield-blue)] hover:underline font-bold">
                                                                {m.fullName || m.email}
                                                            </Link>
                                                            {idx < entry.members.length - 1 && <span className="text-slate-300 ml-1">,</span>}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div>
                                            <Link to={entry.userId ? `/profile?userId=${entry.userId}` : '/profile'} className="font-extrabold text-slate-800 hover:text-blue-600 hover:underline">
                                                {entry.fullName}
                                            </Link>
                                            <p className="text-xs text-slate-400 mt-1">{entry.email}</p>
                                        </div>
                                    )}
                                </td>
                                {mode === 'TEAM' && (
                                    <td className="py-4 px-6 font-semibold text-slate-600">
                                        {entry.track || 'Bảng chung'}
                                    </td>
                                )}
                                <td className="py-4 px-6 text-right pr-8">
                                    {mode === 'TEAM' ? (
                                        <span className="font-extrabold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-md text-xs">
                                            {entry.score || 0} điểm
                                        </span>
                                    ) : (
                                        <span className="text-xs font-semibold text-slate-600">
                                            {entry.first} nhất · {entry.second} nhì · {entry.third} ba
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
    const [selectedEventId, setSelectedEventId] = useState('LATEST');
    const [mode, setMode] = useState('TEAM');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchLeaderboard = async () => {
        try {
            setLoading(true);
            const [rankRes, eventRes] = await Promise.allSettled([
                axiosClient.get('/leaderboard'),
                axiosClient.get('/events'),
            ]);
            if (rankRes.status === 'fulfilled') setRankings(rankRes.value.result || []);
            if (eventRes.status === 'fulfilled') setEvents(eventRes.value.result || []);
            if (rankRes.status === 'rejected') throw rankRes.reason;
            setError('');
        } catch (err) {
            setError(err.message || 'Không thể tải dữ liệu bảng xếp hạng.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaderboard();
    }, []);

    const displayRows = rankings.length ? rankings : demoWinners;
    
    const eventOptions = useMemo(() => {
        return [...events].sort((a, b) => (b.year || 0) - (a.year || 0));
    }, [events]);

    const activeEventId = useMemo(() => {
        if (selectedEventId !== 'LATEST') return selectedEventId;
        if (eventOptions.length > 0) return String(eventOptions[0].id);
        return '';
    }, [selectedEventId, eventOptions]);

    const selectedEventName = useMemo(() => {
        const found = eventOptions.find(e => String(e.id) === String(activeEventId));
        return found ? found.name : 'Giải gần nhất';
    }, [eventOptions, activeEventId]);

    const teamRows = useMemo(() => {
        if (displayRows === demoWinners) {
            return displayRows.map((row, index) => ({ ...row, rank: row.rank || index + 1 }));
        }

        return displayRows
            .filter((row) => !activeEventId || !row.eventId || String(row.eventId) === String(activeEventId))
            .map((row, index) => ({ ...row, rank: row.rank || index + 1 }));
    }, [displayRows, activeEventId]);

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
        <main className="mx-auto max-w-7xl space-y-6">
            {/* Hero Section */}
            <header className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0b3d49] via-[#0e5362] to-[#0f6b7e] p-6 sm:p-8 text-white shadow-lg">
                <div className="absolute -right-8 -top-8 h-44 w-44 rounded-full bg-white/10 blur-2xl pointer-events-none" />
                <div className="relative z-10 max-w-2xl">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-teal-200">SEAL Dashboard</p>
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-1 text-white">Bảng Xếp Hạng</h1>
                    <p className="text-xs sm:text-sm text-teal-100/90 mt-2 font-medium">
                        Vinh danh thành tích các đội thi và cá nhân xuất sắc nhất trong các mùa giải SEAL Hackathon.
                    </p>
                </div>
            </header>

            {/* Filter & Controls section */}
            <section className="bg-white border border-blue-100 rounded-2xl p-5 shadow-sm flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                    {mode === 'TEAM' ? (
                        <div className="w-full sm:max-w-xs">
                            <label htmlFor="leaderboard-season" className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Lọc giải đấu</label>
                            <select 
                                id="leaderboard-season" 
                                value={selectedEventId} 
                                onChange={(e) => setSelectedEventId(e.target.value)}
                                className="w-full bg-white border border-blue-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            >
                                <option value="LATEST">Giải đấu mới nhất</option>
                                {eventOptions.map((evt) => <option key={evt.id} value={evt.id}>{evt.name}</option>)}
                            </select>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-xs font-bold text-[#0f63c9] bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5">
                            <span>🏆</span>
                            <span>BXH Cá nhân tự động tích lũy điểm qua tất cả giải đấu</span>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                    <div className="bg-[#f0f7ff] p-1 rounded-xl flex gap-1 border border-blue-100">
                        <button 
                            type="button" 
                            onClick={() => setMode('TEAM')} 
                            className={`px-4 py-2 text-xs font-black rounded-lg transition-all ${mode === 'TEAM' ? 'bg-[#0f63c9] text-white shadow-sm' : 'text-slate-600 hover:text-[#0f63c9]'}`}
                        >
                            Đội thi
                        </button>
                        <button 
                            type="button" 
                            onClick={() => setMode('PERSONAL')} 
                            className={`px-4 py-2 text-xs font-black rounded-lg transition-all ${mode === 'PERSONAL' ? 'bg-[#0f63c9] text-white shadow-sm' : 'text-slate-600 hover:text-[#0f63c9]'}`}
                        >
                            Cá nhân
                        </button>
                    </div>

                    <button 
                        onClick={fetchLeaderboard} 
                        className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold py-2 px-3.5 rounded-xl transition-all shadow-sm flex items-center gap-1.5 active:scale-95" 
                        type="button"
                    >
                        Làm mới
                    </button>
                </div>
            </section>

            {/* Context Subtitle */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-2">
                <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-[var(--shield-blue)]">Đang xem</span>
                    <h2 className="text-lg font-black text-slate-800 mt-0.5">{mode === 'TEAM' ? 'Thành tích đội thi' : 'Thành tích cá nhân'}</h2>
                </div>
                <p className="text-xs text-[var(--shield-copy)] font-bold sm:text-right">
                    {rankedRows.length} thứ hạng · {mode === 'TEAM' ? selectedEventName : 'Tất cả giải đấu'}
                </p>
            </div>

            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-sm text-slate-500 shadow-sm animate-pulse">
                    Đang tải dữ liệu bảng xếp hạng...
                </div>
            ) : rankedRows.length ? (
                <div className="space-y-6">
                    {/* Top 3 Podium Grid */}
                    <div className="grid gap-6 sm:grid-cols-3 items-end max-w-5xl mx-auto pt-2">
                        <PodiumCard entry={podiumEntries[0]} mode={mode} />
                        <PodiumCard entry={podiumEntries[1]} mode={mode} />
                        <PodiumCard entry={podiumEntries[2]} mode={mode} />
                    </div>

                    {/* Table of Ranks 4+ */}
                    <RankedList rows={remainingRows} mode={mode} />
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-sm text-slate-500 shadow-sm">
                    Chưa có đủ dữ liệu để hiển thị bảng xếp hạng.
                </div>
            )}
        </main>
    );
}
