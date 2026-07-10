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

const podiumMeta = {
    1: { medal: '🥇', className: 'podium-card podium-card--first' },
    2: { medal: '🥈', className: 'podium-card podium-card--second' },
    3: { medal: '🥉', className: 'podium-card podium-card--third' },
};

function PodiumCard({ entry, mode }) {
    if (!entry) return <div className="podium-card podium-card--empty" aria-hidden="true" />;

    const meta = podiumMeta[entry.rank];
    const isTeam = mode === 'TEAM';
    const name = isTeam ? entry.teamName : entry.fullName;
    const profilePath = !isTeam && entry.userId ? `/profile?userId=${entry.userId}` : '/profile';

    return (
        <article className={meta.className}>
            <div className="podium-card__medal" aria-label={rankLabel(entry.rank)}>{meta.medal}</div>
            <p className="podium-card__rank">Hạng {entry.rank}</p>
            {isTeam ? (
                <h2 className="podium-card__name">{name}</h2>
            ) : (
                <Link to={profilePath} className="podium-card__name podium-card__link">{name}</Link>
            )}
            <p className="podium-card__track">
                {isTeam ? (entry.track || 'Bảng chung') : `${entry.first} nhất · ${entry.second} nhì · ${entry.third} ba`}
            </p>
            <div className="podium-card__score">
                <strong>{isTeam ? (entry.score || 0) : entry.total}</strong>
                <span>{isTeam ? 'điểm' : 'lần tham gia'}</span>
            </div>
            {isTeam && (
                <div className="podium-card__members">
                    {(entry.members || []).slice(0, 4).map((member) => (
                        <Link
                            to={member.userId ? `/profile?userId=${member.userId}` : '/profile'}
                            key={member.id || member.email || member.fullName}
                        >
                            {member.fullName || member.email}
                        </Link>
                    ))}
                </div>
            )}
            <div className="podium-card__base"><span>{entry.rank}</span></div>
        </article>
    );
}

function RankedList({ rows, mode }) {
    if (!rows.length) return <div className="leaderboard-empty">Chưa có thứ hạng tiếp theo.</div>;

    return (
        <section className="leaderboard-list" aria-label="Các thứ hạng tiếp theo">
            <div className="leaderboard-list__heading">
                <div><p>Thứ hạng tiếp theo</p><h2>Từ hạng 4 trở xuống</h2></div>
                <span>{rows.length} {mode === 'TEAM' ? 'đội thi' : 'thí sinh'}</span>
            </div>
            {rows.map((entry) => (
                <div key={entry.id || entry.teamName || entry.userId || entry.email || entry.fullName} className="leaderboard-row">
                    <div className="leaderboard-row__rank">#{entry.rank}</div>
                    <div className="leaderboard-row__main">
                        {mode === 'TEAM' ? (
                            <>
                                <h3>{entry.teamName}</h3>
                                <p>{entry.track || 'Bảng chung'} · {(entry.members || []).map((member) => member.fullName || member.email).join(', ') || 'Chưa cập nhật thành viên'}</p>
                            </>
                        ) : (
                            <>
                                <Link to={entry.userId ? `/profile?userId=${entry.userId}` : '/profile'}>{entry.fullName}</Link>
                                <p>{entry.first} giải nhất · {entry.second} giải nhì · {entry.third} giải ba</p>
                            </>
                        )}
                    </div>
                    <div className="leaderboard-row__score">
                        <strong>{mode === 'TEAM' ? (entry.score || 0) : entry.total}</strong>
                        <span>{mode === 'TEAM' ? 'điểm' : 'lần tham gia'}</span>
                    </div>
                </div>
            ))}
        </section>
    );
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

    const rankedRows = useMemo(() => {
        if (mode === 'TEAM') return [...teamRows].sort((a, b) => a.rank - b.rank);
        return individualRows.map((student, index) => ({ ...student, rank: index + 1 }));
    }, [individualRows, mode, teamRows]);
    const podiumEntries = [2, 1, 3].map((rank) => rankedRows.find((entry) => entry.rank === rank));
    const remainingRows = rankedRows.filter((entry) => entry.rank > 3);

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
            ) : (
                <>
                    {rankedRows.length ? (
                        <>
                            <section className="podium-section" aria-label="Top 3 bảng xếp hạng">
                                <div className="podium-section__intro">
                                    <p>Top 3 xuất sắc</p>
                                    <h2>Vinh danh nhà vô địch</h2>
                                </div>
                                <div className="podium-grid">
                                    {podiumEntries.map((entry, index) => <PodiumCard key={entry?.rank || `empty-${index}`} entry={entry} mode={mode} />)}
                                </div>
                            </section>
                            <RankedList rows={remainingRows} mode={mode} />
                        </>
                    ) : (
                        <div className="leaderboard-empty">Chưa có đủ dữ liệu để hiển thị bảng xếp hạng.</div>
                    )}
                </>
            )}
        </main>
    );
}
