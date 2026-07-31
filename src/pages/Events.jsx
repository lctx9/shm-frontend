import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import Toast from '../components/Toast';
import { demoEvent, getEventPhase } from '../utils/hackathon';

const PHASE_OPTIONS = [
    { key: 'all', label: 'All' },
    { key: 'running', label: 'Ongoing', dot: 'sky' },
    { key: 'upcoming', label: 'Upcoming', dot: 'orange' },
    { key: 'ended', label: 'Finished', dot: 'gray' },
];

function formatShortDate(value) {
    if (!value) return 'TBD';
    return new Date(value).toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
    });
}

// English time labels
function getTimeLabel(event, phase) {
    const target = phase.key === 'registration' ? event.regEndDate : event.eventStartDate;
    if (!target || phase.key === 'ended') return 'Finished';

    const days = Math.ceil((new Date(target).getTime() - Date.now()) / 86400000);
    if (days <= 0) return 'Ongoing';
    if (phase.key === 'registration') return `${days} days left to register`;
    return `Starts in ${days} days`;
}

// Function to map event season/metadata to a beautiful Unsplash cover image
function getEventCoverImage(event) {
    const season = (event.season || '').toUpperCase();
    if (season === 'SUMMER') {
        return 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=600&auto=format&fit=crop&q=60';
    } else if (season === 'SPRING') {
        return 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600&auto=format&fit=crop&q=60';
    } else if (season === 'FALL') {
        return 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=600&auto=format&fit=crop&q=60';
    } else {
        return 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&auto=format&fit=crop&q=60';
    }
}

function MarketplaceEventCard({ event, navigate, myTeam }) {
    const phase = getEventPhase(event);
    const tracks = event.tracks || [];
    const detailUrl = `/events/${event.id}`;
    const coverImage = getEventCoverImage(event);

    const phaseStyles = {
        registration: 'bg-[#e6f0fa] text-[#1c4d7e] border-[#cce0f5]',
        running: 'bg-[#eef6fc] text-[#225c87] border-[#d8ebf8]',
        upcoming: 'bg-[#fef4eb] text-[#b45309] border-[#fde3cf]',
        ended: 'bg-slate-50 text-slate-500 border-slate-200',
    };

    const phaseLabels = {
        registration: 'Registration Open',
        running: 'Ongoing',
        upcoming: 'Upcoming',
        ended: 'Ended',
    };

    return (
        <article
            className="flex flex-col bg-white border border-slate-200 rounded-none overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] transition-all duration-300 hover:-translate-y-1 cursor-pointer group"
            onClick={() => navigate(detailUrl)}
        >
            {/* Card Cover Image */}
            <div className="relative aspect-[16/10] overflow-hidden bg-slate-100 border-b border-slate-100 animate-none">
                <img 
                    src={coverImage} 
                    alt={event.name} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm border border-slate-200 text-[10px] font-black tracking-wider text-slate-700 uppercase px-2 py-0.5 rounded shadow-sm">
                    {event.season} {event.year}
                </span>
                {myTeam && (
                    <span className="absolute top-3 right-3 bg-emerald-500 text-white text-[10px] font-black tracking-wider uppercase px-2.5 py-1 rounded shadow-md flex items-center gap-1.5 z-10">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        Joined: {myTeam.name}
                    </span>
                )}
            </div>

            {/* Card Content Body */}
            <div className="flex-1 p-5 flex flex-col justify-between">
                <div>
                    {/* Status & Online Tag */}
                    <div className="flex items-center justify-between gap-2">
                        <span className={`px-2.5 py-0.5 border text-[10px] font-extrabold uppercase tracking-wider rounded ${phaseStyles[phase.key] || 'bg-slate-50 text-slate-600'}`}>
                            {phaseLabels[phase.key] || 'Active'}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            {getTimeLabel(event, phase)}
                        </span>
                    </div>

                    {/* Organizer & Title */}
                    <p className="text-[10px] font-black text-slate-400 tracking-wider uppercase mt-4">
                        SEAL Hackathon Series
                    </p>
                    <h2 className="text-lg font-black text-slate-900 mt-1 leading-snug group-hover:text-[#2c4e66] transition-colors line-clamp-2">
                        {event.name}
                    </h2>

                    {/* Description */}
                    <p className="text-xs text-slate-500 mt-2 line-clamp-3 leading-relaxed">
                        {event.description || 'Join this exciting hackathon challenge and turn your innovative concepts into functional software prototypes.'}
                    </p>
                </div>

                {/* Card footer details */}
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex gap-4 text-xs font-bold text-slate-400">
                        <span><strong>{event.teamCount || 0}</strong> Teams</span>
                        <span><strong>{tracks.length}</strong> Tracks</span>
                    </div>
                    <span className="text-xs font-bold text-[#2c4e66] group-hover:translate-x-1 transition-transform duration-200 flex items-center gap-1">
                        Learn More <span className="text-sm font-semibold">→</span>
                    </span>
                </div>
            </div>
        </article>
    );
}

