import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { classifyEvents, demoEvent, formatDateTime, getCountdownParts, getEventPhase, pickFeaturedEvent } from '../utils/hackathon';

function EventCard({ event }) {
    const phase = getEventPhase(event);

    return (
        <article className={`event-card event-card--${phase.key}`}>
            <div className="event-card__header">
                <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0f63c9]">{event.season} {event.year}</p>
                    <h3 className="mt-2 text-xl font-black uppercase tracking-[0.06em] text-[#071936]">{event.name}</h3>
                </div>
                <span className="event-card__status">
                    {phase.label}
                </span>
            </div>
            <dl className="event-card__facts">
                <div>
                    <dt className="font-bold text-[#0b1f3f]">Đăng ký</dt>
                    <dd>{formatDateTime(event.regStartDate)} - {formatDateTime(event.regEndDate)}</dd>
                </div>
                <div>
                    <dt className="font-bold text-[#0b1f3f]">Thi đấu</dt>
                    <dd>{formatDateTime(event.eventStartDate)} - {formatDateTime(event.eventEndDate)}</dd>
                </div>
                <div>
                    <dt className="font-bold text-[#0b1f3f]">Hạng mục</dt>
                    <dd>{event.tracks?.length || 0}</dd>
                </div>
                <div>
                    <dt className="font-bold text-[#0b1f3f]">Đội đăng ký</dt>
                    <dd>{event.teamCount || 0}</dd>
                </div>
            </dl>
            <div className="event-card__actions">
                <Link to={`/events/${event.id}`} className="btn-primary">Xem chi tiết</Link>
                {phase.key === 'ended'
                    ? <Link to={`/events/${event.id}/results`} className="btn-secondary">Xem kết quả</Link>
                    : phase.key === 'registration' && <Link to={`/my-team?eventId=${event.id}`} className="btn-secondary">Đăng ký đội</Link>}
            </div>
        </article>
    );
}

export default function Events() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchEvents = async () => {
        try {
            setLoading(true);
            const response = await axiosClient.get('/events');
            setEvents(response.result || []);
            setError('');
        } catch (err) {
            setError(err.message || 'Không thể tải danh sách sự kiện.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    const displayEvents = useMemo(() => (events.length ? events : [demoEvent]), [events]);
    const featured = useMemo(() => pickFeaturedEvent(displayEvents), [displayEvents]);
    const phase = getEventPhase(featured);
    const countdown = getCountdownParts(phase.key === 'registration' ? featured.regEndDate : featured.eventStartDate);
    const { upcoming, past } = classifyEvents(displayEvents.filter((event) => String(event.id) !== String(featured.id)));

    return (
        <main className="section-shell">
            <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-[#0f63c9]">Sự kiện</p>
                    <h1 className="section-title">Mùa giải SEAL</h1>
                    <p className="section-copy">Theo dõi giải gần nhất, các sự kiện sắp tới và những mùa đã khép lại.</p>
                </div>
                <button type="button" onClick={fetchEvents} className="btn-secondary">Làm mới</button>
            </div>

            {error && <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}

            <section className="event-featured">
                <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
                    <div>
                        <span className="badge-status-pill">{phase.label}</span>
                        <h2 className="mt-5 text-3xl font-black uppercase tracking-[0.06em] text-[#071936]">{featured.name}</h2>
                        <p className="mt-3 text-sm leading-7 text-[#5c6d83]">
                            Đăng ký: {formatDateTime(featured.regStartDate)} - {formatDateTime(featured.regEndDate)}
                        </p>
                    </div>
                    {countdown && (
                        <div className="grid grid-cols-3 gap-3">
                            {countdown.map((item) => (
                                <div key={item.label} className="rounded-lg border border-[#d7e6f8] bg-[#f8fbff] px-4 py-3 text-center">
                                    <p className="text-2xl font-black text-[#071936]">{item.value}</p>
                                    <p className="text-xs font-black uppercase text-[#5c6d83]">{item.label}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                    <Link to={`/events/${featured.id}`} className="btn-primary">Xem chi tiết</Link>
                    {phase.key === 'ended'
                        ? <Link to={`/events/${featured.id}/results`} className="btn-secondary">Xem kết quả</Link>
                        : phase.key === 'registration' && <Link to={`/my-team?eventId=${featured.id}`} className="btn-secondary">Đăng ký</Link>}
                </div>
            </section>

            {loading ? (
                <div className="rounded-lg border border-[#d7e6f8] bg-white p-8 text-center text-[#5c6d83]">Đang tải sự kiện...</div>
            ) : (
                <div className="grid gap-8 lg:grid-cols-2">
                    <section>
                        <h2 className="mb-4 text-lg font-black uppercase tracking-[0.08em] text-[#071936]">Sắp tới / đang diễn ra</h2>
                        <div className="space-y-5">
                            {(upcoming.length ? upcoming : [featured]).map((event) => <EventCard event={event} key={event.id} />)}
                        </div>
                    </section>
                    <section>
                        <h2 className="mb-4 text-lg font-black uppercase tracking-[0.08em] text-[#071936]">Đã qua</h2>
                        <div className="space-y-5">
                            {past.length ? past.map((event) => <EventCard event={event} key={event.id} />) : (
                                <div className="rounded-lg border border-[#d7e6f8] bg-white p-8 text-center text-[#5c6d83]">
                                    Chưa có sự kiện đã kết thúc.
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            )}
        </main>
    );
}
