import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import Toast from '../components/Toast';
import { demoEvent, getEventPhase } from '../utils/hackathon';

const PHASE_OPTIONS = [
    { key: 'upcoming', label: 'Sắp mở đăng ký', dot: 'orange' },
    { key: 'registration', label: 'Đang mở đăng ký', dot: 'green' },
    { key: 'running', label: 'Đang diễn ra', dot: 'blue' },
    { key: 'ended', label: 'Đã kết thúc', dot: 'gray' },
];

function formatShortDate(value) {
    if (!value) return 'Chưa cập nhật';
    return new Date(value).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
}

function getTimeLabel(event, phase) {
    const target = phase.key === 'registration' ? event.regEndDate : event.eventStartDate;
    if (!target || phase.key === 'ended') return phase.label;

    const days = Math.ceil((new Date(target).getTime() - Date.now()) / 86400000);
    if (days <= 0) return phase.label;
    if (phase.key === 'registration') return `Còn ${days} ngày đăng ký`;
    return `Bắt đầu sau ${days} ngày`;
}

function MarketplaceEventCard({ event }) {
    const phase = getEventPhase(event);
    const tracks = event.tracks || [];

    return (
        <article className={`market-event-card market-event-card--${phase.key}`}>
            <Link to={`/events/${event.id}`} className="market-event-card__visual" aria-label={`Xem ${event.name}`}>
                <span>SEAL</span>
                <strong>{event.season || 'HACKATHON'}</strong>
                <small>{event.year}</small>
            </Link>

            <div className="market-event-card__main">
                <Link to={`/events/${event.id}`}><h2>{event.name}</h2></Link>
                <div className="market-event-card__quick-info">
                    <span className={`market-phase market-phase--${phase.key}`}>{getTimeLabel(event, phase)}</span>
                    <span className="market-location"><span aria-hidden="true">⌖</span> Sự kiện SEAL</span>
                </div>
                <div className="market-event-card__numbers">
                    <span><strong>{event.teamCount || 0}</strong> đội tham gia</span>
                    <span><strong>{tracks.length}</strong> hạng mục thi</span>
                </div>
                <div className="market-event-card__actions">
                    <Link to={`/events/${event.id}`} className="btn-primary">Xem chi tiết</Link>
                    {phase.key === 'ended'
                        ? <Link to={`/events/${event.id}/results`} className="btn-secondary">Xem kết quả</Link>
                        : phase.key === 'registration' && <Link to={`/my-team?eventId=${event.id}`} className="btn-secondary">Đăng ký đội</Link>}
                </div>
            </div>

            <aside className="market-event-card__meta">
                <p className="market-season"><span aria-hidden="true">⚑</span><span>{event.season} {event.year}</span></p>
                <p><span aria-hidden="true">▣</span><span>{formatShortDate(event.eventStartDate)} – {formatShortDate(event.eventEndDate)}</span></p>
                <p><span className="market-seal-mark">S</span><span>Được tổ chức bởi SEAL</span></p>
                {tracks.length > 0 && (
                    <div className="market-tags">
                        {tracks.slice(0, 3).map((track) => <span key={track.id || track.name}>{track.name}</span>)}
                    </div>
                )}
            </aside>
        </article>
    );
}

