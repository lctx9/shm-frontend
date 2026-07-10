import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { formatDateTime, getCountdownParts, getEventPhase } from '../utils/hackathon';
import TeamChat from './TeamChat';

export default function MyTeam() {
    const [searchParams] = useSearchParams();
    const preselectedEventId = searchParams.get('eventId');
    const role = localStorage.getItem('role');
    const isLeader = role === 'LEADER';

    const [team, setTeam] = useState(null);
    const [events, setEvents] = useState([]);
    const [teams, setTeams] = useState([]);
    const [matrices, setMatrices] = useState([]);
    const [joinRequests, setJoinRequests] = useState([]);
    const [submission, setSubmission] = useState(null);
    const [mode, setMode] = useState('CREATE');
    const [teamFilter, setTeamFilter] = useState('ALL');
    const [showActions, setShowActions] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [joinPassword, setJoinPassword] = useState('');
    const [privateTeam, setPrivateTeam] = useState(null);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [savingSubmission, setSavingSubmission] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        type: 'PUBLIC',
        joinPassword: '',
        eventId: '',
        trackId: '',
        fileUrl: '',
        matrixId: '',
    });

    const fetchData = async () => {
        try {
            setLoading(true);
            const [teamRes, eventsRes, teamsRes] = await Promise.allSettled([
                axiosClient.get('/teams/my-team'),
                axiosClient.get('/events'),
                axiosClient.get('/teams'),
            ]);

            const loadedTeam = teamRes.status === 'fulfilled' ? teamRes.value.result : null;
            const loadedEvents = eventsRes.status === 'fulfilled' ? eventsRes.value.result || [] : [];
            setTeam(loadedTeam);
            setEvents(loadedEvents);
            setTeams(teamsRes.status === 'fulfilled' ? teamsRes.value.result || [] : []);

            const firstEvent = loadedEvents.find((item) => String(item.id) === String(preselectedEventId)) || loadedEvents[0];
            setFormData((current) => ({
                ...current,
                eventId: loadedTeam?.eventId || firstEvent?.id || '',
                trackId: loadedTeam?.trackId || firstEvent?.tracks?.[0]?.id || '',
            }));

            if (loadedTeam?.eventId) {
                const [matrixRes, submissionRes, requestRes] = await Promise.allSettled([
                    axiosClient.get(`/events/${loadedTeam.eventId}/matrices`),
                    axiosClient.get('/submissions/my-submission'),
                    localStorage.getItem('role') === 'LEADER'
                        ? axiosClient.get(`/teams/${loadedTeam.id}/join-requests`)
                        : Promise.resolve({ result: [] }),
                ]);
                const teamMatrices = matrixRes.status === 'fulfilled'
                    ? (matrixRes.value.result || []).filter((matrix) => String(matrix.trackId) === String(loadedTeam.trackId))
                    : [];
                setMatrices(teamMatrices);
                const loadedSubmission = submissionRes.status === 'fulfilled' ? submissionRes.value.result : null;
                setSubmission(loadedSubmission);
                setJoinRequests(requestRes.status === 'fulfilled' ? requestRes.value.result || [] : []);
                setFormData((current) => ({
                    ...current,
                    matrixId: loadedSubmission?.matrixId || teamMatrices[0]?.id || '',
                    fileUrl: loadedSubmission?.fileUrl || '',
                }));
            }
        } catch (err) {
            setMessage({ text: err.message || 'Không thể tải dữ liệu đội thi.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [preselectedEventId]);

    const selectedEvent = useMemo(() => events.find((event) => String(event.id) === String(formData.eventId)), [events, formData.eventId]);
    const currentEvent = useMemo(() => events.find((event) => String(event.id) === String(team?.eventId)), [events, team]);
    const selectedMatrix = useMemo(() => matrices.find((matrix) => String(matrix.id) === String(formData.matrixId)), [matrices, formData.matrixId]);
    const eventPhase = currentEvent ? getEventPhase(currentEvent) : null;
    const startCountdown = getCountdownParts(currentEvent?.eventStartDate);

    const filteredTeams = useMemo(() => {
        return teams.filter((item) => {
            if (teamFilter === 'ALL') return true;
            return String(item.trackId) === String(teamFilter);
        });
    }, [teams, teamFilter]);

    const handleEventChange = (eventId) => {
        const nextEvent = events.find((event) => String(event.id) === String(eventId));
        setFormData((current) => ({ ...current, eventId, trackId: nextEvent?.tracks?.[0]?.id || '' }));
    };

    const handleCreateTeam = async (e) => {
        e.preventDefault();
        if (formData.type === 'PRIVATE' && !/^\d{4}$/.test(formData.joinPassword)) {
            setMessage({ text: 'Mã PIN đội private phải gồm đúng 4 số.', type: 'error' });
            return;
        }
        try {
            setCreating(true);
            const response = await axiosClient.post('/teams/create', {
                name: formData.name,
                description: formData.description,
                type: formData.type,
                joinPassword: formData.type === 'PRIVATE' ? formData.joinPassword : '',
                eventId: Number(formData.eventId),
                trackId: Number(formData.trackId),
            });
            localStorage.setItem('role', 'LEADER');
            setTeam(response.result);
            setMessage({ text: 'Tạo đội thành công.', type: 'success' });
            await fetchData();
        } catch (err) {
            setMessage({ text: err.message || 'Không thể tạo đội thi.', type: 'error' });
        } finally {
            setCreating(false);
        }
    };

    const handleJoin = async (targetTeam) => {
        try {
            if (targetTeam.type === 'PRIVATE') {
                setPrivateTeam(targetTeam);
                return;
            }
            await axiosClient.post(`/teams/${targetTeam.id}/join-request`);
            setMessage({ text: 'Đã gửi yêu cầu tham gia đội public.', type: 'success' });
            await fetchData();
        } catch (err) {
            setMessage({ text: err.message || 'Không thể tham gia đội.', type: 'error' });
        }
    };

    const handlePrivateJoin = async (e) => {
        e.preventDefault();
        try {
            await axiosClient.post(`/teams/${privateTeam.id}/join-private`, { password: joinPassword });
            setPrivateTeam(null);
            setJoinPassword('');
            await fetchData();
        } catch (err) {
            setMessage({ text: err.message || 'Mã PIN không đúng hoặc không thể tham gia đội.', type: 'error' });
        }
    };

    const handleInvite = async (e) => {
        e.preventDefault();
        const response = await axiosClient.post(`/teams/${team.id}/invite`, { email: inviteEmail });
        setTeam(response.result);
        setInviteEmail('');
    };

    const handleTransfer = async (memberId) => {
        const response = await axiosClient.put(`/teams/${team.id}/leader/${memberId}`);
        localStorage.setItem('role', 'MEMBER');
        setTeam(response.result);
    };

    const handleKick = async (memberId) => {
        await axiosClient.delete(`/teams/${team.id}/members/${memberId}`);
        await fetchData();
    };

    const handleApproveRequest = async (requestId) => {
        const response = await axiosClient.post(`/teams/${team.id}/join-requests/${requestId}/approve`);
        setTeam(response.result);
        setJoinRequests((current) => current.filter((request) => request.id !== requestId));
    };

    const handleRejectRequest = async (requestId) => {
        await axiosClient.post(`/teams/${team.id}/join-requests/${requestId}/reject`);
        setJoinRequests((current) => current.filter((request) => request.id !== requestId));
    };

    const handleSubmission = async (e) => {
        e.preventDefault();
        if (!isLeader) {
            setMessage({ text: 'Chỉ Team Leader được nộp hoặc cập nhật bài.', type: 'error' });
            return;
        }
        try {
            setSavingSubmission(true);
            const payload = { teamId: team.id, matrixId: Number(formData.matrixId), fileUrl: formData.fileUrl };
            const response = submission
                ? await axiosClient.put(`/submissions/${submission.id}`, payload)
                : await axiosClient.post('/submissions', payload);
            setSubmission(response.result);
            setMessage({ text: 'Lưu bài nộp thành công.', type: 'success' });
        } catch (err) {
            setMessage({ text: err.message || 'Không thể lưu bài nộp.', type: 'error' });
        } finally {
            setSavingSubmission(false);
        }
    };

    if (loading) {
        return <main className="section-shell"><div className="rounded-lg bg-white p-8 text-center text-[#5c6d83]">Đang tải dữ liệu đội thi...</div></main>;
    }

    return (
        <main className="section-shell">
            {message.text && (
                <div className={`mb-6 rounded-lg border p-4 text-sm font-semibold ${message.type === 'success' ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
                    {message.text}
                </div>
            )}

            {!team ? (
                <div className="space-y-6">
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.22em] text-[#0f63c9]">Đội của tôi</p>
                        <h1 className="section-title">Đăng ký giải đấu</h1>
                        <p className="section-copy">Bạn chưa tham gia đội nào. Hãy tạo đội mới hoặc tìm một đội phù hợp trong lobby.</p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <button type="button" onClick={() => setMode('FIND')} className={mode === 'FIND' ? 'btn-primary' : 'btn-secondary'}>Tìm đội</button>
                        <button type="button" onClick={() => setMode('CREATE')} className={mode === 'CREATE' ? 'btn-primary' : 'btn-secondary'}>Tạo đội</button>
                    </div>

                    {mode === 'FIND' ? (
                        <section className="rounded-lg border border-[#d7e6f8] bg-white p-6">
                            <div className="mb-5">
                                <label className="mb-1 block text-sm font-bold text-[#0b1f3f]">Lọc theo hạng mục</label>
                                <select className="input-custom max-w-md" value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)}>
                                    <option value="ALL">Tất cả hạng mục</option>
                                    {events.flatMap((event) => event.tracks || []).map((track) => <option key={track.id} value={track.id}>{track.name}</option>)}
                                </select>
                            </div>
                            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                                {filteredTeams.map((item) => (
                                    <article key={item.id} className="feature-card">
                                        <h3 className="text-lg font-black uppercase tracking-[0.06em] text-[#071936]">{item.name}</h3>
                                        <p className="mt-2 text-sm text-[#5c6d83]">{item.description || 'Đội chưa thêm mô tả.'}</p>
                                        <p className="mt-4 text-sm font-bold text-[#0f63c9]">{item.trackName || 'Chưa chọn hạng mục'}</p>
                                        <button type="button" onClick={() => handleJoin(item)} className="btn-primary mt-5 w-full">
                                            {item.type === 'PRIVATE' ? 'Nhập mã PIN' : 'Gửi request'}
                                        </button>
                                    </article>
                                ))}
                            </div>
                        </section>
                    ) : (
                        <section className="rounded-lg border border-[#d7e6f8] bg-white p-6">
                            {events.length === 0 ? (
                                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
                                    Chưa có giải đấu trong database. Coordinator cần tạo giải trước.
                                </div>
                            ) : (
                                <form onSubmit={handleCreateTeam} className="space-y-5">
                                    <div className="grid gap-5 md:grid-cols-2">
                                        <div>
                                            <label className="mb-1 block text-sm font-bold text-[#0b1f3f]">Tên team</label>
                                            <input required className="input-custom" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-sm font-bold text-[#0b1f3f]">Giải đấu</label>
                                            <select required className="input-custom" value={formData.eventId} onChange={(e) => handleEventChange(e.target.value)}>
                                                {events.map((event) => <option key={event.id} value={event.id}>{event.name} - {event.year}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-sm font-bold text-[#0b1f3f]">Mô tả</label>
                                        <textarea className="input-custom min-h-28" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                                    </div>
                                    <div className="grid gap-5 md:grid-cols-2">
                                        <div>
                                            <label className="mb-1 block text-sm font-bold text-[#0b1f3f]">Hạng mục</label>
                                            <select required className="input-custom" value={formData.trackId} onChange={(e) => setFormData({ ...formData, trackId: e.target.value })}>
                                                {(selectedEvent?.tracks || []).map((track) => <option key={track.id} value={track.id}>{track.name}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-sm font-bold text-[#0b1f3f]">Chế độ</label>
                                            <select className="input-custom" value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}>
                                                <option value="PUBLIC">Public</option>
                                                <option value="PRIVATE">Private</option>
                                            </select>
                                        </div>
                                    </div>
                                    {formData.type === 'PRIVATE' && (
                                        <div>
                                            <label className="mb-1 block text-sm font-bold text-[#0b1f3f]">Mã PIN 4 số</label>
                                            <input className="input-custom max-w-xs" inputMode="numeric" maxLength={4} value={formData.joinPassword} onChange={(e) => setFormData({ ...formData, joinPassword: e.target.value.replace(/\D/g, '') })} />
                                        </div>
                                    )}
                                    <button type="submit" disabled={creating} className="btn-primary w-full">{creating ? 'Đang tạo...' : 'Tạo đội'}</button>
                                </form>
                            )}
                        </section>
                    )}
                </div>
            ) : (
                <div className="space-y-6">
                    <section className="rounded-lg border border-[#d7e6f8] bg-white p-6">
                        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                            <div>
                                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0f63c9]">{team.eventName || 'Chưa gắn giải đấu'}</p>
                                <h1 className="mt-2 text-3xl font-black uppercase tracking-[0.06em] text-[#071936]">{team.name}</h1>
                                <p className="mt-2 text-sm leading-7 text-[#5c6d83]">{team.description || 'Đội chưa thêm mô tả.'}</p>
                                <p className="mt-3 text-sm font-bold text-[#0f63c9]">{team.trackName}</p>
                            </div>
                            <span className="badge-status-pill">{team.type}</span>
                        </div>
                        {startCountdown && eventPhase?.key !== 'running' && (
                            <div className="mt-6 grid gap-3 sm:grid-cols-3">
                                {startCountdown.map((item) => (
                                    <div key={item.label} className="rounded-lg border border-[#d7e6f8] bg-[#f8fbff] p-4 text-center">
                                        <p className="text-3xl font-black text-[#071936]">{item.value}</p>
                                        <p className="text-xs font-black uppercase text-[#5c6d83]">{item.label} đến khi bắt đầu</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    <section className="team-workspace">
                        <div className="team-mentor-chat">
                            <div className="team-mentor-chat__intro">
                                <div>
                                    <p>Trao đổi cùng mentor</p>
                                    <h2>Chat mentor</h2>
                                    <span>Hỏi nhanh và nhận góp ý từ mentor.</span>
                                </div>
                                <strong>Realtime</strong>
                            </div>
                            <TeamChat embedded />
                        </div>
                        <div className="team-submission-panel rounded-lg border border-[#d7e6f8] bg-white p-6">
                            <h2 className="text-lg font-black uppercase tracking-[0.08em] text-[#071936]">Đề thi và nộp bài</h2>
                            {matrices.length === 0 ? (
                                <p className="mt-4 text-sm text-[#5c6d83]">Coordinator chưa thêm đề thi/guideline cho hạng mục này.</p>
                            ) : (
                                <form onSubmit={handleSubmission} className="mt-5 space-y-5">
                                    <div>
                                        <label className="mb-1 block text-sm font-bold text-[#0b1f3f]">Vòng thi</label>
                                        <select className="input-custom" value={formData.matrixId} onChange={(e) => setFormData({ ...formData, matrixId: e.target.value })} disabled={!isLeader}>
                                            {matrices.map((matrix) => <option key={matrix.id} value={matrix.id}>{matrix.roundName} - {matrix.trackName}</option>)}
                                        </select>
                                    </div>
                                    {selectedMatrix?.guidelineUrl && <a href={selectedMatrix.guidelineUrl} target="_blank" rel="noreferrer" className="btn-secondary">Tải đề thi / quy chế</a>}
                                    <p className="text-sm font-semibold text-[#5c6d83]">Deadline: {formatDateTime(selectedMatrix?.submissionDeadline)}</p>
                                    <input required type="url" className="input-custom" placeholder="Link GitHub, Drive hoặc demo" value={formData.fileUrl} disabled={!isLeader} onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })} />
                                    <button type="submit" disabled={savingSubmission || !isLeader} className="btn-primary w-full">
                                        {!isLeader ? 'Chỉ leader được nộp bài' : savingSubmission ? 'Đang lưu...' : submission ? 'Cập nhật bài nộp' : 'Nộp bài'}
                                    </button>
                                </form>
                            )}
                        </div>

                        <div className="team-members-panel rounded-lg border border-[#d7e6f8] bg-white p-6">
                            <div className="flex items-center justify-between gap-3">
                                <h2 className="text-lg font-black uppercase tracking-[0.08em] text-[#071936]">Thành viên</h2>
                                {isLeader && <button type="button" onClick={() => setShowActions((value) => !value)} className="btn-secondary">Thao tác</button>}
                            </div>
                            <div className="mt-5 divide-y divide-[#d7e6f8]">
                                {(team.members || []).map((member) => (
                                    <div key={member.id} className="py-4">
                                        <div className="flex items-center justify-between gap-3">
                                            <div>
                                                <Link to={`/profile?userId=${member.userId}`} className="font-black text-[#071936]">{member.fullName || member.email}</Link>
                                                <p className="text-sm text-[#5c6d83]">{member.email}</p>
                                            </div>
                                            <span className="rounded-full bg-[#f8fbff] px-3 py-1 text-xs font-black text-[#0f63c9]">{member.role}</span>
                                        </div>
                                        {showActions && isLeader && member.role !== 'LEADER' && (
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                <button type="button" onClick={() => handleTransfer(member.id)} className="btn-secondary">Chuyển leader</button>
                                                <button type="button" onClick={() => handleKick(member.id)} className="btn-secondary">Kick</button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                            {showActions && isLeader && (
                                <div className="mt-5 space-y-5">
                                    <div>
                                        <h3 className="mb-3 text-sm font-black uppercase tracking-[0.08em] text-[#071936]">Yêu cầu tham gia</h3>
                                        <div className="space-y-3">
                                            {joinRequests.length ? joinRequests.map((request) => (
                                                <div key={request.id} className="rounded-lg border border-[#d7e6f8] bg-[#f8fbff] p-3">
                                                    <p className="font-bold text-[#071936]">{request.fullName || request.email}</p>
                                                    <p className="text-sm text-[#5c6d83]">{request.email}</p>
                                                    <div className="mt-3 flex gap-2">
                                                        <button type="button" onClick={() => handleApproveRequest(request.id)} className="btn-primary">Duyệt</button>
                                                        <button type="button" onClick={() => handleRejectRequest(request.id)} className="btn-secondary">Từ chối</button>
                                                    </div>
                                                </div>
                                            )) : <p className="text-sm text-[#5c6d83]">Chưa có yêu cầu tham gia nào.</p>}
                                        </div>
                                    </div>

                                    <form onSubmit={handleInvite} className="flex gap-2">
                                        <input required type="email" className="input-custom" placeholder="Email thành viên" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
                                        <button type="submit" className="btn-primary">Mời</button>
                                    </form>
                                </div>
                            )}
                        </div>
                    </section>
                    <Link to="/teams" className="btn-secondary">Xem lobby đội</Link>
                </div>
            )}

            {privateTeam && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
                    <form onSubmit={handlePrivateJoin} className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
                        <h3 className="text-lg font-black uppercase tracking-[0.08em] text-[#071936]">Nhập mã PIN của {privateTeam.name}</h3>
                        <input required className="input-custom mt-5" inputMode="numeric" maxLength={4} value={joinPassword} onChange={(e) => setJoinPassword(e.target.value.replace(/\D/g, ''))} />
                        <div className="mt-5 flex gap-3">
                            <button type="button" onClick={() => setPrivateTeam(null)} className="btn-secondary flex-1">Hủy</button>
                            <button type="submit" className="btn-primary flex-1">Vào đội</button>
                        </div>
                    </form>
                </div>
            )}
        </main>
    );
}
