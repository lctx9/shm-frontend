import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { formatDateTime, getEventPhase } from '../utils/hackathon';

export default function EventDetail() {
    const { eventId } = useParams();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                setLoading(true);
                const response = await axiosClient.get(`/events/${eventId}`);
                setEvent(response.result);
                setError('');
            } catch (err) {
                setError(err.message || 'Không thể tải chi tiết sự kiện.');
            } finally {
                setLoading(false);
            }
        };
        fetchEvent();
    }, [eventId]);

    if (loading) {
        return <main className="section-shell"><div className="rounded-lg border border-[#d7e6f8] bg-white p-8 text-center text-[#5c6d83]">Đang tải chi tiết sự kiện...</div></main>;
    }

    if (error || !event) {
        return <main className="section-shell"><div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error || 'Không tìm thấy sự kiện.'}</div></main>;
    }

    const phase = getEventPhase(event);

    return (
        <main className="section-shell">
            <div className="event-detail-breadcrumb"><Link to="/events">Sự kiện</Link><span>/</span><strong>{event.name}</strong></div>
            <section className={`event-detail-hero event-detail-hero--${phase.key}`}>
                <div className="event-detail-hero__content">
                    <span className="badge-status-pill">{phase.label}</span>
                    <p>{event.season} {event.year}</p>
                    <h1>{event.name}</h1>
                    <span className="event-detail-hero__copy">Theo dõi lịch trình, hạng mục thi và toàn bộ thông tin quan trọng của sự kiện tại một nơi.</span>
                </div>
                <div className="event-detail-timeline">
                    <div><p className="font-bold text-[#0b1f3f]">Mở đăng ký</p><p>{formatDateTime(event.regStartDate)}</p></div>
                    <div><p className="font-bold text-[#0b1f3f]">Đóng đăng ký</p><p>{formatDateTime(event.regEndDate)}</p></div>
                    <div><p className="font-bold text-[#0b1f3f]">Bắt đầu</p><p>{formatDateTime(event.eventStartDate)}</p></div>
                    <div><p className="font-bold text-[#0b1f3f]">Kết thúc</p><p>{formatDateTime(event.eventEndDate)}</p></div>
                </div>
                <div className="event-detail-actions">
                    {phase.key === 'registration' ? (
                        <Link to={`/my-team?eventId=${event.id}`} className="btn-action-main">Đăng ký đội thi</Link>
                    ) : phase.key === 'ended' ? (
                        <Link to={`/events/${event.id}/results`} className="btn-action-main">Xem kết quả sự kiện</Link>
                    ) : null}
                    <Link to="/events" className="btn-secondary">Tất cả sự kiện</Link>
                </div>
            </section>

            <div className="event-detail-content">
                <section className="event-detail-panel">
                    <div className="event-detail-panel__heading"><span>01</span><div><p>Competition tracks</p><h2>Hạng mục thi</h2></div></div>
                    <div className="mt-5 space-y-3">
                        {(event.tracks || []).map((track) => (
                            <div key={track.id} className="rounded-lg border border-[#d7e6f8] bg-[#f8fbff] p-4">
                                <p className="font-black text-[#0b1f3f]">{track.name}</p>
                                <p className="mt-1 text-sm text-[#5c6d83]">{track.description || 'Chưa có mô tả.'}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="event-detail-panel">
                    <div className="event-detail-panel__heading"><span>02</span><div><p>Rounds & deadlines</p><h2>Đề thi và deadline</h2></div></div>
                    <div className="mt-5 space-y-3">
                        {(event.matrices || []).map((matrix) => (
                            <div key={matrix.id} className="rounded-lg border border-[#d7e6f8] bg-[#f8fbff] p-4">
                                <p className="font-black text-[#0b1f3f]">{matrix.roundName} - {matrix.trackName}</p>
                                <p className="mt-1 text-sm text-[#5c6d83]">Deadline nộp bài: {formatDateTime(matrix.submissionDeadline)}</p>
                                {matrix.guidelineUrl && <a href={matrix.guidelineUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex text-sm font-black text-[#0f63c9]">Tải đề thi / quy chế</a>}
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </main>
    );
}
