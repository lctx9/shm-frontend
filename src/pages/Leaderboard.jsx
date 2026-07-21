import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import Toast from '../components/Toast';
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
            border: 'border-t-4 border-t-amber-500 shadow-sm',
            rankText: 'Vô địch',
            scoreBg: 'bg-amber-50 text-amber-700',
            scale: 'md:scale-105 z-10 md:-translate-y-1'
        },
        2: {
            medal: '🥈',
            medalBg: 'bg-slate-50 text-slate-500 border-slate-200',
            border: 'border-t-4 border-t-slate-400 shadow-sm',
            rankText: 'Á quân',
            scoreBg: 'bg-[#e8f4ff] text-[#1474cb]',
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
        scoreBg: 'bg-[#e8f4ff] text-[#1474cb]',
        scale: ''
    };

    return (
        <div className={`bg-white rounded-lg border border-[#c6d3d7] p-5 flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm ${config.border} ${config.scale}`}>
            <div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className={`text-[18px] h-9 w-9 rounded-lg border flex items-center justify-center ${config.medalBg}`}>
                            {config.medal}
                        </span>
                        <div>
                            <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#56717a]">{config.rankText}</p>
                            <p className="text-xs font-bold text-[#536d75]">Top {entry.rank}</p>
                        </div>
                    </div>
                </div>

                <div className="mt-4 min-w-0">
                    {isTeam ? (
                        <h2 className="text-base font-extrabold text-[#102d38] truncate" title={name}>{name}</h2>
                    ) : (
                        <Link to={profilePath} className="text-base font-extrabold text-[#102d38] hover:text-[var(--dp-blue)] hover:underline truncate block" title={name}>
                            {name}
                        </Link>
                    )}
                    <p className="text-xs text-[#536d75] mt-1 truncate">
                        {isTeam ? (entry.track || 'Bảng chung') : `${entry.first} nhất · ${entry.second} nhì · ${entry.third} ba`}
                    </p>
                </div>

                {isTeam && entry.members && entry.members.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                        {entry.members.slice(0, 3).map((m, idx) => (
                            <Link 
                                to={m.userId ? `/profile?userId=${m.userId}` : '/profile'}
                                key={m.id || m.email || m.fullName || idx}
                                className="text-[11px] bg-[#e8f4ff] hover:bg-[#d8ebff] text-[#1474cb] px-2 py-0.5 rounded font-semibold transition-colors"
                            >
                                {m.fullName || m.email}
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            <div className="mt-4 pt-3 border-t border-[#eef1f2] flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#56717a] uppercase tracking-wider">Thành tích</span>
                <span className={`text-xs font-extrabold px-2.5 py-1 rounded ${config.scoreBg}`}>
                    {isTeam ? `${entry.score || 0} điểm` : `${entry.total} lần tham gia`}
                </span>
            </div>
        </div>
    );
}

function RankedList({ rows, mode }) {
    if (!rows.length) return null;

    return (
        <div className="bg-white rounded-lg border border-[#c6d3d7] overflow-hidden">
            <div className="px-5 py-3.5 bg-[#f8fafb] border-b border-[#c6d3d7] flex items-center justify-between">
                <h2 className="text-xs font-extrabold text-[#102d38] uppercase tracking-wider">Thứ hạng tiếp theo</h2>
                <span className="bg-[#e8f4ff] text-[#1474cb] text-[10px] font-extrabold px-2.5 py-0.5 rounded uppercase tracking-wider">
                    Từ hạng 4 trở xuống
                </span>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-[#c6d3d7] bg-[#f8fafb] text-[11px] font-extrabold uppercase text-[#102d38] tracking-wider">
                            <th className="py-3 px-5 w-16 text-center">Hạng</th>
                            <th className="py-3 px-5">
                                {mode === 'TEAM' ? 'Đội thi & Thành viên' : 'Sinh viên'}
                            </th>
                            {mode === 'TEAM' && <th className="py-3 px-5">Bảng đấu</th>}
                            <th className="py-3 px-5 text-right pr-6">
                                {mode === 'TEAM' ? 'Điểm số' : 'Số giải đạt được'}
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#eef1f2] text-xs sm:text-sm">
                        {rows.map((entry) => (
                            <tr key={entry.id || entry.teamName || entry.userId || entry.email || entry.fullName} className="hover:bg-[#f8fafb]/60 transition-colors">
                                <td className="py-3.5 px-5 text-center font-extrabold text-[#56717a]">
                                    #{entry.rank}
                                </td>
                                <td className="py-3.5 px-5">
                                    {mode === 'TEAM' ? (
                                        <div>
                                            <p className="font-extrabold text-[#102d38]">{entry.teamName}</p>
                                            {entry.members && entry.members.length > 0 && (
                                                <div className="text-xs text-[#536d75] mt-1 flex flex-wrap gap-x-1.5 items-center">
                                                    <span className="font-semibold text-[#56717a]">Thành viên:</span>
                                                    {(entry.members || []).map((m, idx) => (
                                                        <span key={m.userId || m.email || idx} className="inline-flex items-center">
                                                            <Link to={m.userId ? `/profile?userId=${m.userId}` : '/profile'} className="text-[#1474cb] hover:underline font-bold">
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
                                            <Link to={entry.userId ? `/profile?userId=${entry.userId}` : '/profile'} className="font-extrabold text-[#102d38] hover:text-[#1474cb] hover:underline">
                                                {entry.fullName}
                                            </Link>
                                            <p className="text-xs text-[#56717a] mt-0.5">{entry.email}</p>
                                        </div>
                                    )}
                                </td>
                                {mode === 'TEAM' && (
                                    <td className="py-3.5 px-5 font-semibold text-[#536d75]">
                                        {entry.track || 'Bảng chung'}
                                    </td>
                                )}
                                <td className="py-3.5 px-5 text-right pr-6">
                                    {mode === 'TEAM' ? (
                                        <span className="font-extrabold text-[#1474cb] bg-[#e8f4ff] px-2.5 py-1 rounded text-xs">
                                            {entry.score || 0} điểm
                                        </span>
                                    ) : (
                                        <span className="text-xs font-semibold text-[#536d75]">
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
        <main className="events-marketplace">
            {/* Hero Section - Synchronized with Events Page */}
            <header className="events-marketplace__hero">
                <h1>Bảng xếp hạng giải đấu SEAL</h1>
                <p>Vinh danh thành tích các đội thi và cá nhân xuất sắc nhất qua các mùa giải hackathon.</p>
            </header>

            {/* Filter & Controls section - Synchronized with Events Page Search Wrap */}
            <section className="events-marketplace__search-wrap">
                <div className="w-full max-w-[1460px] mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex-1">
                        {mode === 'TEAM' ? (
                            <div className="flex items-center gap-3">
                                <label htmlFor="leaderboard-season" className="text-xs font-extrabold text-[#56717a] uppercase tracking-wider whitespace-nowrap">Lọc giải đấu:</label>
                                <select 
                                    id="leaderboard-season" 
                                    value={selectedEventId} 
                                    onChange={(e) => setSelectedEventId(e.target.value)}
                                    className="bg-white border border-[#afc0c6] rounded px-3 py-1.5 text-xs font-bold text-[#102d38] focus:border-[var(--dp-blue)] focus:outline-none min-w-[220px]"
                                >
                                    <option value="LATEST">Giải đấu mới nhất</option>
                                    {eventOptions.map((evt) => <option key={evt.id} value={evt.id}>{evt.name}</option>)}
                                </select>
                            </div>
                        ) : (
                            <div className="inline-flex items-center gap-2 text-xs font-extrabold text-[#1474cb] bg-[#e8f4ff] border border-[#c7d4d8] rounded px-3 py-1.5">
                                <span>🏆</span>
                                <span>BXH Cá nhân tự động tích lũy điểm qua tất cả giải đấu</span>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="market-sort">
                            <strong>Chế độ:</strong>
                            <button 
                                type="button" 
                                className={mode === 'TEAM' ? 'is-active' : ''} 
                                onClick={() => setMode('TEAM')}
                            >
                                Đội thi
                            </button>
                            <button 
                                type="button" 
                                className={mode === 'PERSONAL' ? 'is-active' : ''} 
                                onClick={() => setMode('PERSONAL')}
                            >
                                Cá nhân
                            </button>
                        </div>

                        <button 
                            onClick={fetchLeaderboard} 
                            title="Làm mới dữ liệu" 
                            className="h-9 w-9 flex items-center justify-center rounded border border-[#afc0c6] bg-white text-[#1474cb] hover:bg-[#e8f4ff] font-bold text-sm transition-all shadow-sm" 
                            type="button"
                        >
                            ↻
                        </button>
                    </div>
                </div>
            </section>

            {/* Main Content Body - Synchronized with Events Page Body */}
            <div className="events-marketplace__body flex-col space-y-5" style={{ gridTemplateColumns: '1fr' }}>
                <Toast error={error} onClose={() => setError('')} />

                {loading ? (
                    <div className="market-results__message">
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
                    <div className="market-results__message">
                        Chưa có đủ dữ liệu để hiển thị bảng xếp hạng.
                    </div>
                )}
            </div>
        </main>
    );
}
