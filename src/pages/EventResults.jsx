import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import axiosClient from '../api/axiosClient';

const podiumOrder = [2, 1, 3];
const medals = { 1: '🥇', 2: '🥈', 3: '🥉' };

export default function EventResults() {
    const { eventId } = useParams();
    const [event, setEvent] = useState(null);
    const [rankings, setRankings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        Promise.all([axiosClient.get(`/events/${eventId}`), axiosClient.get('/leaderboard')])
            .then(([eventResponse, rankingResponse]) => {
                setEvent(eventResponse.result);
                setRankings(rankingResponse.result || []);
                setError('');
            })
            .catch((err) => setError(err.message || 'Không thể tải kết quả sự kiện.'))
            .finally(() => setLoading(false));
    }, [eventId]);

    const eventRows = useMemo(() => {
        const bestResultByTeam = new Map();
        rankings
            .filter((row) => String(row.eventId) === String(eventId))
            .forEach((row) => {
                const key = `${row.teamName || 'unknown'}::${row.track || 'general'}`;
                const current = bestResultByTeam.get(key);
                if (!current || (row.score || 0) > (current.score || 0)) bestResultByTeam.set(key, row);
            });

        return [...bestResultByTeam.values()]
            .sort((a, b) => (b.score || 0) - (a.score || 0))
            .map((row, index) => ({ ...row, eventRank: index + 1 }));
    }, [eventId, rankings]);

    if (loading) return <main className="section-shell"><div className="leaderboard-empty">Đang tải kết quả sự kiện...</div></main>;
    if (error || !event) return <main className="section-shell"><div className="form-alert">{error || 'Không tìm thấy sự kiện.'}</div></main>;

    const podium = podiumOrder.map((rank) => eventRows.find((row) => row.eventRank === rank));
    const remaining = eventRows.filter((row) => row.eventRank > 3);

    return (
        <main className="section-shell event-results-page">
            <div className="event-results-breadcrumb"><Link to="/events">Sự kiện</Link><span>/</span><Link to={`/events/${event.id}`}>{event.name}</Link><span>/</span><strong>Kết quả</strong></div>

            <header className="event-results-hero">
                <div>
                    <p>Kết quả chính thức · {event.season} {event.year}</p>
                    <h1>{event.name}</h1>
                    <span>Kết quả chỉ bao gồm các đội và bài thi thuộc sự kiện này.</span>
                </div>
                <div className="event-results-summary"><strong>{eventRows.length}</strong><span>đội được xếp hạng</span></div>
            </header>

            {eventRows.length ? (
                <>
                    <section className="podium-section event-podium" aria-label="Top 3 của sự kiện">
                        <div className="podium-section__intro"><p>Top 3 sự kiện</p><h2>Những đội thi xuất sắc nhất</h2></div>
                        <div className="podium-grid">
                            {podium.map((team, index) => team ? (
                                <article key={team.id || team.teamName} className={`podium-card podium-card--${team.eventRank === 1 ? 'first' : team.eventRank === 2 ? 'second' : 'third'}`}>
                                    <div className="podium-card__medal">{medals[team.eventRank]}</div>
                                    <p className="podium-card__rank">Hạng {team.eventRank}</p>
                                    <h2 className="podium-card__name">{team.teamName}</h2>
                                    <p className="podium-card__track">{team.track || 'Bảng chung'}</p>
                                    <div className="podium-card__score"><strong>{team.score || 0}</strong><span>điểm</span></div>
                                    <div className="podium-card__members">{(team.members || []).map((member) => <Link key={member.id || member.email} to={member.userId ? `/profile?userId=${member.userId}` : '/profile'}>{member.fullName || member.email}</Link>)}</div>
                                    <div className="podium-card__base"><span>{team.eventRank}</span></div>
                                </article>
                            ) : <div key={`empty-${index}`} className="podium-card podium-card--empty" />)}
                        </div>
                    </section>

                    {remaining.length > 0 && (
                        <section className="leaderboard-list">
                            <div className="leaderboard-list__heading"><div><p>Kết quả đầy đủ</p><h2>Các đội xếp hạng tiếp theo</h2></div><span>{remaining.length} đội</span></div>
                            {remaining.map((team) => (
                                <div key={team.id || team.teamName} className="leaderboard-row">
                                    <div className="leaderboard-row__rank">#{team.eventRank}</div>
                                    <div className="leaderboard-row__main"><h3>{team.teamName}</h3><p>{team.track || 'Bảng chung'} · {(team.members || []).map((member) => member.fullName || member.email).join(', ')}</p></div>
                                    <div className="leaderboard-row__score"><strong>{team.score || 0}</strong><span>điểm</span></div>
                                </div>
                            ))}
                        </section>
                    )}
                </>
            ) : (
                <div className="event-results-empty"><span>⌛</span><h2>Kết quả chưa được công bố</h2><p>Sự kiện chưa có bài thi đã chấm hoặc ban tổ chức chưa công bố bảng điểm.</p><Link to={`/events/${event.id}`} className="btn-secondary">Quay lại chi tiết sự kiện</Link></div>
            )}
        </main>
    );
}