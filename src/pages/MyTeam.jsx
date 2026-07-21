import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { formatDateTime, getCountdownParts, getEventPhase } from '../utils/hackathon';
import TeamChat from './TeamChat';
import Toast from '../components/Toast';

export default function MyTeam() {
    const [searchParams] = useSearchParams();
    const preselectedEventId = searchParams.get('eventId');
    const currentEmail = localStorage.getItem('email');

    const [team, setTeam] = useState(null);
    const [events, setEvents] = useState([]);
    const [teams, setTeams] = useState([]);
    const [matrices, setMatrices] = useState([]);
    const [joinRequests, setJoinRequests] = useState([]);
    const [myInvitations, setMyInvitations] = useState([]);
    const [sentInvitations, setSentInvitations] = useState([]);
    const [submission, setSubmission] = useState(null);
    const [mode, setMode] = useState('CREATE');
    const [teamFilter, setTeamFilter] = useState('ALL');
    const [showActions, setShowActions] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [joinPassword, setJoinPassword] = useState('');
    const [privateTeam, setPrivateTeam] = useState(null);
    const [joinError, setJoinError] = useState('');
    const [message, setMessage] = useState({ text: '', type: '' });
    const [createError, setCreateError] = useState('');
    const [createSuccess, setCreateSuccess] = useState('');
    const [pinError, setPinError] = useState('');
    const [emailsError, setEmailsError] = useState('');
    const [lobbyActionStatus, setLobbyActionStatus] = useState({ teamId: null, message: '', type: '' });
    const [inviteError, setInviteError] = useState('');
    const [inviteSuccess, setInviteSuccess] = useState('');
    const [actionMessage, setActionMessage] = useState({ text: '', type: '' });
    const [submitError, setSubmitError] = useState('');
    const [submitSuccess, setSubmitSuccess] = useState('');
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
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
                axiosClient.get(preselectedEventId ? `/teams/my-team?eventId=${preselectedEventId}` : '/teams/my-team'),
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
                return getEventPhase(event).key === 'registration';
            });
            const firstEvent = activeOrUpcoming.find((item) => String(item.id) === String(preselectedEventId)) || activeOrUpcoming[0] || loadedEvents[0];
            setFormData((current) => ({
                ...current,
                eventId: loadedTeam?.eventId || firstEvent?.id || '',
                trackId: loadedTeam?.trackId || firstEvent?.tracks?.[0]?.id || '',
            }));

            if (loadedTeam?.eventId) {
                const isLeaderRole = loadedTeam?.members?.some((member) => member.email === currentEmail && member.role === 'LEADER');
                const [matrixRes, submissionRes, requestRes, sentInvRes] = await Promise.allSettled([
                    axiosClient.get(`/events/${loadedTeam.eventId}/matrices`),
                    axiosClient.get(`/submissions/my-submission?teamId=${loadedTeam.id}`),
                    loadedTeam?.members?.some((member) => member.email === currentEmail && member.role === 'LEADER')
                        ? axiosClient.get(`/teams/${loadedTeam.id}/join-requests`)
                        : Promise.resolve({ result: [] }),
                    isLeaderRole
                        ? axiosClient.get(`/teams/${loadedTeam.id}/sent-invitations`)
                        : Promise.resolve({ result: [] }),
                ]);
                const teamMatrices = matrixRes.status === 'fulfilled'
                    ? (matrixRes.value.result || []).filter((matrix) => matrix.trackId == null || String(matrix.trackId) === String(loadedTeam.trackId))
                    : [];
                setMatrices(teamMatrices);
                const loadedSubmission = submissionRes.status === 'fulfilled' ? submissionRes.value.result : null;
                setSubmission(loadedSubmission);
                setJoinRequests(requestRes.status === 'fulfilled' ? requestRes.value.result || [] : []);
                setSentInvitations(sentInvRes.status === 'fulfilled' ? sentInvRes.value.result || [] : []);
                setFormData((current) => ({
                    ...current,
                    matrixId: loadedSubmission?.matrixId || teamMatrices[0]?.id || '',
                    fileUrl: loadedSubmission?.fileUrl || '',
                }));
            } else {
                try {
                    const invRes = await axiosClient.get('/teams/my-invitations');
                    setMyInvitations(invRes.result || []);
                } catch {
                    setMyInvitations([]);
                }
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
            return getEventPhase(event).key === 'registration';
        });
    }, [events]);

    const selectedEvent = useMemo(() => events.find((event) => String(event.id) === String(formData.eventId)), [events, formData.eventId]);
    const currentEvent = useMemo(() => events.find((event) => String(event.id) === String(team?.eventId)), [events, team]);
    const selectedMatrix = useMemo(() => matrices.find((matrix) => String(matrix.id) === String(formData.matrixId)), [matrices, formData.matrixId]);
    const isSubmissionStarted = useMemo(() => {
        if (!selectedMatrix?.submissionStartDate) return true;
        return new Date() >= new Date(selectedMatrix.submissionStartDate);
    }, [selectedMatrix]);
    const isSubmissionEnded = useMemo(() => {
        if (!selectedMatrix?.submissionDeadline) return false;
        return new Date() > new Date(selectedMatrix.submissionDeadline);
    }, [selectedMatrix]);
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
        setCreateError('');
        setCreateSuccess('');
        setPinError('');
        setEmailsError('');

        let hasErr = false;
        if (formData.type === 'PRIVATE' && !/^\d{4}$/.test(formData.joinPassword)) {
            setPinError('Mã PIN đội private phải gồm đúng 4 số.');
            hasErr = true;
        }
        const nonNullEmails = memberEmails.filter(email => email.trim() !== '');
        if (nonNullEmails.length < 2) {
            setEmailsError('Bạn phải điền tối thiểu 2 email của thành viên khác.');
            hasErr = true;
        }
        if (nonNullEmails.includes(currentEmail)) {
            setEmailsError('Bạn không thể tự mời chính mình vào đội.');
            hasErr = true;
        }
        const selectedTrack = (selectedEvent?.tracks || []).find((t) => String(t.id) === String(formData.trackId));
        if (selectedTrack && selectedTrack.maxTeams && selectedTrack.maxTeams > 0) {
            const currentTeams = selectedTrack.currentTeamsCount || 0;
            if (currentTeams >= selectedTrack.maxTeams) {
                setCreateError(`Bảng đấu ${selectedTrack.name} đã đạt giới hạn tối đa ${selectedTrack.maxTeams} đội tham gia.`);
                hasErr = true;
            }
        }

        if (hasErr) return;

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
            setCreateSuccess('Tạo đội thành công! Lời mời gia nhập đã được gửi tới các thành viên được mời.');
            await fetchData();
        } catch (err) {
            setCreateError(err.message || 'Không thể tạo đội thi.');
        } finally {
            setCreating(false);
        }
    };

    const handleJoin = async (targetTeam) => {
        setLobbyActionStatus({ teamId: targetTeam.id, message: 'Đang gửi yêu cầu...', type: 'info' });
        try {
            if (targetTeam.type === 'PRIVATE') {
                setPrivateTeam(targetTeam);
                setLobbyActionStatus({ teamId: null, message: '', type: '' });
                return;
            }
            await axiosClient.post(`/teams/${targetTeam.id}/join-request`);
            setLobbyActionStatus({ teamId: targetTeam.id, message: 'Đã gửi yêu cầu gia nhập thành công. Đang chờ Leader duyệt.', type: 'success' });
            await fetchData();
        } catch (err) {
            setLobbyActionStatus({ teamId: targetTeam.id, message: err.message || 'Không thể gửi yêu cầu tham gia đội.', type: 'error' });
        }
    };

    const handlePrivateJoin = async (e) => {
        e.preventDefault();
        setJoinError('');
        try {
            await axiosClient.post(`/teams/${privateTeam.id}/join-private`, { password: joinPassword });
            setPrivateTeam(null);
            setJoinPassword('');
            await fetchData();
            setMessage({ text: 'Gia nhập đội thành công!', type: 'success' });
        } catch (err) {
            setJoinError(err.message || 'Mã PIN không đúng hoặc không thể tham gia đội.');
        }
    };

    const handleInvite = async (e) => {
        e.preventDefault();
        setInviteError('');
        setInviteSuccess('');
        try {
            const response = await axiosClient.post(`/teams/${team.id}/invite`, { email: inviteEmail });
            setTeam(response.result);
            setInviteEmail('');
            setInviteSuccess('Đã gửi lời mời đến thành viên! Đang chờ thành viên đồng ý.');
            await fetchData();
        } catch (err) {
            setInviteError(err.message || 'Không thể mời thành viên.');
        }
    };

    const handleAcceptInvitation = async (requestId) => {
        setMessage({ text: '', type: '' });
        try {
            await axiosClient.post(`/teams/invitations/${requestId}/accept`);
            setMessage({ text: 'Chấp nhận lời mời gia nhập đội thành công!', type: 'success' });
            await fetchData();
        } catch (err) {
            setMessage({ text: err.message || 'Không thể chấp nhận lời mời.', type: 'error' });
        }
    };

    const handleRejectInvitation = async (requestId) => {
        setMessage({ text: '', type: '' });
        try {
            await axiosClient.post(`/teams/invitations/${requestId}/reject`);
            setMyInvitations((prev) => prev.filter((item) => item.id !== requestId));
            setMessage({ text: 'Đã từ chối lời mời gia nhập đội.', type: 'success' });
        } catch (err) {
            setMessage({ text: err.message || 'Không thể từ chối lời mời.', type: 'error' });
        }
    };

    const handleTransfer = async (memberId) => {
        setActionMessage({ text: '', type: '' });
        setConfirmModal({
            isOpen: true,
            title: 'Chuyển quyền Trưởng nhóm',
            message: 'Bạn có chắc chắn muốn chuyển quyền Trưởng nhóm cho thành viên này?',
            onConfirm: async () => {
                try {
                    const response = await axiosClient.put(`/teams/${team.id}/leader/${memberId}`);
                    setTeam(response.result);
                    setActionMessage({ text: 'Chuyển quyền Trưởng nhóm thành công!', type: 'success' });
                } catch (err) {
                    setActionMessage({ text: err.message || 'Không thể chuyển quyền Trưởng nhóm.', type: 'error' });
                }
            }
        });
    };

    const handleKick = async (memberId) => {
        const memberCount = team?.members?.length || 0;
        let confirmMsg = "Bạn có chắc chắn muốn xóa thành viên này khỏi đội?";
        if (memberCount <= 3) {
            confirmMsg = "Đội hiện tại chỉ có 3 người. Nếu bạn xóa thành viên này, số thành viên sẽ dưới 3 và đội sẽ tự động bị GIẢI TÁN. Bạn có chắc chắn muốn xóa?";
        }
        setActionMessage({ text: '', type: '' });
        setConfirmModal({
            isOpen: true,
            title: 'Xóa thành viên',
            message: confirmMsg,
            onConfirm: async () => {
                try {
                    await axiosClient.delete(`/teams/${team.id}/members/${memberId}`);
                    setActionMessage({ text: 'Xóa thành viên khỏi đội thành công!', type: 'success' });
                    await fetchData();
                } catch (err) {
                    setActionMessage({ text: err.message || 'Không thể xóa thành viên.', type: 'error' });
                }
            }
        });
    };

    const handleApproveRequest = async (requestId) => {
        setActionMessage({ text: '', type: '' });
        try {
            const response = await axiosClient.post(`/teams/${team.id}/join-requests/${requestId}/approve`);
            setTeam(response.result);
            setJoinRequests((current) => current.filter((request) => request.id !== requestId));
            setActionMessage({ text: 'Đã duyệt yêu cầu tham gia!', type: 'success' });
        } catch (err) {
            setActionMessage({ text: err.message || 'Không thể duyệt yêu cầu.', type: 'error' });
        }
    };

    const handleRejectRequest = async (requestId) => {
        setActionMessage({ text: '', type: '' });
        try {
            await axiosClient.post(`/teams/${team.id}/join-requests/${requestId}/reject`);
            setJoinRequests((current) => current.filter((request) => request.id !== requestId));
            setActionMessage({ text: 'Đã từ chối yêu cầu tham gia.', type: 'success' });
        } catch (err) {
            setActionMessage({ text: err.message || 'Không thể từ chối yêu cầu.', type: 'error' });
        }
    };

    const handleLeave = async () => {
        const isLeaderOfTeam = team?.members?.some(
            (member) => member.email === currentEmail && member.role === 'LEADER'
        );
        const memberCount = team?.members?.length || 0;

        setActionMessage({ text: '', type: '' });

        if (isLeaderOfTeam) {
            setActionMessage({ text: "Bạn là Trưởng nhóm. Bạn phải chuyển quyền Trưởng nhóm cho thành viên khác trước khi rời đội.", type: 'error' });
            return;
        }

        let confirmMsg = "Bạn có chắc chắn muốn rời đội?";
        if (memberCount <= 3) {
            confirmMsg = "Đội của bạn hiện có 3 người. Khi bạn rời đi, số thành viên sẽ dưới 3 và đội sẽ tự động bị GIẢI TÁN. Bạn có chắc chắn muốn rời đội?";
        }

        setConfirmModal({
            isOpen: true,
            title: 'Rời đội',
            message: confirmMsg,
            onConfirm: async () => {
                try {
                    await axiosClient.post(`/teams/leave?teamId=${team.id}`);
                    setTeam(null);
                    setMessage({ text: 'Rời khỏi đội thành công!', type: 'success' });
                    await fetchData();
                } catch (err) {
                    setActionMessage({ text: err.message || 'Không thể rời đội.', type: 'error' });
                }
            }
        });
    };

    const handleSubmission = async (e) => {
        e.preventDefault();
        setSubmitError('');
        setSubmitSuccess('');
        if (!isLeader) {
            setSubmitError('Chỉ Team Leader được nộp hoặc cập nhật bài.');
            return;
        }
        try {
            setSavingSubmission(true);
            const payload = { teamId: team.id, matrixId: Number(formData.matrixId), fileUrl: formData.fileUrl };
            const response = submission
                ? await axiosClient.put(`/submissions/${submission.id}`, payload)
                : await axiosClient.post('/submissions', payload);
            setSubmission(response.result);
            setSubmitSuccess('Lưu bài nộp thành công!');
        } catch (err) {
            setSubmitError(err.message || 'Không thể lưu bài nộp.');
        } finally {
            setSavingSubmission(false);
        }
    };

    if (loading) {
        return <main className="section-shell"><div className="rounded-lg bg-white p-8 text-center text-[#5c6d83]">Đang tải dữ liệu đội thi...</div></main>;
    }

    return (
        <main className="section-shell">
            <Toast message={message} onClose={() => setMessage({ text: '', type: '' })} />

            {!team ? (
                <div className="space-y-6">
                    {myInvitations.length > 0 && (
                        <section className="rounded-lg border-2 border-blue-400 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 shadow-md">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-black uppercase tracking-[0.06em] text-[#071936] flex items-center gap-2">
                                        <span className="flex h-3 w-3 rounded-full bg-blue-600 animate-ping"></span>
                                        Lời mời gia nhập đội ({myInvitations.length})
                                    </h2>
                                    <p className="text-xs text-[#5c6d83] mt-1">
                                        Bạn có lời mời tham gia đội thi. Bạn có quyền chấp nhận hoặc từ chối lời mời bên dưới.
                                    </p>
                                </div>
                            </div>
                            <div className="mt-4 grid gap-4 md:grid-cols-2">
                                {myInvitations.map((inv) => (
                                    <div key={inv.id} className="rounded-lg border border-[#d7e6f8] bg-white p-4 shadow-sm flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-center justify-between gap-2">
                                                <h3 className="font-black text-[#071936] text-base">{inv.teamName}</h3>
                                                <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-[#0f63c9]">
                                                    {inv.trackName || 'Hạng mục'}
                                                </span>
                                            </div>
                                            <p className="mt-1 text-xs text-[#5c6d83]">
                                                Giải đấu: <strong className="text-[#071936]">{inv.eventName || 'Sự kiện'}</strong>
                                            </p>
                                            {inv.inviterName && (
                                                <p className="mt-0.5 text-xs text-[#5c6d83]">
                                                    Người mời: <strong className="text-[#071936]">{inv.inviterName}</strong>
                                                </p>
                                            )}
                                        </div>
                                        <div className="mt-4 flex gap-2 pt-3 border-t border-[#f0f4f8]">
                                            <button
                                                type="button"
                                                onClick={() => handleAcceptInvitation(inv.id)}
                                                className="btn-primary py-1.5 px-4 text-xs bg-emerald-600 hover:bg-emerald-700 flex-1"
                                            >
                                                ✓ Chấp nhận
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleRejectInvitation(inv.id)}
                                                className="btn-secondary py-1.5 px-4 text-xs text-red-600 border-red-200 hover:bg-red-50 flex-1"
                                            >
                                                ✕ Từ chối
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    <div>
                        <h1 className="section-title">Đăng ký giải đấu</h1>
                        {selectedEvent && (
                            <div className="mt-2 flex flex-col items-start gap-1">
                                <p className="text-xl font-black text-[#0b1f3f]">{selectedEvent.name}</p>
                                <Link to={`/events/${selectedEvent.id}`} className="group inline-flex items-center gap-1.5 rounded-full bg-[#f4f7fa] px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-[#0f63c9] transition-all hover:bg-[#e6eff8] hover:shadow-sm">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Xem chi tiết sự kiện
                                    <svg className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                                    </svg>
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
                                            {lobbyActionStatus.teamId === item.id && lobbyActionStatus.message && (
                                                <p className={`mt-2 text-xs font-semibold text-center ${
                                                    lobbyActionStatus.type === 'success' ? 'text-green-600' :
                                                    lobbyActionStatus.type === 'error' ? 'text-red-600' : 'text-blue-600'
                                                }`}>
                                                    {lobbyActionStatus.message}
                                                </p>
                                            )}
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
                                                            setEmailsError('');
                                                        }}
                                                    />
                                                    {memberEmails.length > 2 && (
                                                        <button
                                                            type="button"
                                                            className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-100"
                                                            onClick={() => {
                                                                const newEmails = memberEmails.filter((_, i) => i !== index);
                                                                setMemberEmails(newEmails);
                                                                setEmailsError('');
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
                                            {emailsError && <p className="mt-1.5 text-xs font-semibold text-red-600">{emailsError}</p>}
                                        </div>
                                    </div>

                                    {createError && <p className="text-sm font-semibold text-red-600">{createError}</p>}
                                    {createSuccess && <p className="text-sm font-semibold text-green-600">{createSuccess}</p>}
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
                                    <div className="space-y-1">
                                        {selectedMatrix?.submissionStartDate && (
                                            <p className="text-sm font-semibold text-[#5c6d83]">Mở nộp: {formatDateTime(selectedMatrix.submissionStartDate)}</p>
                                        )}
                                        <p className="text-sm font-semibold text-[#5c6d83]">Deadline: {formatDateTime(selectedMatrix?.submissionDeadline)}</p>
                                    </div>
                                    {!isSubmissionStarted && selectedMatrix?.submissionStartDate && (
                                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs font-bold text-amber-800">
                                            Cổng nộp bài chưa mở. Vui lòng quay lại sau thời gian mở nộp bài.
                                        </div>
                                    )}
                                    {isSubmissionEnded && (
                                        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-800">
                                            Đã quá hạn nộp bài của vòng thi này.
                                        </div>
                                    )}
                                    <input required type="url" className="input-custom" placeholder="Link GitHub, Drive hoặc demo" value={formData.fileUrl} disabled={!isLeader || !isSubmissionStarted || isSubmissionEnded} onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })} />
                                    <button type="submit" disabled={savingSubmission || !isLeader || !isSubmissionStarted || isSubmissionEnded} className="btn-primary w-full">
                                        {!isLeader ? 'Chỉ leader được nộp bài' : savingSubmission ? 'Đang lưu...' : !isSubmissionStarted ? 'Cổng nộp bài chưa mở' : isSubmissionEnded ? 'Đã hết hạn nộp bài' : submission ? 'Cập nhật bài nộp' : 'Nộp bài'}
                                    </button>
                                    {submitError && <p className="mt-2 text-sm font-semibold text-red-600">{submitError}</p>}
                                    {submitSuccess && <p className="mt-2 text-sm font-semibold text-green-600">{submitSuccess}</p>}
                                </form>
                            )}
                        </div>

                        <div className="team-members-panel rounded-lg border border-[#d7e6f8] bg-white p-6">
                            <div className="flex items-center justify-between gap-3">
                                <h2 className="text-lg font-black uppercase tracking-[0.08em] text-[#071936]">Thành viên</h2>
                                <div className="flex gap-2">
                                    {isLeader && <button type="button" onClick={() => setShowActions((value) => !value)} className="btn-secondary">Thao tác</button>}
                                    <button 
                                        type="button" 
                                        onClick={handleLeave} 
                                        title="Rời đội" 
                                        className="flex items-center justify-center rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 p-2 transition-all duration-200"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            {actionMessage.text && (
                                <p className={`mt-3 text-sm font-semibold ${actionMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                                    {actionMessage.text}
                                </p>
                            )}
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
                                            <div className="mt-3 flex items-center gap-2">
                                                <button type="button" onClick={() => handleTransfer(member.id)} className="btn-secondary text-xs py-1 px-3">Chuyển leader</button>
                                                <button 
                                                    type="button" 
                                                    onClick={() => handleKick(member.id)} 
                                                    title="Xóa thành viên khỏi đội" 
                                                    className="flex items-center justify-center rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 p-1.5 transition-all duration-200 cursor-pointer"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M22 10.5h-6m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.3 20c-2.282 0-4.47-.6-6.42-1.656z" />
                                                    </svg>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                            {isLeader && (
                                <div className="mt-6 border-t border-[#d7e6f8] pt-5 space-y-6">
                                    <div>
                                        <h3 className="mb-3 text-sm font-black uppercase tracking-[0.08em] text-[#071936]">Mời thành viên</h3>
                                        <form onSubmit={handleInvite} className="flex gap-2">
                                            <input required type="email" className="input-custom" placeholder="Email thành viên" value={inviteEmail} onChange={(e) => { setInviteEmail(e.target.value); setInviteError(''); setInviteSuccess(''); }} />
                                            <button type="submit" className="btn-primary">Mời</button>
                                        </form>
                                        {inviteError && <p className="mt-1.5 text-xs font-semibold text-red-600">{inviteError}</p>}
                                        {inviteSuccess && <p className="mt-1.5 text-xs font-semibold text-green-600">{inviteSuccess}</p>}
                                    </div>

                                    {sentInvitations.length > 0 && (
                                        <div className="border-t border-[#d7e6f8] pt-5">
                                            <h3 className="text-sm font-black uppercase tracking-[0.08em] text-[#071936] mb-3">
                                                Lời mời đã gửi (Đang chờ phản hồi)
                                            </h3>
                                            <div className="space-y-2">
                                                {sentInvitations.map((inv) => (
                                                    <div key={inv.id} className="rounded-lg border border-[#d7e6f8] bg-[#f8fbff] p-3 flex items-center justify-between">
                                                        <div>
                                                            <p className="font-bold text-[#071936] text-sm">{inv.fullName || inv.email}</p>
                                                            <p className="text-xs text-[#5c6d83]">{inv.email}</p>
                                                        </div>
                                                        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700">
                                                            Đang chờ phản hồi
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="border-t border-[#d7e6f8] pt-5">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-sm font-black uppercase tracking-[0.08em] text-[#071936]">Yêu cầu tham gia</h3>
                                            {joinRequests.length > 0 && (
                                                <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-600 animate-pulse">
                                                    {joinRequests.length} mới
                                                </span>
                                            )}
                                        </div>
                                        <div className="mt-3 space-y-3">
                                            {joinRequests.length ? joinRequests.map((request) => (
                                                <div key={request.id} className="rounded-lg border border-[#d7e6f8] bg-[#f8fbff] p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                                    <div>
                                                        <p className="font-bold text-[#071936]">{request.fullName || request.email}</p>
                                                        <p className="text-sm text-[#5c6d83]">{request.email}</p>
                                                    </div>
                                                    <div className="flex gap-2 shrink-0">
                                                        <button type="button" onClick={() => handleApproveRequest(request.id)} className="btn-primary py-1.5 px-3 text-xs">Duyệt</button>
                                                        <button type="button" onClick={() => handleRejectRequest(request.id)} className="btn-secondary py-1.5 px-3 text-xs">Từ chối</button>
                                                    </div>
                                                </div>
                                            )) : <p className="text-sm text-[#5c6d83]">Chưa có yêu cầu tham gia nào.</p>}
                                        </div>
                                    </div>
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

            {confirmModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
                    <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl border border-[#d7e6f8]">
                        <h3 className="text-lg font-black uppercase tracking-[0.08em] text-[#071936]">{confirmModal.title}</h3>
                        <p className="mt-4 text-sm text-[#5c6d83] leading-relaxed">{confirmModal.message}</p>
                        <div className="mt-6 flex gap-3">
                            <button 
                                type="button" 
                                onClick={() => setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null })} 
                                className="btn-secondary flex-1"
                            >
                                Hủy
                            </button>
                            <button 
                                type="button" 
                                onClick={() => {
                                    confirmModal.onConfirm?.();
                                    setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null });
                                }} 
                                className="btn-primary bg-red-600 hover:bg-red-700 text-white flex-1"
                            >
                                Đồng ý
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
