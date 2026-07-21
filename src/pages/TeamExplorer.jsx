import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axiosClient from '../api/axiosClient';

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
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0f63c9]">Chi tiết đội thi</p>
                        <h3 className="mt-1 text-2xl font-black text-slate-900">{team.name}</h3>
                        <p className="mt-1 text-sm text-slate-500">{team.eventName} · {team.trackName}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {canChat && <button type="button" onClick={onOpenChat} className="btn-primary">Trao đổi</button>}
                        <button type="button" onClick={onClose} className="btn-secondary">Đóng</button>
                    </div>
                </div>

                <div className="grid gap-6 p-6 lg:grid-cols-[0.9fr_1.1fr]">
                    <section className="space-y-5">
                        <div className="rounded-lg border border-blue-100 bg-blue-50 p-5">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-xs font-black uppercase tracking-[0.16em] text-[#0f63c9]">Tiến độ</p>
                                    <p className="mt-1 text-3xl font-black text-slate-900">{progress}%</p>
                                </div>
                                <Pill tone={progress === 100 ? 'green' : 'amber'}>{completedRounds}/{requiredMatrices.length || 0} vòng đã nộp</Pill>
                            </div>
                            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white">
                                <div className="h-full rounded-full bg-[#0f63c9]" style={{ width: `${progress}%` }} />
                            </div>
                            <p className="mt-4 text-sm leading-6 text-slate-600">{team.description || 'Đội chưa cập nhật mô tả.'}</p>
                        </div>

                        <div className="rounded-lg border border-blue-100 bg-white p-5">
                            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Thành viên</p>
                            <div className="mt-4 space-y-3">
                                {(team.members || []).map((member) => (
                                    <div key={member.id} className="rounded-lg border border-blue-50 bg-slate-50 p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="font-black text-slate-900">{member.fullName}</p>
                                                <p className="mt-1 text-sm text-slate-500">{member.email}</p>
                                                <p className="mt-1 text-sm text-slate-500">MSSV: {member.studentId || 'Chưa có'}</p>
                                            </div>
                                            <Pill tone={member.role === 'LEADER' ? 'blue' : 'slate'}>{member.role}</Pill>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    <section className="rounded-lg border border-blue-100 bg-white">
                        <div className="border-b border-blue-100 p-5">
                            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Bài nộp theo vòng</p>
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
                                                    Deadline: {matrix.submissionDeadline ? new Date(matrix.submissionDeadline).toLocaleString('vi-VN') : 'Chưa đặt'}
                                                </p>
                                            </div>
                                            <Pill tone={submission ? (submission.graded ? 'green' : 'amber') : 'slate'}>
                                                {submission ? (submission.graded ? `Đã chấm ${submission.score}/100` : 'Đã nộp, chờ chấm') : 'Chưa nộp'}
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
                            {requiredMatrices.length === 0 && <p className="p-5 text-sm text-slate-500">Chưa có vòng thi cho track này.</p>}
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
            setError(err.message || 'Không thể tải dữ liệu đội thi.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const matrices = useMemo(() => events.flatMap((event) => event.matrices || []), [events]);

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
            const eventMatched = eventFilter === 'ALL' || String(team.eventId) === String(eventFilter);
            const mentorMatched = !isMentor || assignedTrackIds.has(String(team.trackId));
            const isMember = (team.members || []).some((member) => String(member.userId) === String(userId));
            
            if (canJoin && isMember) {
                return false;
            }
            
            return eventMatched && mentorMatched;
        });
    }, [assignedTrackIds, eventFilter, isMentor, teams, userId, canJoin]);

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
        setJoinActionStatus({ teamId, message: 'Đang gửi yêu cầu...', type: 'info' });
        try {
            await axiosClient.post(`/teams/${teamId}/join-request`);
            await fetchData();
            setJoinActionStatus({ teamId, message: 'Đã gửi yêu cầu gia nhập đội. Vui lòng chờ Leader duyệt.', type: 'success' });
        } catch (err) {
            setJoinActionStatus({ teamId, message: err.message || 'Không thể gia nhập đội.', type: 'error' });
        }
    };

    const handleJoinPrivate = async (e) => {
        e.preventDefault();
        if (!joinTeam) return;
        setJoinError('');

        try {
            await axiosClient.post(`/teams/${joinTeam.id}/join-private`, { password: joinPassword });
            setJoinTeam(null);
            setJoinPassword('');
            window.location.href = '/my-team';
        } catch (err) {
            setJoinError(err.message || 'Không thể gia nhập đội riêng tư.');
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
                    <h2 className="text-2xl font-black tracking-tight text-slate-900">{isMentor ? 'Đội đang hướng dẫn' : 'Danh sách đội thi'}</h2>
                    <p className="mt-2 text-sm text-slate-600">
                        {isMentor
                            ? 'Theo dõi đội được phân công, xem bài nộp, tiến độ và trao đổi trực tiếp với từng đội.'
                            : 'Theo dõi các đội trong sự kiện, thành viên, track và trạng thái tham gia.'}
                    </p>
                </div>
                <button type="button" onClick={fetchData} title="Làm mới dữ liệu" className="btn-secondary h-9 w-9 p-0 inline-flex items-center justify-center text-sm font-bold">↻</button>
            </div>

            <section className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border border-blue-100 bg-white p-5">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Đội</p>
                    <p className="mt-2 text-3xl font-black text-slate-900">{stats.teams}</p>
                </div>
                <div className="rounded-lg border border-blue-100 bg-white p-5">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Bài nộp</p>
                    <p className="mt-2 text-3xl font-black text-slate-900">{stats.submissions}</p>
                </div>
                <div className="rounded-lg border border-blue-100 bg-white p-5">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Chờ chấm</p>
                    <p className="mt-2 text-3xl font-black text-slate-900">{stats.pending}</p>
                </div>
            </section>

            <div className="rounded-lg border border-blue-100 bg-white p-4">
                <label className="mb-1 block text-sm font-bold text-slate-700">Lọc theo giải đấu</label>
                <select className="input-custom max-w-md" value={eventFilter} onChange={(e) => setEventFilter(e.target.value)}>
                    <option value="ALL">Tất cả giải đấu</option>
                    {events.map((event) => (
                        <option key={event.id} value={event.id}>{event.name}</option>
                    ))}
                </select>
            </div>

            {error && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}

            {loading ? (
                <div className="rounded-lg bg-white p-8 text-center text-gray-500">Đang tải đội thi...</div>
            ) : filteredTeams.length === 0 ? (
                <div className="rounded-lg border border-blue-100 bg-white p-8 text-center text-gray-500">
                    {isMentor ? 'Mentor chưa được phân công đội nào.' : 'Chưa có đội thi phù hợp.'}
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
                                        <p className="mt-1 text-sm text-slate-500 line-clamp-1" title={team.eventName}>{team.eventName || 'Chưa gắn giải đấu'}</p>
                                    </div>
                                    <Pill>{team.type}</Pill>
                                </div>

                                <p className="mt-4 min-h-12 text-sm leading-6 text-slate-600 line-clamp-3" title={team.description}>{team.description || 'Đội chưa cập nhật mô tả.'}</p>

                                <dl className="mt-5 space-y-2 text-sm text-slate-600">
                                    <div className="flex justify-between gap-4">
                                        <dt className="font-bold text-slate-800">Track</dt>
                                        <dd className="text-right">{team.trackName || 'Chưa cập nhật'}</dd>
                                    </div>
                                    <div className="flex justify-between gap-4">
                                        <dt className="font-bold text-slate-800">Thành viên</dt>
                                        <dd>{team.memberCount || 0}</dd>
                                    </div>
                                    <div className="flex justify-between gap-4">
                                        <dt className="font-bold text-slate-800">Bài nộp</dt>
                                        <dd>{teamSubmissions.length} ({gradedCount} đã chấm)</dd>
                                    </div>
                                </dl>

                                <div className="mt-auto pt-6">
                                    <div className="grid gap-2 sm:grid-cols-2">
                                        <button type="button" onClick={() => setSelectedTeam(team)} className="btn-secondary">Chi tiết</button>
                                        {isMentor || staffRoles.has(role) ? (
                                            <button type="button" onClick={() => openChatForTeam(team)} className="btn-primary">Trao đổi</button>
                                        ) : canJoin && (
                                            <button
                                                type="button"
                                                onClick={() => team.type === 'PUBLIC' ? handleJoinPublic(team.id) : setJoinTeam(team)}
                                                className="btn-primary"
                                            >
                                                {team.type === 'PUBLIC' ? 'Xin gia nhập' : 'Nhập mật khẩu'}
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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
                    <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
                        <h3 className="text-lg font-black tracking-wide text-slate-900">Gia nhập {joinTeam.name}</h3>
                        <p className="mt-2 text-sm text-slate-600">Đội riêng tư yêu cầu mật khẩu do Team Leader cung cấp.</p>
                        <form onSubmit={handleJoinPrivate} className="mt-5 space-y-4">
                            <input required className="input-custom" value={joinPassword} onChange={(e) => { setJoinPassword(e.target.value); setJoinError(''); }} placeholder="Mật khẩu đội" />
                            {joinError && <p className="mt-2 text-sm font-semibold text-red-600">{joinError}</p>}
                            <div className="flex gap-3">
                                <button type="button" onClick={() => { setJoinTeam(null); setJoinPassword(''); setJoinError(''); }} className="btn-secondary flex-1">Hủy</button>
                                <button type="submit" className="btn-primary flex-1">Xác nhận</button>
                            </div>
                        </form>
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
            setError(err.message || 'Không thể tải tin nhắn.');
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
            setError(err.message || 'Không thể gửi tin nhắn.');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
            <div className="flex max-h-[88vh] w-full max-w-3xl flex-col rounded-lg bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-blue-100 p-5">
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-[#0f63c9]">Trao đổi với đội</p>
                        <h3 className="mt-1 text-lg font-black text-slate-900">{team.name}</h3>
                    </div>
                    <button type="button" onClick={onClose} className="btn-secondary">Đóng</button>
                </div>
                {error && <div className="m-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">{error}</div>}
                <div ref={messagesContainerRef} className="flex-1 space-y-3 overflow-y-auto p-5">
                    {messages.length === 0 ? (
                        <p className="text-center text-sm text-slate-500">Chưa có tin nhắn.</p>
                    ) : messages.map((message) => (
                        <div key={message.id} className="rounded-lg border border-blue-100 bg-blue-50 p-4">
                            <div className="flex items-center justify-between gap-3">
                                <p className="font-black text-slate-900">{message.senderName || message.senderEmail}</p>
                                <p className="text-xs text-slate-500">{message.createdAt ? new Date(message.createdAt).toLocaleString('vi-VN') : ''}</p>
                            </div>
                            <p className="mt-2 text-sm leading-6 text-slate-700">{message.content}</p>
                        </div>
                    ))}
                </div>
                <form onSubmit={handleSubmit} className="flex gap-3 border-t border-blue-100 p-4">
                    <input className="input-custom" value={content} onChange={(e) => setContent(e.target.value)} placeholder="Nhập tin nhắn cho đội..." />
                    <button type="submit" className="btn-primary">Gửi</button>
                </form>
            </div>
        </div>
    );
}
