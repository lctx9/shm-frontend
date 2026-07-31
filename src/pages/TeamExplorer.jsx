import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axiosClient from '../api/axiosClient';
import { getEventPhase } from '../utils/hackathon';
import Toast from '../components/Toast';

const staffRoles = new Set(['ADMIN', 'COORDINATOR', 'STAFF', 'JUDGE', 'MENTOR']);

function Pill({ children, tone = 'blue' }) {
    const tones = {
        blue: 'bg-blue-50 text-[#0f63c9] border-blue-100',
        green: 'bg-green-50 text-green-700 border-green-100',
        amber: 'bg-amber-50 text-amber-700 border-amber-100',
        slate: 'bg-slate-100 text-slate-700 border-slate-200',
    };
    return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${tones[tone]}`}>{children}</span>;
}

function TeamDetail({ team, submissions, matrices, onClose, onOpenChat, canChat }) {
    if (!team) return null;

    const teamSubmissions = submissions.filter((item) => String(item.teamId) === String(team.id));
    const requiredMatrices = matrices.filter((matrix) => String(matrix.trackId) === String(team.trackId));
    const submittedMatrixIds = new Set(teamSubmissions.map((item) => String(item.matrixId)));
    const completedRounds = requiredMatrices.filter((matrix) => submittedMatrixIds.has(String(matrix.id))).length;
    const progress = requiredMatrices.length ? Math.round((completedRounds / requiredMatrices.length) * 100) : 0;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/55 p-4">
            <div className="mx-auto my-8 max-w-6xl rounded-lg bg-white shadow-xl">
                <div className="flex flex-col gap-3 border-b border-blue-100 p-6 md:flex-row md:items-center md:justify-between">
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0f63c9]">Team Details</p>
                        <h3 className="mt-1 text-2xl font-black text-slate-900">{team.name}</h3>
                        <p className="mt-1 text-sm text-slate-500">{team.eventName} · {team.trackName}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {canChat && <button type="button" onClick={onOpenChat} className="btn-primary">Chat</button>}
                        <button type="button" onClick={onClose} className="btn-secondary">Close</button>
                    </div>
                </div>

                <div className="grid gap-6 p-6 lg:grid-cols-[0.9fr_1.1fr]">
                    <section className="space-y-5">
                        {team.disqualificationStatus === 'APPROVED' && (
                            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-900 shadow-sm">
                                <h4 className="font-black text-red-900 text-sm">This team has been disqualified from the tournament</h4>
                                <p className="text-xs text-red-800 mt-1">Reason: "{team.disqualificationReason || 'Rules violation'}"</p>
                            </div>
                        )}
                        <div className="rounded-lg border border-blue-100 bg-blue-50 p-5">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-xs font-black uppercase tracking-[0.16em] text-[#0f63c9]">Progress</p>
                                    <p className="mt-1 text-3xl font-black text-slate-900">{progress}%</p>
                                </div>
                                <Pill tone={progress === 100 ? 'green' : 'amber'}>{completedRounds}/{requiredMatrices.length || 0} rounds submitted</Pill>
                            </div>
                            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white">
                                <div className="h-full rounded-full bg-[#0f63c9]" style={{ width: `${progress}%` }} />
                            </div>
                            <p className="mt-4 text-sm leading-6 text-slate-600">{team.description || 'No description provided by team leader.'}</p>
                        </div>

                        <div className="rounded-lg border border-blue-100 bg-white p-5">
                            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Members ({(team.members || []).length || team.memberCount || 0})</p>
                            <div className="mt-4 space-y-3">
                                {(team.members || []).map((member) => (
                                    <div key={member.id} className="rounded-lg border border-blue-50 bg-slate-50 p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="font-black text-slate-900">{member.fullName}</p>
                                                <p className="mt-1 text-sm text-slate-500">{member.email}</p>
                                                <p className="mt-1 text-sm text-slate-500">Student ID: {member.studentId || 'N/A'}</p>
                                            </div>
                                            <Pill tone={member.role === 'LEADER' ? 'red' : 'slate'}>{member.role}</Pill>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    <section className="rounded-lg border border-blue-100 bg-white">
                        <div className="border-b border-blue-100 p-5">
                            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Submissions per Round</p>
                        </div>
                        <div className="divide-y divide-blue-50">
                            {requiredMatrices.map((matrix) => {
                                const submission = teamSubmissions.find((item) => String(item.matrixId) === String(matrix.id));
                                return (
                                    <div key={matrix.id} className="p-5">
                                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                            <div>
                                                <p className="font-black text-slate-900">{matrix.roundName}</p>
                                                <p className="mt-1 text-sm text-slate-500">
                                                    Deadline: {matrix.submissionDeadline ? new Date(matrix.submissionDeadline).toLocaleString('en-US') : 'Not Set'}
                                                </p>
                                            </div>
                                            <Pill tone={submission ? (submission.graded ? 'green' : 'amber') : 'slate'}>
                                                {submission ? (submission.graded ? `Graded ${submission.score}/100` : 'Submitted, awaiting score') : 'Not Submitted'}
                                            </Pill>
                                        </div>
                                        {submission?.fileUrl && (
                                            <a href={submission.fileUrl} target="_blank" rel="noreferrer" className="mt-3 block break-all text-sm font-bold text-[#0f63c9]">
                                                {submission.fileUrl}
                                            </a>
                                        )}
                                        {submission?.feedback && <p className="mt-3 text-sm leading-6 text-slate-600">{submission.feedback}</p>}
                                    </div>
                                );
                            })}
                            {requiredMatrices.length === 0 && <p className="p-5 text-sm text-slate-500">No rounds configured for this track.</p>}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}

export default function TeamExplorer() {
    const storedRole = localStorage.getItem('role');
    const role = ['MENTOR', 'JUDGE'].includes(storedRole) ? 'STAFF' : storedRole;
    const email = localStorage.getItem('email');
    const userId = localStorage.getItem('userId');
    const [teams, setTeams] = useState([]);
    const [events, setEvents] = useState([]);
    const [submissions, setSubmissions] = useState([]);
    const [eventFilter, setEventFilter] = useState('ALL');
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [chatTeam, setChatTeam] = useState(null);
    const [joinTeam, setJoinTeam] = useState(null);
    const [joinPassword, setJoinPassword] = useState('');
    const [joinError, setJoinError] = useState('');
    const [joinActionStatus, setJoinActionStatus] = useState({ teamId: null, message: '', type: '' });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [alertModal, setAlertModal] = useState({ isOpen: false, title: '', message: '' });
    const isMentor = role === 'STAFF' || role === 'MENTOR';
    const canJoin = !staffRoles.has(role);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [teamRes, eventRes, submissionRes] = await Promise.all([
                axiosClient.get('/teams'),
                axiosClient.get('/events'),
                staffRoles.has(role) ? axiosClient.get('/submissions').catch(() => ({ result: [] })) : Promise.resolve({ result: [] }),
            ]);
            setTeams(teamRes.result || []);
            setEvents(eventRes.result || []);
            setSubmissions(submissionRes.result || []);
            setError('');
        } catch (err) {
            setError(err.message || 'Failed to load team database.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const matrices = useMemo(() => events.flatMap((event) => event.matrices || []), [events]);

    const registrationEvents = useMemo(() => {
        return events.filter((event) => getEventPhase(event).key === 'registration');
    }, [events]);

    const registrationEventIds = useMemo(() => {
        return new Set(registrationEvents.map((event) => String(event.id)));
    }, [registrationEvents]);

    const assignedTrackIds = useMemo(() => {
        if (!isMentor) return new Set();
        return new Set(
            matrices
                .filter((matrix) => (matrix.mentors || []).some((mentor) => mentor.email === email))
                .map((matrix) => String(matrix.trackId))
        );
    }, [email, isMentor, matrices]);

    const filteredTeams = useMemo(() => {
        return teams.filter((team) => {
            const isRegOpenEvent = registrationEventIds.has(String(team.eventId));
            const eventMatched = eventFilter === 'ALL' ? isRegOpenEvent : String(team.eventId) === String(eventFilter);
            const mentorMatched = !isMentor || assignedTrackIds.has(String(team.trackId));
            const isMember = (team.members || []).some((member) => String(member.userId) === String(userId));
            const isOfficial = (team.memberCount || team.members?.length || 0) >= 3;

            // Ẩn các đội chưa đủ thành viên (< 3 TV) khỏi Sảnh chờ công khai trừ tài khoản Staff/Coordinator
            if (!staffRoles.has(role) && !isOfficial) {
                return false;
            }
            
            if (canJoin && isMember) {
                return false;
            }
            
            return eventMatched && mentorMatched;
        });
    }, [assignedTrackIds, eventFilter, isMentor, teams, userId, canJoin, registrationEventIds, staffRoles, role]);

    const stats = useMemo(() => {
        const teamIds = new Set(filteredTeams.map((team) => String(team.id)));
        const scopedSubmissions = submissions.filter((item) => teamIds.has(String(item.teamId)));
        return {
            teams: filteredTeams.length,
            submissions: scopedSubmissions.length,
            pending: scopedSubmissions.filter((item) => !item.graded).length,
        };
    }, [filteredTeams, submissions]);

    const handleJoinPublic = async (teamId) => {
        setJoinActionStatus({ teamId, message: 'Submitting join request...', type: 'info' });
        try {
            await axiosClient.post(`/teams/${teamId}/join-request`);
            await fetchData();
            setJoinActionStatus({ teamId, message: 'Join request submitted successfully. Awaiting team leader approval.', type: 'success' });
        } catch (err) {
            setJoinActionStatus({ teamId: null, message: '', type: '' });
            setAlertModal({
                isOpen: true,
                title: 'Error Message',
                message: err.message || 'Failed to join team.'
            });
        }
    };

    const handleJoinPrivate = async (e) => {
        e.preventDefault();
        if (!joinTeam) return;
        if (!/^\d{4}$/.test(joinPassword)) {
            setJoinError('Team join password must be exactly 4 digits.');
            return;
        }
        setJoinError('');

        try {
            await axiosClient.post(`/teams/${joinTeam.id}/join-private`, { password: joinPassword });
            setJoinTeam(null);
            setJoinPassword('');
            window.location.href = '/my-team';
        } catch (err) {
            setJoinError(err.message || 'Failed to join private team.');
        }
    };

    const openChatForTeam = (team) => {
        setChatTeam(team);
        setSelectedTeam(null);
    };

    return (
        <div className="mx-auto max-w-7xl space-y-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0f63c9]">{isMentor ? 'Mentor workspace' : 'Team explorer'}</p>
                    <h2 className="text-2xl font-black tracking-tight text-slate-900">{isMentor ? 'Assigned Teams' : 'Teams Directory'}</h2>
                    <p className="mt-2 text-sm text-slate-600">
                        {isMentor
                            ? 'Monitor assigned teams, review submissions, track progress, and communicate directly.'
                            : 'Browse teams participating in active hackathons, including tracks, members, and progress.'}
                    </p>
                </div>
                <button type="button" onClick={fetchData} title="Refresh data" className="btn-secondary h-9 w-9 p-0 inline-flex items-center justify-center text-sm font-bold">↻</button>
            </div>

            <section className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border border-blue-100 bg-white p-5">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Teams</p>
                    <p className="mt-2 text-3xl font-black text-slate-900">{stats.teams}</p>
                </div>
                <div className="rounded-lg border border-blue-100 bg-white p-5">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Submissions</p>
                    <p className="mt-2 text-3xl font-black text-slate-900">{stats.submissions}</p>
                </div>
                <div className="rounded-lg border border-blue-100 bg-white p-5">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Pending</p>
                    <p className="mt-2 text-3xl font-black text-slate-900">{stats.pending}</p>
                </div>
            </section>

            <div className="rounded-lg border border-blue-100 bg-white p-4">
                <label className="mb-1 block text-sm font-bold text-slate-700">Filter by Tournament (registration open)</label>
                <select className="input-custom max-w-md" value={eventFilter} onChange={(e) => setEventFilter(e.target.value)}>
                    <option value="ALL">All Tournaments</option>
                    {registrationEvents.map((event) => (
                        <option key={event.id} value={event.id}>{event.name}</option>
                    ))}
                </select>
            </div>

            <Toast error={error} onClose={() => setError('')} />

            {loading ? (
                <div className="rounded-lg bg-white p-8 text-center text-gray-500">Loading teams database...</div>
            ) : filteredTeams.length === 0 ? (
                <div className="rounded-lg border border-blue-100 bg-white p-8 text-center text-gray-500">
                    {isMentor ? 'No teams currently assigned under your mentoring tracks.' : 'No matching teams found.'}
                </div>
            ) : (
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {filteredTeams.map((team) => {
                        const teamSubmissions = submissions.filter((item) => String(item.teamId) === String(team.id));
                        const gradedCount = teamSubmissions.filter((item) => item.graded).length;
                        return (
                            <article key={team.id} className="flex flex-col h-full rounded-lg border border-blue-100 bg-white p-5 shadow-sm">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <h3 className="text-lg font-black text-slate-900 line-clamp-2" title={team.name}>{team.name}</h3>
                                        <p className="mt-1 text-sm text-slate-500 line-clamp-1" title={team.eventName}>{team.eventName || 'No event attached'}</p>
                                    </div>
                                    <Pill>{team.type}</Pill>
                                </div>

                                <p className="mt-4 min-h-12 text-sm leading-6 text-slate-600 line-clamp-3" title={team.description}>{team.description || 'No description provided by team leader.'}</p>

                                <dl className="mt-5 space-y-2 text-sm text-slate-600">
                                    <div className="flex justify-between gap-4">
                                        <dt className="font-bold text-slate-800">Track</dt>
                                        <dd className="text-right">{team.trackName || 'N/A'}</dd>
                                    </div>
                                    <div className="flex justify-between gap-4">
                                        <dt className="font-bold text-slate-800">Members</dt>
                                        <dd className="flex items-center gap-1.5 font-semibold">
                                            <span>{team.memberCount || 0}/5</span>
                                            {(team.disqualificationStatus === 'APPROVED') ? (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                                                    <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-red-600" />
                                                    Disqualified
                                                </span>
                                            ) : (team.memberCount || 0) >= 3 ? (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                                    <span className="pulsing-dot-green shrink-0" />
                                                    Official
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                                    <span className="pulsing-dot-amber shrink-0" />
                                                    Unofficial
                                                </span>
                                            )}
                                        </dd>
                                    </div>
                                    <div className="flex justify-between gap-4">
                                        <dt className="font-bold text-slate-800">Submissions</dt>
                                        <dd>{teamSubmissions.length} ({gradedCount} graded)</dd>
                                    </div>
                                </dl>

                                <div className="mt-auto pt-6">
                                    <div className="grid gap-2 sm:grid-cols-2">
                                        <button type="button" onClick={() => setSelectedTeam(team)} className="btn-secondary">Details</button>
                                        {isMentor || staffRoles.has(role) ? (
                                            <button type="button" onClick={() => openChatForTeam(team)} className="btn-primary">Chat</button>
                                        ) : canJoin && team.disqualificationStatus !== 'APPROVED' && (
                                            <button
                                                type="button"
                                                onClick={() => team.type === 'PUBLIC' ? handleJoinPublic(team.id) : setJoinTeam(team)}
                                                className="btn-primary"
                                            >
                                                {team.type === 'PUBLIC' ? 'Request to Join' : 'Enter PIN'}
                                            </button>
                                        )}
                                    </div>
                                    {joinActionStatus.teamId === team.id && (
                                        <p className={`mt-3 text-xs font-bold text-center ${joinActionStatus.type === 'success' ? 'text-green-600' : joinActionStatus.type === 'info' ? 'text-[#0f63c9]' : 'text-red-600'}`}>
                                            {joinActionStatus.message}
                                        </p>
                                    )}
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}

            {selectedTeam && (
                <TeamDetail
                    team={selectedTeam}
                    submissions={submissions}
                    matrices={matrices}
                    onClose={() => setSelectedTeam(null)}
                    onOpenChat={() => openChatForTeam(selectedTeam)}
                    canChat={isMentor || staffRoles.has(role)}
                />
            )}

            {joinTeam && canJoin && !staffRoles.has(role) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4">
                    <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
                        <h3 className="text-lg font-black tracking-wide text-slate-900">Join {joinTeam.name}</h3>
                        <p className="mt-2 text-sm text-slate-600">Private teams require a 4-digit PIN code provided by the Team Leader.</p>
                        <form onSubmit={handleJoinPrivate} className="mt-5 space-y-4">
                            <input 
                                required 
                                className="input-custom" 
                                inputMode="numeric"
                                maxLength={4}
                                value={joinPassword} 
                                onChange={(e) => { 
                                    setJoinPassword(e.target.value.replace(/\D/g, '')); 
                                    setJoinError(''); 
                                }} 
                                placeholder="Team PIN (4 digits)" 
                            />
                            {joinError && <p className="mt-2 text-sm font-semibold text-red-600">{joinError}</p>}
                            <div className="flex gap-3">
                                <button type="button" onClick={() => { setJoinTeam(null); setJoinPassword(''); setJoinError(''); }} className="btn-secondary flex-1">Cancel</button>
                                <button type="submit" className="btn-primary flex-1">Confirm</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {alertModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
                    <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl border border-red-200">
                        <h3 className="text-lg font-black uppercase tracking-[0.08em] text-red-600">{alertModal.title}</h3>
                        <p className="mt-4 text-sm text-slate-600 leading-relaxed">{alertModal.message}</p>
                        <div className="mt-6 flex gap-3">
                            <button 
                                type="button" 
                                onClick={() => setAlertModal({ isOpen: false, title: '', message: '' })} 
                                className="btn-primary flex-1"
                            >
                                OK
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {chatTeam && <MentorChatModal team={chatTeam} onClose={() => setChatTeam(null)} />}
        </div>
    );
}

function MentorChatModal({ team, onClose }) {
    const [messages, setMessages] = useState([]);
    const [content, setContent] = useState('');
    const [error, setError] = useState('');
    const messagesContainerRef = useRef(null);

    const fetchMessages = useCallback(async () => {
        try {
            const response = await axiosClient.get(`/chat/teams/${team.id}`);
            setMessages(response.result || []);
        } catch (err) {
            setError(err.message || 'Failed to load chat history.');
        }
    }, [team.id]);

    useEffect(() => {
        fetchMessages();
    }, [fetchMessages]);

    useEffect(() => {
        const intervalId = window.setInterval(() => {
            fetchMessages().catch(() => {});
        }, 2500);
        return () => window.clearInterval(intervalId);
    }, [fetchMessages]);

    useEffect(() => {
        if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
    }, [messages]);

    useEffect(() => {
        if (team.id && messages.length > 0) {
            const lastMsg = messages[messages.length - 1];
            localStorage.setItem(`lastReadChat_${team.id}`, String(lastMsg.id));
            window.dispatchEvent(new Event('chatRead'));
        }
    }, [team.id, messages]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!content.trim()) return;
        try {
            const response = await axiosClient.post(`/chat/teams/${team.id}`, { teamId: team.id, content });
            setContent('');
            if (response.result) {
                setMessages((current) => [...current, response.result]);
            } else {
                await fetchMessages();
            }
        } catch (err) {
            setError(err.message || 'Failed to send message.');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
            <div className="flex max-h-[88vh] w-full max-w-3xl flex-col rounded-lg bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-blue-100 p-5">
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-[#0f63c9]">Team Chat</p>
                        <h3 className="mt-1 text-lg font-black text-slate-900">{team.name}</h3>
                    </div>
                    <button type="button" onClick={onClose} className="btn-secondary">Close</button>
                </div>
                {error && <div className="m-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">{error}</div>}
                <div ref={messagesContainerRef} className="flex-1 space-y-3 overflow-y-auto p-5">
                    {messages.length === 0 ? (
                        <p className="text-center text-sm text-slate-500">No messages yet.</p>
                    ) : messages.map((message) => (
                        <div key={message.id} className="rounded-lg border border-blue-100 bg-blue-50 p-4">
                            <div className="flex items-center justify-between gap-3">
                                <p className="font-black text-slate-900">{message.senderName || message.senderEmail}</p>
                                <p className="text-xs text-slate-500">{message.createdAt ? new Date(message.createdAt).toLocaleString('en-US') : ''}</p>
                            </div>
                            <p className="mt-2 text-sm leading-6 text-slate-700">{message.content}</p>
                        </div>
                    ))}
                </div>
                <form onSubmit={handleSubmit} className="flex gap-3 border-t border-blue-100 p-4">
                    <input className="input-custom" value={content} onChange={(e) => setContent(e.target.value)} placeholder="Type message to team..." />
                    <button type="submit" className="btn-primary">Send</button>
                </form>
            </div>
        </div>
    );
}
