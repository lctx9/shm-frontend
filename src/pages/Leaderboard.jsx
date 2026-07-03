import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { demoWinners } from '../utils/hackathon';

function rankLabel(rank) {
    if (rank === 1) return 'Vô địch';
    if (rank === 2) return 'Á quân';
    if (rank === 3) return 'Hạng ba';
    return `Hạng ${rank}`;
}

export default function Leaderboard() {
    const [rankings, setRankings] = useState([]);
    const [events, setEvents] = useState([]);
    const [season, setSeason] = useState('LATEST');
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
    const seasons = useMemo(() => {
        const fromRankings = displayRows.map((row) => row.eventYear).filter(Boolean);
        const fromEvents = events.map((event) => event.year).filter(Boolean);
        return [...new Set([...fromRankings, ...fromEvents])].sort((a, b) => b - a);
    }, [displayRows, events]);

    const latestSeason = seasons[0];
    const selectedYear = season === 'LATEST' ? latestSeason : Number(season);
    const teamRows = displayRows
        .filter((row) => !selectedYear || !row.eventYear || row.eventYear === selectedYear)
        .map((row, index) => ({ ...row, rank: row.rank || index + 1 }));

    const individualRows = useMemo(() => {
        const stats = new Map();
        teamRows.forEach((team) => {
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
    }, [teamRows]);

    return (
        <main className="section-shell">
            <div className="mb-8 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
                <div>
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-[#0f63c9]">Leaderboard</p>
                    <h1 className="section-title">Bảng xếp hạng giải gần nhất</h1>
                    <p className="section-copy">Xem thứ hạng đội thi theo mùa giải hoặc chuyển sang thành tích cá nhân của sinh viên.</p>
                </div>
                <button onClick={fetchLeaderboard} className="btn-secondary" type="button">Làm mới</button>
            </div>

            <div className="mb-6 grid gap-4 rounded-lg border border-[#d7e6f8] bg-white p-4 md:grid-cols-2">
                <div>
                    <label className="mb-1 block text-sm font-bold text-[#0b1f3f]">Mùa giải</label>
                    <select className="input-custom" value={season} onChange={(e) => setSeason(e.target.value)}>
                        <option value="LATEST">Giải gần nhất</option>
                        {seasons.map((year) => <option key={year} value={year}>{year}</option>)}
                    </select>
                </div>
                <div>
                    <label className="mb-1 block text-sm font-bold text-[#0b1f3f]">Loại bảng xếp hạng</label>
                    <div className="grid grid-cols-2 gap-2">
                        <button type="button" onClick={() => setMode('TEAM')} className={mode === 'TEAM' ? 'btn-primary' : 'btn-secondary'}>Đội thi</button>
                        <button type="button" onClick={() => setMode('PERSONAL')} className={mode === 'PERSONAL' ? 'btn-primary' : 'btn-secondary'}>Cá nhân</button>
                    </div>
                </div>
            </div>

            {error && <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}

            {loading ? (
                <div className="rounded-lg border border-[#d7e6f8] bg-white p-8 text-center text-[#5c6d83]">Đang tải bảng xếp hạng...</div>
            ) : mode === 'TEAM' ? (
                <div className="overflow-hidden rounded-lg border border-[#d7e6f8] bg-white shadow-sm">
                    {teamRows.map((team) => (
                        <div key={`${team.id || team.teamName}-${team.rank}`} className="grid gap-4 border-b border-[#d7e6f8] p-5 last:border-b-0 md:grid-cols-[90px_1fr_160px] md:items-center">
                            <div className="text-center">
                                <p className="text-3xl font-black text-[#0f63c9]">#{team.rank}</p>
                                <p className="text-xs font-black uppercase text-[#5c6d83]">{rankLabel(team.rank)}</p>
                            </div>
                            <div>
                                <h2 className="text-xl font-black uppercase tracking-[0.06em] text-[#071936]">{team.teamName}</h2>
                                <p className="mt-1 text-sm font-bold text-[#0f63c9]">{team.track || 'Bảng chung'}</p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {(team.members || []).length ? team.members.map((member) => (
                                        <Link
                                            to={member.userId ? `/profile?userId=${member.userId}` : '/profile'}
                                            key={member.id || member.email || member.fullName}
                                            className="rounded-full border border-[#d7e6f8] bg-[#f8fbff] px-3 py-1 text-xs font-bold text-[#0b1f3f] hover:border-[#8ec5ff]"
                                        >
                                            {member.fullName || member.email}
                                        </Link>
                                    )) : <span className="text-sm text-[#5c6d83]">Chưa cập nhật thành viên</span>}
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-4xl font-black text-[#071936]">{team.score || 0}</p>
                                <p className="text-xs font-black uppercase text-[#5c6d83]">điểm</p>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="overflow-hidden rounded-lg border border-[#d7e6f8] bg-white shadow-sm">
                    {individualRows.length ? individualRows.map((student, index) => (
                        <div key={student.userId || student.email || student.fullName} className="grid gap-4 border-b border-[#d7e6f8] p-5 last:border-b-0 md:grid-cols-[80px_1fr_360px] md:items-center">
                            <p className="text-2xl font-black text-[#0f63c9]">#{index + 1}</p>
                            <Link to={student.userId ? `/profile?userId=${student.userId}` : '/profile'} className="text-lg font-black uppercase tracking-[0.06em] text-[#071936]">
                                {student.fullName}
                            </Link>
                            <div className="grid grid-cols-4 gap-2 text-center text-sm">
                                <span className="rounded-lg bg-[#f8fbff] p-3 font-bold">Giải nhất: {student.first}</span>
                                <span className="rounded-lg bg-[#f8fbff] p-3 font-bold">Giải nhì: {student.second}</span>
                                <span className="rounded-lg bg-[#f8fbff] p-3 font-bold">Giải ba: {student.third}</span>
                                <span className="rounded-lg bg-[#f8fbff] p-3 font-bold">Đã tham gia: {student.total}</span>
                            </div>
                        </div>
                    )) : (
                        <div className="p-8 text-center text-[#5c6d83]">Chưa có đủ dữ liệu thành viên để tính bảng xếp hạng cá nhân.</div>
                    )}
                </div>
            )}
        </main>
    );
}
