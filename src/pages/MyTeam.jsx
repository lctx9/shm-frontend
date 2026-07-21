import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { formatDateTime, getCountdownParts, getEventPhase } from '../utils/hackathon';
import TeamChat from './TeamChat';
import Toast from '../components/Toast';

export default function MyTeam() {
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTeamId = searchParams.get('teamId');
    const paramEventId = searchParams.get('registerEventId') || searchParams.get('eventId');
    const registeringEventId = paramEventId;
    const preselectedEventId = searchParams.get('eventId') || searchParams.get('registerEventId');
    const currentEmail = localStorage.getItem('email');
 
    const [team, setTeam] = useState(null);
    const [myTeams, setMyTeams] = useState([]);
    const [events, setEvents] = useState([]);
    const [teams, setTeams] = useState([]);
    const [matrices, setMatrices] = useState([]);
    const [joinRequests, setJoinRequests] = useState([]);
    const [myInvitations, setMyInvitations] = useState([]);
    const [sentInvitations, setSentInvitations] = useState([]);
    const [submission, setSubmission] = useState(null);        // submission của vòng đang chọn
    const [submissionsMap, setSubmissionsMap] = useState({});   // { matrixId: SubmissionResponse }
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
    const [submissionValues, setSubmissionValues] = useState({}); // { fieldId: value } theo submissionFormSchema
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
            const [teamRes, eventsRes, teamsRes, invRes] = await Promise.allSettled([
                axiosClient.get(preselectedEventId ? `/teams/my-team?eventId=${preselectedEventId}` : '/teams/my-team'),
                axiosClient.get('/events'),
                axiosClient.get('/teams'),
                axiosClient.get('/teams/my-invitations'),
            ]);

            const loadedTeamsList = teamRes.status === 'fulfilled' ? teamRes.value.result || [] : [];
            const loadedEvents = eventsRes.status === 'fulfilled' ? eventsRes.value.result || [] : [];
            setMyTeams(loadedTeamsList);
            setEvents(loadedEvents);
            setTeams(teamsRes.status === 'fulfilled' ? teamsRes.value.result || [] : []);
            setMyInvitations(invRes.status === 'fulfilled' ? invRes.value.result || [] : []);

            const activeOrUpcoming = loadedEvents.filter((event) => {
                if (!event.active) return false;
                return getEventPhase(event).key === 'registration';
            });

            const getPriority = (event) => {
                const phase = getEventPhase(event).key;
                if (phase === 'running') return 1;
                if (phase === 'registration') return 2;
                if (phase === 'upcoming') return 3;
                return 4; // ended
            };

            const sortedTeams = [...loadedTeamsList].sort((a, b) => {
                const eventA = loadedEvents.find(e => String(e.id) === String(a.eventId));
                const eventB = loadedEvents.find(e => String(e.id) === String(b.eventId));
                if (!eventA) return 1;
                if (!eventB) return -1;
                const pA = getPriority(eventA);
                const pB = getPriority(eventB);
                if (pA !== pB) return pA - pB;
                const startA = eventA.eventStartDate ? new Date(eventA.eventStartDate).getTime() : 0;
                const startB = eventB.eventStartDate ? new Date(eventB.eventStartDate).getTime() : 0;
                return Math.abs(startA - Date.now()) - Math.abs(startB - Date.now());
            });

            const initialTeam = activeTeamId ? sortedTeams.find(t => String(t.id) === String(activeTeamId)) : null;
            setTeam(initialTeam);

            const initialEventId = registeringEventId 
                || initialTeam?.eventId 
                || (activeOrUpcoming.find((item) => String(item.id) === String(preselectedEventId)) || activeOrUpcoming[0] || loadedEvents[0])?.id 
                || '';

            setFormData((current) => ({
                ...current,
                eventId: initialEventId,
                trackId: initialTeam?.trackId || (loadedEvents.find(e => String(e.id) === String(initialEventId))?.tracks?.[0]?.id || ''),
            }));

        } catch (err) {
            setMessage({ text: err.message || 'Không thể tải dữ liệu.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        window.scrollTo(0, 0);
        fetchData();
    }, [preselectedEventId]);

    useEffect(() => {
        if (activeTeamId && myTeams.length > 0) {
            const currentTeam = myTeams.find(t => String(t.id) === String(activeTeamId));
            if (currentTeam) {
                setTeam(currentTeam);
                setFormData((current) => ({
                    ...current,
                    eventId: currentTeam.eventId,
                    trackId: currentTeam.trackId,
                }));
            }
        } else {
            setTeam(null);
        }
    }, [activeTeamId, myTeams]);

    useEffect(() => {
        if (registeringEventId && events.length > 0) {
            const regEvent = events.find(e => String(e.id) === String(registeringEventId));
            if (regEvent) {
                setFormData((current) => ({
                    ...current,
                    eventId: registeringEventId,
                    trackId: regEvent.tracks?.[0]?.id || '',
                }));
            }
        }
    }, [registeringEventId, events]);

    useEffect(() => {
        const fetchTeamDataForEvent = async () => {
            if (!formData.eventId || myTeams.length === 0) return;
            const currentEventTeam = myTeams.find(t => String(t.eventId) === String(formData.eventId)) || null;
            setTeam(currentEventTeam);

            if (currentEventTeam) {
                try {
                    const isLeaderRole = currentEventTeam?.members?.some((member) => member.email === currentEmail && member.role === 'LEADER');
                    const [matrixRes, submissionRes, requestRes, sentInvRes] = await Promise.allSettled([
                        axiosClient.get(`/events/${currentEventTeam.eventId}/matrices`),
                        axiosClient.get('/submissions/my-submission'),
                        isLeaderRole
                            ? axiosClient.get(`/teams/${currentEventTeam.id}/join-requests`)
                            : Promise.resolve({ result: [] }),
                        isLeaderRole
                            ? axiosClient.get(`/teams/${currentEventTeam.id}/sent-invitations`)
                            : Promise.resolve({ result: [] }),
                    ]);
                    const teamMatrices = matrixRes.status === 'fulfilled'
                        ? (matrixRes.value.result || []).filter((matrix) => matrix.trackId == null || String(matrix.trackId) === String(currentEventTeam.trackId))
                        : [];
                    setMatrices(teamMatrices);
                    
                    const loadedSubmissions = submissionRes.status === 'fulfilled' ? submissionRes.value.result || [] : [];
                    // Key tất cả submissions theo matrixId để tìm kiếm O(1)
                    const newSubmissionsMap = {};
                    if (Array.isArray(loadedSubmissions)) {
                        loadedSubmissions
                            .filter(s => String(s.teamId) === String(currentEventTeam.id))
                            .forEach(s => { newSubmissionsMap[String(s.matrixId)] = s; });
                    }
                    setSubmissionsMap(newSubmissionsMap);

                    const firstMatrixId = Object.keys(newSubmissionsMap)[0] || teamMatrices[0]?.id || '';
                    const roundSubmission = newSubmissionsMap[String(firstMatrixId)] || null;
                    setSubmission(roundSubmission);
                    
                    setJoinRequests(requestRes.status === 'fulfilled' ? requestRes.value.result || [] : []);
                    setSentInvitations(sentInvRes.status === 'fulfilled' ? sentInvRes.value.result || [] : []);

                    // Parse dữ liệu form từ submission của vòng đầu tiên (nếu có)
                    let initialValues = {};
                    if (roundSubmission?.submissionDataJson) {
                        try { initialValues = JSON.parse(roundSubmission.submissionDataJson); } catch {}
                    }
                    setSubmissionValues(initialValues);

                    setFormData((current) => ({
                        ...current,
                        matrixId: firstMatrixId,
                        fileUrl: roundSubmission?.fileUrl || '',
                    }));
                } catch (error) {
                    console.error("Error fetching data for team", error);
                }
            } else {
                setMatrices([]);
                setSubmission(null);
                setJoinRequests([]);
            }
        };

        fetchTeamDataForEvent();
    }, [formData.eventId, myTeams, currentEmail]);

    const activeOrUpcomingEvents = useMemo(() => {
        return events.filter((event) => {
            if (!event.active) return false;
            return getEventPhase(event).key === 'registration';
        });
    }, [events]);

    const availableEventsToRegister = useMemo(() => {
        return activeOrUpcomingEvents.filter(
            (event) => !myTeams.some((t) => String(t.eventId) === String(event.id))
        );
    }, [activeOrUpcomingEvents, myTeams]);

    const selectedEvent = useMemo(() => events.find((event) => String(event.id) === String(formData.eventId)), [events, formData.eventId]);
    const currentEvent = useMemo(() => events.find((event) => String(event.id) === String(team?.eventId)), [events, team]);
    const selectedMatrix = useMemo(() => matrices.find((matrix) => String(matrix.id) === String(formData.matrixId)), [matrices, formData.matrixId]);
    const isEventStarted = useMemo(() => {
        if (!currentEvent?.eventStartDate) return true;
        return new Date() >= new Date(currentEvent.eventStartDate);
    }, [currentEvent]);

    const isPreviousRoundEnded = useMemo(() => {
        if (!selectedMatrix || !matrices.length) return true;
        const currentOrder = selectedMatrix.roundOrder;
        if (currentOrder <= 1) return true;

        const prevMatrix = matrices.find(other => {
            if (other.roundOrder !== currentOrder - 1) return false;
            if (selectedMatrix.finalRound) return true;
            return !other.finalRound && String(other.trackId) === String(selectedMatrix.trackId);
        });

        if (!prevMatrix || !prevMatrix.submissionDeadline) return true;
        return new Date() >= new Date(prevMatrix.submissionDeadline);
    }, [selectedMatrix, matrices]);

    // Parse submissionFormSchema của sự kiện hiện tại
    const submissionSchema = useMemo(() => {
        const raw = currentEvent?.submissionFormSchema;
        if (!raw) return null;
        try {
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
        } catch {
            return null;
        }
    }, [currentEvent]);

    // Khi đổi vòng thi → cập nhật submission và pre-fill form values từ vòng đó
    useEffect(() => {
        if (!formData.matrixId) return;
        const roundSub = submissionsMap[String(formData.matrixId)] || null;
        setSubmission(roundSub);
        let vals = {};
        if (roundSub?.submissionDataJson) {
            try { vals = JSON.parse(roundSub.submissionDataJson); } catch {}
        }
        setSubmissionValues(vals);
        setFormData(prev => ({ ...prev, fileUrl: roundSub?.fileUrl || '' }));
        setSubmitError('');
        setSubmitSuccess('');
    }, [formData.matrixId, submissionsMap]);

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

    const handleSelectTeam = (selectedTeam) => {
        setSearchParams({ teamId: selectedTeam.id });
        setFormData((current) => ({
            ...current,
            eventId: selectedTeam.eventId,
            trackId: selectedTeam.trackId,
        }));
    };

    const handleSelectEventToRegister = (eventId) => {
        setSearchParams({ registerEventId: eventId });
        const selectedEv = events.find(e => String(e.id) === String(eventId));
        setFormData((current) => ({
            ...current,
            eventId: eventId,
            trackId: selectedEv?.tracks?.[0]?.id || '',
        }));
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
            setSearchParams({ teamId: response.result.id });
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
            setTimeout(() => {
                setSearchParams({});
            }, 2000);
            await fetchData();
        } catch (err) {
            setLobbyActionStatus({ teamId: null, message: '', type: '' });
            setConfirmModal({
                isOpen: true,
                title: 'Thông báo lỗi',
                message: err.message || 'Không thể gửi yêu cầu tham gia đội.',
                isAlert: true,
                onConfirm: null
            });
        }
    };

    const handlePrivateJoin = async (e) => {
        e.preventDefault();
        if (!/^\d{4}$/.test(joinPassword)) {
            setJoinError('Mã PIN phải gồm đúng 4 số.');
            return;
        }
        setJoinError('');
        try {
            await axiosClient.post(`/teams/${privateTeam.id}/join-private`, { password: joinPassword });
            setPrivateTeam(null);
            setJoinPassword('');
            setSearchParams({ teamId: privateTeam.id });
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

    const handleReInvite = async (email) => {
        setInviteError('');
        setInviteSuccess('');
        try {
            await axiosClient.post(`/teams/${team.id}/invite`, { email });
            setInviteSuccess(`Đã gửi lời mời lại cho ${email}!`);
            await fetchData();
        } catch (err) {
            setInviteError(err.message || 'Không thể gửi lời mời lại.');
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
        setActionMessage({ text: '', type: '' });

        if (isLeader) {
            setConfirmModal({
                isOpen: true,
                title: 'Không thể rời đội',
                message: 'Bạn đang là Trưởng nhóm (Leader). Bạn phải chuyển quyền Trưởng nhóm cho thành viên khác trước khi rời khỏi đội.',
                isAlert: true,
                isError: true,
                onConfirm: null,
            });
            return;
        }

        setConfirmModal({
            isOpen: true,
            title: 'Xác nhận rời đội',
            message: `Bạn có chắc chắn muốn rời khỏi đội "${team?.name}" không?`,
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

    const handleDisbandTeam = () => {
        if (!isLeader) return;

        setConfirmModal({
            isOpen: true,
            title: 'Xác nhận xóa đội thi',
            message: `Bạn có chắc chắn muốn XÓA đội thi "${team?.name}" không? Thao tác này sẽ xóa hoàn toàn đội khỏi cuộc thi.`,
            isError: true,
            onConfirm: async () => {
                try {
                    await axiosClient.delete(`/teams/${team.id}`);
                    setTeam(null);
                    setMessage({ text: 'Xóa đội thi thành công!', type: 'success' });
                    await fetchData();
                } catch (err) {
                    setActionMessage({ text: err.message || 'Không thể xóa đội.', type: 'error' });
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

            let fileUrl = formData.fileUrl;
            let submissionDataJson = null;

            if (submissionSchema && submissionSchema.length > 0) {
                // Validate các trường required từ schema
                for (const field of submissionSchema) {
                    if (field.required && !submissionValues[field.id]?.trim()) {
                        setSubmitError(`Vui lòng điền đầy đủ trường "${field.label}"`);
                        return;
                    }
                }
                submissionDataJson = JSON.stringify(submissionValues);
                // Dùng field đầu tiên có type url làm fileUrl legacy cho backward compat
                const firstUrlField = submissionSchema.find(f => f.type === 'url');
                if (firstUrlField) fileUrl = submissionValues[firstUrlField.id] || '';
            }

            const payload = {
                teamId: team.id,
                matrixId: Number(formData.matrixId),
                fileUrl,
                submissionDataJson,
            };

            const response = submission
                ? await axiosClient.put(`/submissions/${submission.id}`, payload)
                : await axiosClient.post('/submissions', payload);

            const saved = response.result;
            setSubmission(saved);
            setSubmissionsMap(prev => ({ ...prev, [String(formData.matrixId)]: saved }));
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

            {activeTeamId && team ? (
                /* VIEW 1: ĐỘI THI CHI TIẾT (Trang riêng hiển thị khi click vào một đội) */
                <div className="space-y-6">
                    <div className="flex justify-end mb-4">
                        <Link to="/teams" className="btn-secondary flex items-center gap-1.5 font-bold text-xs py-2 px-3 shrink-0">
                            <span>Xem Lobby</span>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-slate-500">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94-3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                            </svg>
                        </Link>
                    </div>

                    <section className="rounded-lg border border-[#d7e6f8] bg-white p-6">
                        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                            <div>
                                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0f63c9]">{team.eventName || 'Chưa gắn giải đấu'}</p>
                                <h1 className="mt-2 text-3xl font-black uppercase tracking-[0.06em] text-[#071936]">{team.name}</h1>
                                <p className="mt-2 text-sm leading-7 text-[#5c6d83]">{team.description || 'Đội chưa thêm mô tả.'}</p>
                                <p className="mt-3 text-sm font-bold text-[#0f63c9]">{team.trackName}</p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="badge-status-pill">{team.type}</span>
                                {(team.members?.length || team.memberCount || 0) >= 3 ? (
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700 border border-emerald-200">
                                        <span className="pulsing-dot-green shrink-0" />
                                        Đội chính thức
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700 border border-amber-200">
                                        <span className="pulsing-dot-amber shrink-0" />
                                        Đội chưa chính thức
                                    </span>
                                )}
                            </div>
                        </div>

                        {(team.members?.length || team.memberCount || 0) < 3 && (
                            <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-amber-900 shadow-sm flex items-start gap-3">
                                <svg className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <div>
                                    <h4 className="font-black text-amber-900 text-sm">Đội thi hiện tại là Đội chưa chính thức</h4>
                                    <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                                        Đội của bạn hiện tại chưa đủ tối thiểu 3 thành viên xác nhận tham gia. Hãy mời thêm thành viên hoặc đợi người được mời chấp nhận để đội trở thành <strong>Đội chính thức</strong> và mở quyền nộp bài dự thi.
                                    </p>
                                </div>
                            </div>
                        )}
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
                            <TeamChat embedded teamId={team.id} />
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
                                    {!isEventStarted && currentEvent?.eventStartDate && (
                                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs font-bold text-amber-800">
                                            Giải đấu chưa chính thức bắt đầu. Thời gian bắt đầu: {formatDateTime(currentEvent.eventStartDate)}.
                                        </div>
                                    )}
                                    {isEventStarted && !isPreviousRoundEnded && (
                                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs font-bold text-amber-800">
                                            Vui lòng đợi vòng thi trước kết thúc mới được nộp bài cho vòng này.
                                        </div>
                                    )}
                                    {isEventStarted && isPreviousRoundEnded && !isSubmissionStarted && selectedMatrix?.submissionStartDate && (
                                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs font-bold text-amber-800">
                                            Cổng nộp bài chưa mở. Vui lòng quay lại sau thời gian mở nộp bài.
                                        </div>
                                    )}
                                    {isSubmissionEnded && (
                                        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-800">
                                            Đã quá hạn nộp bài của vòng thi này.
                                        </div>
                                    )}

                                    {/* === DYNAMIC FORM FIELDS từ submissionFormSchema === */}
                                    {submissionSchema && submissionSchema.length > 0 ? (
                                        <div className="space-y-4">
                                            {submissionSchema.map((field) => (
                                                <div key={field.id}>
                                                    <label className="mb-1 block text-sm font-bold text-[#0b1f3f]">
                                                        {field.label}
                                                        {field.required && <span className="ml-1 text-red-500">*</span>}
                                                    </label>
                                                    {field.type === 'textarea' ? (
                                                        <textarea
                                                            className="input-custom min-h-[80px] resize-y"
                                                            placeholder={field.placeholder || ''}
                                                            value={submissionValues[field.id] || ''}
                                                            disabled={!isLeader || !isEventStarted || !isPreviousRoundEnded || !isSubmissionStarted || isSubmissionEnded}
                                                            onChange={(e) => setSubmissionValues(prev => ({ ...prev, [field.id]: e.target.value }))}
                                                        />
                                                    ) : (
                                                        <input
                                                            type={field.type || 'text'}
                                                            className="input-custom"
                                                            placeholder={field.type === 'url' ? 'https://' : (field.placeholder || '')}
                                                            value={submissionValues[field.id] || ''}
                                                            disabled={!isLeader || !isEventStarted || !isPreviousRoundEnded || !isSubmissionStarted || isSubmissionEnded}
                                                            onChange={(e) => setSubmissionValues(prev => ({ ...prev, [field.id]: e.target.value }))}
                                                        />
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        /* Fallback: form cũ — event chưa cấu hình schema */
                                        <input required type="url" className="input-custom" placeholder="Link GitHub, Drive hoặc demo" value={formData.fileUrl} disabled={!isLeader || !isEventStarted || !isPreviousRoundEnded || !isSubmissionStarted || isSubmissionEnded} onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })} />
                                    )}

                                    <button type="submit" disabled={savingSubmission || !isLeader || !isEventStarted || !isPreviousRoundEnded || !isSubmissionStarted || isSubmissionEnded} className="btn-primary w-full">
                                        {!isLeader ? 'Chỉ leader được nộp bài' : savingSubmission ? 'Đang lưu...' : !isEventStarted ? 'Giải đấu chưa bắt đầu' : !isPreviousRoundEnded ? 'Vòng trước chưa kết thúc' : !isSubmissionStarted ? 'Cổng nộp bài chưa mở' : isSubmissionEnded ? 'Đã hết hạn nộp bài' : submission ? 'Cập nhật bài nộp' : 'Nộp bài'}
                                    </button>
                                    {submitError && <p className="mt-2 text-sm font-semibold text-red-600">{submitError}</p>}
                                    {submitSuccess && <p className="mt-2 text-sm font-semibold text-green-600">{submitSuccess}</p>}
                                </form>
                            )}
                        </div>

                        <div className="team-members-panel rounded-lg border border-[#d7e6f8] bg-white p-6">
                            <div className="flex items-center justify-between gap-3">
                                <h2 className="text-lg font-black uppercase tracking-[0.08em] text-[#071936]">Thành viên ({team.members?.length || 0})</h2>
                                <div className="flex items-center gap-2.5">
                                    {isLeader && (
                                        <>
                                            <button type="button" onClick={() => setShowActions((value) => !value)} className="btn-secondary">Thao tác</button>
                                            <button 
                                                type="button" 
                                                onClick={handleDisbandTeam} 
                                                title="Xóa đội (Dành cho Trưởng nhóm)" 
                                                className="flex items-center justify-center rounded-lg border border-red-300 bg-red-100 hover:bg-red-200 text-red-700 p-2.5 transition-all duration-200 cursor-pointer shadow-sm"
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </>
                                    )}
                                    <button 
                                        type="button" 
                                        onClick={handleLeave} 
                                        title="Rời khỏi đội" 
                                        className="flex items-center justify-center rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-700 p-2.5 transition-all duration-200 cursor-pointer shadow-sm"
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
                                             <span className={member.role === 'LEADER' ? 'rounded-full bg-red-100 text-red-700 border border-red-200 px-3 py-1 text-xs font-black uppercase shadow-xs' : 'rounded-full bg-slate-100 text-slate-700 px-3 py-1 text-xs font-black uppercase'}>{member.role}</span>
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
                                                Lời mời đã gửi ({sentInvitations.length})
                                            </h3>
                                            <div className="space-y-2">
                                                {sentInvitations.map((inv) => (
                                                    <div key={inv.id} className="rounded-lg border border-[#d7e6f8] bg-[#f8fbff] p-3 flex items-center justify-between gap-3">
                                                        <div className="min-w-0">
                                                            <p className="font-bold text-[#071936] text-sm truncate">{inv.fullName || inv.email}</p>
                                                            <p className="text-xs text-[#5c6d83] truncate">{inv.email}</p>
                                                        </div>
                                                        {inv.status === 'REJECTED' ? (
                                                            <div className="flex items-center gap-2 shrink-0">
                                                                <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-600">
                                                                    Đã từ chối
                                                                </span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleReInvite(inv.email)}
                                                                    className="btn-primary py-1 px-3 text-xs shrink-0"
                                                                >
                                                                    Mời lại
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700 shrink-0">
                                                                Đang chờ phản hồi
                                                            </span>
                                                        )}
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
                </div>
            ) : registeringEventId ? (
                /* VIEW 2: ĐĂNG KÝ GIẢI ĐẤU MỚI (Trang riêng tương tự lobby khi bấm Đăng ký ngay) */
                (() => {
                    const registeringEvent = events.find(e => String(e.id) === String(registeringEventId));
                    if (!registeringEvent) {
                        return <div className="rounded-lg bg-white p-8 text-center text-[#5c6d83]">Giải đấu không tồn tại hoặc đã đóng.</div>;
                    }
                    return (
                        <div className="space-y-6">

                            <div className="w-full rounded-2xl bg-white p-6 shadow-md border border-[#d7e6f8]">
                                <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                    <div>
                                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-100 uppercase tracking-wider mb-2">
                                            Đăng ký giải đấu
                                        </span>
                                        <h2 className="text-2xl font-black text-[#0b1f3f]">{registeringEvent.name}</h2>
                                        <p className="text-sm text-[#5c6d83] mt-1">{registeringEvent.description || 'Chưa có mô tả ngắn cho giải đấu.'}</p>
                                    </div>
                                    <Link to={`/events/${registeringEvent.id}`} className="group inline-flex items-center gap-1.5 rounded-full bg-[#f4f7fa] px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-[#0f63c9] transition-all hover:bg-[#e6eff8] shrink-0 w-fit">
                                        Xem chi tiết sự kiện
                                        <svg className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </Link>
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2 mb-6">
                                    <button type="button" onClick={() => setMode('FIND')} className={mode === 'FIND' ? 'btn-primary' : 'btn-secondary'}>Tìm đội</button>
                                    <button type="button" onClick={() => setMode('CREATE')} className={mode === 'CREATE' ? 'btn-primary' : 'btn-secondary'}>Tạo đội</button>
                                </div>

                                <div>
                                    {mode === 'FIND' ? (
                                        <section className="rounded-lg border border-[#d7e6f8] bg-white p-6">
                                            <div className="mb-5">
                                                <label className="mb-1 block text-sm font-bold text-[#0b1f3f]">Lọc theo hạng mục</label>
                                                <select className="input-custom max-w-md" value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)}>
                                                    <option value="ALL">Tất cả hạng mục</option>
                                                    {(registeringEvent.tracks || []).map((track) => (
                                                        <option key={track.id} value={track.id}>{track.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                                                {filteredTeams.map((item) => (
                                                    <article key={item.id} className="feature-card flex flex-col h-full border border-[#d7e6f8] rounded-xl p-4 bg-slate-50/50 shadow-sm">
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
                                                {filteredTeams.length === 0 && (
                                                    <p className="col-span-full text-center text-sm text-slate-500 py-8">Không có đội thi nào phù hợp trong lobby.</p>
                                                )}
                                            </div>
                                        </section>
                                    ) : (
                                        <section className="rounded-lg border border-[#d7e6f8] bg-white p-6">
                                            <form onSubmit={handleCreateTeam} className="space-y-5">
                                                <div className="grid gap-5 md:grid-cols-2">
                                                    <div className="md:col-span-2">
                                                        <label className="mb-1 block text-sm font-bold text-[#0b1f3f]">Tên team</label>
                                                        <input required className="input-custom" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                                                    </div>
                                                </div>
                                                <div className="grid gap-5 md:grid-cols-2">
                                                    <div className="md:col-span-2">
                                                        <label className="mb-1 block text-sm font-bold text-[#0b1f3f]">Mô tả đội</label>
                                                        <textarea className="input-custom min-h-[100px]" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Kỹ năng, mục tiêu, hoặc ý tưởng dự án..." />
                                                    </div>
                                                </div>

                                                <div className="grid gap-5 md:grid-cols-2">
                                                    <div>
                                                        <label className="mb-1 block text-sm font-bold text-[#0b1f3f]">Hạng mục</label>
                                                        <select required className="input-custom" value={formData.trackId} onChange={(e) => setFormData({ ...formData, trackId: e.target.value })}>
                                                            {(registeringEvent.tracks || []).map((track) => <option key={track.id} value={track.id}>{track.name}</option>)}
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
                                                        Mời thành viên khác (Tối thiểu 2 người, tối đa 4)
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
                                                <button type="submit" disabled={creating} className="btn-primary w-full">{creating ? 'Đang tạo...' : 'Tạo đội'}</button>
                                            </form>
                                        </section>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })()
            ) : (
                /* VIEW 3: DASHBOARD CHÍNH (Chỉ hiển thị danh sách Đội đang tham gia & các giải đấu có thể đăng ký) */
                <>
                    {myInvitations.length > 0 && (
                        <div className="mb-8 rounded-2xl border-2 border-blue-400 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 shadow-md animate-fade-in">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-black uppercase tracking-[0.06em] text-[#071936] flex items-center gap-2">
                                        <span className="flex h-3 w-3 rounded-full bg-blue-600 animate-ping"></span>
                                        Lời mời gia nhập đội ({myInvitations.length})
                                    </h2>
                                    <p className="text-xs text-[#5c6d83] mt-1 font-semibold">
                                        Bạn có lời mời tham gia đội thi. Bạn có quyền chấp nhận hoặc từ chối lời mời bên dưới.
                                    </p>
                                </div>
                            </div>
                            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {myInvitations.map((inv) => (
                                    <div key={inv.id} className="rounded-xl border border-[#d7e6f8] bg-white p-5 shadow-sm flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-start justify-between gap-2">
                                                <h3 className="font-black text-[#071936] text-base">{inv.teamName}</h3>
                                                <span className="rounded-full bg-blue-50 border border-blue-100 px-2 py-0.5 text-[10px] font-bold text-[#0f63c9] shrink-0 uppercase tracking-wider">
                                                    {inv.trackName || 'Hạng mục'}
                                                </span>
                                            </div>
                                            <p className="mt-2 text-xs text-[#5c6d83] font-semibold">
                                                Giải đấu: <strong className="text-[#071936]">{inv.eventName || 'Sự kiện'}</strong>
                                            </p>
                                            {inv.inviterName && (
                                                <p className="mt-1 text-xs text-[#5c6d83] font-semibold">
                                                    Người mời: <strong className="text-[#071936]">{inv.inviterName}</strong>
                                                </p>
                                            )}
                                        </div>
                                        <div className="mt-5 flex gap-2 pt-4 border-t border-[#f0f4f8]">
                                            <button
                                                type="button"
                                                onClick={() => handleAcceptInvitation(inv.id)}
                                                className="btn-primary py-1.5 px-4 text-xs bg-emerald-600 hover:bg-emerald-700 hover:border-emerald-700 text-white flex-1 font-bold cursor-pointer"
                                            >
                                                ✓ Chấp nhận
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleRejectInvitation(inv.id)}
                                                className="btn-secondary py-1.5 px-4 text-xs text-red-600 border-red-200 hover:bg-red-50 flex-1 font-bold cursor-pointer"
                                            >
                                                ✕ Từ chối
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* SECTION 1: DANH SÁCH ĐỘI THI ĐÃ THAM GIA */}
                    <div className="mb-10 rounded-3xl border border-blue-200/80 bg-gradient-to-br from-blue-50/70 via-indigo-50/30 to-white p-6 sm:p-8 shadow-sm space-y-6">
                        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-blue-100">
                            <div>
                                <div className="flex items-center gap-2.5">
                                    <span className="p-2 rounded-xl bg-[#0f63c9] text-white shadow-md shadow-blue-500/20">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                    </span>
                                    <h2 className="text-xl sm:text-2xl font-black text-[#0b1f3f]">Đội thi của bạn</h2>
                                </div>
                                <p className="text-xs sm:text-sm text-[#5c6d83] font-medium mt-1">Bấm vào đội thi để xem chi tiết, quản lý thành viên và nộp bài</p>
                            </div>
                            <span className="px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider text-[#0f63c9] bg-blue-100/80 border border-blue-200 shadow-inner">
                                {myTeams.length} Đội thi
                            </span>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {myTeams.map((item) => {
                                const isLeaderOfItem = item.members?.some(m => m.email === currentEmail && m.role === 'LEADER');
                                const isOfficial = (item.memberCount || item.members?.length || 0) >= 3;
                                return (
                                    <button
                                        type="button"
                                        key={item.id}
                                        onClick={() => handleSelectTeam(item)}
                                        className="group text-left p-5 rounded-2xl border border-blue-100/90 bg-white hover:border-[#0f63c9] hover:shadow-[0_8px_25px_rgba(15,99,201,0.14)] hover:-translate-y-1 transition-all duration-300 cursor-pointer relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 h-16 w-16 bg-gradient-to-bl from-blue-400/10 to-transparent rounded-bl-full pointer-events-none group-hover:from-blue-500/20 transition-colors" />
                                        <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-[#0f63c9] bg-blue-50/90 border border-blue-200/80 px-2.5 py-0.5 rounded-full mb-2">
                                            {item.eventName}
                                        </span>
                                        <h3 className="text-base font-black text-[#0b1f3f] group-hover:text-[#0f63c9] transition-colors line-clamp-1">{item.name}</h3>
                                        <p className="text-xs text-[#5c6d83] mt-1 font-semibold">{item.trackName}</p>
                                        <div className="mt-4 flex items-center justify-between pt-3 border-t border-blue-100/80">
                                            <div className="flex items-center gap-1.5 text-xs text-[#5c6d83] font-bold">
                                                <span>{item.memberCount || 0} TV</span>
                                                {isOfficial ? (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                                        <span className="pulsing-dot-green shrink-0" />
                                                        Chính thức
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                                        <span className="pulsing-dot-amber shrink-0" />
                                                        Chưa chính thức
                                                    </span>
                                                )}
                                            </div>
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                                                isLeaderOfItem ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-slate-100 text-slate-700 border border-slate-200'
                                            }`}>
                                                {isLeaderOfItem ? 'Leader' : 'Member'}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                            {myTeams.length === 0 && (
                                <div className="sm:col-span-2 lg:col-span-3 bg-white border border-dashed border-[#d7e6f8] rounded-xl p-8 text-center text-[#5c6d83]">
                                    Bạn chưa tham gia đội thi nào. Hãy đăng ký giải đấu bên dưới để bắt đầu!
                                </div>
                            )}
                        </div>
                    </div>

                    {/* SECTION 2: ĐĂNG KÝ GIẢI ĐẤU KHÁC */}
                    {availableEventsToRegister.length > 0 && (
                        <div className="mb-10 rounded-3xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50/70 via-teal-50/30 to-white p-6 sm:p-8 shadow-sm space-y-6">
                            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-emerald-100">
                                <div>
                                    <div className="flex items-center gap-2.5">
                                        <span className="p-2 rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-500/20">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </span>
                                        <h2 className="text-xl sm:text-2xl font-black text-emerald-950">Đăng ký giải đấu khác</h2>
                                    </div>
                                    <p className="text-xs sm:text-sm text-emerald-800/80 font-medium mt-1">Danh sách các giải đấu đang mở cổng đăng ký. Click vào giải đấu để tạo đội hoặc tìm đội.</p>
                                </div>
                                <span className="px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider text-emerald-800 bg-emerald-100/90 border border-emerald-300 shadow-inner">
                                    {availableEventsToRegister.length} Mùa giải mới
                                </span>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {availableEventsToRegister.map((event) => (
                                    <button
                                        type="button"
                                        key={event.id}
                                        onClick={() => handleSelectEventToRegister(event.id)}
                                        className="group text-left p-5 rounded-2xl border border-emerald-200/90 bg-white hover:border-emerald-500 hover:shadow-[0_8px_25px_rgba(16,185,129,0.15)] hover:-translate-y-1 transition-all duration-300 cursor-pointer relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 h-16 w-16 bg-gradient-to-bl from-emerald-400/10 to-transparent rounded-bl-full pointer-events-none group-hover:from-emerald-500/20 transition-colors" />
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-black text-emerald-700 border border-emerald-200/80 uppercase tracking-wider mb-2">
                                            <span className="pulsing-dot-green shrink-0" />
                                            Đang mở đăng ký
                                        </span>
                                        <h3 className="text-base font-black text-[#0b1f3f] group-hover:text-emerald-700 transition-colors line-clamp-1">{event.name}</h3>
                                        <p className="text-xs text-[#5c6d83] mt-1 line-clamp-2 min-h-[32px]">{event.description || 'Chưa có mô tả ngắn cho giải đấu.'}</p>
                                        <div className="mt-4 flex items-center justify-between border-t border-emerald-100/80 pt-3">
                                            <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">
                                                Hạn: {new Date(event.regEndDate).toLocaleDateString('vi-VN')}
                                            </span>
                                            <span className="text-xs font-black text-emerald-700 group-hover:translate-x-1 inline-flex items-center gap-1 transition-transform">
                                                Đăng ký ngay
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* privateTeam PIN modal & confirmModal shared globally */}
            {privateTeam && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
                    <form onSubmit={handlePrivateJoin} className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl border border-[#d7e6f8]">
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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
                    <div className={`w-full max-w-md rounded-lg bg-white p-6 shadow-xl border ${confirmModal.isError ? 'border-red-200' : 'border-[#d7e6f8]'}`}>
                        <h3 className={`text-lg font-black uppercase tracking-[0.08em] ${confirmModal.isError ? 'text-red-600' : 'text-[#071936]'}`}>
                            {confirmModal.title}
                        </h3>
                        <p className={`mt-4 text-sm leading-relaxed ${confirmModal.isError ? 'text-red-600 bg-red-50 border border-red-100 p-4 rounded-lg font-semibold' : 'text-[#5c6d83]'}`}>
                            {confirmModal.message}
                        </p>
                        <div className="mt-6 flex gap-3">
                            {confirmModal.isAlert ? (
                                <button 
                                    type="button" 
                                    onClick={() => setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null })} 
                                    className={`btn-primary flex-1 ${confirmModal.isError ? '!bg-red-600 hover:!bg-red-700 text-white' : ''}`}
                                >
                                    Đồng ý
                                </button>
                            ) : (
                                <>
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
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