export default function Events() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [query, setQuery] = useState('');
    const [phaseFilters, setPhaseFilters] = useState([]);
    const [seasonFilters, setSeasonFilters] = useState([]);
    const [sortBy, setSortBy] = useState('relevant');

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
    const seasons = useMemo(() => [...new Set(displayEvents.map((event) => event.season).filter(Boolean))].sort(), [displayEvents]);
    const activeFilterCount = phaseFilters.length + seasonFilters.length;

    const filteredEvents = useMemo(() => {
        const keyword = query.trim().toLowerCase();
        const result = displayEvents.filter((event) => {
            const matchesSearch = !keyword || `${event.name} ${event.season} ${event.year} ${(event.tracks || []).map((track) => track.name).join(' ')}`.toLowerCase().includes(keyword);
            const matchesPhase = !phaseFilters.length || phaseFilters.includes(getEventPhase(event).key);
            const matchesSeason = !seasonFilters.length || seasonFilters.includes(event.season);
            return matchesSearch && matchesPhase && matchesSeason;
        });

        return [...result].sort((a, b) => {
            if (sortBy === 'deadline') return new Date(a.regEndDate || 0) - new Date(b.regEndDate || 0);
            if (sortBy === 'newest') return Number(b.year || 0) - Number(a.year || 0) || Number(b.id || 0) - Number(a.id || 0);
            if (sortBy === 'teams') return Number(b.teamCount || 0) - Number(a.teamCount || 0);
            const phaseOrder = { registration: 0, running: 1, upcoming: 2, ended: 3 };
            return phaseOrder[getEventPhase(a).key] - phaseOrder[getEventPhase(b).key];
        });
    }, [displayEvents, phaseFilters, query, seasonFilters, sortBy]);

    const toggleFilter = (setter, value) => {
        setter((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
    };

    const clearFilters = () => {
        setPhaseFilters([]);
        setSeasonFilters([]);
    };

    const submitSearch = (event) => {
        event.preventDefault();
        setQuery(searchInput);
    };

    return (
        <main className="events-marketplace">
            <header className="events-marketplace__hero">
                <h1>Tham gia những hackathon nổi bật của SEAL</h1>
                <p>Khám phá cuộc thi phù hợp, lập đội và biến ý tưởng thành sản phẩm thực tế.</p>
            </header>

            <section className="events-marketplace__search-wrap">
                <form className="events-marketplace__search" onSubmit={submitSearch}>
                    <label>
                        <span aria-hidden="true">⌕</span>
                        <input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Tìm theo tên hackathon, mùa giải hoặc hạng mục" />
                    </label>
                    <button type="submit">Tìm kiếm</button>
                </form>
            </section>

            <div className="events-marketplace__body">
                <aside className="market-filters" aria-label="Bộ lọc sự kiện">
                    <button type="button" className="market-filters__clear" onClick={clearFilters} disabled={!activeFilterCount}>
                        Xóa bộ lọc <span>{activeFilterCount}</span>
                    </button>

                    <fieldset>
                        <legend>Trạng thái</legend>
                        {PHASE_OPTIONS.map((option) => (
                            <label key={option.key}>
                                <input type="checkbox" checked={phaseFilters.includes(option.key)} onChange={() => toggleFilter(setPhaseFilters, option.key)} />
                                <span>{option.label}</span><i className={`filter-dot filter-dot--${option.dot}`} />
                            </label>
                        ))}
                    </fieldset>

                    <fieldset>
                        <legend>Mùa giải</legend>
                        {seasons.map((season) => (
                            <label key={season}>
                                <input type="checkbox" checked={seasonFilters.includes(season)} onChange={() => toggleFilter(setSeasonFilters, season)} />
                                <span>{season}</span>
                            </label>
                        ))}
                    </fieldset>

                    <button type="button" className="market-filters__refresh h-8 w-8 inline-flex items-center justify-center rounded border border-[#afc0c6] bg-white text-[#1474cb] hover:bg-[#e8f4ff] font-bold text-sm transition-all" onClick={fetchEvents} title="Làm mới dữ liệu">↻</button>
                </aside>

                <section className="market-results">
                    <div className="market-results__toolbar">
                        <p>Hiển thị <strong>{filteredEvents.length}</strong> hackathon</p>
                        <div className="market-sort" aria-label="Sắp xếp sự kiện">
                            <strong>Sắp xếp:</strong>
                            {[
                                ['relevant', 'Phù hợp nhất'],
                                ['deadline', 'Hạn đăng ký'],
                                ['newest', 'Mới thêm'],
                                ['teams', 'Đội tham gia'],
                            ].map(([value, label]) => <button type="button" key={value} className={sortBy === value ? 'is-active' : ''} onClick={() => setSortBy(value)}>{label}</button>)}
                        </div>
                    </div>

                    <Toast error={error} onClose={() => setError('')} />
                    {loading ? (
                        <div className="market-results__message">Đang tải danh sách sự kiện...</div>
                    ) : filteredEvents.length ? (
                        <div className="market-event-list">{filteredEvents.map((event) => <MarketplaceEventCard event={event} key={event.id} />)}</div>
                    ) : (
                        <div className="market-results__message">Không tìm thấy hackathon phù hợp với bộ lọc hiện tại.</div>
                    )}
                </section>
            </div>
        </main>
    );
}
