import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axiosClient from '../api/axiosClient';

export default function TeamChat({ embedded = false }) {
    const storedRole = localStorage.getItem('role');
    const role = ['MENTOR', 'JUDGE'].includes(storedRole) ? 'STAFF' : storedRole;
    const email = localStorage.getItem('email');
    const [teams, setTeams] = useState([]);
    const [events, setEvents] = useState([]);
    const [selectedTeamId, setSelectedTeamId] = useState('');
    const [messages, setMessages] = useState([]);
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const messagesEndRef = useRef(null);
    const isMentor = role === 'STAFF' || role === 'MENTOR';

    const assignedTrackIds = useMemo(() => {
        if (!isMentor) return new Set();
        return new Set(
            events
                .flatMap((event) => event.matrices || [])
                .filter((matrix) => (matrix.mentors || []).some((mentor) => mentor.email === email))
                .map((matrix) => String(matrix.trackId))
        );
    }, [email, events, isMentor]);

    const visibleTeams = useMemo(() => {
        if (!isMentor) return teams;
        return teams.filter((team) => assignedTrackIds.has(String(team.trackId)));
    }, [assignedTrackIds, isMentor, teams]);

    const selectedTeam = visibleTeams.find((team) => String(team.id) === String(selectedTeamId));

    const fetchMessages = useCallback(async (teamId, { silent = false } = {}) => {
        if (!teamId) return;
        if (silent) setRefreshing(true);
        try {
            const response = await axiosClient.get(`/chat/teams/${teamId}`);
            setMessages(response.result || []);
        } finally {
            if (silent) setRefreshing(false);
        }
    }, []);

    const bootstrap = async () => {
        try {
            setLoading(true);
            if (isMentor) {
                const [teamRes, eventRes] = await Promise.all([
                    axiosClient.get('/teams'),
                    axiosClient.get('/events'),
                ]);
                const allTeams = teamRes.result || [];
                const allEvents = eventRes.result || [];
                setTeams(allTeams);
                setEvents(allEvents);

                const trackIds = new Set(
                    allEvents
                        .flatMap((event) => event.matrices || [])
                        .filter((matrix) => (matrix.mentors || []).some((mentor) => mentor.email === email))
                        .map((matrix) => String(matrix.trackId))
                );
                const firstTeam = allTeams.find((team) => trackIds.has(String(team.trackId)));
                setSelectedTeamId(firstTeam?.id || '');
                if (firstTeam?.id) await fetchMessages(firstTeam.id);
            } else {
                const teamRes = await axiosClient.get('/teams/my-team');
                const team = teamRes.result;
                setTeams(team ? [team] : []);
                setSelectedTeamId(team?.id || '');
                if (team?.id) await fetchMessages(team.id);
            }
            setError('');
        } catch (err) {
            setError(err.message || 'Không thể tải chat.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        bootstrap();
    }, []);

    useEffect(() => {
        if (!selectedTeamId) return undefined;
        const intervalId = window.setInterval(() => {
            fetchMessages(selectedTeamId, { silent: true }).catch(() => {});
        }, 2500);
        return () => window.clearInterval(intervalId);
    }, [fetchMessages, selectedTeamId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, [messages]);

    const handleSelectTeam = async (teamId) => {
        setSelectedTeamId(teamId);
        if (teamId) await fetchMessages(teamId);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedTeamId || !content.trim()) return;
        try {
            const response = await axiosClient.post(`/chat/teams/${selectedTeamId}`, { teamId: Number(selectedTeamId), content });
            setContent('');
            if (response.result) {
                setMessages((current) => [...current, response.result]);
            } else {
                await fetchMessages(selectedTeamId);
            }
        } catch (err) {
            setError(err.message || 'Không thể gửi tin nhắn.');
        }
    };

    if (loading) {
        return <div className="rounded-lg border border-blue-100 bg-white p-8 text-center text-slate-500">Đang tải chat...</div>;
    }

    if (!selectedTeamId) {
        return (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-amber-900">
                {isMentor ? 'Mentor chưa được phân công đội nào để trao đổi.' : 'Bạn cần có đội trước khi chat.'}
            </div>
        );
    }

    return (
        <div className={embedded && !isMentor ? 'team-chat team-chat--embedded' : 'team-chat mx-auto grid max-w-7xl gap-6 lg:grid-cols-[320px_1fr]'}>
            {(!embedded || isMentor) && <aside className="rounded-lg border border-blue-100 bg-white shadow-sm">
                <div className="border-b border-blue-100 p-5">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-[#0f63c9]">Team chat</p>
                    <h2 className="mt-1 text-lg font-black text-slate-900">Đội trao đổi</h2>
                </div>
                <div className="divide-y divide-blue-50">
                    {visibleTeams.map((team) => (
                        <button
                            key={team.id}
                            type="button"
                            onClick={() => handleSelectTeam(team.id)}
                            className={`block w-full p-4 text-left hover:bg-blue-50 ${String(selectedTeamId) === String(team.id) ? 'bg-blue-50' : ''}`}
                        >
                            <p className="font-black text-slate-900">{team.name}</p>
                            <p className="mt-1 text-sm text-slate-500">{team.trackName}</p>
                        </button>
                    ))}
                </div>
            </aside>}

            <section className={`flex flex-col rounded-lg border border-blue-100 bg-white shadow-sm ${embedded ? 'min-h-[360px]' : 'min-h-[680px]'}`}>
                <div className="team-chat__header relative border-b border-blue-100 bg-blue-50 px-6 py-4 sm:pr-36">
                    <span className="mt-3 inline-flex w-fit items-center rounded-full border border-green-100 bg-green-50 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-green-700 sm:absolute sm:right-6 sm:top-5 sm:mt-0">
                        {refreshing ? 'Đang đồng bộ' : 'Realtime'}
                    </span>
                    <h2 className="text-xl font-black text-slate-900">{selectedTeam?.name || 'Đội thi'}</h2>
                    <p className="mt-1 text-sm text-slate-600">Trao đổi trực tiếp giữa mentor và đội thi.</p>
                </div>
                {error && <div className="m-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}
                <div className="team-chat__messages flex-1 space-y-4 overflow-y-auto p-6">
                    {messages.length === 0 ? (
                        <p className="text-center text-sm text-slate-500">Chưa có tin nhắn.</p>
                    ) : messages.map((message) => {
                        const isMine = message.senderEmail === email;
                        return (
                        <div key={message.id} className={`rounded-lg border p-4 ${isMine ? 'ml-auto max-w-[82%] border-blue-200 bg-blue-50' : 'max-w-[82%] border-blue-100 bg-[#f8fbff]'}`}>
                            <div className="mb-2 flex items-center justify-between gap-4">
                                <p className="font-bold text-slate-900">{isMine ? 'Bạn' : (message.senderName || message.senderEmail)}</p>
                                <p className="text-xs text-slate-400">{message.createdAt ? new Date(message.createdAt).toLocaleString('vi-VN') : ''}</p>
                            </div>
                            <p className="text-sm leading-6 text-slate-700">{message.content}</p>
                        </div>
                    );
                    })}
                    <div ref={messagesEndRef} />
                </div>
                <form onSubmit={handleSubmit} className="team-chat__composer flex gap-3 border-t border-blue-100 p-4">
                    <input className="input-custom" value={content} onChange={(e) => setContent(e.target.value)} placeholder="Nhập tin nhắn..." />
                    <button type="submit" className="btn-primary">Gửi</button>
                </form>
            </section>
        </div>
    );
}
