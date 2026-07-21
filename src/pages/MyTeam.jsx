import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { formatDateTime, getCountdownParts, getEventPhase } from '../utils/hackathon';
import TeamChat from './TeamChat';

export default function MyTeam() {
    const [searchParams] = useSearchParams();
    const preselectedEventId = searchParams.get('eventId');
    const currentEmail = localStorage.getItem('email');

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
    const [joinError, setJoinError] = useState('');
    const [message, setMessage] = useState({ text: '', type: '' });
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [savingSubmission, setSavingSubmission] = useState(false);
    const [memberEmails, setMemberEmails] = useState(['', '']);
    const [showPin, setShowPin] = useState(false);
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
    const isLeader = team?.members?.some(
        (member) => member.email === currentEmail && member.role === 'LEADER'
    ) || false;

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

            const activeOrUpcoming = loadedEvents.filter((event) => {
                if (!event.active) return false;
                if (event.eventEndDate) {
                    const endDate = new Date(event.eventEndDate);
                    const now = new Date();
                    if (endDate < now) return false;
                }
                return true;
            });
            const firstEvent = activeOrUpcoming.find((item) => String(item.id) === String(preselectedEventId)) || activeOrUpcoming[0] || loadedEvents[0];
            setFormData((current) => ({
                ...current,
                eventId: loadedTeam?.eventId || firstEvent?.id || '',
                trackId: loadedTeam?.trackId || firstEvent?.tracks?.[0]?.id || '',
            }));

            if (loadedTeam?.eventId) {
                const [matrixRes, submissionRes, requestRes] = await Promise.allSettled([
                    axiosClient.get(`/events/${loadedTeam.eventId}/matrices`),
                    axiosClient.get('/submissions/my-submission'),
                    loadedTeam?.members?.some((member) => member.email === currentEmail && member.role === 'LEADER')
                        ? axiosClient.get(`/teams/${loadedTeam.id}/join-requests`)
                        : Promise.resolve({ result: [] }),
                ]);
                const teamMatrices = matrixRes.status === 'fulfilled'
                    ? (matrixRes.value.result || []).filter((matrix) => matrix.trackId == null || String(matrix.trackId) === String(loadedTeam.trackId))
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
        window.scrollTo(0, 0);
        fetchData();
    }, [preselectedEventId]);

    const activeOrUpcomingEvents = useMemo(() => {
        return events.filter((event) => {
            if (!event.active) return false;
            if (event.eventEndDate) {
                const endDate = new Date(event.eventEndDate);
                const now = new Date();
                if (endDate < now) return false;
            }
            return true;
        });
    }, [events]);

    const selectedEvent = useMemo(() => events.find((event) => String(event.id) === String(formData.eventId)), [events, formData.eventId]);
    const currentEvent = useMemo(() => events.find((event) => String(event.id) === String(team?.eventId)), [events, team]);
    const selectedMatrix = useMemo(() => matrices.find((matrix) => String(matrix.id) === String(formData.matrixId)), [matrices, formData.matrixId]);
    const eventPhase = currentEvent ? getEventPhase(currentEvent) : null;
    const startCountdown = getCountdownParts(currentEvent?.eventStartDate);

    const filteredTeams = useMemo(() => {
        return teams.filter((item) => {
            if (String(item.eventId) !== String(formData.eventId)) return false;
            if (teamFilter === 'ALL') return true;
            return String(item.trackId) === String(teamFilter);
        });
    }, [teams, teamFilter, formData.eventId]);

    const handleEventChange = (eventId) => {
        const nextEvent = events.find((event) => String(event.id) === String(eventId));
        setFormData((current) => ({ ...current, eventId, trackId: nextEvent?.tracks?.[0]?.id || '' }));
    };

    const handleCreateTeam = async (e) => {
        e.preventDefault();
        if (formData.type === 'PRIVATE' && !/^\d{4}$/.test(formData.joinPassword)) {
            alert('Mã PIN đội private phải gồm đúng 4 số.');
            return;
        }
        const nonNullEmails = memberEmails.filter(email => email.trim() !== '');
        if (nonNullEmails.length < 2) {
            alert('Bạn phải điền tối thiểu 2 email của thành viên khác.');
            return;
        }
        if (nonNullEmails.includes(currentEmail)) {
            alert('Bạn không thể tự mời chính mình vào đội.');
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
                memberEmails: nonNullEmails,
            });
            setTeam(response.result);
            alert('Tạo đội thành công!');
            setMessage({ text: 'Tạo đội thành công.', type: 'success' });
            await fetchData();
        } catch (err) {
            alert(err.message || 'Không thể tạo đội thi.');
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
            alert('Đã gửi yêu cầu gia nhập thành công. Đang chờ Leader duyệt.');
            setMessage({ text: 'Đã gửi yêu cầu tham gia đội public.', type: 'success' });
            await fetchData();
        } catch (err) {
            alert(err.message || 'Không thể gửi yêu cầu tham gia đội.');
            setMessage({ text: err.message || 'Không thể tham gia đội.', type: 'error' });
        }
    };

    const handlePrivateJoin = async (e) => {
        e.preventDefault();
        setJoinError('');
        try {
            await axiosClient.post(`/teams/${privateTeam.id}/join-private`, { password: joinPassword });
            alert('Gia nhập đội thành công!');
            setPrivateTeam(null);
            setJoinPassword('');
            await fetchData();
        } catch (err) {
            setJoinError(err.message || 'Mã PIN không đúng hoặc không thể tham gia đội.');
        }
    };

    const handleInvite = async (e) => {
        e.preventDefault();
        try {
            const response = await axiosClient.post(`/teams/${team.id}/invite`, { email: inviteEmail });
            setTeam(response.result);
            setInviteEmail('');
            alert('Mời thành viên thành công!');
        } catch (err) {
            alert(err.message || 'Không thể mời thành viên.');
        }
    };

    const handleTransfer = async (memberId) => {
        if (!window.confirm("Bạn có chắc chắn muốn chuyển quyền Trưởng nhóm cho thành viên này?")) {
            return;
        }
        try {
            const response = await axiosClient.put(`/teams/${team.id}/leader/${memberId}`);
            setTeam(response.result);
            alert('Chuyển quyền Trưởng nhóm thành công!');
        } catch (err) {
            alert(err.message || 'Không thể chuyển quyền Trưởng nhóm.');
        }
    };

    const handleKick = async (memberId) => {
        const memberCount = team?.members?.length || 0;
        let confirmMsg = "Bạn có chắc chắn muốn xóa thành viên này khỏi đội?";
        if (memberCount <= 3) {
            confirmMsg = "Đội hiện tại chỉ có 3 người. Nếu bạn xóa thành viên này, số thành viên sẽ dưới 3 và đội sẽ tự động bị GIẢI TÁN. Bạn có chắc chắn muốn xóa?";
        }
        if (!window.confirm(confirmMsg)) {
            return;
        }
        try {
            await axiosClient.delete(`/teams/${team.id}/members/${memberId}`);
            alert('Xóa thành viên khỏi đội thành công!');
            await fetchData();
        } catch (err) {
            alert(err.message || 'Không thể xóa thành viên.');
        }
    };

    const handleApproveRequest = async (requestId) => {
        try {
            const response = await axiosClient.post(`/teams/${team.id}/join-requests/${requestId}/approve`);
            setTeam(response.result);
            setJoinRequests((current) => current.filter((request) => request.id !== requestId));
            alert('Đã duyệt yêu cầu tham gia!');
        } catch (err) {
            alert(err.message || 'Không thể duyệt yêu cầu.');
        }
    };

    const handleRejectRequest = async (requestId) => {
        try {
            await axiosClient.post(`/teams/${team.id}/join-requests/${requestId}/reject`);
            setJoinRequests((current) => current.filter((request) => request.id !== requestId));
            alert('Đã từ chối yêu cầu tham gia.');
        } catch (err) {
            alert(err.message || 'Không thể từ chối yêu cầu.');
        }
    };

    const handleLeave = async () => {
        const isLeaderOfTeam = team?.members?.some(
            (member) => member.email === currentEmail && member.role === 'LEADER'
        );
        const memberCount = team?.members?.length || 0;

        if (isLeaderOfTeam) {
            alert("Bạn là Trưởng nhóm. Bạn phải chuyển quyền Trưởng nhóm cho thành viên khác trước khi rời đội.");
            return;
        }

        let confirmMsg = "Bạn có chắc chắn muốn rời đội?";
        if (memberCount <= 3) {
            confirmMsg = "Đội của bạn hiện có 3 người. Khi bạn rời đi, số thành viên sẽ dưới 3 và đội sẽ tự động bị GIẢI TÁN. Bạn có chắc chắn muốn rời đội?";
        }

        if (!window.confirm(confirmMsg)) {
            return;
        }

        try {
            await axiosClient.post('/teams/leave');
            alert('Rời khỏi đội thành công!');
            setTeam(null);
            await fetchData();
        } catch (err) {
            alert(err.message || 'Không thể rời đội.');
        }
    };

    const handleSubmission = async (e) => {
        e.preventDefault();
        if (!isLeader) {
            alert('Chỉ Team Leader được nộp hoặc cập nhật bài.');
            return;
        }
        try {
            setSavingSubmission(true);
            const payload = { teamId: team.id, matrixId: Number(formData.matrixId), fileUrl: formData.fileUrl };
            const response = submission
                ? await axiosClient.put(`/submissions/${submission.id}`, payload)
                : await axiosClient.post('/submissions', payload);
            setSubmission(response.result);
            alert('Lưu bài nộp thành công!');
            setMessage({ text: 'Lưu bài nộp thành công.', type: 'success' });
        } catch (err) {
            alert(err.message || 'Không thể lưu bài nộp.');
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
                        <h1 className="section-title">Đăng ký giải đấu</h1>
                        {selectedEvent && (
                            <div className="mt-2">
                                <p className="text-lg font-bold text-[#0f63c9]">{selectedEvent.name}</p>
                                <Link to={`/events/${selectedEvent.id}`} className="mt-1 inline-block text-sm font-bold text-[#0b1f3f] underline hover:text-[#0f63c9]">
                                    Xem chi tiết sự kiện
                                </Link>
                            </div>
                        )}
                        <p className="section-copy mt-3">Bạn chưa tham gia đội nào. Hãy tạo đội mới hoặc tìm một đội phù hợp trong lobby.</p>
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
                                    {(selectedEvent?.tracks || []).map((track) => (
                                        <option key={track.id} value={track.id}>{track.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                                {filteredTeams.map((item) => (
                                    <article key={item.id} className="feature-card flex flex-col h-full">
                                        <h3 className="text-lg font-black uppercase tracking-[0.06em] text-[#071936] line-clamp-2" title={item.name}>{item.name}</h3>
                                        <p className="mt-2 text-sm text-[#5c6d83] line-clamp-3" title={item.description}>{item.description || 'Đội chưa thêm mô tả.'}</p>
                                        
                                        <div className="mt-auto pt-5">
                                            <p className="text-sm font-bold text-[#0f63c9] line-clamp-1" title={item.trackName}>{item.trackName || 'Chưa chọn hạng mục'}</p>
                                            <button type="button" onClick={() => handleJoin(item)} className="btn-primary mt-4 w-full">
                                                {item.type === 'PRIVATE' ? 'Nhập mã PIN' : 'Gửi request'}
                                            </button>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </section>
                    ) : (
                        <section className="rounded-lg border border-[#d7e6f8] bg-white p-6">
                            {activeOrUpcomingEvents.length === 0 ? (
                                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
                                    Không có giải đấu nào đang hoặc sắp diễn ra để tạo đội thi.
                                </div>
                            ) : (
                                <form onSubmit={handleCreateTeam} className="space-y-5">
                                    <div className="grid gap-5 md:grid-cols-2">
                                        <div>
                                            <label className="mb-1 block text-sm font-bold text-[#0b1f3f]">Tên team</label>
                                            <input required className="input-custom" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} disabled={selectedEvent && getEventPhase(selectedEvent).key !== 'registration'} />
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-sm font-bold text-[#0b1f3f]">Giải đấu</label>
                                            <select required className="input-custom" value={formData.eventId} onChange={(e) => handleEventChange(e.target.value)}>
                                                {activeOrUpcomingEvents.map((event) => <option key={event.id} value={event.id}>{event.name}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    {selectedEvent && getEventPhase(selectedEvent).key !== 'registration' ? (
                                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
                                            Sự kiện này đã đóng cổng đăng ký đội. Bạn chỉ có thể xem lobby các đội đã tham gia.
                                        </div>
                                    ) : (
                                        <>
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

                                            <div>
                                                <label className="mb-2 block text-sm font-bold text-[#0b1f3f]">
                                                    Mời thành viên khác (Tối thiểu 2 người, tối tối đa 4)
                                                </label>
                                                <p className="text-xs text-[#5c6d83] mb-2">Đội của bạn phải có ít nhất 3 thành viên khi tạo (bản thân bạn và ít nhất 2 thành viên khác).</p>
                                                <div className="space-y-3">
                                            {memberEmails.map((email, index) => (
                                                <div key={index} className="flex items-center gap-2">
                                                    <input
                                                        type="email"
                                                        placeholder={`Email thành viên ${index + 1} ${index < 2 ? '(Bắt buộc)' : '(Tùy chọn)'}`}
                                                        required={index < 2}
                                                        className="input-custom flex-1"
                                                        value={email}
                                                        onChange={(e) => {
                                                            const newEmails = [...memberEmails];
                                                            newEmails[index] = e.target.value;
                                                            setMemberEmails(newEmails);
                                                        }}
                                                    />
                                                    {memberEmails.length > 2 && (
                                                        <button
                                                            type="button"
                                                            className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-100"
                                                            onClick={() => {
                                                                const newEmails = memberEmails.filter((_, i) => i !== index);
                                                                setMemberEmails(newEmails);
                                                            }}
                                                        >
                                                            Xóa
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                            {memberEmails.length < 4 && (
                                                <button
                                                    type="button"
                                                    className="btn-secondary text-xs py-1.5 px-3 block w-fit"
                                                    onClick={() => setMemberEmails([...memberEmails, ''])}
                                                >
                                                    + Thêm ô nhập email
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <button type="submit" disabled={creating} className="btn-primary w-full">{creating ? 'Đang tạo...' : 'Tạo đội'}</button>
                                        </>
                                    )}
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
                                {team.type === 'PRIVATE' && isLeader && team.joinPassword && (
                                    <div className="mt-3 flex items-center gap-2 rounded-md border border-[#d7e6f8] bg-[#f8fbff] px-3 py-1.5 w-fit">
                                        <span className="text-xs font-black uppercase text-[#5c6d83]">Mã PIN:</span>
                                        <span className="font-mono text-sm font-bold text-[#071936]">
                                            {showPin ? team.joinPassword : '••••'}
                                        </span>
                                        <button 
                                            type="button" 
                                            onClick={() => setShowPin(!showPin)} 
                                            className="text-[#5c6d83] hover:text-[#0f63c9] ml-1 focus:outline-none"
                                            title={showPin ? "Ẩn PIN" : "Hiện PIN"}
                                        >
                                            {showPin ? (
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                                </svg>
                                            ) : (
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                )}
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
                                <div className="flex gap-2">
                                    {isLeader && <button type="button" onClick={() => setShowActions((value) => !value)} className="btn-secondary">Thao tác</button>}
                                    <button type="button" onClick={handleLeave} className="rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 font-bold px-4 py-2 text-sm transition-all duration-200">Rời đội</button>
                                </div>
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
                        <input required className="input-custom mt-5" inputMode="numeric" maxLength={4} value={joinPassword} onChange={(e) => { setJoinPassword(e.target.value.replace(/\D/g, '')); setJoinError(''); }} />
                        {joinError && <p className="mt-2 text-sm font-semibold text-red-600">{joinError}</p>}
                        <div className="mt-5 flex gap-3">
                            <button type="button" onClick={() => { setPrivateTeam(null); setJoinPassword(''); setJoinError(''); }} className="btn-secondary flex-1">Hủy</button>
                            <button type="submit" className="btn-primary flex-1">Vào đội</button>
                        </div>
                    </form>
                </div>
            )}
        </main>
    );
}
