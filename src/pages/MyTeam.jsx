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
    const [teamPage, setTeamPage] = useState(0);
    const [eventCarouselPage, setEventCarouselPage] = useState(0);
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

    // Kiểm tra mốc thời gian thi đấu của 2 sự kiện có bị chồng chéo (trùng) hay không
    const isTimelineOverlapping = (eventA, eventB) => {
        if (!eventA || !eventB) return false;
        const startA = eventA.eventStartDate || eventA.regStartDate;
        const endA = eventA.eventEndDate || eventA.regEndDate;
        const startB = eventB.eventStartDate || eventB.regStartDate;
        const endB = eventB.eventEndDate || eventB.regEndDate;

        if (!startA || !endA || !startB || !endB) return false;

        const tStartA = new Date(startA).getTime();
        const tEndA = new Date(endA).getTime();
        const tStartB = new Date(startB).getTime();
        const tEndB = new Date(endB).getTime();

        return tStartA <= tEndB && tEndA >= tStartB;
    };

    const availableEventsToRegister = useMemo(() => {
        const joinedEvents = events.filter((e) =>
            myTeams.some((t) => String(t.eventId) === String(e.id))
        );

        return activeOrUpcomingEvents.filter((event) => {
            // 1. Chặn các giải mà thí sinh ĐÃ THAM GIA rồi
            const alreadyJoined = joinedEvents.some((e) => String(e.id) === String(event.id));
            if (alreadyJoined) return false;

            // 2. Chặn các giải BỊ TRÙNG THỜI GIAN THI ĐẤU với bất kỳ giải nào thí sinh đã tham gia trước đó
            const hasTimeConflict = joinedEvents.some((joinedEvent) =>
                isTimelineOverlapping(event, joinedEvent)
            );

            return !hasTimeConflict;
        });
    }, [activeOrUpcomingEvents, myTeams, events]);

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
                    {/* Hero Section: Tên Đội thi trên cùng -> Sự kiện & Nút Lobby phía dưới */}
                    <section className="bg-white border border-slate-200 border-l-[6px] border-l-[#007EFA] rounded-xl p-6 sm:p-8 shadow-sm space-y-5 relative overflow-hidden">
                        {/* Hàng 1 (TRÊN HẾT): Thumbnail Devpost + Tên Đội Thi + Sub-info Track Badge + Trạng thái */}
                        <div className="flex flex-col sm:flex-row items-start gap-5">
                            {/* Devpost Style Square Team Avatar */}
                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-slate-900 text-white font-black text-xl flex flex-col items-center justify-center shrink-0 border border-slate-800 shadow-sm uppercase tracking-wider select-none">
                                <span className="text-[#007EFA] text-2xl sm:text-3xl font-black">{team.name ? team.name.charAt(0) : 'T'}</span>
                                <span className="text-[9px] font-bold text-slate-400 -mt-1">TEAM</span>
                            </div>

                            <div className="flex-1 space-y-2 w-full">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                                        {team.name}
                                    </h1>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="bg-slate-100 text-slate-800 text-[10px] font-black uppercase px-2.5 py-1 rounded border border-slate-200">
                                            {team.type}
                                        </span>
                                        {(team.members?.length || team.memberCount || 0) >= 3 ? (
                                            <span className="bg-[#16b889] text-white font-black px-2.5 py-1 rounded text-[10px] uppercase tracking-wide flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                                Đội chính thức
                                            </span>
                                        ) : (
                                            <span className="bg-amber-500 text-white font-black px-2.5 py-1 rounded text-[10px] uppercase tracking-wide flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                                Chưa đủ 3 TV
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {team.trackName && (
                                    <span className="inline-block bg-blue-50 text-[#007EFA] border border-blue-200 text-xs font-black px-3 py-0.5 rounded">
                                        {team.trackName}
                                    </span>
                                )}

                                <p className="text-sm text-slate-600 font-medium leading-relaxed">
                                    {team.description || 'Đội chưa thêm mô tả ngắn.'}
                                </p>
                            </div>
                        </div>

                        {/* Hàng 2 (PHÍA DƯỚI): Sự Kiện (Trái) + Xem các Đội thi khác (Phải - Devpost Style) */}
                        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                                <span className="flex h-7 w-7 items-center justify-center rounded bg-slate-900 text-white text-xs font-bold shrink-0">
                                    📅
                                </span>
                                <span className="text-xs sm:text-sm font-bold tracking-tight text-slate-900">
                                    {team.eventName || 'Chưa gắn giải đấu'}
                                </span>
                            </div>

                            <Link 
                                to={`/teams?eventId=${team.eventId}`} 
                                className="inline-flex items-center gap-1.5 text-xs font-black text-[#007EFA] bg-blue-50/80 hover:bg-[#007EFA] hover:text-white border border-blue-200 px-3.5 py-1.5 rounded transition-all duration-200 shadow-2xs group shrink-0 cursor-pointer"
                            >
                                <svg className="w-4 h-4 text-[#007EFA] group-hover:text-white transition-transform group-hover:rotate-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94-3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                                </svg>
                                <span>Xem các Đội thi khác</span>
                                <svg className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                                </svg>
                            </Link>
                        </div>
                    </section>

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
                            <div className="flex items-center justify-between gap-3 mb-4">
                                <h2 className="text-lg font-black uppercase tracking-[0.08em] text-[#071936]">Đề thi và nộp bài</h2>
                                <span className="text-xs font-bold text-[#5c6d83] bg-blue-50 border border-blue-100 px-3 py-1 rounded-full">
                                    Thành viên & Leader có thể chọn vòng để xem lại bài nộp
                                </span>
                            </div>

                            {matrices.length === 0 ? (
                                <p className="mt-4 text-sm text-[#5c6d83]">Coordinator chưa thêm đề thi/guideline cho hạng mục này.</p>
                            ) : (
                                <div>
                                    {/* === ROUND STEPPER / TABS BAR === */}
                                    <div className="flex flex-wrap gap-2 mb-5 border-b border-[#cbd5e1] pb-3">
                                        {matrices.map((matrix) => {
                                            const isSelected = String(matrix.id) === String(formData.matrixId);
                                            const sub = submissionsMap[String(matrix.id)];
                                            const hasSub = Boolean(sub && sub.fileUrl);
                                            const isGraded = Boolean(sub && sub.graded);

                                            return (
                                                <button
                                                    key={matrix.id}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, matrixId: String(matrix.id) })}
                                                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer border ${
                                                        isSelected
                                                            ? 'bg-[#0f63c9] text-white border-[#0f63c9] shadow-md scale-105'
                                                            : 'bg-[#f8fafc] text-slate-700 border-slate-200 hover:bg-blue-50 hover:text-[#0f63c9]'
                                                    }`}
                                                >
                                                    <span>{matrix.roundName}</span>
                                                    {isGraded ? (
                                                        <span className="text-[10px] bg-emerald-500 text-white px-1.5 py-0.5 rounded-full font-bold">✓ Đã chấm</span>
                                                    ) : hasSub ? (
                                                        <span className="text-[10px] bg-blue-500 text-white px-1.5 py-0.5 rounded-full font-bold">✓ Đã nộp</span>
                                                    ) : null}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* === GUIDELINE / PROMPT DOWNLOAD CARD === */}
                                    {selectedMatrix && (
                                        <div className="mb-5 rounded-xl border border-blue-100 bg-[#f8fafc] p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-xs">
                                            <div>
                                                <p className="text-xs font-black uppercase text-[#0f63c9]">Đề bài {selectedMatrix.roundName}</p>
                                                <p className="text-sm font-bold text-slate-800 mt-0.5">{selectedMatrix.trackName || 'Bảng thi'}</p>
                                                {selectedMatrix.submissionDeadline && (
                                                    <p className="text-xs font-semibold text-slate-500 mt-1">Hạn nộp: {formatDateTime(selectedMatrix.submissionDeadline)}</p>
                                                )}
                                            </div>
                                            {selectedMatrix.guidelineUrl ? (
                                                <a href={selectedMatrix.guidelineUrl} target="_blank" rel="noreferrer" className="btn-primary py-2 px-4 text-xs shrink-0 flex items-center gap-1.5">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                                    Tải Đề bài / Quy chế Vòng này
                                                </a>
                                            ) : (
                                                <span className="text-xs text-slate-400 font-semibold italic">Chưa có link đề bài</span>
                                            )}
                                        </div>
                                    )}

                                    {/* === PAST ROUND REVIEW CARD (If scored or graded) === */}
                                    {submission && submission.graded && (
                                        <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-black uppercase tracking-wider text-emerald-800">Kết quả chấm điểm Vòng này</span>
                                                {submission.score != null && (
                                                    <span className="text-sm font-black bg-emerald-600 text-white px-3 py-1 rounded-full shadow-xs">
                                                        {submission.score} / 100 điểm
                                                    </span>
                                                )}
                                            </div>
                                            {submission.feedback && (
                                                <div className="mt-2 text-xs text-slate-700 bg-white p-3 rounded-lg border border-emerald-100">
                                                    <strong>Nhận xét từ Giám khảo:</strong> {submission.feedback}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <form onSubmit={handleSubmission} className="space-y-5">
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
                                            {!isLeader ? 'Chỉ Team Leader mới được sửa / nộp bài' : savingSubmission ? 'Đang lưu...' : !isEventStarted ? 'Giải đấu chưa bắt đầu' : !isPreviousRoundEnded ? 'Vòng trước chưa kết thúc' : !isSubmissionStarted ? 'Cổng nộp bài chưa mở' : isSubmissionEnded ? 'Đã hết hạn nộp bài' : submission ? 'Cập nhật bài nộp' : 'Nộp bài'}
                                        </button>
                                        {submitError && <p className="mt-2 text-sm font-semibold text-red-600">{submitError}</p>}
                                        {submitSuccess && <p className="mt-2 text-sm font-semibold text-green-600">{submitSuccess}</p>}
                                    </form>
                                </div>
                            )}
                        </div>

                        <div className="team-members-panel rounded-lg border border-[#d7e6f8] bg-white p-6">
                            <div className="flex items-center justify-between gap-3">
                                <h2 className="text-lg font-black uppercase tracking-[0.08em] text-[#071936]">Thành viên ({team.members?.length || 0})</h2>
                                <div className="flex flex-wrap items-center gap-2">
                                    {isLeader ? (
                                        <>
                                            {/* Nút 1: Quản lý thành viên (Gear Icon) */}
                                            <div className="relative group inline-block">
                                                <button 
                                                    type="button" 
                                                    onClick={() => setShowActions((value) => !value)} 
                                                    aria-label="Quản lý thành viên"
                                                    className={`flex items-center justify-center rounded-xl p-2.5 transition-all duration-200 cursor-pointer border ${
                                                        showActions 
                                                            ? 'bg-[#0f63c9] text-white border-[#0f63c9] shadow-md scale-105' 
                                                            : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-blue-50 hover:border-blue-300 hover:text-[#0f63c9]'
                                                    }`}
                                                >
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    </svg>
                                                </button>
                                                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-20 whitespace-nowrap">
                                                    <div className="bg-[#0b1f3f] text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-lg">
                                                        {showActions ? 'Đóng menu quản lý' : 'Quản lý thành viên'}
                                                    </div>
                                                    <div className="w-2 h-2 bg-[#0b1f3f] rotate-45 mx-auto -mt-1" />
                                                </div>
                                            </div>

                                            {/* Nút 2: Giải tán đội thi (Trash Icon) */}
                                            <div className="relative group inline-block">
                                                <button 
                                                    type="button" 
                                                    onClick={handleDisbandTeam} 
                                                    aria-label="Giải tán đội thi"
                                                    className="flex items-center justify-center rounded-xl border border-red-200 bg-red-50 hover:bg-red-600 hover:border-red-600 hover:text-white text-red-600 p-2.5 transition-all duration-200 cursor-pointer shadow-xs"
                                                >
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-20 whitespace-nowrap">
                                                    <div className="bg-red-900 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-lg">
                                                        Giải tán đội thi
                                                    </div>
                                                    <div className="w-2 h-2 bg-red-900 rotate-45 mx-auto -mt-1" />
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        /* Nút 3: Rời khỏi đội (LogOut Icon) */
                                        <div className="relative group inline-block">
                                            <button 
                                                type="button" 
                                                onClick={handleLeave} 
                                                aria-label="Rời khỏi đội thi"
                                                className="flex items-center justify-center rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-600 hover:border-amber-600 hover:text-white text-amber-700 p-2.5 transition-all duration-200 cursor-pointer shadow-xs"
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                                </svg>
                                            </button>
                                            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-20 whitespace-nowrap">
                                                <div className="bg-amber-950 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-lg">
                                                    Rời khỏi đội thi
                                                </div>
                                                <div className="w-2 h-2 bg-amber-950 rotate-45 mx-auto -mt-1" />
                                            </div>
                                        </div>
                                    )}
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
                /* VIEW 2: ĐĂNG KÝ GIẢI ĐẤU MỚI (MÀN HÌNH TẠO ĐỘI / TÌM ĐỘI CHUẨN DEVPOST) */
                (() => {
                    const registeringEvent = events.find(e => String(e.id) === String(registeringEventId));
                    if (!registeringEvent) {
                        return (
                            <div className="rounded-3xl bg-white border border-slate-200 p-8 text-center text-slate-500 font-medium shadow-sm">
                                Giải đấu không tồn tại hoặc đã đóng.
                                <button type="button" onClick={() => setRegisteringEventId(null)} className="mt-4 block mx-auto text-xs font-black text-[#007EFA]">
                                    ← Quay lại danh sách giải đấu
                                </button>
                            </div>
                        );
                    }
                    return (
                        <div className="space-y-6">
                            <div className="w-full rounded-3xl bg-white p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-100">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#16b889] border border-emerald-200/80 flex items-center justify-center shrink-0 shadow-xs">
                                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="inline-flex items-center rounded-md bg-emerald-50 text-[#0c7053] border border-emerald-200 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider">
                                                    Đăng ký giải đấu
                                                </span>
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                                                    {registeringEvent.season || 'SEASON'} {registeringEvent.year || ''}
                                                </span>
                                            </div>
                                            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{registeringEvent.name}</h2>
                                            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">{registeringEvent.description || 'Chưa có mô tả ngắn cho giải đấu.'}</p>
                                        </div>
                                    </div>
                                    <Link
                                        to={`/events/${registeringEvent.id}`}
                                        className="group inline-flex items-center gap-2 rounded-xl bg-emerald-50 hover:bg-[#16b889] text-[#0c7053] hover:text-white border border-emerald-200/80 px-4 py-2.5 text-xs font-black transition-all shrink-0 w-fit"
                                    >
                                        <span>Xem chi tiết sự kiện</span>
                                        <svg className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                        </svg>
                                    </Link>
                                </div>

                                {/* TAB CHUYỂN ĐỔI: TÌM ĐỘI VS TẠO ĐỘI (EMERALD THEME) */}
                                <div className="grid gap-3 sm:grid-cols-2 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/60">
                                    <button
                                        type="button"
                                        onClick={() => setMode('FIND')}
                                        className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${
                                            mode === 'FIND'
                                                ? 'bg-[#16b889] text-white shadow-md shadow-emerald-500/20'
                                                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                                        }`}
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                        Tìm đội thi có sẵn
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setMode('CREATE')}
                                        className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${
                                            mode === 'CREATE'
                                                ? 'bg-[#16b889] text-white shadow-md shadow-emerald-500/20'
                                                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                                        }`}
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                        </svg>
                                        Tạo đội thi mới
                                    </button>
                                </div>

                                <div className="pt-2">
                                    {mode === 'FIND' ? (
                                        <div className="space-y-6">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                                                <div>
                                                    <h3 className="text-lg font-black text-slate-900">Sảnh chờ Đội thi (Lobby)</h3>
                                                    <p className="text-xs text-slate-500 font-medium">Danh sách các đội thi đang mở tuyển thành viên cho giải đấu này.</p>
                                                </div>
                                                <div className="w-full sm:w-auto">
                                                    <select
                                                        className="input-custom min-w-[220px] text-xs font-bold text-slate-700 bg-slate-50 border-slate-200 rounded-xl"
                                                        value={teamFilter}
                                                        onChange={(e) => setTeamFilter(e.target.value)}
                                                    >
                                                        <option value="ALL">Tất cả hạng mục</option>
                                                        {(registeringEvent.tracks || []).map((track) => (
                                                            <option key={track.id} value={track.id}>{track.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                                                {filteredTeams.map((item) => (
                                                    <article key={item.id} className="group text-left p-5 rounded-2xl bg-white border border-slate-200 hover:border-[#16b889] shadow-xs hover:shadow-md transition-all flex flex-col justify-between min-h-[200px]">
                                                        <div>
                                                            <div className="flex items-start gap-3 mb-3">
                                                                <div className="w-11 h-11 rounded-xl bg-slate-900 text-white font-black flex flex-col items-center justify-center shrink-0 shadow-xs">
                                                                    <span className="text-sm font-black text-[#007EFA] leading-none">{item.name ? item.name.charAt(0).toUpperCase() : 'T'}</span>
                                                                    <span className="text-[7px] font-black text-slate-400 tracking-tighter uppercase mt-0.5">TEAM</span>
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center justify-between gap-1 mb-1">
                                                                        <h3 className="text-base font-black text-slate-900 group-hover:text-[#16b889] transition-colors truncate" title={item.name}>{item.name}</h3>
                                                                        <span className="text-[10px] font-bold text-slate-400 shrink-0">
                                                                            {item.type === 'PRIVATE' ? '🔒 Private' : '🌐 Public'}
                                                                        </span>
                                                                    </div>
                                                                    <span className="inline-block text-[10px] font-black text-[#007EFA] bg-blue-50 border border-blue-200/80 px-2.5 py-0.5 rounded-md">
                                                                        {item.trackName || 'General Track'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <p className="text-xs text-slate-500 line-clamp-2 font-medium leading-relaxed">{item.description || 'Đội thi đang mở tuyển thành viên thi đấu.'}</p>
                                                        </div>

                                                        <div className="mt-4 pt-3 border-t border-slate-100">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleJoin(item)}
                                                                className="w-full bg-[#16b889] hover:bg-[#129a73] text-white font-black text-xs py-2.5 px-4 rounded-xl shadow-md shadow-emerald-500/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                                                            >
                                                                <span>{item.type === 'PRIVATE' ? 'Nhập mã PIN' : 'Gửi yêu cầu gia nhập'}</span>
                                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                                                </svg>
                                                            </button>
                                                            {lobbyActionStatus.teamId === item.id && lobbyActionStatus.message && (
                                                                <p className={`mt-2 text-xs font-bold text-center ${
                                                                    lobbyActionStatus.type === 'success' ? 'text-emerald-600' :
                                                                    lobbyActionStatus.type === 'error' ? 'text-red-600' : 'text-[#16b889]'
                                                                }`}>
                                                                    {lobbyActionStatus.message}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </article>
                                                ))}
                                                {filteredTeams.length === 0 && (
                                                    <div className="col-span-full text-center text-sm text-slate-500 py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                                        Chưa có đội thi nào mở tuyển trong sảnh chờ hạng mục này. Hãy chuyển sang Tab <strong className="text-[#16b889]">"Tạo đội thi mới"</strong> để trở thành Đội trưởng!
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <form onSubmit={handleCreateTeam} className="space-y-6">
                                            <div>
                                                <label className="mb-1.5 block text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider">Tên Đội Thi *</label>
                                                <input
                                                    required
                                                    className="input-custom text-sm font-semibold rounded-xl border-slate-200 focus:border-[#16b889] focus:ring-[#16b889]"
                                                    placeholder="Nhập tên đội thi ấn tượng của bạn..."
                                                    value={formData.name}
                                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                />
                                            </div>

                                            <div>
                                                <label className="mb-1.5 block text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider">Mô Tả Ý TƯỞNG / ĐỘI THI</label>
                                                <textarea
                                                    className="input-custom min-h-[100px] text-sm font-medium rounded-xl border-slate-200 focus:border-[#16b889] focus:ring-[#16b889]"
                                                    value={formData.description}
                                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                    placeholder="Mô tả ngắn về kỹ năng mong muốn, mục tiêu hoặc ý tưởng dự án..."
                                                />
                                            </div>

                                            <div className="grid gap-5 md:grid-cols-2">
                                                <div>
                                                    <label className="mb-1.5 block text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider">Hạng Mục Thi Đấu *</label>
                                                    <select
                                                        required
                                                        className="input-custom text-sm font-bold rounded-xl border-slate-200 focus:border-[#16b889]"
                                                        value={formData.trackId}
                                                        onChange={(e) => setFormData({ ...formData, trackId: e.target.value })}
                                                    >
                                                        {(registeringEvent.tracks || []).map((track) => (
                                                            <option key={track.id} value={track.id}>{track.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="mb-1.5 block text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider">Chế Độ Tham Gia *</label>
                                                    <select
                                                        className="input-custom text-sm font-bold rounded-xl border-slate-200 focus:border-[#16b889]"
                                                        value={formData.type}
                                                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                                    >
                                                        <option value="PUBLIC">Public</option>
                                                        <option value="PRIVATE">Private</option>
                                                    </select>
                                                </div>
                                            </div>

                                            {formData.type === 'PRIVATE' && (
                                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                    <div>
                                                        <label className="block text-xs font-black text-slate-900 uppercase tracking-wider">Mã PIN 4 số riêng tư *</label>
                                                        <p className="text-xs text-slate-500 font-medium mt-0.5">Thành viên khác cần nhập đúng mã PIN này mới xin gia nhập đội được</p>
                                                    </div>
                                                    <input
                                                        className="input-custom max-w-[140px] font-mono font-black text-base text-center tracking-widest rounded-xl border-slate-300 focus:border-[#16b889] bg-white shadow-xs"
                                                        inputMode="numeric"
                                                        maxLength={4}
                                                        placeholder="1234"
                                                        value={formData.joinPassword}
                                                        onChange={(e) => setFormData({ ...formData, joinPassword: e.target.value.replace(/\D/g, '') })}
                                                    />
                                                </div>
                                            )}

                                            <div className="pt-4 border-t border-slate-100 space-y-4">
                                                <div className="flex flex-wrap items-center justify-between gap-2">
                                                    <label className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider">
                                                        Mời Thành Viên Thi Đấu (Yêu cầu tối thiểu 3 TV)
                                                    </label>
                                                    <span className="text-[11px] font-bold text-[#0c7053] bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200/80">
                                                        Tối thiểu 2 email (tối đa 4)
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-500 font-medium">Đội của bạn phải có đủ từ 3 thành viên trở lên để chính thức thi đấu (gồm bạn và ít nhất 2 thành viên khác).</p>
                                                
                                                <div className="grid gap-3">
                                                    {memberEmails.map((email, index) => (
                                                        <div key={index} className="flex items-center gap-2">
                                                            <input
                                                                type="email"
                                                                placeholder={`Email thành viên ${index + 1} ${index < 2 ? '(Bắt buộc)' : '(Tùy chọn)'}`}
                                                                required={index < 2}
                                                                className="input-custom flex-1 text-sm rounded-xl border-slate-200 focus:border-[#16b889]"
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
                                                                    className="rounded-xl bg-red-50 border border-red-200/80 px-3.5 py-2.5 text-xs font-bold text-red-600 hover:bg-red-100 transition-colors cursor-pointer shrink-0"
                                                                    onClick={() => {
                                                                        const newEmails = memberEmails.filter((_, i) => i !== index);
                                                                        setMemberEmails(newEmails);
                                                                        setEmailsError('');
                                                                    }}
                                                                >
                                                                    ✕ Xóa
                                                                </button>
                                                            )}
                                                        </div>
                                                    ))}
                                                    {memberEmails.length < 4 && (
                                                        <button
                                                            type="button"
                                                            className="inline-flex items-center gap-1.5 text-xs font-black text-[#0c7053] bg-emerald-50 hover:bg-[#16b889] hover:text-white border border-emerald-200/80 px-4 py-2.5 rounded-xl transition-all cursor-pointer w-fit mt-1 shadow-2xs"
                                                            onClick={() => setMemberEmails([...memberEmails, ''])}
                                                        >
                                                            <span>+ Thêm ô nhập email</span>
                                                        </button>
                                                    )}
                                                    {emailsError && <p className="mt-1 text-xs font-bold text-red-600">{emailsError}</p>}
                                                </div>
                                            </div>

                                            {createError && <p className="text-sm font-bold text-red-600 bg-red-50 p-3 rounded-xl border border-red-200">{createError}</p>}
                                            <button
                                                type="submit"
                                                disabled={creating}
                                                className="w-full bg-[#16b889] hover:bg-[#129a73] text-white font-black text-sm py-3.5 px-6 rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
                                            >
                                                {creating ? 'Đang khởi tạo đội thi...' : 'Tạo Đội Thi Ngay'}
                                            </button>
                                        </form>
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

                    {/* SECTION 1: DANH SÁCH ĐỘI THI ĐÃ THAM GIA (CAROUSEL SLIDER 2 ĐỘI / LƯỢT VỚI MŨI TÊN BÊN HÔNG THẦU TÚY) */}
                    {(() => {
                        const TEAMS_PER_PAGE = 2;
                        const totalTeamPages = Math.max(1, Math.ceil(myTeams.length / TEAMS_PER_PAGE));
                        const visibleTeams = myTeams.slice(teamPage * TEAMS_PER_PAGE, (teamPage + 1) * TEAMS_PER_PAGE);

                        return (
                            <div className="mb-10 rounded-3xl border border-blue-900/40 bg-gradient-to-br from-slate-900 via-[#0b2247] to-slate-950 p-6 sm:p-8 space-y-6 shadow-xl relative overflow-hidden">
                                {/* Ambient glow accent in background */}
                                <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-blue-500/20 via-orange-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

                                <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-slate-800/80 relative z-10">
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <span className="p-2.5 rounded-xl bg-[#007EFA] text-white shadow-lg shadow-blue-500/30 shrink-0">
                                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                </svg>
                                            </span>
                                            <div>
                                                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
                                                    Đội thi của bạn
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-bold">
                                                        <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                                                        Active
                                                    </span>
                                                </h2>
                                                <p className="text-xs sm:text-sm text-slate-300 font-medium mt-1">Bấm vào đội thi để xem chi tiết, quản lý thành viên và nộp bài dự thi</p>
                                            </div>
                                        </div>
                                    </div>

                                    <span className="px-4 py-1.5 rounded-xl bg-[#007EFA] text-white text-xs font-black uppercase tracking-wider shadow-md shadow-blue-500/30">
                                        {myTeams.length} Đội thi
                                    </span>
                                </div>

                                {/* Container Carousel với 2 Nút Mũi Tên nổi 2 bên hông */}
                                <div className="relative px-2 relative z-10">
                                    {/* Nút Mũi Tên Trái (Thuần mũi tên, bỏ viền ô) */}
                                    {myTeams.length > 2 && (
                                        <button
                                            type="button"
                                            disabled={teamPage === 0}
                                            onClick={() => setTeamPage(p => Math.max(0, p - 1))}
                                            className="absolute -left-6 sm:-left-8 top-1/2 -translate-y-1/2 z-20 p-2 text-slate-400 hover:text-white hover:scale-125 disabled:opacity-0 disabled:pointer-events-none transition-all duration-200 cursor-pointer"
                                            title="Đội thi trước"
                                        >
                                            <svg className="w-7 h-7 sm:w-8 sm:h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                                            </svg>
                                        </button>
                                    )}

                                    {/* Nút Mũi Tên Phải (Thuần mũi tên, bỏ viền ô) */}
                                    {myTeams.length > 2 && (
                                        <button
                                            type="button"
                                            disabled={teamPage >= totalTeamPages - 1}
                                            onClick={() => setTeamPage(p => Math.min(totalTeamPages - 1, p + 1))}
                                            className="absolute -right-6 sm:-right-8 top-1/2 -translate-y-1/2 z-20 p-2 text-slate-400 hover:text-white hover:scale-125 disabled:opacity-0 disabled:pointer-events-none transition-all duration-200 cursor-pointer"
                                            title="Đội thi tiếp theo"
                                        >
                                            <svg className="w-7 h-7 sm:w-8 sm:h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                            </svg>
                                        </button>
                                    )}

                                    {/* Lưới 2 Đội / Lượt side-by-side chuẩn sang trọng */}
                                    <div className="grid gap-5 grid-cols-1 md:grid-cols-2">
                                        {visibleTeams.map((item) => {
                                            const isLeaderOfItem = item.members?.some(m => m.email === currentEmail && m.role === 'LEADER');
                                            const isOfficial = (item.memberCount || item.members?.length || 0) >= 3;
                                            return (
                                                <button
                                                    type="button"
                                                    key={item.id}
                                                    onClick={() => handleSelectTeam(item)}
                                                    className="group text-left p-6 sm:p-7 rounded-2xl bg-white border-l-[8px] border-l-[#007EFA] shadow-xl hover:shadow-2xl hover:scale-[1.01] transition-all duration-300 cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[195px]"
                                                >
                                                    <div className="space-y-3">
                                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                                            <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-[#007EFA] bg-blue-50 border border-blue-200/80 px-3 py-1 rounded-lg">
                                                                {item.eventName}
                                                            </span>
                                                            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider ${
                                                                isLeaderOfItem ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-slate-100 text-slate-700 border border-slate-200'
                                                            }`}>
                                                                {isLeaderOfItem ? '👑 Leader' : 'Member'}
                                                            </span>
                                                        </div>

                                                        <h3 className="text-2xl sm:text-3xl font-black text-slate-900 group-hover:text-[#007EFA] transition-colors tracking-tight line-clamp-1">{item.name}</h3>
                                                        <p className="text-xs sm:text-sm text-slate-500 font-semibold">{item.trackName || 'Chưa phân hạng mục'}</p>
                                                    </div>

                                                    <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-100">
                                                        <div className="flex items-center gap-2.5 text-xs sm:text-sm font-bold text-slate-700">
                                                            <span className="text-slate-900 font-black text-sm sm:text-base">{item.memberCount || 0} Thành viên</span>
                                                            {isOfficial ? (
                                                                <span className="bg-[#16b889] text-white font-black px-2.5 py-1 rounded-md text-[10px] uppercase tracking-wide flex items-center gap-1">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                                                    Chính thức
                                                                </span>
                                                            ) : (
                                                                <span className="bg-amber-500 text-white font-black px-2.5 py-1 rounded-md text-[10px] uppercase tracking-wide flex items-center gap-1">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                                                    Chưa đủ 3 TV
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className="text-xs sm:text-sm font-black text-[#007EFA] bg-blue-50 border border-blue-200/80 group-hover:bg-[#007EFA] group-hover:text-white group-hover:border-[#007EFA] group-hover:translate-x-1 transition-all inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl shadow-2xs">
                                                            <span>Xem đội</span>
                                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                                                            </svg>
                                                        </span>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                        {myTeams.length === 0 && (
                                            <div className="sm:col-span-2 bg-slate-800/60 border border-dashed border-slate-700 rounded-2xl p-8 text-center text-slate-300 font-medium">
                                                Bạn chưa tham gia đội thi nào. Hãy chọn giải đấu bên dưới để bắt đầu đăng ký!
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Thanh Dấu Chấm Chuyển Trang (Dot Indicators) Mềm Mại */}
                                {totalTeamPages > 1 && (
                                    <div className="flex items-center justify-center gap-2 pt-2 relative z-10">
                                        {Array.from({ length: totalTeamPages }).map((_, idx) => (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => setTeamPage(idx)}
                                                className={`h-2 rounded-full transition-all cursor-pointer ${
                                                    teamPage === idx ? 'w-6 bg-[#007EFA]' : 'w-2 bg-slate-700 hover:bg-slate-600'
                                                }`}
                                                title={`Trang ${idx + 1}`}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })()}

                    {/* SECTION 2: ĐĂNG KÝ GIẢI ĐẤU KHÁC (SLIDER PRO CÓ NÚT MŨI TÊN 2 BÊN HÔNG THẺ BÀI) */}
                    {availableEventsToRegister.length > 0 && (() => {
                        const EVENTS_PER_PAGE = 3;
                        const totalEventPages = Math.max(1, Math.ceil(availableEventsToRegister.length / EVENTS_PER_PAGE));
                        const visibleEvents = availableEventsToRegister.slice(eventCarouselPage * EVENTS_PER_PAGE, (eventCarouselPage + 1) * EVENTS_PER_PAGE);

                        return (
                            <div className="mb-10 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 space-y-6 shadow-sm">
                                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <span className="p-2.5 rounded-xl bg-[#16b889] text-white shrink-0 shadow-md shadow-emerald-500/20">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </span>
                                        <div>
                                            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Đăng ký giải đấu khác</h2>
                                            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">Danh sách các giải đấu đang mở cổng đăng ký. Click để tạo đội hoặc tìm đội thi.</p>
                                        </div>
                                    </div>

                                    <span className="px-4 py-1.5 rounded-xl bg-emerald-50 text-[#0c7053] border border-emerald-200 text-xs font-black uppercase tracking-wider">
                                        {availableEventsToRegister.length} Mùa giải mở
                                    </span>
                                </div>

                                {/* Container Carousel với 2 nút Mũi Tên nổi 2 bên hông */}
                                <div className="relative px-2">
                                    {/* Nút Mũi Tên Trái (Thuần mũi tên, bỏ viền ô) */}
                                    {availableEventsToRegister.length > 3 && (
                                        <button
                                            type="button"
                                            disabled={eventCarouselPage === 0}
                                            onClick={() => setEventCarouselPage(p => Math.max(0, p - 1))}
                                            className="absolute -left-6 sm:-left-8 top-1/2 -translate-y-1/2 z-20 p-2 text-slate-400 hover:text-[#16b889] hover:scale-125 disabled:opacity-0 disabled:pointer-events-none transition-all duration-200 cursor-pointer"
                                            title="Giải đấu trước"
                                        >
                                            <svg className="w-7 h-7 sm:w-8 sm:h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                                            </svg>
                                        </button>
                                    )}

                                    {/* Nút Mũi Tên Phải (Thuần mũi tên, bỏ viền ô) */}
                                    {availableEventsToRegister.length > 3 && (
                                        <button
                                            type="button"
                                            disabled={eventCarouselPage >= totalEventPages - 1}
                                            onClick={() => setEventCarouselPage(p => Math.min(totalEventPages - 1, p + 1))}
                                            className="absolute -right-6 sm:-right-8 top-1/2 -translate-y-1/2 z-20 p-2 text-slate-400 hover:text-[#16b889] hover:scale-125 disabled:opacity-0 disabled:pointer-events-none transition-all duration-200 cursor-pointer"
                                            title="Giải đấu tiếp theo"
                                        >
                                            <svg className="w-7 h-7 sm:w-8 sm:h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                            </svg>
                                        </button>
                                    )}

                                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                                        {visibleEvents.map((event) => (
                                            <button
                                                type="button"
                                                key={event.id}
                                                onClick={() => handleSelectEventToRegister(event.id)}
                                                className="group text-left p-5 rounded-2xl bg-white border border-slate-200 border-l-[5px] border-l-[#16b889] shadow-xs hover:shadow-md hover:border-[#16b889] hover:-translate-y-1 transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[175px]"
                                            >
                                                <div>
                                                    <div className="flex items-center justify-between gap-2 mb-2">
                                                        <span className="text-[10px] font-black uppercase tracking-wider text-white bg-slate-900 px-2.5 py-0.5 rounded shadow-xs">
                                                            {event.season || 'SEASON'} {event.year || ''}
                                                        </span>
                                                        <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                                                            Hạn ĐK: {new Date(event.regEndDate).toLocaleDateString('vi-VN')}
                                                        </span>
                                                    </div>

                                                    <h3 className="text-base font-black text-slate-900 group-hover:text-[#16b889] transition-colors line-clamp-1">{event.name}</h3>
                                                    <p className="text-xs text-slate-600 mt-1 line-clamp-2 font-medium leading-relaxed">{event.description || 'Chưa có mô tả ngắn cho giải đấu.'}</p>
                                                    
                                                    {/* Thời gian diễn ra giải đấu */}
                                                    <div className="mt-3.5 flex items-center gap-1.5 text-[11px] font-black text-[#0c7053] bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200 w-fit">
                                                        <svg className="w-3.5 h-3.5 text-[#16b889] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        <span>Thi đấu: {event.eventStartDate ? new Date(event.eventStartDate).toLocaleDateString('vi-VN') : 'Đang cập nhật'}{event.eventEndDate ? ` - ${new Date(event.eventEndDate).toLocaleDateString('vi-VN')}` : ''}</span>
                                                    </div>
                                                </div>

                                                <div className="mt-4 flex items-center justify-end border-t border-slate-100 pt-3">
                                                    <span className="text-xs font-black text-[#16b889] group-hover:translate-x-1 inline-flex items-center gap-1 transition-transform">
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

                                {/* Thanh Dấu Chấm Chuyển Trang (Dot Indicators) Mềm Mại */}
                                {totalEventPages > 1 && (
                                    <div className="flex items-center justify-center gap-2 pt-2">
                                        {Array.from({ length: totalEventPages }).map((_, idx) => (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => setEventCarouselPage(idx)}
                                                className={`h-2 rounded-full transition-all cursor-pointer ${
                                                    eventCarouselPage === idx ? 'w-6 bg-[#16b889]' : 'w-2 bg-slate-200 hover:bg-slate-300'
                                                }`}
                                                title={`Trang ${idx + 1}`}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })()}
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