export default function Events() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    
    // Read search parameters for phase tab
    const defaultPhase = searchParams.get('filter') === 'participating' ? 'participating' : 'all';
    
    const [events, setEvents] = useState([]);
    const [myTeams, setMyTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [query, setQuery] = useState('');
    const [selectedPhase, setSelectedPhase] = useState(defaultPhase);
    const [sortBy, setSortBy] = useState('relevant');

    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const isManager = ['ADMIN', 'COORDINATOR', 'STAFF', 'JUDGE', 'MENTOR'].includes(role);

    const fetchEvents = async () => {
        try {
            setLoading(true);
            const response = await axiosClient.get('/events');
            setEvents(response.result || []);
            setError('');
        } catch (err) {
            setError(err.message || 'Unable to load events list.');
        } finally {
            setLoading(false);
        }
    };

    const fetchMyTeams = async () => {
        if (!token || isManager) return;
        try {
            const res = await axiosClient.get('/teams/my-team');
            setMyTeams(res.result || []);
        } catch (err) {
            console.error("Error fetching user teams:", err);
        }
    };

    useEffect(() => {
        fetchEvents();
        fetchMyTeams();
    }, [token, isManager]);

    // Sync selectedPhase tab when search query parameter changes
    useEffect(() => {
        const filter = searchParams.get('filter');
        if (filter === 'participating') {
            setSelectedPhase('participating');
        } else if (selectedPhase === 'participating') {
            setSelectedPhase('all');
        }
    }, [searchParams]);

    const handlePhaseChange = (phaseKey) => {
        setSelectedPhase(phaseKey);
        setSearchParams(prev => {
            const nextParams = new URLSearchParams(prev);
            if (phaseKey === 'participating') {
                nextParams.set('filter', 'participating');
            } else {
                nextParams.delete('filter');
            }
            return nextParams;
        });
    };

    const phaseOptions = useMemo(() => {
        const options = [
            { key: 'all', label: 'All' },
            { key: 'running', label: 'Ongoing', dot: 'sky' },
            { key: 'upcoming', label: 'Upcoming', dot: 'orange' },
            { key: 'ended', label: 'Finished', dot: 'gray' },
        ];
        if (token && !isManager && myTeams.length > 0) {
            options.unshift({ key: 'participating', label: 'My Event', dot: 'emerald' });
        }
        return options;
    }, [token, isManager, myTeams]);

    const displayEvents = useMemo(() => (events.length ? events : [demoEvent]), [events]);

    const filteredEvents = useMemo(() => {
        const keyword = query.trim().toLowerCase();
        return displayEvents.filter((event) => {
            const matchesSearch = !keyword || `${event.name} ${event.season} ${event.year} ${(event.tracks || []).map((track) => track.name).join(' ')}`.toLowerCase().includes(keyword);
            
            const eventPhase = getEventPhase(event).key;
            const matchesPhase = selectedPhase === 'all' || 
                (selectedPhase === 'participating' && myTeams.some(t => String(t.eventId) === String(event.id))) ||
                (selectedPhase === 'running' && (eventPhase === 'running' || eventPhase === 'registration')) ||
                (selectedPhase === 'upcoming' && eventPhase === 'upcoming') ||
                (selectedPhase === 'ended' && eventPhase === 'ended');
                
            return matchesSearch && matchesPhase;
        }).sort((a, b) => {
            if (sortBy === 'deadline') return new Date(a.regEndDate || 0) - new Date(b.regEndDate || 0);
            if (sortBy === 'newest') return Number(b.year || 0) - Number(a.year || 0) || Number(b.id || 0) - Number(a.id || 0);
            if (sortBy === 'teams') return Number(b.teamCount || 0) - Number(a.teamCount || 0);
            const phaseOrder = { registration: 0, running: 1, upcoming: 2, ended: 3 };
            return phaseOrder[getEventPhase(a).key] - phaseOrder[getEventPhase(b).key];
        });
    }, [displayEvents, selectedPhase, query, sortBy]);

    const submitSearch = (event) => {
        event.preventDefault();
        setQuery(searchInput);
    };

    return (
        <main className="bg-white min-h-screen text-slate-800">
            {/* Title Section */}
            <header className="bg-[#f8fafc] py-12 text-center border-b border-slate-200">
                <h1 className="text-[60px] font-black tracking-tight text-[#1f3747] leading-none">Events</h1>
                <p className="mt-4 text-[#415b6d] max-w-lg mx-auto text-base sm:text-lg">
                    Discover SEAL hackathons, assemble your team, and build prototypes for real-world issues.
                </p>
            </header>

            {/* Filter pills & search toolbar */}
            <section className="max-w-[1220px] mx-auto px-6 mt-12">
                <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center pb-6 border-b border-slate-100">
                    {/* Category tabs */}
                    <div className="flex flex-wrap gap-2">
                        {phaseOptions.map((option) => (
                            <button
                                key={option.key}
                                type="button"
                                className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded border transition-all ${
                                    selectedPhase === option.key
                                        ? 'bg-[#2c4e66] border-[#2c4e66] text-white'
                                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                                onClick={() => handlePhaseChange(option.key)}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>

                    {/* Search Form */}
                    <form className="flex w-full md:w-auto gap-2" onSubmit={submitSearch}>
                        <div className="flex items-center border border-slate-200 rounded px-3 py-1.5 bg-white w-full md:w-80 focus-within:border-[#2c4e66]">
                            <span className="text-slate-400 mr-2 text-sm">⌕</span>
                            <input 
                                value={searchInput} 
                                onChange={(event) => setSearchInput(event.target.value)} 
                                placeholder="Search by name, season, or track..." 
                                className="w-full text-sm outline-none border-0 p-0 focus:ring-0 bg-transparent text-slate-800"
                            />
                        </div>
                        <button 
                            type="submit" 
                            className="btn-primary min-h-[38px] text-xs py-2"
                            style={{ backgroundColor: '#2c4e66', borderColor: '#2c4e66' }}
                        >
                            Search
                        </button>
                    </form>
                </div>

                {/* Toolbar results list count & sort order */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mt-6">
                    <p className="text-sm font-bold text-slate-500">
                        Showing <strong>{filteredEvents.length}</strong> Hackathons
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        <strong>Sort by:</strong>
                        <div className="inline-flex rounded border border-slate-200 overflow-hidden">
                            {[
                                ['relevant', 'Most Relevant'],
                                ['deadline', 'Registration Deadline'],
                                ['newest', 'Recently Added'],
                                ['teams', 'Team Count'],
                            ].map(([value, label]) => (
                                <button
                                    type="button"
                                    key={value}
                                    className={`px-3 py-1.5 border-r border-slate-100 last:border-0 ${
                                        sortBy === value 
                                            ? 'bg-slate-100 text-slate-900 font-extrabold' 
                                            : 'bg-white hover:bg-slate-50 text-slate-600'
                                    }`}
                                    onClick={() => setSortBy(value)}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Events Card Grid List */}
            <section className="max-w-[1220px] mx-auto px-6 py-12">
                <Toast error={error} onClose={() => setError('')} />
                
                {loading ? (
                    <div className="text-center py-16 text-sm text-slate-500 font-bold">
                        Loading events list...
                    </div>
                ) : filteredEvents.length ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredEvents.map((event) => {
                            const userTeam = myTeams.find(t => String(t.eventId) === String(event.id));
                            return (
                                <MarketplaceEventCard 
                                    event={event} 
                                    key={event.id} 
                                    navigate={navigate} 
                                    myTeam={userTeam} 
                                />
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-16 text-sm text-slate-500">
                        No hackathons found matching the current filters.
                    </div>
                )}
            </section>
        </main>
    );
}
