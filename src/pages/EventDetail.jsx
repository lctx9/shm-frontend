import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { formatDateTime, getEventPhase } from '../utils/hackathon';
import MyTeam from './MyTeam';
import ParticipantsPool from '../components/ParticipantsPool';
import AllTeamsPool from '../components/AllTeamsPool';

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
    const [searchParams, setSearchParams] = useSearchParams();
    const initialTab = searchParams.get('tab') || 'home';
    const [activeTab, setActiveTab] = useState(initialTab);
    const [hasTeam, setHasTeam] = useState(false);
    const [event, setEvent] = useState(null);
    const [prizes, setPrizes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [showCreateDialog, setShowCreateDialog] = useState(false);

    // Create team dialog state
    const [createForm, setCreateForm] = useState({
        name: '',
        trackId: '',
        type: 'PUBLIC',
        joinPassword: '',
    });
    const [createEmails, setCreateEmails] = useState(['', '']);
    const [createError, setCreateError] = useState('');
    const [createSuccess, setCreateSuccess] = useState('');
    const [creating, setCreating] = useState(false);

    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const isManager = ['ADMIN', 'COORDINATOR', 'STAFF', 'JUDGE', 'MENTOR'].includes(role);
    const currentEmail = localStorage.getItem('email');

    useEffect(() => {
        const checkUserTeam = async () => {
            if (!token || isManager || !eventId) return;
            try {
                const res = await axiosClient.get(`/teams/my-team?eventId=${eventId}`);
                const teams = res.result || [];
                setHasTeam(teams.length > 0);
            } catch (err) {
                console.error("Error checking user team:", err);
            }
        };
        checkUserTeam();
    }, [eventId, token, isManager]);

    useEffect(() => {
        const tab = searchParams.get('tab') || 'home';
        setActiveTab(tab);
    }, [searchParams]);

    const handleTabChange = (newTab) => {
        setActiveTab(newTab);
        setSearchParams(prev => {
            const nextParams = new URLSearchParams(prev);
            if (newTab === 'home') {
                nextParams.delete('tab');
            } else {
                nextParams.set('tab', newTab);
            }
            return nextParams;
        });
    };

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

    const handleCreateTeamPath = () => {
        setShowJoinModal(false);
        setCreateForm({ name: '', trackId: event?.tracks?.[0]?.id || '', type: 'PUBLIC', joinPassword: '' });
        setCreateEmails(['', '']);
        setCreateError('');
        setCreateSuccess('');
        setShowCreateDialog(true);
    };

    const handleLookingPath = () => {
        setShowJoinModal(false);
        localStorage.setItem(`shm_registered_looking_event_${event.id}`, 'true');
        handleTabChange('all-teams');
    };

    const handleCreateTeamSubmit = async (e) => {
        e.preventDefault();
        setCreateError('');
        setCreateSuccess('');
        const nonNullEmails = createEmails.filter(em => em.trim() !== '');
        if (nonNullEmails.length < 2) {
            setCreateError('Bạn cần mời ít nhất 2 thành viên khác.');
            return;
        }
        const uniqueEmails = [...new Set(nonNullEmails.map(email => email.trim().toLowerCase()))];
        if (uniqueEmails.length < nonNullEmails.length) {
            setCreateError('Các email mời không được trùng nhau.');
            return;
        }
        if (nonNullEmails.includes(currentEmail.toLowerCase())) {
            setCreateError('Bạn không thể tự mời chính mình.');
            return;
        }
        if (createForm.type === 'PRIVATE' && !/^\d{4}$/.test(createForm.joinPassword)) {
            setCreateError('PIN private phải là đúng 4 chữ số.');
            return;
        }
        try {
            setCreating(true);
            await axiosClient.post('/teams/create', {
                name: createForm.name,
                type: createForm.type,
                joinPassword: createForm.type === 'PRIVATE' ? createForm.joinPassword : '',
                eventId: Number(event.id),
                trackId: Number(createForm.trackId),
                memberEmails: nonNullEmails,
            });
            setCreateSuccess('Tạo đội thành công! Lời mời đã được gửi tới các thành viên.');
            setHasTeam(true);
            setTimeout(() => {
                setShowCreateDialog(false);
                handleTabChange('my-team');
            }, 1500);
        } catch (err) {
            setCreateError(err.message || 'Không thể tạo đội.');
        } finally {
            setCreating(false);
        }
    };

    const tabClass = (tabName) => {
        const isActive = activeTab === tabName;
        return `w-full text-left px-4 py-2.5 rounded-full text-sm flex items-center gap-2 transition-colors cursor-pointer ${
            isActive 
                ? 'bg-[#1f3747] text-white font-bold' 
                : 'hover:bg-slate-50 text-slate-600 hover:text-slate-900 font-medium'
        }`;
    };

    return (
        <main className="bg-white min-h-screen text-slate-800 py-12 px-6 max-w-[1400px] mx-auto">
            <div className="flex flex-col lg:flex-row gap-8 items-start">
                
                {/* Left Sidebar Navigation */}
                <aside className="w-full lg:w-56 shrink-0 space-y-1 animate-none">
                    <button 
                        onClick={() => handleTabChange('home')}
                        className={tabClass('home')}
                    >
                        <span>🏠</span> Home
                    </button>
                    <button 
                        onClick={() => handleTabChange('participants')}
                        className={tabClass('participants')}
                    >
                        <span>👥</span> Participants
                    </button>
                    <button 
                        onClick={() => handleTabChange('all-teams')}
                        className={tabClass('all-teams')}
                    >
                        <span>🏆</span> All Teams
                    </button>
                    {(hasTeam || activeTab === 'my-team') && (
                        <button 
                            onClick={() => handleTabChange('my-team')}
                            className={tabClass('my-team')}
                        >
                            <span>🛡️</span> My Team
                        </button>
                    )}
                    <button className="w-full text-left px-4 py-2.5 rounded-full hover:bg-slate-50 text-slate-600 hover:text-slate-900 font-medium text-sm flex items-center gap-2">
                        <span>🎓</span> Mentors/Judges
                    </button>
                    <button className="w-full text-left px-4 py-2.5 rounded-full hover:bg-slate-50 text-slate-600 hover:text-slate-900 font-medium text-sm flex items-center gap-2">
                        <span>🤝</span> Our Sponsors
                    </button>
                </aside>

                {activeTab === 'home' ? (
                    <>
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
                                {canJoin && !hasTeam && !isManager && token && (
                                    <button onClick={() => setShowJoinModal(true)} className="btn-primary cursor-pointer">Join Hackathon</button>
                                )}
                                {canJoin && hasTeam && !isManager && token && (
                                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-bold">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        Already registered
                                    </span>
                                )}
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
                    </>
                ) : activeTab === 'my-team' ? (
                    <div className="flex-1 min-w-0 animate-none">
                        <MyTeam 
                            eventId={event.id} 
                            embedded={true} 
                            onTeamChanged={(teamExists) => {
                                setHasTeam(teamExists);
                            }} 
                        />
                    </div>
                ) : activeTab === 'participants' ? (
                    <div className="flex-1 min-w-0 animate-none">
                        <ParticipantsPool eventId={event.id} />
                    </div>
                ) : activeTab === 'all-teams' ? (
                    <div className="flex-1 min-w-0 animate-none">
                        <AllTeamsPool 
                            eventId={event.id} 
                            onTeamJoined={(joined) => {
                                setHasTeam(joined);
                            }}
                        />
                    </div>
                ) : null}

            </div>

            {/* Join Hackathon Path Decision Modal */}
            {showJoinModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-slate-200">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-black text-[#0b1f3f]">Join Hackathon</h3>
                            <button 
                                onClick={() => setShowJoinModal(false)}
                                className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <p className="text-sm text-slate-500 mb-6 font-medium">
                            Choose how you would like to participate in <strong>{event.name}</strong>:
                        </p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Card 1: Create Team */}
                            <button
                                onClick={handleCreateTeamPath}
                                className="text-left p-5 rounded-xl border border-slate-200 hover:border-[#0f63c9] hover:shadow-[0_8px_20px_rgba(15,99,201,0.1)] transition-all duration-300 flex flex-col justify-between h-48 cursor-pointer bg-white"
                            >
                                <div>
                                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-xl mb-3">
                                        🛡️
                                    </div>
                                    <h4 className="font-black text-slate-900 text-base">Create a Team</h4>
                                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                        Start a new team as a Leader, set up your track, and invite members.
                                    </p>
                                </div>
                                <span className="text-xs font-bold text-[#0f63c9] mt-3 inline-flex items-center gap-1">
                                    Create now →
                                </span>
                            </button>

                            {/* Card 2: Looking for a Team */}
                            <button
                                onClick={handleLookingPath}
                                className="text-left p-5 rounded-xl border border-slate-200 hover:border-amber-500 hover:shadow-[0_8px_20px_rgba(245,158,11,0.1)] transition-all duration-300 flex flex-col justify-between h-48 cursor-pointer bg-white"
                            >
                                <div>
                                    <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-xl mb-3">
                                        🔍
                                    </div>
                                    <h4 className="font-black text-slate-900 text-base">Looking for Team</h4>
                                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                        Browse all teams or join as a solo participant looking for a team.
                                    </p>
                                </div>
                                <span className="text-xs font-bold text-amber-600 mt-3 inline-flex items-center gap-1">
                                    Browse teams →
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Team Dialog */}
            {showCreateDialog && event && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
                        {/* Dialog Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-[#0b1f3f]">
                            <div>
                                <h3 className="text-lg font-black text-white">🛡️ Create a Team</h3>
                                <p className="text-xs text-slate-300 mt-0.5">{event.name}</p>
                            </div>
                            <button
                                onClick={() => { setShowCreateDialog(false); setCreateError(''); setCreateSuccess(''); }}
                                className="text-slate-300 hover:text-white transition-colors cursor-pointer p-1"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Dialog Body */}
                        <form onSubmit={handleCreateTeamSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
                            {/* Team Name */}
                            <div>
                                <label className="block text-sm font-bold text-[#0b1f3f] mb-1">Team Name <span className="text-red-500">*</span></label>
                                <input
                                    required
                                    className="input-custom"
                                    placeholder="Enter your team name"
                                    value={createForm.name}
                                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                                />
                            </div>

                            {/* Track */}
                            {(event.tracks || []).length > 0 && (
                                <div>
                                    <label className="block text-sm font-bold text-[#0b1f3f] mb-1">Track <span className="text-red-500">*</span></label>
                                    <select
                                        required
                                        className="input-custom"
                                        value={createForm.trackId}
                                        onChange={(e) => setCreateForm({ ...createForm, trackId: e.target.value })}
                                    >
                                        <option value="">-- Select a track --</option>
                                        {(event.tracks || []).map((track) => (
                                            <option key={track.id} value={track.id}>{track.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Visibility */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-[#0b1f3f] mb-1">Visibility</label>
                                    <select
                                        className="input-custom"
                                        value={createForm.type}
                                        onChange={(e) => setCreateForm({ ...createForm, type: e.target.value, joinPassword: '' })}
                                    >
                                        <option value="PUBLIC">🌐 Public</option>
                                        <option value="PRIVATE">🔒 Private</option>
                                    </select>
                                </div>
                                {createForm.type === 'PRIVATE' && (
                                    <div>
                                        <label className="block text-sm font-bold text-[#0b1f3f] mb-1">4-digit PIN <span className="text-red-500">*</span></label>
                                        <input
                                            className="input-custom tracking-widest text-center text-lg font-bold"
                                            inputMode="numeric"
                                            maxLength={4}
                                            placeholder="····"
                                            value={createForm.joinPassword}
                                            onChange={(e) => setCreateForm({ ...createForm, joinPassword: e.target.value.replace(/\D/g, '') })}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Invite Emails */}
                            <div>
                                <label className="block text-sm font-bold text-[#0b1f3f] mb-1">
                                    Invite Members <span className="text-red-500">*</span>
                                    <span className="ml-1 text-xs text-slate-400 font-normal">(min. 2, max 4)</span>
                                </label>
                                <p className="text-xs text-slate-400 mb-3">Your team needs at least 3 members total (you + 2 others).</p>
                                <div className="space-y-2.5">
                                    {createEmails.map((email, idx) => (
                                        <div key={idx} className="flex items-center gap-2">
                                            <input
                                                type="email"
                                                className="input-custom flex-1"
                                                placeholder={`Member ${idx + 1} email ${idx < 2 ? '(required)' : '(optional)'}`}
                                                value={email}
                                                onChange={(e) => {
                                                    const next = [...createEmails];
                                                    next[idx] = e.target.value;
                                                    setCreateEmails(next);
                                                    setCreateError('');
                                                }}
                                            />
                                            {createEmails.length > 2 && (
                                                <button
                                                    type="button"
                                                    onClick={() => setCreateEmails(createEmails.filter((_, i) => i !== idx))}
                                                    className="shrink-0 rounded-lg border border-red-200 bg-red-50 px-2 py-2 text-red-600 hover:bg-red-100 transition-colors cursor-pointer"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    {createEmails.length < 4 && (
                                        <button
                                            type="button"
                                            onClick={() => setCreateEmails([...createEmails, ''])}
                                            className="text-xs font-bold text-[#0f63c9] hover:underline flex items-center gap-1 cursor-pointer"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                            </svg>
                                            Add another email
                                        </button>
                                    )}
                                </div>
                            </div>

                            {createError && (
                                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                                    {createError}
                                </div>
                            )}
                            {createSuccess && (
                                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 flex items-center gap-2">
                                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                    </svg>
                                    {createSuccess}
                                </div>
                            )}

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => { setShowCreateDialog(false); setCreateError(''); setCreateSuccess(''); }}
                                    className="btn-secondary flex-1"
                                    disabled={creating}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn-primary flex-1"
                                    disabled={creating}
                                >
                                    {creating ? 'Creating...' : '🛡️ Create Team'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
}
