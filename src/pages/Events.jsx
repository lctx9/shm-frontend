import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import Toast from '../components/Toast';
import { demoEvent, getEventPhase } from '../utils/hackathon';

const PHASE_OPTIONS = [
    { key: 'upcoming', label: 'Upcoming', dot: 'bg-orange-500' },
    { key: 'registration', label: 'Open', dot: 'bg-emerald-500' },
    { key: 'running', label: 'Running', dot: 'bg-blue-500' },
    { key: 'ended', label: 'Ended', dot: 'bg-slate-400' },
];

function formatShortDate(value) {
    if (!value) return 'Chưa cập nhật';
    return new Date(value).toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
    });
}

function getDaysRemaining(event, phase) {
    const target = phase.key === 'registration' ? event.regEndDate : event.eventStartDate;
    if (!target) return null;
    const diff = new Date(target).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / 86400000));
}

function MarketplaceEventCard({ event, navigate, isFeatured }) {
    const phase = getEventPhase(event);
    const tracks = event.tracks || [];
    const detailUrl = `/events/${event.id}`;
    const daysLeft = getDaysRemaining(event, phase);

    // Left border color matching Devpost status
    let leftBorderColor = 'border-l-slate-300';
    if (phase.key === 'registration' || phase.key === 'running') {
        leftBorderColor = 'border-l-[#16b889]';
    } else if (phase.key === 'upcoming') {
        leftBorderColor = 'border-l-orange-500';
    }

    return (
        <article
            className={`flex flex-col sm:flex-row bg-white border border-slate-200 rounded-sm relative overflow-hidden hover:shadow-md transition-shadow cursor-pointer ${leftBorderColor} border-l-[4px] min-h-[160px]`}
            onClick={() => navigate(detailUrl)}
        >
            {/* Vertical Featured Ribbon */}
            {isFeatured && (
                <div className="bg-[#1e293b] text-white text-[8px] font-black tracking-[0.25em] uppercase flex items-center justify-center w-6 shrink-0 select-none border-r border-slate-200">
                    <span className="transform -rotate-90 whitespace-nowrap">FEATURED</span>
                </div>
            )}

            <div className="flex-1 flex flex-col sm:flex-row p-5 gap-5 items-start sm:items-center">
                {/* Visual Thumbnail */}
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded bg-slate-900 text-white font-black text-xl flex items-center justify-center shrink-0 uppercase tracking-tighter select-none border border-slate-800 shadow-inner">
                    <span className="text-center leading-none">
                        SEAL
                        <span className="block text-[9px] font-bold text-slate-400 mt-1">{event.season || 'HACK'}</span>
                    </span>
                </div>

                {/* Main Information */}
                <div className="flex-1 space-y-3.5 text-left">
                    <Link 
                        to={detailUrl} 
                        onClick={e => e.stopPropagation()} 
                        className="block text-slate-900 hover:text-[#007EFA] text-lg sm:text-xl font-bold tracking-tight transition-colors"
                    >
                        {event.name}
                    </Link>

                    <div className="flex flex-wrap items-center gap-2.5 text-xs">
                        {phase.key === 'registration' && daysLeft !== null ? (
                            <span className="bg-[#16b889] text-white font-extrabold px-2.5 py-1 rounded text-[10px] tracking-wide uppercase">
                                {daysLeft} days left
                            </span>
                        ) : phase.key === 'running' ? (
                            <span className="bg-blue-600 text-white font-extrabold px-2.5 py-1 rounded text-[10px] tracking-wide uppercase">
                                Active
                            </span>
                        ) : phase.key === 'upcoming' && daysLeft !== null ? (
                            <span className="bg-orange-500 text-white font-extrabold px-2.5 py-1 rounded text-[10px] tracking-wide uppercase">
                                Starts in {daysLeft}d
                            </span>
                        ) : (
                            <span className="bg-slate-400 text-white font-extrabold px-2.5 py-1 rounded text-[10px] tracking-wide uppercase">
                                Ended
                            </span>
                        )}

                        <span className="text-slate-500 font-medium flex items-center gap-1">
                            <span className="text-sm">🌐</span> Online
                        </span>
                    </div>

                    <div className="text-xs sm:text-sm text-slate-600 font-medium">
                        <strong className="text-slate-900 font-bold">{event.prizeAmount || '50.000.000đ'}</strong> in prizes
                        <span className="mx-2 text-slate-300">|</span>
                        <strong className="text-slate-900 font-bold">{(event.teamCount || 0) * 4}</strong> participants
                    </div>
                </div>

                {/* Metadata Sidebar (Right side of card) */}
                <div className="sm:border-l sm:border-slate-100 sm:pl-6 space-y-3 text-left w-full sm:w-auto sm:min-w-[200px]">
                    <div className="inline-flex items-center gap-1.5 border border-slate-200 rounded px-2.5 py-1 text-[10px] font-black uppercase text-slate-600 tracking-wider bg-slate-50">
                        🚩 SEAL
                    </div>

                    <div className="text-slate-500 text-xs flex items-center gap-1.5 font-medium">
                        <span>📅</span>
                        <span>{formatShortDate(event.eventStartDate)} – {formatShortDate(event.eventEndDate)}</span>
                    </div>

                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                        🛡️ Managed by SEAL
                    </div>

                    {tracks.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                            {tracks.slice(0, 3).map((track) => (
                                <span key={track.id || track.name} className="bg-[#ebf5ff] text-[#007EFA] text-[9px] font-bold px-2 py-0.5 rounded border border-blue-50/50">
                                    {track.name}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </article>
    );
}

export default function Events() {
    const navigate = useNavigate();
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
        <main className="w-full bg-[#f8fafc] text-slate-800 min-h-screen font-sans antialiased pb-20">
            {/* HERO BANNER: Deep Teal Slate */}
            <header className="bg-[#003e54] text-white py-16 sm:py-20 px-6 text-center select-none">
                <h1 className="text-2xl sm:text-3.5xl font-extrabold tracking-tight max-w-4xl mx-auto">
                    Join the world's best online and in-person hackathons
                </h1>
            </header>

            {/* SEARCH BAR SECTION */}
            <section className="max-w-[1240px] mx-auto px-6 -mt-7 relative z-10">
                <form className="bg-white shadow-lg rounded border border-slate-200 overflow-hidden flex items-center max-w-[840px] mx-auto" onSubmit={submitSearch}>
                    <div className="flex-1 flex items-center px-4 gap-2">
                        <span className="text-slate-400 text-lg">🔍</span>
                        <input 
                            value={searchInput} 
                            onChange={(event) => setSearchInput(event.target.value)} 
                            placeholder="Search by hackathon title or keyword" 
                            className="w-full py-4 text-slate-800 focus:outline-none text-sm font-sans placeholder-slate-400"
                        />
                    </div>
                    <button type="submit" className="bg-[#007EFA] hover:bg-[#006bd4] text-white px-8 py-4 font-bold text-sm tracking-wide transition-colors uppercase shrink-0">
                        Search
                    </button>
                </form>
            </section>

            {/* MAIN CONTENT LAYOUT */}
            <div className="max-w-[1240px] mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-10">
                
                {/* Left Side: Sidebar Filters (25% column ratio) */}
                <aside className="lg:col-span-3 space-y-8 bg-white border border-slate-200 p-6 rounded-sm h-fit" aria-label="Bộ lọc sự kiện">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                        <span className="text-xs font-black uppercase text-slate-400 tracking-wider">Filters</span>
                        <button 
                            type="button" 
                            className={`text-xs font-bold transition-colors ${activeFilterCount ? 'text-blue-600 hover:text-blue-800' : 'text-slate-300 cursor-not-allowed'}`} 
                            onClick={clearFilters} 
                            disabled={!activeFilterCount}
                        >
                            Clear filters ({activeFilterCount})
                        </button>
                    </div>

                    {/* Checkbox: Managed by Devpost */}
                    <div className="flex items-center justify-between text-xs py-2 border-b border-slate-50">
                        <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-600">
                            <input type="checkbox" className="rounded text-[#007EFA]" />
                            <span>Managed by SEAL</span>
                        </label>
                        <span className="text-slate-400 cursor-help" title="Các sự kiện được quản lý trực tiếp bởi SEAL">ⓘ</span>
                    </div>

                    {/* Filter Group: Location */}
                    <div className="space-y-3">
                        <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400">Location</h4>
                        <div className="space-y-2 text-xs font-semibold text-slate-600">
                            <label className="flex items-center gap-2.5 cursor-pointer">
                                <input type="checkbox" defaultChecked className="rounded text-[#007EFA]" />
                                <span>Online</span>
                            </label>
                            <label className="flex items-center gap-2.5 cursor-pointer">
                                <input type="checkbox" className="rounded text-[#007EFA]" />
                                <span>In-person</span>
                            </label>
                        </div>
                    </div>

                    {/* Filter Group: Status (Mapped to SEAL Event Phases) */}
                    <div className="space-y-3 pt-2">
                        <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400">Status</h4>
                        <div className="space-y-2.5 text-xs font-semibold text-slate-600">
                            {PHASE_OPTIONS.map((option) => (
                                <label key={option.key} className="flex items-center justify-between cursor-pointer group">
                                    <div className="flex items-center gap-2.5">
                                        <input 
                                            type="checkbox" 
                                            checked={phaseFilters.includes(option.key)} 
                                            onChange={() => toggleFilter(setPhaseFilters, option.key)} 
                                            className="rounded text-[#007EFA]" 
                                        />
                                        <span>{option.label}</span>
                                    </div>
                                    <span className={`w-2 h-2 rounded-full ${option.dot}`} />
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Filter Group: Length */}
                    <div className="space-y-3 pt-2">
                        <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400">Length</h4>
                        <div className="space-y-2 text-xs font-semibold text-slate-600">
                            <label className="flex items-center gap-2.5 cursor-pointer">
                                <input type="checkbox" className="rounded text-[#007EFA]" />
                                <span>1–6 days</span>
                            </label>
                            <label className="flex items-center gap-2.5 cursor-pointer">
                                <input type="checkbox" className="rounded text-[#007EFA]" />
                                <span>1–4 weeks</span>
                            </label>
                            <label className="flex items-center gap-2.5 cursor-pointer">
                                <input type="checkbox" className="rounded text-[#007EFA]" />
                                <span>1+ month</span>
                            </label>
                        </div>
                    </div>

                    {/* Filter Group: Seasons */}
                    <div className="space-y-3 pt-2">
                        <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400">Seasons</h4>
                        <div className="space-y-2 text-xs font-semibold text-slate-600">
                            {seasons.map((season) => (
                                <label key={season} className="flex items-center gap-2.5 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={seasonFilters.includes(season)} 
                                        onChange={() => toggleFilter(setSeasonFilters, season)} 
                                        className="rounded text-[#007EFA]" 
                                    />
                                    <span>{season}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Refresh Button */}
                    <div className="pt-2">
                        <button 
                            type="button" 
                            className="w-full py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 font-bold text-xs rounded transition-colors" 
                            onClick={fetchEvents}
                        >
                            Refresh Directory ↻
                        </button>
                    </div>
                </aside>

                {/* Right Side: Hackathon Directory List (75% column ratio) */}
                <section className="lg:col-span-9 space-y-6">
                    
                    {/* Results count & Toolbar Sort Links */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-3.5 text-sm gap-3">
                        <p className="text-slate-500 font-medium">
                            Showing <strong className="text-slate-800 font-extrabold">{filteredEvents.length}</strong> hackathons
                        </p>
                        
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <strong className="text-slate-400 text-xs font-black uppercase tracking-wider mr-2">Sort:</strong>
                            {[
                                ['relevant', 'Most relevant'],
                                ['deadline', 'Submission date'],
                                ['newest', 'Recently added'],
                                ['teams', 'Prize amount'],
                            ].map(([value, label]) => (
                                <button 
                                    type="button" 
                                    key={value} 
                                    className={`px-3 py-1 text-xs font-bold transition-all relative ${sortBy === value ? 'text-slate-900 border-b-2 border-[#007EFA]' : 'text-slate-400 hover:text-slate-600'}`} 
                                    onClick={() => setSortBy(value)}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Discord Banner Panel */}
                    <div className="bg-[#ebf5ff] border border-blue-100 rounded-sm p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <span className="text-slate-800 text-sm font-semibold tracking-tight text-center sm:text-left">
                            Ready to code, connect, and crush hackathons?
                        </span>
                        <a 
                            href="https://discord.gg" 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="inline-flex items-center gap-2 bg-[#007EFA] hover:bg-[#006bd4] text-white text-xs font-bold px-4 py-2.5 rounded-sm transition-colors uppercase tracking-wider shrink-0"
                        >
                            <span>Join our Discord community</span>
                        </a>
                    </div>

                    {/* Toast error notifications */}
                    <Toast error={error} onClose={() => setError('')} />

                    {/* Loading & Listing Cards */}
                    {loading ? (
                        <div className="text-center py-20 text-slate-400 font-medium font-sans">
                            Loading directory hackathons...
                        </div>
                    ) : filteredEvents.length ? (
                        <div className="flex flex-col gap-4">
                            {filteredEvents.map((event, idx) => (
                                <MarketplaceEventCard 
                                    event={event} 
                                    key={event.id} 
                                    navigate={navigate} 
                                    isFeatured={idx === 0 || idx === 1} // Mark first two cards as Featured for visual authenticity
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 text-slate-500 font-semibold bg-white border border-slate-200 rounded-sm">
                            No hackathons found matching your active filters.
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}
