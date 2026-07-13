import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { formatDateTime, getEventPhase } from '../utils/hackathon';

function parseCriteria(value) {
    if (!value) return [];
    try {
        const parsed = typeof value === 'string' ? JSON.parse(value) : value;
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function getDeadlineStatus(value) {
    if (!value) return 'Chưa cập nhật deadline';
    const days = Math.ceil((new Date(value).getTime() - Date.now()) / 86400000);
    if (days < 0) return 'Deadline đã kết thúc';
    if (days === 0) return 'Deadline trong hôm nay';
    return `Còn ${days} ngày đến deadline`;
}

function SectionTitle({ children }) {
    return <div className="devpost-detail-section-title"><h2>{children}</h2><span /></div>;
}

export default function EventDetail() {
    const { eventId } = useParams();
    const [event, setEvent] = useState(null);
    const [prizes, setPrizes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                setLoading(true);
                const [eventResponse, prizeResponse] = await Promise.all([
                    axiosClient.get(`/events/${eventId}`),
                    axiosClient.get(`/events/${eventId}/prizes`).catch(() => ({ result: [] })),
                ]);
                setEvent(eventResponse.result);
                setPrizes(prizeResponse.result || []);
                setError('');
            } catch (err) {
                setError(err.message || 'Không thể tải chi tiết sự kiện.');
            } finally {
                setLoading(false);
            }
        };
        fetchEvent();
    }, [eventId]);

    const criteria = useMemo(() => {
        const matrices = event?.matrices || [];
        const publishedMatrix = matrices.find((matrix) => matrix.finalRound && matrix.scoringCriteriaJson)
            || matrices.find((matrix) => matrix.scoringCriteriaJson);
        return parseCriteria(publishedMatrix?.scoringCriteriaJson);
    }, [event]);

    const deadline = useMemo(() => {
        if (!event) return null;
        const matrixDeadlines = (event.matrices || []).map((matrix) => matrix.submissionDeadline).filter(Boolean);
        return event.defaultSubmissionDeadline || matrixDeadlines[0] || event.regEndDate;
    }, [event]);

    if (loading) {
        return <main className="devpost-detail-state">Đang tải chi tiết sự kiện...</main>;
    }

    if (error || !event) {
        return <main className="devpost-detail-state devpost-detail-state--error">{error || 'Không tìm thấy sự kiện.'}</main>;
    }

    const phase = getEventPhase(event);
    const canJoin = phase.key === 'registration';
    const ended = phase.key === 'ended';
    const rules = event.competitionRules?.trim();
    const tracks = event.tracks || [];
    const schedule = [
        ['01', 'Mở đăng ký', event.regStartDate],
        ['02', 'Đóng đăng ký', event.regEndDate],
        ['03', 'Bắt đầu thi', event.eventStartDate],
        ['04', 'Kết thúc', event.eventEndDate],
    ];

    return (
        <main className="devpost-event-detail">
            <section className="devpost-detail-hero">
                <div className="devpost-detail-hero__inner">
                    <div className="devpost-detail-brand">
                        <div className="devpost-detail-logo"><span>SEAL</span><strong>{event.season}</strong><small>{event.year}</small></div>
                        <p>{event.season} {event.year}</p>
                        <h1>{event.name}</h1>
                        <p className="devpost-detail-summary">{event.description || 'Thông tin giới thiệu chi tiết của sự kiện đang được ban tổ chức cập nhật.'}</p>
                        <div className="devpost-detail-participate">
                            {canJoin && <Link to={`/my-team?eventId=${event.id}`} className="btn-primary">Tham gia hackathon</Link>}
                            {ended && <Link to={`/events/${event.id}/results`} className="btn-primary">Xem kết quả</Link>}
                            <div><strong>Ai có thể tham gia?</strong><span>Sinh viên đăng ký theo đội và lựa chọn một hạng mục thi phù hợp.</span></div>
                        </div>
                    </div>

                    <aside className="devpost-detail-facts">
                        <div className={`devpost-detail-deadline devpost-detail-deadline--${phase.key}`}>
                            <span>{getDeadlineStatus(deadline)}</span>
                            <a href="#schedule">Xem lịch trình</a>
                        </div>
                        <strong>Deadline</strong>
                        <p className="devpost-detail-deadline-value">{formatDateTime(deadline)}</p>
                        <div className="devpost-detail-fact-grid">
                            <p><span>◉</span><span>Sự kiện SEAL</span></p>
                            <p><span>♟</span><span>{event.teamCount || 0} đội tham gia</span></p>
                        </div>
                        <div className="devpost-detail-organizer"><span className="market-seal-mark">S</span> Được tổ chức bởi SEAL</div>
                        <div className="market-tags">{tracks.map((track) => <span key={track.id}>{track.name}</span>)}</div>
                        {event.ruleDocumentUrl && <a className="devpost-detail-rule-link" href={event.ruleDocumentUrl} target="_blank" rel="noreferrer">Xem tài liệu thể lệ ↗</a>}
                    </aside>
                </div>
            </section>

            <nav className="devpost-detail-sticky" aria-label="Điều hướng chi tiết sự kiện">
                <div>
                    <strong>{event.name}</strong>
                    <span>Deadline: {formatDateTime(deadline)}</span>
                    {canJoin && <Link to={`/my-team?eventId=${event.id}`}>Tham gia hackathon</Link>}
                    {ended && <Link to={`/events/${event.id}/results`}>Xem kết quả</Link>}
                </div>
            </nav>

            <div className="devpost-detail-body">
                <div className="devpost-detail-main">
                    <section id="schedule" className="devpost-detail-section">
                        <p className="devpost-detail-kicker">Ý tưởng. Xây dựng. Hoàn thiện. Bứt phá.</p>
                        <p className="devpost-detail-lead">Theo dõi bốn cột mốc quan trọng của {event.name} và chuẩn bị cùng đội của bạn.</p>
                        <div className="devpost-detail-schedule">
                            {schedule.map(([number, label, value]) => <div key={label}><span>{number}</span><strong>{label}</strong><p>{formatDateTime(value)}</p></div>)}
                        </div>
                        <p className="devpost-detail-description">{event.description || 'Ban tổ chức sẽ cập nhật nội dung, mục tiêu và thông tin chi tiết của giải đấu tại đây.'}</p>
                    </section>

                    <section className="devpost-detail-section">
                        <SectionTitle>Yêu cầu &amp; thể lệ</SectionTitle>
                        {rules ? <div className="devpost-detail-rules">{rules}</div> : <p className="devpost-detail-empty">Ban tổ chức chưa cập nhật thể lệ chi tiết.</p>}
                        {event.ruleDocumentUrl && <a className="devpost-detail-inline-link" href={event.ruleDocumentUrl} target="_blank" rel="noreferrer">Tải tài liệu quy chế đầy đủ ↗</a>}
                    </section>

                    <section className="devpost-detail-section">
                        <SectionTitle>Hạng mục thi</SectionTitle>
                        {tracks.length ? <div className="devpost-detail-tracks">{tracks.map((track) => <article key={track.id}><strong>{track.name}</strong><p>{track.description || 'Mô tả hạng mục đang được cập nhật.'}</p></article>)}</div> : <p className="devpost-detail-empty">Chưa có hạng mục thi.</p>}
                    </section>

                    <section className="devpost-detail-section">
                        <SectionTitle>Giải thưởng</SectionTitle>
                        <div className="devpost-detail-prize-summary"><strong>{prizes.length}</strong> hạng mục giải thưởng</div>
                        {prizes.length ? <div className="devpost-detail-prizes">{prizes.map((prize) => <article key={prize.id}><span>★</span><div><strong>{prize.name}</strong><p>{prize.description || 'Thông tin phần thưởng đang được cập nhật.'}</p>{prize.teamName && <small>Đội đạt giải: {prize.teamName}</small>}</div></article>)}</div> : <p className="devpost-detail-empty">Cơ cấu giải thưởng đang được ban tổ chức cập nhật.</p>}
                    </section>

                    <section className="devpost-detail-section">
                        <SectionTitle>Tiêu chí chấm điểm</SectionTitle>
                        {criteria.length ? <div className="devpost-detail-criteria">{criteria.map((criterion) => <article key={criterion.id || criterion.label}><div><strong>{criterion.label}</strong><span>{criterion.weight ? `${criterion.weight}%` : `${criterion.maxScore || 100} điểm`}</span></div><p>{criterion.description || 'Đánh giá theo hướng dẫn của ban giám khảo.'}</p></article>)}</div> : <p className="devpost-detail-empty">Rubric chấm điểm chưa được công bố.</p>}
                    </section>
                </div>

                <aside className="devpost-detail-contact">
                    <strong>Cần hỗ trợ?</strong>
                    <p>Theo dõi mục thông báo để nhận cập nhật mới nhất từ ban tổ chức và coordinator.</p>
                    <Link to="/events">Quay lại danh sách sự kiện</Link>
                </aside>
            </div>
        </main>
    );
}
