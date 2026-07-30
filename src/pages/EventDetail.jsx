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

function SectionTitle({ children }) {
    return (
        <div className="flex items-center gap-4 my-8 border-b border-slate-100 pb-3">
            <h2 className="text-xl font-black text-slate-900">{children}</h2>
        </div>
    );
}

function getEventCoverImage(event) {
    const season = (event.season || '').toUpperCase();
    if (season === 'SUMMER') {
        return 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&auto=format&fit=crop&q=60';
    } else if (season === 'SPRING') {
        return 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop&q=60';
    } else if (season === 'FALL') {
        return 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&auto=format&fit=crop&q=60';
    } else {
        return 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=60';
    }
}

function CountdownSection({ event }) {
    const phase = getEventPhase(event);
    const targetDate = phase.key === 'registration' ? event.regEndDate : event.eventStartDate;

    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

    useEffect(() => {
        if (!targetDate) return;

        const updateTimer = () => {
            const diff = new Date(targetDate).getTime() - Date.now();
            if (diff <= 0) {
                setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
            const minutes = Math.floor((diff / 1000 / 60) % 60);
            const seconds = Math.floor((diff / 1000) % 60);

            setTimeLeft({ days, hours, minutes, seconds });
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [targetDate]);

    const titleLabel = phase.key === 'registration' 
        ? 'Time until 🏆 Registration close' 
        : phase.key === 'running' 
        ? 'Time until 🏁 Hackathon end'
        : 'Time until 🎉 Winners announcement';

    const timeBlocks = [
        { label: 'days', value: timeLeft.days },
        { label: 'hours', value: timeLeft.hours },
        { label: 'minutes', value: timeLeft.minutes },
        { label: 'seconds', value: timeLeft.seconds },
    ];

    return (
        <div className="bg-[#FAF6EF]/30 border border-slate-200 p-6 rounded-none animate-none">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                {titleLabel}
            </h3>

            <div className="grid grid-cols-4 gap-2">
                {timeBlocks.map((block) => (
                    <div key={block.label} className="bg-white border border-slate-200 p-2.5 flex flex-col items-center justify-center rounded shadow-sm">
                        <span className="text-xl font-black text-slate-800 leading-none">
                            {String(block.value).padStart(2, '0')}
                        </span>
                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 mt-1.5">
                            {block.label}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function TimelineSection({ event }) {
    const regStart = event.regStartDate ? new Date(event.regStartDate) : null;
    const regEnd = event.regEndDate ? new Date(event.regEndDate) : null;
    const eventStart = event.eventStartDate ? new Date(event.eventStartDate) : null;
    const eventEnd = event.eventEndDate ? new Date(event.eventEndDate) : null;

    const formatDateStr = (date) => {
        if (!date) return 'TBD';
        return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) + ' @ ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    };

    const timelineItems = [
        { label: 'Registration and team formation start', date: formatDateStr(regStart), done: regStart && regStart < Date.now(), icon: '✅' },
        { label: 'Registrations and team formation close', date: formatDateStr(regEnd), done: regEnd && regEnd < Date.now(), icon: '⭕' },
        { label: 'Hackathon days start', date: formatDateStr(eventStart), done: eventStart && eventStart < Date.now(), icon: '🏁' },
        { label: 'Mentor Session - Technical Architecture Guidance', date: formatDateStr(eventStart ? new Date(eventStart.getTime() + 86400000 * 3) : null), done: false, icon: '💬' },
        { label: 'Deliverable 1 - Initial Prototype Submission', date: formatDateStr(eventStart ? new Date(eventStart.getTime() + 86400000 * 5) : null), done: false, icon: '🚩' },
        { label: 'Mentor Session 2 - Pitch Deck & Demo Prep', date: formatDateStr(eventStart ? new Date(eventStart.getTime() + 86400000 * 7) : null), done: false, icon: '💬' },
        { label: 'Deliverable 2 - Final Source Code & Video Demo', date: formatDateStr(eventStart ? new Date(eventStart.getTime() + 86400000 * 9) : null), done: false, icon: '🚩' },
        { label: 'Teams Pitches & Live Demo Q&A Session', date: formatDateStr(eventEnd ? new Date(eventEnd.getTime() - 86400000) : null), done: false, icon: '📢' },
        { label: 'Evaluation & Winners Announcement', date: formatDateStr(eventEnd), done: false, icon: '🏆', current: true },
    ];

    return (
        <div className="bg-[#FAF6EF]/30 border border-slate-200 p-6 rounded-none animate-none">
            <div className="flex justify-between items-baseline mb-6 border-b border-slate-200 pb-3">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Timeline</h3>
                <span className="text-[10px] font-bold text-slate-400">Asia/Saigon UTC+07:00</span>
            </div>

            <div className="relative border-l border-slate-200 ml-2 pl-6 space-y-6">
                {timelineItems.map((item, idx) => (
                    <div key={idx} className="relative">
                        <span className={`absolute -left-[32px] top-0 h-4.5 w-4.5 rounded-full border flex items-center justify-center text-[10px] ${
                            item.done 
                                ? 'bg-[#edf2f6] text-[#2c4e66] border-[#d4e2ec]' 
                                : item.current 
                                ? 'bg-emerald-500 text-white border-emerald-600' 
                                : 'bg-white text-slate-400 border-slate-200'
                        }`}>
                            {item.done ? '✔' : '•'}
                        </span>
                        <div className="text-xs">
                            <p className="font-bold text-slate-800 leading-tight flex items-center gap-1.5">
                                <span>{item.icon}</span>
                                <span>{item.label}</span>
                            </p>
                            <p className="text-slate-400 mt-1">{item.date}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
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
        return <main className="flex items-center justify-center min-h-[60vh] text-slate-500 font-bold">Loading event details...</main>;
    }

    if (error || !event) {
        return <main className="flex items-center justify-center min-h-[60vh] text-red-500 font-bold">{error || 'Event not found.'}</main>;
    }

    const phase = getEventPhase(event);
    const canJoin = phase.key === 'registration';
    const ended = phase.key === 'ended';
    const rules = event.competitionRules?.trim();
    const tracks = event.tracks || [];
    const coverImage = getEventCoverImage(event);

    return (
        <main className="bg-white min-h-screen text-slate-800 py-12 px-6 max-w-[1400px] mx-auto">
            <div className="flex flex-col lg:flex-row gap-8 items-start">
                
                {/* Left Sidebar Navigation */}
                <aside className="w-full lg:w-56 shrink-0 space-y-1 animate-none">
                    <button className="w-full text-left px-4 py-2.5 rounded-full bg-[#1f3747] text-white font-bold text-sm flex items-center gap-2">
                        <span>🏠</span> Home
                    </button>
                    <button className="w-full text-left px-4 py-2.5 rounded-full hover:bg-slate-50 text-slate-600 hover:text-slate-900 font-medium text-sm flex items-center gap-2">
                        <span>👥</span> Participants
                    </button>
                    <button className="w-full text-left px-4 py-2.5 rounded-full hover:bg-slate-50 text-slate-600 hover:text-slate-900 font-medium text-sm flex items-center gap-2">
                        <span>🎓</span> Mentors/Judges
                    </button>
                    <button className="w-full text-left px-4 py-2.5 rounded-full hover:bg-slate-50 text-slate-600 hover:text-slate-900 font-medium text-sm flex items-center gap-2">
                        <span>🤝</span> Our Sponsors
                    </button>
                    <button className="w-full text-left px-4 py-2.5 rounded-full hover:bg-slate-50 text-slate-600 hover:text-slate-900 font-medium text-sm flex items-center gap-2">
                        <span>📰</span> Latest AI News
                    </button>
                </aside>

                {/* Center Content */}
                <div className="flex-1 min-w-0 animate-none">
                    {/* Cover Graphic Banner */}
                    <div className="w-full overflow-hidden border border-slate-200 mb-6 bg-slate-50">
                        <img 
                            src={coverImage} 
                            alt={event.name} 
                            className="w-full h-auto max-h-[420px] object-cover" 
                        />
                    </div>

                    {/* Title Header */}
                    <h1 className="text-3xl font-black text-slate-900 mb-4 flex items-center gap-2 leading-tight">
                        🚀 {event.name}
                    </h1>

                    {/* Call to Actions inside header block */}
                    <div className="flex flex-wrap items-center gap-4 mb-8">
                        {canJoin && <Link to={`/my-team?registerEventId=${event.id}`} className="btn-primary">Join Hackathon</Link>}
                        {ended && <Link to={`/events/${event.id}/results`} className="btn-primary">View Results</Link>}
                        <div className="text-xs text-slate-500">
                            <strong>Who can register?</strong> Students register in teams of 2 to 5 members.
                        </div>
                    </div>

                    {/* Event Description */}
                    <div className="prose max-w-none text-slate-600 text-sm sm:text-base leading-relaxed mb-12">
                        <p>{event.description || 'Welcome to this season\'s hackathon challenge! Team up, build prototypes, and turn your tech ideas into reality.'}</p>
                    </div>

                    {/* Competition Rules */}
                    <section className="mt-8">
                        <SectionTitle>Requirements & Rules</SectionTitle>
                        {rules ? (
                            <div className="text-sm sm:text-base text-slate-600 leading-relaxed whitespace-pre-line">{rules}</div>
                        ) : (
                            <p className="text-xs text-slate-400">Rules document is being finalized by the organizing committee.</p>
                        )}
                        {event.ruleDocumentUrl && (
                            <a 
                                className="inline-block mt-4 text-xs font-bold text-[#2c4e66] hover:underline" 
                                href={event.ruleDocumentUrl} 
                                target="_blank" 
                                rel="noreferrer"
                            >
                                Download Full Rule Book ↗
                            </a>
                        )}
                    </section>

                    {/* Event Tracks */}
                    <section className="mt-8">
                        <SectionTitle>Tracks</SectionTitle>
                        {tracks.length ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {tracks.map((track) => (
                                    <div key={track.id} className="border border-slate-200 p-5 rounded-none hover:border-slate-400 transition-colors">
                                        <h3 className="text-sm font-black text-slate-900 mb-2">{track.name}</h3>
                                        <p className="text-xs text-slate-500 leading-relaxed">{track.description || 'Details regarding this track statement will be announced shortly.'}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-slate-400">Tracks have not been configured for this event yet.</p>
                        )}
                    </section>

                    {/* Event Prizes */}
                    <section className="mt-8">
                        <SectionTitle>Prizes</SectionTitle>
                        {prizes.length ? (
                            <div className="space-y-4">
                                {prizes.map((prize) => (
                                    <div key={prize.id} className="flex gap-4 border border-slate-200 p-5 rounded-none">
                                        <span className="text-2xl text-amber-500 leading-none">★</span>
                                        <div>
                                            <h3 className="text-sm font-black text-slate-900">{prize.name}</h3>
                                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">{prize.description || 'Cash prizes, scholarships, and academic recognition.'}</p>
                                            {prize.teamName && (
                                                <small className="inline-block mt-2 px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-black uppercase rounded">
                                                    Winner: {prize.teamName}
                                                </small>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-slate-400">Prize structure will be announced by organizers.</p>
                        )}
                    </section>

                    {/* Scoring Criteria */}
                    <section className="mt-8">
                        <SectionTitle>Scoring Rubric</SectionTitle>
                        {criteria.length ? (
                            <div className="space-y-4">
                                {criteria.map((criterion) => (
                                    <div key={criterion.id || criterion.label} className="border border-slate-200 p-5 rounded-none">
                                        <div className="flex justify-between items-baseline mb-2">
                                            <h3 className="text-sm font-black text-slate-900">{criterion.label}</h3>
                                            <span className="text-xs font-bold text-[#2c4e66]">
                                                {criterion.weight ? `${criterion.weight}%` : `${criterion.maxScore || 100} pts`}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500 leading-relaxed">{criterion.description || 'Assessed by jury members.'}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-slate-400">Detailed rubric has not been released yet.</p>
                        )}
                    </section>
                </div>

                {/* Right Sidebar Info Panel */}
                <aside className="w-full lg:w-[320px] shrink-0 space-y-6">
                    <CountdownSection event={event} />
                    <TimelineSection event={event} />
                </aside>

            </div>
        </main>
    );
}
