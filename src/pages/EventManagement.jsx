import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';

const defaultSubmissionFields = [
    { id: 'projectName', label: 'Ten du an', type: 'text', required: true },
    { id: 'demoUrl', label: 'Link demo', type: 'url', required: false },
    { id: 'repoUrl', label: 'Link source code', type: 'url', required: true },
    { id: 'pitchDeck', label: 'Pitch deck', type: 'url', required: true },
];

const defaultCriteria = [
    { id: 'presentation', label: 'Presentation', description: 'Cach trinh bay, storytelling, tra loi cau hoi', maxScore: 100, weight: 25 },
    { id: 'innovation', label: 'Tinh sang tao', description: 'Muc do moi, khac biet, kha nang tao tac dong', maxScore: 100, weight: 25 },
    { id: 'technical', label: 'Ky thuat', description: 'Kien truc, chat luong code, do hoan thien san pham', maxScore: 100, weight: 30 },
    { id: 'business', label: 'Tinh ung dung', description: 'Do phu hop bai toan, kha nang mo rong, thi truong', maxScore: 100, weight: 20 },
];

const emptyEvent = () => ({
    id: null,
    name: '',
    description: '',
    season: 'SPRING',
    year: new Date().getFullYear(),
    regStartDate: '',
    regEndDate: '',
    eventStartDate: '',
    eventEndDate: '',
    submissionDeadline: '',
    roundCount: 3,
    tracks: [
        { name: 'Bảng A', mentorIds: [] },
        { name: 'Bảng B', mentorIds: [] },
    ],
    submissionFields: defaultSubmissionFields,
    competitionRules: [
        'Moi doi nop bai dung deadline tren he thong.',
        'San pham phai do doi tu phat trien trong khuon kho su kien.',
        'Judge cham diem theo rubric da cong bo cho tung round.',
    ].join('\n'),
    ruleDocumentUrl: '',
    active: true,
    draftPrizes: [{ name: 'Giải Nhất', description: '' }],
});

const emptyPrize = { id: null, name: '', description: '', teamId: '' };

function parseJson(value, fallback) {
    if (!value) return fallback;
    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : fallback;
    } catch {
        return fallback;
    }
}

function toLocalInput(value) {
    return value ? value.slice(0, 16) : '';
}

function eventToForm(event) {
    if (!event) return emptyEvent();
    return {
        id: event.id,
        name: event.name || '',
        description: event.description || '',
        season: event.season || 'SPRING',
        year: event.year || new Date().getFullYear(),
        regStartDate: toLocalInput(event.regStartDate),
        regEndDate: toLocalInput(event.regEndDate),
        eventStartDate: toLocalInput(event.eventStartDate),
        eventEndDate: toLocalInput(event.eventEndDate),
        submissionDeadline: toLocalInput(event.defaultSubmissionDeadline),
        roundCount: Math.max(event.roundCount || 2, 2),
        tracks: event.tracks?.length
            ? event.tracks.map((track) => ({ name: track.name, mentorIds: track.mentors?.map((mentor) => mentor.id) || [] }))
            : [{ name: 'Bảng A', mentorIds: [] }],
        submissionFields: parseJson(event.submissionFormSchema, defaultSubmissionFields),
        competitionRules: event.competitionRules || '',
        ruleDocumentUrl: event.ruleDocumentUrl || '',
        active: event.active !== false,
        draftPrizes: [],
    };
}

function eventLifecycle(event) {
    const now = Date.now();
    const registrationStart = event.regStartDate ? new Date(event.regStartDate).getTime() : null;
    const registrationEnd = event.regEndDate ? new Date(event.regEndDate).getTime() : null;
    const eventStart = event.eventStartDate ? new Date(event.eventStartDate).getTime() : null;
    const eventEnd = event.eventEndDate ? new Date(event.eventEndDate).getTime() : null;
    if (eventEnd && now > eventEnd) return { id: 'ended', label: 'Đã kết thúc', className: 'border-slate-200 bg-slate-100 text-slate-600' };
    if (!event.active) return { id: 'inactive', label: 'Tạm dừng', className: 'border-slate-200 bg-slate-100 text-slate-600' };
    if (registrationStart && now < registrationStart) return { id: 'upcoming', label: 'Sắp mở đăng ký', className: 'border-violet-200 bg-violet-50 text-violet-700' };
    if (registrationEnd && now <= registrationEnd) return { id: 'registration', label: 'Đang đăng ký', className: 'border-blue-200 bg-blue-50 text-blue-700' };
    if (eventStart && now < eventStart) return { id: 'preparing', label: 'Chuẩn bị thi', className: 'border-amber-200 bg-amber-50 text-amber-700' };
    if (eventEnd && now <= eventEnd) return { id: 'running', label: 'Đang diễn ra', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' };
    return { id: 'draft', label: 'Chưa đủ lịch', className: 'border-rose-200 bg-rose-50 text-rose-700' };
}

function shortDate(value) {
    return value ? new Date(value).toLocaleDateString('vi-VN') : 'Chưa đặt';
}

function Section({ title, eyebrow, children, actions }) {
    return (
        <section className="rounded-lg border border-blue-100 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-blue-100 px-6 py-5 md:flex-row md:items-center md:justify-between">
                <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0f63c9]">{eyebrow}</p>
                    <h2 className="mt-1 text-lg font-black uppercase tracking-wide text-slate-900">{title}</h2>
                </div>
                {actions}
            </div>
            <div className="p-6">{children}</div>
        </section>
    );
}

const createSteps = [
    ['01', 'Thông tin'],
    ['02', 'Thời gian'],
    ['03', 'Bảng đấu'],
    ['04', 'Xác nhận'],
];

function WizardField({ label, hint, children }) {
    return (
        <label className="block">
            <span className="text-sm font-black text-slate-800">{label}</span>
            {hint && <span className="ml-2 text-xs font-medium text-slate-400">{hint}</span>}
            <span className="mt-2 block">{children}</span>
        </label>
    );
}

export default function EventManagement() {
    const [events, setEvents] = useState([]);
    const [teams, setTeams] = useState([]);
    const [mentors, setMentors] = useState([]);
    const [judges, setJudges] = useState([]);
    const [prizes, setPrizes] = useState([]);
    const [selectedEventId, setSelectedEventId] = useState('');
    const [selectedMatrixId, setSelectedMatrixId] = useState('');
    const [form, setForm] = useState(emptyEvent);
    const [matrixForm, setMatrixForm] = useState({ guidelineUrl: '', submissionDeadline: '', topN: 10, judgeIds: [], criteria: defaultCriteria });
    const [prizeForm, setPrizeForm] = useState(emptyPrize);
    const [activeTab, setActiveTab] = useState('overview');
    const [createStep, setCreateStep] = useState(0);
    const [initialLoading, setInitialLoading] = useState(true);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [showCreate, setShowCreate] = useState(false);
    const [eventQuery, setEventQuery] = useState('');
    const [eventFilter, setEventFilter] = useState('all');
    const didBootstrap = useRef(false);

    const selectedEvent = useMemo(
        () => events.find((event) => String(event.id) === String(selectedEventId)),
        [events, selectedEventId]
    );

    const selectedMatrix = useMemo(
        () => selectedEvent?.matrices?.find((matrix) => String(matrix.id) === String(selectedMatrixId)),
        [selectedEvent, selectedMatrixId]
    );

    const eventTeams = useMemo(
        () => teams.filter((team) => String(team.eventId) === String(selectedEventId)),
        [teams, selectedEventId]
    );

    const completion = useMemo(() => {
        const totalMatrices = selectedEvent?.matrices?.length || 0;
        const readyMatrices = selectedEvent?.matrices?.filter((matrix) => matrix.scoringCriteriaJson && matrix.submissionDeadline).length || 0;
        return {
            structure: Boolean(selectedEvent?.structureInitialized),
            form: parseJson(selectedEvent?.submissionFormSchema, []).length > 0,
            rules: Boolean(selectedEvent?.competitionRules || selectedEvent?.ruleDocumentUrl),
            rubric: totalMatrices > 0 && readyMatrices === totalMatrices,
            readyMatrices,
            totalMatrices,
        };
    }, [selectedEvent]);

    const eventOverview = useMemo(() => {
        const rows = events.map((event) => ({ ...event, lifecycle: eventLifecycle(event) }));
        const query = eventQuery.trim().toLowerCase();
        return rows.filter((event) => (!query || `${event.name} ${event.season} ${event.year}`.toLowerCase().includes(query))
            && (eventFilter === 'all' || event.lifecycle.id === eventFilter));
    }, [events, eventQuery, eventFilter]);

    const eventStats = useMemo(() => ({
        total: events.length,
        live: events.filter((event) => ['registration', 'running'].includes(eventLifecycle(event).id)).length,
        upcoming: events.filter((event) => ['upcoming', 'preparing'].includes(eventLifecycle(event).id)).length,
        teams: events.reduce((sum, event) => sum + Number(event.teamCount || 0), 0),
    }), [events]);

    const fetchPrizes = async (eventId) => {
        if (!eventId) {
            setPrizes([]);
            return;
        }
        const response = await axiosClient.get(`/events/${eventId}/prizes`).catch(() => ({ result: [] }));
        setPrizes(response.result || []);
    };

    const fetchAll = async (preferredEventId = '') => {
        const [eventRes, teamRes, staffRes] = await Promise.all([
            axiosClient.get('/events'),
            axiosClient.get('/teams').catch(() => ({ result: [] })),
            axiosClient.get('/users/role/STAFF').catch(() => ({ result: [] })),
        ]);

        const loadedEvents = eventRes.result || [];
        const nextEventId = preferredEventId || '';
        const nextEvent = loadedEvents.find((item) => String(item.id) === String(nextEventId));

        setEvents(loadedEvents);
        setTeams(teamRes.result || []);
        setMentors(staffRes.result || []);
        setJudges(staffRes.result || []);
        setSelectedEventId(nextEventId);
        setSelectedMatrixId((currentMatrixId) => {
            const keepMatrix = nextEvent?.matrices?.find((matrix) => String(matrix.id) === String(currentMatrixId));
            return keepMatrix?.id || nextEvent?.matrices?.[0]?.id || '';
        });
        setForm(eventToForm(nextEvent));
        await fetchPrizes(nextEventId);
    };

    useEffect(() => {
        if (didBootstrap.current) return;
        didBootstrap.current = true;
        fetchAll()
            .catch((err) => setMessage({ type: 'error', text: err.message || 'Không tải được dữ liệu cuộc thi.' }))
            .finally(() => setInitialLoading(false));
        // Initial bootstrap only; later refreshes are triggered explicitly after mutations.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!selectedMatrix) {
            setMatrixForm({ guidelineUrl: '', submissionDeadline: '', topN: 10, judgeIds: [], criteria: defaultCriteria });
            return;
        }

        setMatrixForm({
            guidelineUrl: selectedMatrix.guidelineUrl || '',
            submissionDeadline: toLocalInput(selectedMatrix.submissionDeadline),
            topN: selectedMatrix.topN || 10,
            judgeIds: selectedMatrix.judges?.map((user) => user.id) || [],
            criteria: parseJson(selectedMatrix.scoringCriteriaJson, defaultCriteria),
        });
    }, [selectedMatrix]);

    const selectEvent = (eventId) => {
        const event = events.find((item) => String(item.id) === String(eventId));
        setSelectedEventId(eventId);
        setSelectedMatrixId(event?.matrices?.[0]?.id || '');
        setForm(eventToForm(event));
        setPrizeForm(emptyPrize);
        setShowCreate(false);
        fetchPrizes(eventId);
    };

    const updateArrayItem = (field, index, patch) => {
        setForm((current) => ({
            ...current,
            [field]: current[field].map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item),
        }));
    };

    const updateTrack = (index, patch) => {
        setForm((current) => ({
            ...current,
            tracks: current.tracks.map((track, trackIndex) => trackIndex === index ? { ...track, ...patch } : track),
        }));
    };

    const toggleTrackMentor = (trackIndex, mentorId) => {
        setForm((current) => ({
            ...current,
            tracks: current.tracks.map((track, index) => {
                if (index !== trackIndex) return track;
                const exists = track.mentorIds.some((id) => String(id) === String(mentorId));
                if (!exists && track.mentorIds.length >= 2) return track;
                return {
                    ...track,
                    mentorIds: exists
                        ? track.mentorIds.filter((id) => String(id) !== String(mentorId))
                        : [...track.mentorIds, mentorId],
                };
            }),
        }));
    };

    const updateCriterion = (index, patch) => {
        setMatrixForm((current) => ({
            ...current,
            criteria: current.criteria.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item),
        }));
    };

    const toggleMatrixUser = (field, id) => {
        setMatrixForm((current) => {
            const exists = current[field].some((item) => String(item) === String(id));
            return {
                ...current,
                [field]: exists ? current[field].filter((item) => String(item) !== String(id)) : [...current[field], id],
            };
        });
    };

    const eventPayload = () => ({
        name: form.name,
        description: form.description,
        season: form.season,
        year: Number(form.year),
        regStartDate: form.regStartDate || null,
        regEndDate: form.regEndDate || null,
        eventStartDate: form.eventStartDate || null,
        eventEndDate: form.eventEndDate || null,
        submissionDeadline: form.submissionDeadline || null,
        roundCount: Number(form.roundCount),
        tracks: form.tracks.map((track) => track.name.trim()).filter(Boolean),
        trackConfigs: form.tracks
            .filter((track) => track.name.trim())
            .map((track) => ({ name: track.name.trim(), mentorIds: track.mentorIds.map(Number) })),
        submissionFormSchema: JSON.stringify(form.submissionFields),
        competitionRules: form.competitionRules,
        ruleDocumentUrl: form.ruleDocumentUrl,
        active: form.active,
    });

    const validateCreateStep = (step) => {
        if (step === 0 && (!form.name.trim() || !form.description.trim() || !form.year)) {
            return 'Hãy nhập tên, năm và mô tả cuộc thi.';
        }
        if (step === 1) {
            if (!form.regStartDate || !form.regEndDate || !form.eventStartDate || !form.eventEndDate) {
                return 'Hãy nhập đủ thời gian đăng ký và thời gian diễn ra.';
            }
            if (new Date(form.regStartDate) >= new Date(form.regEndDate)) return 'Thời gian đóng đăng ký phải sau thời gian mở.';
            if (new Date(form.regEndDate) > new Date(form.eventStartDate)) return 'Đăng ký phải đóng trước khi cuộc thi bắt đầu.';
            if (new Date(form.eventStartDate) >= new Date(form.eventEndDate)) return 'Thời gian kết thúc phải sau thời gian bắt đầu.';
        }
        if (step === 2) {
            if (!form.tracks.length || form.tracks.some((track) => !track.name.trim())) return 'Mỗi bảng đấu cần có tên.';
            if (form.tracks.some((track) => track.mentorIds.length < 1 || track.mentorIds.length > 2)) return 'Mỗi bảng đấu cần từ 1 đến 2 mentor.';
        }
        return null;
    };

    const goToNextCreateStep = () => {
        const error = validateCreateStep(createStep);
        if (error) {
            setMessage({ type: 'error', text: error });
            return;
        }
        setMessage(null);
        setCreateStep((step) => Math.min(3, step + 1));
    };

    const createCompetition = async () => {
        const error = validateCreateStep(2);
        if (error) {
            setMessage({ type: 'error', text: error });
            setCreateStep(2);
            return;
        }

        setLoading(true);
        setMessage(null);
        try {
            const response = await axiosClient.post('/events', eventPayload());
            const eventId = response.result?.id;
            const validPrizes = form.draftPrizes.filter((prize) => prize.name.trim());
            await Promise.all(validPrizes.map((prize) => axiosClient.post(`/events/${eventId}/prizes`, {
                name: prize.name.trim(),
                description: prize.description.trim(),
                teamId: null,
            })));
            await axiosClient.post(`/events/${eventId}/initialize-structure`);
            await fetchAll(eventId);
            setActiveTab('overview');
            setMessage({ type: 'success', text: 'Đã tạo cuộc thi và lịch đấu. Dùng mục Cấu hình chấm điểm trên sidebar để thiết lập rubric, Top N và Judge.' });
        } catch (err) {
            setMessage({ type: 'error', text: err.message || 'Không thể tạo cuộc thi.' });
        } finally {
            setLoading(false);
        }
    };

    const saveEvent = async (e) => {
        e.preventDefault();
        if (!selectedEvent?.structureInitialized && form.tracks.some((track) => track.mentorIds.length < 1 || track.mentorIds.length > 2)) {
            setMessage({ type: 'error', text: 'Mỗi bảng đấu cần được phân công từ 1 đến 2 mentor.' });
            return;
        }
        setLoading(true);
        setMessage(null);

        try {
            const response = form.id
                ? await axiosClient.put(`/events/${form.id}`, eventPayload())
                : await axiosClient.post('/events', eventPayload());
            setMessage({ type: 'success', text: form.id ? 'Da cap nhat event.' : 'Da tao event moi.' });
            await fetchAll(response.result?.id || form.id || '');
        } catch (err) {
            setMessage({ type: 'error', text: err.message || 'Khong luu duoc event.' });
        } finally {
            setLoading(false);
        }
    };

    const deleteEvent = async () => {
        if (!selectedEventId) return;
        setLoading(true);
        try {
            await axiosClient.delete(`/events/${selectedEventId}`);
            setMessage({ type: 'success', text: 'Da tat hoat dong event.' });
            await fetchAll('');
        } catch (err) {
            setMessage({ type: 'error', text: err.message || 'Khong xoa duoc event.' });
        } finally {
            setLoading(false);
        }
    };

    const initializeStructure = async () => {
        if (!selectedEventId) return;
        setLoading(true);
        try {
            const response = await axiosClient.post(`/events/${selectedEventId}/initialize-structure`);
            setMessage({ type: 'success', text: 'Da tao matrix Track x Round.' });
            await fetchAll(response.result?.id || selectedEventId);
        } catch (err) {
            setMessage({ type: 'error', text: err.message || 'Khong tao duoc matrix.' });
        } finally {
            setLoading(false);
        }
    };

    const saveMatrix = async (e) => {
        e.preventDefault();
        if (!selectedMatrixId) return;
        if (matrixForm.judgeIds.length < 2 || matrixForm.judgeIds.length > 4) {
            setMessage({ type: 'error', text: 'Mỗi vòng đấu cần từ 2 đến 4 giám khảo.' });
            return;
        }

        setLoading(true);
        try {
            await axiosClient.put(`/events/matrices/${selectedMatrixId}`, {
                guidelineUrl: matrixForm.guidelineUrl,
                submissionDeadline: matrixForm.submissionDeadline || null,
                judgeIds: matrixForm.judgeIds.map(Number),
                topN: selectedMatrix?.finalRound ? null : Math.max(1, Number(matrixForm.topN)),
                scoringCriteriaJson: JSON.stringify(matrixForm.criteria),
            });
            setMessage({ type: 'success', text: 'Da luu rubric va phan cong.' });
            await fetchAll(selectedEventId);
        } catch (err) {
            setMessage({ type: 'error', text: err.message || 'Khong luu duoc rubric.' });
        } finally {
            setLoading(false);
        }
    };

    const applyMatrixToSameRound = async () => {
        if (!selectedMatrix || matrixForm.judgeIds.length < 2 || matrixForm.judgeIds.length > 4) {
            setMessage({ type: 'error', text: 'Hãy chọn từ 2 đến 4 giám khảo trước khi áp dụng hàng loạt.' });
            return;
        }

        const sameRoundMatrices = (selectedEvent?.matrices || []).filter(
            (matrix) => matrix.roundOrder === selectedMatrix.roundOrder
        );
        setLoading(true);
        setMessage(null);
        try {
            await Promise.all(sameRoundMatrices.map((matrix) => axiosClient.put(`/events/matrices/${matrix.id}`, {
                guidelineUrl: matrixForm.guidelineUrl,
                submissionDeadline: matrixForm.submissionDeadline || null,
                judgeIds: matrixForm.judgeIds.map(Number),
                topN: matrix.finalRound ? null : Math.max(1, Number(matrixForm.topN)),
                scoringCriteriaJson: JSON.stringify(matrixForm.criteria),
            })));
            setMessage({ type: 'success', text: `Đã áp dụng cấu hình cho ${sameRoundMatrices.length} bảng ở ${selectedMatrix.roundName}.` });
            await fetchAll(selectedEventId);
        } catch (err) {
            setMessage({ type: 'error', text: err.message || 'Không thể áp dụng cấu hình hàng loạt.' });
        } finally {
            setLoading(false);
        }
    };

    const savePrize = async (e) => {
        e.preventDefault();
        if (!selectedEventId) return;

        setLoading(true);
        try {
            const payload = { ...prizeForm, teamId: prizeForm.teamId ? Number(prizeForm.teamId) : null };
            if (prizeForm.id) {
                await axiosClient.put(`/events/prizes/${prizeForm.id}`, payload);
            } else {
                await axiosClient.post(`/events/${selectedEventId}/prizes`, payload);
            }
            setPrizeForm(emptyPrize);
            setMessage({ type: 'success', text: 'Da luu giai thuong.' });
            await fetchPrizes(selectedEventId);
        } catch (err) {
            setMessage({ type: 'error', text: err.message || 'Khong luu duoc giai thuong.' });
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        { id: 'overview', label: 'Tổng quan' },
        { id: 'event', label: 'Thông tin & lịch' },
        { id: 'submission', label: 'Form bài nộp' },
        { id: 'rules', label: 'Thể lệ & giải thưởng' },
    ];
    const managementSteps = [
        { id: 'event', label: 'Thông tin và lịch sự kiện', description: 'Tên, thời gian đăng ký, thời gian thi, bảng đấu và Mentor.', done: Boolean(form.name && form.regStartDate && form.regEndDate && form.eventStartDate && form.eventEndDate && form.tracks.length) },
        { id: 'submission', label: 'Form bài nộp của đội thi', description: 'Quy định những nội dung Team Leader cần gửi cho mỗi bài thi.', done: completion.form },
        { id: 'scoring', label: 'Chấm điểm và phân công Judge', description: 'Rubric, trọng số, deadline từng vòng, Top N và Judge phụ trách.', done: completion.rubric },
        { id: 'rules', label: 'Thể lệ và giải thưởng', description: 'Quy chế cuộc thi, tài liệu hướng dẫn và cơ cấu giải thưởng.', done: completion.rules },
    ];
    const completedManagementSteps = managementSteps.filter((step) => step.done).length;
    const managementProgress = Math.round((completedManagementSteps / managementSteps.length) * 100);

    if (initialLoading) {
        return (
            <div className="mx-auto max-w-7xl animate-pulse space-y-5" aria-label="Đang tải dữ liệu cuộc thi">
                <div className="h-24 rounded-xl border border-slate-200 bg-white" />
                <div className="grid gap-5 xl:grid-cols-[340px_1fr]">
                    <div className="h-[520px] rounded-xl border border-slate-200 bg-white" />
                    <div className="h-[520px] rounded-xl border border-slate-200 bg-white" />
                </div>
            </div>
        );
    }

    if (!form.id && !showCreate) {
        return (
            <div className="mx-auto max-w-7xl space-y-6">
                <section className="overflow-hidden rounded-2xl bg-gradient-to-r from-[#092e66] to-[#0f63c9] p-6 text-white shadow-lg md:p-8">
                    <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.2em] !text-blue-200">Event operations</p>
                            <h2 className="mt-2 text-2xl font-black !text-white md:text-3xl">Tổng quan sự kiện</h2>
                            <p className="mt-2 max-w-2xl text-sm leading-6 !text-blue-100">Theo dõi toàn bộ mùa giải, tiến độ cấu hình và trạng thái vận hành tại một nơi.</p>
                        </div>
                        <button type="button" className="rounded-xl bg-white px-5 py-3 text-sm font-black text-[#0f63c9] shadow-sm transition hover:bg-blue-50" onClick={() => { setForm(emptyEvent()); setShowCreate(true); setCreateStep(0); setMessage(null); }}>+ Tạo sự kiện mới</button>
                    </div>
                </section>

                {message && <div className={`rounded-xl border p-4 text-sm font-bold ${message.type === 'success' ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'}`}>{message.text}</div>}

                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {[
                        ['Tổng sự kiện', eventStats.total, 'Tất cả mùa giải'],
                        ['Đang hoạt động', eventStats.live, 'Đăng ký hoặc đang thi'],
                        ['Sắp diễn ra', eventStats.upcoming, 'Đang chuẩn bị'],
                        ['Tổng đội thi', eventStats.teams, 'Trên mọi sự kiện'],
                    ].map(([label, value, hint]) => <div key={label} className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm"><p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">{label}</p><p className="mt-2 text-3xl font-black text-[#071936]">{value}</p><p className="mt-1 text-xs text-slate-500">{hint}</p></div>)}
                </section>

                <section className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm">
                    <div className="flex flex-col gap-4 border-b border-blue-100 p-5 lg:flex-row lg:items-center lg:justify-between">
                        <div><h3 className="text-lg font-black text-slate-900">Danh sách sự kiện</h3><p className="mt-1 text-sm text-slate-500">{eventOverview.length} sự kiện phù hợp</p></div>
                        <div className="flex flex-col gap-3 sm:flex-row">
                            <input className="input-custom min-w-72" value={eventQuery} onChange={(event) => setEventQuery(event.target.value)} placeholder="Tìm theo tên, mùa hoặc năm..." />
                            <select className="input-custom min-w-48" value={eventFilter} onChange={(event) => setEventFilter(event.target.value)}>
                                <option value="all">Tất cả trạng thái</option>
                                <option value="registration">Đang đăng ký</option>
                                <option value="running">Đang diễn ra</option>
                                <option value="upcoming">Sắp mở đăng ký</option>
                                <option value="preparing">Chuẩn bị thi</option>
                                <option value="ended">Đã kết thúc</option>
                                <option value="inactive">Tạm dừng</option>
                                <option value="draft">Chưa đủ lịch</option>
                            </select>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-[920px] text-left">
                            <thead className="bg-slate-50"><tr><th className="px-5 py-3">Sự kiện</th><th className="px-5 py-3">Trạng thái</th><th className="px-5 py-3">Thời gian</th><th className="px-5 py-3">Cấu trúc</th><th className="px-5 py-3 text-center">Đội thi</th><th className="px-5 py-3 text-right">Thao tác</th></tr></thead>
                            <tbody className="divide-y divide-blue-50">
                                {eventOverview.map((event) => {
                                    const matrixTotal = event.matrices?.length || 0;
                                    const configured = event.matrices?.filter((matrix) => matrix.scoringCriteriaJson && matrix.submissionDeadline && matrix.judges?.length >= 2).length || 0;
                                    return <tr key={event.id} className="transition hover:bg-blue-50/50">
                                        <td className="px-5 py-4"><p className="font-black text-slate-900">{event.name}</p><p className="mt-1 text-xs font-bold uppercase tracking-wide text-[#0f63c9]">{event.season} {event.year}</p></td>
                                        <td className="px-5 py-4"><span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-black ${event.lifecycle.className}`}>{event.lifecycle.label}</span></td>
                                        <td className="px-5 py-4"><p className="text-sm font-bold text-slate-700">{shortDate(event.eventStartDate)} → {shortDate(event.eventEndDate)}</p><p className="mt-1 text-xs text-slate-500">Đóng đăng ký: {shortDate(event.regEndDate)}</p></td>
                                        <td className="px-5 py-4"><p className="text-sm font-bold text-slate-700">{event.tracks?.length || 0} bảng · {event.roundCount || 0} vòng</p><p className={`mt-1 text-xs font-bold ${configured === matrixTotal && matrixTotal > 0 ? 'text-emerald-600' : 'text-amber-700'}`}>{matrixTotal ? `${configured}/${matrixTotal} vòng đã cấu hình` : 'Chưa khởi tạo vòng đấu'}</p></td>
                                        <td className="px-5 py-4 text-center text-lg font-black text-slate-900">{event.teamCount || 0}</td>
                                        <td className="px-5 py-4"><div className="flex justify-end gap-2"><Link to={`/events/${event.id}`} className="btn-secondary">Trang công khai</Link><button type="button" className="btn-primary" onClick={() => { selectEvent(event.id); setActiveTab('overview'); }}>Quản lý</button></div></td>
                                    </tr>;
                                })}
                                {!eventOverview.length && <tr><td colSpan="6" className="px-5 py-12 text-center text-sm text-slate-500">Không tìm thấy sự kiện phù hợp.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        );
    }

    if (!form.id) {
        const matchCount = form.tracks.length * (Number(form.roundCount) - 1) + 1;
        return (
            <div className="mx-auto max-w-6xl pb-8">
                    {message && (
                        <div className={`mb-5 rounded-xl border p-4 text-sm font-bold ${message.type === 'success' ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
                            {message.text}
                        </div>
                    )}

                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-300/60">
                    <header className="bg-gradient-to-r from-[#092e66] to-[#0f63c9] px-6 py-7 text-white md:px-10">
                        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                            <div>
                                <p className="text-xs font-black uppercase tracking-[0.22em] !text-blue-200">Coordinator · Tạo cuộc thi</p>
                                <h1 className="mt-2 text-2xl font-black !text-white md:text-3xl">Thiết lập cuộc thi mới</h1>
                                <p className="mt-2 max-w-2xl text-sm !text-blue-100">Đi từng bước. Hệ thống sẽ tự sinh bảng, vòng loại và một trận chung kết.</p>
                            </div>
                            <button
                                type="button"
                                className="rounded-lg border px-4 py-2 text-sm font-bold"
                                style={{ color: '#ffffff', background: 'rgba(255,255,255,0.12)', borderColor: 'rgba(255,255,255,0.35)' }}
                                onClick={() => { setShowCreate(false); setForm(emptyEvent()); }}
                            >
                                Hủy tạo mới
                            </button>
                        </div>
                    </header>

                    <div className="border-b border-slate-200 bg-slate-50 px-5 py-4 md:px-10">
                        <div className="grid grid-cols-4 gap-2">
                            {createSteps.map(([number, label], index) => (
                                <button key={number} type="button" onClick={() => index < createStep && setCreateStep(index)} className="text-left" disabled={index > createStep}>
                                    <div className={`h-1.5 rounded-full ${index <= createStep ? 'bg-[#0f63c9]' : 'bg-slate-200'}`} />
                                    <div className="mt-2 flex items-center gap-2">
                                        <span className={`hidden h-7 w-7 items-center justify-center rounded-full text-xs font-black sm:flex ${index === createStep ? 'bg-[#0f63c9] text-white' : index < createStep ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-500'}`}>{number}</span>
                                        <span className={`text-xs font-black sm:text-sm ${index === createStep ? 'text-[#0f63c9]' : 'text-slate-500'}`}>{label}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="min-h-[520px] p-6 md:p-10">
                        {createStep === 0 && (
                            <div className="mx-auto max-w-3xl space-y-6">
                                <div>
                                    <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0f63c9]">Bước 1/4</p>
                                    <h2 className="mt-2 text-2xl font-black text-slate-900">Thông tin cuộc thi</h2>
                                    <p className="mt-2 text-sm text-slate-500">Thông tin người tham gia sẽ nhìn thấy trên trang sự kiện.</p>
                                </div>
                                <WizardField label="Tên cuộc thi">
                                    <input autoFocus className="input-custom text-base" placeholder="Ví dụ: SEAL Innovation Challenge 2026" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                                </WizardField>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <WizardField label="Mùa giải">
                                        <select className="input-custom" value={form.season} onChange={(e) => setForm({ ...form, season: e.target.value })}>
                                            <option value="SPRING">Spring</option><option value="SUMMER">Summer</option><option value="FALL">Fall</option>
                                        </select>
                                    </WizardField>
                                    <WizardField label="Năm tổ chức">
                                        <input type="number" min="2020" max="2100" className="input-custom" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} />
                                    </WizardField>
                                </div>
                                <WizardField label="Mô tả" hint="Bắt buộc">
                                    <textarea rows="6" className="input-custom" placeholder="Mục tiêu, đối tượng tham gia và nội dung chính của cuộc thi..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                                </WizardField>
                            </div>
                        )}

                        {createStep === 1 && (
                            <div className="mx-auto max-w-4xl space-y-6">
                                <div>
                                    <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0f63c9]">Bước 2/4</p>
                                    <h2 className="mt-2 text-2xl font-black text-slate-900">Mốc thời gian</h2>
                                    <p className="mt-2 text-sm text-slate-500">Nhập theo thứ tự từ đăng ký đến kết thúc cuộc thi.</p>
                                </div>
                                <div className="grid gap-5 rounded-xl border border-blue-100 bg-blue-50/60 p-5 md:grid-cols-2">
                                    <WizardField label="1. Mở đăng ký"><input type="datetime-local" className="input-custom bg-white" value={form.regStartDate} onChange={(e) => setForm({ ...form, regStartDate: e.target.value })} /></WizardField>
                                    <WizardField label="2. Đóng đăng ký"><input type="datetime-local" className="input-custom bg-white" value={form.regEndDate} onChange={(e) => setForm({ ...form, regEndDate: e.target.value })} /></WizardField>
                                    <WizardField label="3. Bắt đầu cuộc thi"><input type="datetime-local" className="input-custom bg-white" value={form.eventStartDate} onChange={(e) => setForm({ ...form, eventStartDate: e.target.value })} /></WizardField>
                                    <WizardField label="4. Kết thúc cuộc thi"><input type="datetime-local" className="input-custom bg-white" value={form.eventEndDate} onChange={(e) => setForm({ ...form, eventEndDate: e.target.value })} /></WizardField>
                                </div>
                                <div className="grid gap-5 md:grid-cols-2">
                                    <WizardField label="Deadline nộp bài mặc định" hint="Có thể đổi theo từng vòng"><input type="datetime-local" className="input-custom" value={form.submissionDeadline} onChange={(e) => setForm({ ...form, submissionDeadline: e.target.value })} /></WizardField>
                                    <WizardField label="Tổng số vòng" hint="Đã gồm vòng chung kết"><input type="number" min="2" className="input-custom" value={form.roundCount} onChange={(e) => setForm({ ...form, roundCount: Math.max(2, Number(e.target.value)) })} /></WizardField>
                                </div>
                                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                                    <strong>{Number(form.roundCount) - 1} vòng loại theo từng bảng</strong> và <strong>1 vòng chung kết chung</strong> sẽ được tạo tự động.
                                </div>
                            </div>
                        )}

                        {createStep === 2 && (
                            <div className="space-y-6">
                                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                                    <div>
                                        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0f63c9]">Bước 3/4</p>
                                        <h2 className="mt-2 text-2xl font-black text-slate-900">Bảng đấu và mentor</h2>
                                        <p className="mt-2 text-sm text-slate-500">Thêm bảng tùy ý; mỗi bảng chọn 1–2 mentor đúng một lần.</p>
                                    </div>
                                    <button type="button" className="btn-primary" onClick={() => setForm((current) => ({ ...current, tracks: [...current.tracks, { name: `Bảng ${String.fromCharCode(65 + current.tracks.length)}`, mentorIds: [] }] }))}>+ Thêm bảng đấu</button>
                                </div>
                                <div className="grid gap-4 lg:grid-cols-2">
                                    {form.tracks.map((track, index) => (
                                        <div key={index} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                                            <div className="flex gap-2">
                                                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-100 font-black text-blue-700">{index + 1}</span>
                                                <input className="input-custom font-black" value={track.name} onChange={(e) => updateTrack(index, { name: e.target.value })} placeholder="Tên bảng đấu" />
                                                <button type="button" className="btn-secondary" disabled={form.tracks.length <= 1} onClick={() => setForm((current) => ({ ...current, tracks: current.tracks.filter((_, itemIndex) => itemIndex !== index) }))}>Xóa</button>
                                            </div>
                                            <div className="mt-4 flex items-center justify-between">
                                                <p className="text-xs font-black uppercase tracking-wide text-slate-500">Chọn Staff làm Mentor</p>
                                                <span className={`rounded-full px-2 py-1 text-xs font-black ${track.mentorIds.length >= 1 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{track.mentorIds.length}/2</span>
                                            </div>
                                            <div className="mt-2 max-h-44 space-y-1 overflow-auto rounded-lg border border-slate-100 p-2">
                                                {mentors.map((user) => {
                                                    const checked = track.mentorIds.some((id) => String(id) === String(user.id));
                                                    return <label key={user.id} className={`flex cursor-pointer items-center gap-3 rounded-lg p-2.5 text-sm ${checked ? 'bg-blue-50 font-bold text-blue-800' : 'hover:bg-slate-50'}`}><input type="checkbox" checked={checked} disabled={!checked && track.mentorIds.length >= 2} onChange={() => toggleTrackMentor(index, user.id)} /><span>{user.fullName || user.email}</span></label>;
                                                })}
                                                {!mentors.length && <p className="p-2 text-sm text-amber-700">Chưa có tài khoản Mentor. Hãy tạo Mentor trong Quản lý người dùng.</p>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="rounded-xl bg-[#092e66] p-5 text-white">
                                    <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-200">Xem trước cấu trúc</p>
                                    <p className="mt-2 text-xl font-black">{form.tracks.length} bảng × {Number(form.roundCount) - 1} vòng loại + 1 chung kết = {matchCount} vòng đấu</p>
                                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-blue-100">{form.tracks.map((track) => <span key={track.name} className="rounded-full bg-white/10 px-3 py-1.5">{track.name || 'Chưa đặt tên'}</span>)}<span className="rounded-full bg-emerald-400/20 px-3 py-1.5 text-emerald-100">Chung kết</span></div>
                                </div>
                            </div>
                        )}

                        {createStep === 3 && (
                            <div className="mx-auto max-w-4xl space-y-6">
                                <div>
                                    <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0f63c9]">Bước 4/4</p>
                                    <h2 className="mt-2 text-2xl font-black text-slate-900">Giải thưởng và xác nhận</h2>
                                    <p className="mt-2 text-sm text-slate-500">Thêm giải ngay bây giờ hoặc quản lý sau khi cuộc thi được tạo.</p>
                                </div>
                                <WizardField label="Thể lệ / ghi chú">
                                    <textarea rows="5" className="input-custom" value={form.competitionRules} onChange={(e) => setForm({ ...form, competitionRules: e.target.value })} placeholder="Quy định nộp bài, cách xử lý vi phạm..." />
                                </WizardField>
                                <div>
                                    <div className="flex items-center justify-between"><p className="text-sm font-black text-slate-800">Giải thưởng</p><button type="button" className="btn-secondary" onClick={() => setForm((current) => ({ ...current, draftPrizes: [...current.draftPrizes, { name: '', description: '' }] }))}>+ Thêm giải</button></div>
                                    <div className="mt-3 space-y-3">
                                        {form.draftPrizes.map((prize, index) => (
                                            <div key={index} className="grid gap-3 rounded-xl border border-slate-200 p-4 md:grid-cols-[1fr_1.5fr_auto]">
                                                <input className="input-custom font-bold" placeholder="Tên giải" value={prize.name} onChange={(e) => setForm((current) => ({ ...current, draftPrizes: current.draftPrizes.map((item, itemIndex) => itemIndex === index ? { ...item, name: e.target.value } : item) }))} />
                                                <input className="input-custom" placeholder="Tiền thưởng / quyền lợi" value={prize.description} onChange={(e) => setForm((current) => ({ ...current, draftPrizes: current.draftPrizes.map((item, itemIndex) => itemIndex === index ? { ...item, description: e.target.value } : item) }))} />
                                                <button type="button" className="btn-secondary" onClick={() => setForm((current) => ({ ...current, draftPrizes: current.draftPrizes.filter((_, itemIndex) => itemIndex !== index) }))}>Xóa</button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="grid gap-3 rounded-xl border border-blue-200 bg-blue-50 p-5 sm:grid-cols-3">
                                    <div><p className="text-xs font-bold text-slate-500">CUỘC THI</p><p className="mt-1 font-black text-slate-900">{form.name}</p></div>
                                    <div><p className="text-xs font-bold text-slate-500">CẤU TRÚC</p><p className="mt-1 font-black text-slate-900">{form.tracks.length} bảng · {matchCount} vòng đấu</p></div>
                                    <div><p className="text-xs font-bold text-slate-500">GIẢI THƯỞNG</p><p className="mt-1 font-black text-slate-900">{form.draftPrizes.filter((prize) => prize.name.trim()).length} giải</p></div>
                                </div>
                            </div>
                        )}
                    </div>

                    <footer className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-5 md:px-10">
                        <button type="button" className="btn-secondary" disabled={createStep === 0 || loading} onClick={() => { setMessage(null); setCreateStep((step) => step - 1); }}>← Quay lại</button>
                        <span className="hidden text-xs font-bold text-slate-400 sm:block">Bước {createStep + 1} / 4</span>
                        {createStep < 3
                            ? <button type="button" className="btn-primary min-w-32" onClick={goToNextCreateStep}>Tiếp tục →</button>
                            : <button type="button" className="btn-primary min-w-44" disabled={loading} onClick={createCompetition}>{loading ? 'Đang tạo...' : 'Tạo cuộc thi & lịch đấu'}</button>}
                    </footer>
                    </div>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-7xl space-y-6">
            {message && (
                <div className={`rounded-lg border p-4 text-sm font-bold ${message.type === 'success' ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
                    {message.text}
                </div>
            )}

            <div className="space-y-6">
                <section className="overflow-hidden rounded-2xl bg-gradient-to-r from-[#092e66] to-[#0f63c9] p-6 text-white shadow-lg md:p-8">
                    <button type="button" className="text-xs font-black !text-blue-100 hover:underline" onClick={() => { setForm(emptyEvent()); setSelectedEventId(''); setShowCreate(false); setMessage(null); }}>← Quay lại danh sách sự kiện</button>
                    <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-white/15 px-3 py-1 text-xs font-black !text-white">{selectedEvent?.season} {selectedEvent?.year}</span><span className={`rounded-full border px-3 py-1 text-xs font-black ${eventLifecycle(selectedEvent).className}`}>{eventLifecycle(selectedEvent).label}</span></div>
                            <h2 className="mt-3 text-2xl font-black !text-white md:text-3xl">{selectedEvent?.name}</h2>
                            <p className="mt-2 text-sm !text-blue-100">{selectedEvent?.teamCount || 0} đội thi · {selectedEvent?.tracks?.length || 0} bảng đấu · {selectedEvent?.roundCount || 0} vòng</p>
                        </div>
                        <div className="flex flex-wrap gap-2"><Link to={`/events/${selectedEventId}`} className="rounded-xl border border-blue-200 px-4 py-2.5 text-sm font-black hover:opacity-90" style={{ background: '#174f93', color: '#ffffff' }}>Xem trang công khai</Link><Link to="/dashboard/scoring-config" className="rounded-xl bg-white px-4 py-2.5 text-sm font-black !text-[#0f63c9] hover:bg-blue-50">Cấu hình chấm điểm</Link></div>
                    </div>
                </section>

                <main className="min-w-0 space-y-6">
                    <div className="rounded-2xl border border-blue-100 bg-white p-2 shadow-sm">
                        <div className="grid gap-2 md:grid-cols-4">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`rounded-xl px-4 py-3 text-sm font-black ${activeTab === tab.id ? 'bg-[#0f63c9] text-white shadow-sm' : 'text-slate-600 hover:bg-blue-50 hover:text-[#0f63c9]'}`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {activeTab === 'overview' && (
                        <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
                            <section className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
                                <div className="flex flex-col gap-4 border-b border-blue-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
                                    <div><p className="text-xs font-black uppercase tracking-[0.18em] text-[#0f63c9]">Hướng dẫn thiết lập</p><h3 className="mt-1 text-xl font-black text-slate-900">Các việc cần hoàn tất</h3><p className="mt-1 text-sm text-slate-500">Đi lần lượt từ trên xuống. Mỗi mục sẽ tự đánh dấu khi đủ thông tin.</p></div>
                                    <div className="text-right"><p className="text-3xl font-black text-[#0f63c9]">{managementProgress}%</p><p className="text-xs font-bold text-slate-500">{completedManagementSteps}/{managementSteps.length} mục hoàn tất</p></div>
                                </div>
                                <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-[#0f63c9] to-[#48a0ff] transition-all" style={{ width: `${managementProgress}%` }} /></div>
                                <div className="mt-5 space-y-3">
                                    {managementSteps.map((step, index) => {
                                        const content = <><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-black ${step.done ? 'bg-emerald-500 text-white' : 'bg-blue-100 text-[#0f63c9]'}`}>{step.done ? '✓' : index + 1}</span><span className="min-w-0 flex-1 text-left"><span className="block font-black text-slate-900">{step.label}</span><span className="mt-1 block text-sm leading-5 text-slate-500">{step.description}</span></span><span className="shrink-0 text-sm font-black text-[#0f63c9]">{step.done ? 'Xem lại' : 'Thiết lập'} →</span></>;
                                        return step.id === 'scoring'
                                            ? <Link key={step.id} to="/dashboard/scoring-config" className="flex items-center gap-4 rounded-xl border border-slate-200 p-4 transition hover:border-blue-300 hover:bg-blue-50/50">{content}</Link>
                                            : <button key={step.id} type="button" onClick={() => setActiveTab(step.id)} className="flex w-full items-center gap-4 rounded-xl border border-slate-200 p-4 transition hover:border-blue-300 hover:bg-blue-50/50">{content}</button>;
                                    })}
                                </div>
                            </section>

                            <aside className="space-y-5">
                                <section className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm"><p className="text-xs font-black uppercase tracking-[0.16em] text-[#0f63c9]">Lịch quan trọng</p><div className="mt-4 space-y-4">{[['Mở đăng ký', selectedEvent?.regStartDate], ['Đóng đăng ký', selectedEvent?.regEndDate], ['Bắt đầu thi', selectedEvent?.eventStartDate], ['Kết thúc thi', selectedEvent?.eventEndDate]].map(([label, value]) => <div key={label} className="flex items-start justify-between gap-4"><span className="text-sm text-slate-500">{label}</span><strong className="text-right text-sm text-slate-900">{value ? new Date(value).toLocaleString('vi-VN') : 'Chưa đặt'}</strong></div>)}</div></section>
                                <section className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm"><p className="text-xs font-black uppercase tracking-[0.16em] text-[#0f63c9]">Cấu trúc cuộc thi</p><div className="mt-4 grid grid-cols-2 gap-3"><div className="rounded-xl bg-blue-50 p-3"><p className="text-2xl font-black text-[#071936]">{selectedEvent?.tracks?.length || 0}</p><p className="text-xs font-bold text-slate-500">Bảng đấu</p></div><div className="rounded-xl bg-blue-50 p-3"><p className="text-2xl font-black text-[#071936]">{selectedEvent?.roundCount || 0}</p><p className="text-xs font-bold text-slate-500">Vòng thi</p></div><div className="rounded-xl bg-blue-50 p-3"><p className="text-2xl font-black text-[#071936]">{selectedEvent?.teamCount || 0}</p><p className="text-xs font-bold text-slate-500">Đội tham gia</p></div><div className="rounded-xl bg-blue-50 p-3"><p className="text-2xl font-black text-[#071936]">{completion.readyMatrices}/{completion.totalMatrices}</p><p className="text-xs font-bold text-slate-500">Vòng sẵn sàng</p></div></div></section>
                            </aside>
                        </div>
                    )}

                    {activeTab === 'event' && (
                        <Section
                            title="Thông tin và lịch sự kiện"
                            eyebrow="Cấu hình cơ bản"
                            actions={selectedEvent && <button type="button" className="btn-secondary" onClick={deleteEvent} disabled={loading}>Tạm dừng sự kiện</button>}
                        >
                            <form onSubmit={saveEvent} className="space-y-5">
                                <div><h3 className="font-black text-slate-900">1. Thông tin nhận diện</h3><p className="mt-1 text-sm text-slate-500">Nội dung cơ bản hiển thị cho người tham gia trên trang công khai.</p></div>
                                <div className="grid gap-4 md:grid-cols-[1fr_180px_140px]">
                                    <input required className="input-custom" placeholder="Tên sự kiện" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                                    <select className="input-custom" value={form.season} onChange={(e) => setForm({ ...form, season: e.target.value })}>
                                        <option value="SPRING">Spring</option>
                                        <option value="SUMMER">Summer</option>
                                        <option value="FALL">Fall</option>
                                    </select>
                                    <input required type="number" className="input-custom" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} />
                                </div>
                                <textarea rows="4" className="input-custom" placeholder="Mô tả mục tiêu, đối tượng tham gia và nội dung sự kiện..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                                <div className="border-t border-blue-100 pt-5"><h3 className="font-black text-slate-900">2. Các mốc thời gian</h3><p className="mt-1 text-sm text-slate-500">Các mốc phải theo thứ tự từ mở đăng ký đến kết thúc cuộc thi.</p></div>
                                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                    <label className="text-sm font-bold text-slate-700">Mở đăng ký<input required type="datetime-local" className="input-custom mt-1" value={form.regStartDate} onChange={(e) => setForm({ ...form, regStartDate: e.target.value })} /></label>
                                    <label className="text-sm font-bold text-slate-700">Đóng đăng ký<input required type="datetime-local" className="input-custom mt-1" value={form.regEndDate} onChange={(e) => setForm({ ...form, regEndDate: e.target.value })} /></label>
                                    <label className="text-sm font-bold text-slate-700">Deadline mặc định<input type="datetime-local" className="input-custom mt-1" value={form.submissionDeadline} onChange={(e) => setForm({ ...form, submissionDeadline: e.target.value })} /></label>
                                    <label className="text-sm font-bold text-slate-700">Bắt đầu thi<input required type="datetime-local" className="input-custom mt-1" value={form.eventStartDate} onChange={(e) => setForm({ ...form, eventStartDate: e.target.value })} /></label>
                                    <label className="text-sm font-bold text-slate-700">Kết thúc thi<input required type="datetime-local" className="input-custom mt-1" value={form.eventEndDate} onChange={(e) => setForm({ ...form, eventEndDate: e.target.value })} /></label>
                                    <label className="text-sm font-bold text-slate-700">Tổng số vòng (gồm chung kết)<input required min="2" type="number" className="input-custom mt-1" value={form.roundCount} onChange={(e) => setForm({ ...form, roundCount: Math.max(2, Number(e.target.value)) })} /></label>
                                </div>
                                <div className="rounded-xl border border-blue-100 bg-slate-50 p-4">
                                    <div className="mb-2 flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-black text-slate-800">3. Bảng đấu và Mentor phụ trách</p>
                                            <p className="mt-1 text-xs text-slate-500">Mỗi bảng chọn từ 1–2 Staff được giao nhiệm vụ Mentor.</p>
                                        </div>
                                        <button type="button" className="btn-secondary" disabled={selectedEvent?.structureInitialized} onClick={() => setForm((current) => ({ ...current, tracks: [...current.tracks, { name: `Bảng ${String.fromCharCode(65 + current.tracks.length)}`, mentorIds: [] }] }))}>Thêm bảng</button>
                                    </div>
                                    <div className="mt-4 grid gap-4 lg:grid-cols-2">
                                        {form.tracks.map((track, index) => (
                                            <div key={index} className="rounded-lg border border-blue-100 bg-white p-4 shadow-sm">
                                                <div className="flex gap-2">
                                                    <input required className="input-custom font-bold" value={track.name} onChange={(e) => updateTrack(index, { name: e.target.value })} placeholder="Tên bảng đấu" />
                                                    <button type="button" className="btn-secondary" disabled={selectedEvent?.structureInitialized || form.tracks.length <= 1} onClick={() => setForm((current) => ({ ...current, tracks: current.tracks.filter((_, itemIndex) => itemIndex !== index) }))}>Xóa</button>
                                                </div>
                                                <p className="mb-2 mt-4 text-xs font-black uppercase tracking-wide text-[#0f63c9]">Chọn Mentor phụ trách ({track.mentorIds.length}/2)</p>
                                                <div className="max-h-36 space-y-2 overflow-auto">
                                                    {mentors.map((user) => (
                                                        <label key={user.id} className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm ${track.mentorIds.some((id) => String(id) === String(user.id)) ? 'bg-blue-50 font-bold text-blue-800' : 'text-slate-600'}`}>
                                                            <input type="checkbox" checked={track.mentorIds.some((id) => String(id) === String(user.id))} disabled={!track.mentorIds.some((id) => String(id) === String(user.id)) && track.mentorIds.length >= 2} onChange={() => toggleTrackMentor(index, user.id)} />
                                                            {user.fullName || user.email}
                                                        </label>
                                                    ))}
                                                    {mentors.length === 0 && <p className="text-sm text-amber-700">Chưa có tài khoản mentor.</p>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-bold text-emerald-800">
                                        Cấu trúc hiện tại: {form.tracks.length} bảng đấu và {form.roundCount} vòng thi.
                                    </div>
                                    {selectedEvent?.structureInitialized && <p className="mt-2 text-xs font-semibold text-amber-700">Cấu trúc đã được khởi tạo nên bảng đấu được khóa để bảo toàn dữ liệu bài thi.</p>}
                                </div>
                                <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                    <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
                                    Cho phép sự kiện hiển thị và hoạt động
                                </label>
                                <button type="submit" className="btn-primary w-full" disabled={loading}>{loading ? 'Đang lưu...' : 'Lưu thay đổi'}</button>
                            </form>
                        </Section>
                    )}

                    {activeTab === 'submission' && (
                        <Section title="Form bài nộp của đội thi" eyebrow="Nội dung Team Leader cần cung cấp">
                            <form onSubmit={saveEvent} className="space-y-4">
                                {form.submissionFields.map((field, index) => (
                                    <div key={field.id || index} className="grid gap-3 rounded-lg border border-blue-100 p-4 md:grid-cols-[1fr_150px_120px_auto]">
                                        <input className="input-custom" value={field.label} onChange={(e) => updateArrayItem('submissionFields', index, { label: e.target.value, id: field.id || e.target.value.toLowerCase().replaceAll(' ', '_') })} placeholder="Ten truong" />
                                        <select className="input-custom" value={field.type} onChange={(e) => updateArrayItem('submissionFields', index, { type: e.target.value })}>
                                            <option value="text">Text</option>
                                            <option value="url">URL</option>
                                            <option value="textarea">Textarea</option>
                                            <option value="file">File</option>
                                        </select>
                                        <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                            <input type="checkbox" checked={field.required} onChange={(e) => updateArrayItem('submissionFields', index, { required: e.target.checked })} />
                                            Bat buoc
                                        </label>
                                        <button type="button" className="btn-secondary" onClick={() => setForm((current) => ({ ...current, submissionFields: current.submissionFields.filter((_, itemIndex) => itemIndex !== index) }))}>Xoa</button>
                                    </div>
                                ))}
                                <div className="flex flex-col gap-3 md:flex-row">
                                    <button type="button" className="btn-secondary" onClick={() => setForm((current) => ({ ...current, submissionFields: [...current.submissionFields, { id: `field_${Date.now()}`, label: '', type: 'text', required: false }] }))}>+ Thêm trường</button>
                                    <button type="submit" className="btn-primary" disabled={loading || !form.name}>Lưu form bài nộp</button>
                                </div>
                            </form>
                        </Section>
                    )}

                    {activeTab === 'rubric' && (
                        <Section
                            title="Vòng đấu, Top N & giám khảo"
                            eyebrow="Cấu trúc thi đấu"
                            actions={<button type="button" className="btn-secondary" disabled={!selectedEvent || selectedEvent.structureInitialized || loading} onClick={initializeStructure}>Tạo lịch đấu tự động</button>}
                        >
                            {!selectedEvent?.structureInitialized ? (
                                <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm font-bold text-amber-800">
                                    Lưu thông tin cuộc thi trước, sau đó bấm “Tạo lịch đấu tự động”. Hệ thống chỉ tạo một trận chung kết.
                                </div>
                            ) : (
                                <form onSubmit={saveMatrix} className="space-y-5">
                                    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                                        {(selectedEvent?.matrices || []).map((matrix) => (
                                            <button key={matrix.id} type="button" onClick={() => setSelectedMatrixId(matrix.id)} className={`rounded-lg border p-3 text-left ${String(selectedMatrixId) === String(matrix.id) ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-100' : 'border-slate-200 bg-white hover:border-blue-300'}`}>
                                                <p className="font-black text-slate-900">{matrix.roundName}</p>
                                                <p className="mt-1 text-sm text-slate-600">{matrix.finalRound ? 'Tất cả bảng · Chung kết' : matrix.trackName}</p>
                                                <p className="mt-2 text-xs font-bold text-[#0f63c9]">{matrix.finalRound ? 'Vòng cuối' : `Lấy Top ${matrix.topN || '—'}`} · {matrix.judges?.length || 0}/4 judge</p>
                                            </button>
                                        ))}
                                    </div>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <input className="input-custom" placeholder="Guideline / de bai / link quy che rieng" value={matrixForm.guidelineUrl} onChange={(e) => setMatrixForm({ ...matrixForm, guidelineUrl: e.target.value })} />
                                        <input type="datetime-local" className="input-custom" value={matrixForm.submissionDeadline} onChange={(e) => setMatrixForm({ ...matrixForm, submissionDeadline: e.target.value })} />
                                    </div>
                                    {!selectedMatrix?.finalRound && (
                                        <label className="block rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-900">
                                            Tự động đưa Top N đội vào vòng tiếp theo
                                            <input required min="1" type="number" className="input-custom mt-2 max-w-xs bg-white" value={matrixForm.topN} onChange={(e) => setMatrixForm({ ...matrixForm, topN: e.target.value })} />
                                            <span className="mt-2 block text-xs font-medium text-emerald-700">Chỉ xếp hạng sau khi tất cả judge được phân công đã chấm xong.</span>
                                        </label>
                                    )}
                                    <div className="space-y-3">
                                        {matrixForm.criteria.map((criterion, index) => (
                                            <div key={criterion.id || index} className="grid gap-3 rounded-lg border border-blue-100 p-4 lg:grid-cols-[1fr_1.3fr_120px_120px_auto]">
                                                <input className="input-custom" value={criterion.label} onChange={(e) => updateCriterion(index, { label: e.target.value, id: criterion.id || e.target.value.toLowerCase().replaceAll(' ', '_') })} placeholder="Cot diem" />
                                                <input className="input-custom" value={criterion.description} onChange={(e) => updateCriterion(index, { description: e.target.value })} placeholder="Mo ta tieu chi" />
                                                <input type="number" min="1" className="input-custom" value={criterion.maxScore} onChange={(e) => updateCriterion(index, { maxScore: Number(e.target.value) })} />
                                                <input type="number" min="1" className="input-custom" value={criterion.weight} onChange={(e) => updateCriterion(index, { weight: Number(e.target.value) })} />
                                                <button type="button" className="btn-secondary" onClick={() => setMatrixForm((current) => ({ ...current, criteria: current.criteria.filter((_, itemIndex) => itemIndex !== index) }))}>Xoa</button>
                                            </div>
                                        ))}
                                    </div>
                                    <button type="button" className="btn-secondary" onClick={() => setMatrixForm((current) => ({ ...current, criteria: [...current.criteria, { id: `criterion_${Date.now()}`, label: '', description: '', maxScore: 100, weight: 10 }] }))}>Them cot diem</button>
                                    <div>
                                            <p className="mb-2 text-sm font-bold text-slate-700">Staff làm Judge (chọn 2–4 người)</p>
                                            <div className="max-h-56 space-y-2 overflow-auto rounded-lg border border-blue-100 p-3">
                                                {judges.map((user) => (
                                                    <label key={user.id} className="flex items-center gap-2 text-sm">
                                                        <input type="checkbox" checked={matrixForm.judgeIds.some((id) => String(id) === String(user.id))} disabled={!matrixForm.judgeIds.some((id) => String(id) === String(user.id)) && matrixForm.judgeIds.length >= 4} onChange={() => toggleMatrixUser('judgeIds', user.id)} />
                                                        {user.fullName || user.email}
                                                    </label>
                                                ))}
                                                {judges.length === 0 && <p className="text-sm text-slate-500">Chưa có judge.</p>}
                                            </div>
                                    </div>
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <button type="submit" className="btn-primary w-full" disabled={loading}>Lưu riêng vòng đấu này</button>
                                        <button type="button" className="btn-secondary w-full" disabled={loading} onClick={applyMatrixToSameRound}>Áp dụng cho mọi bảng cùng vòng</button>
                                    </div>
                                </form>
                            )}
                        </Section>
                    )}

                    {activeTab === 'rules' && (
                        <div className="space-y-6">
                            <Section title="Thể lệ cuộc thi" eyebrow="Quy định dành cho đội thi">
                                <form onSubmit={saveEvent} className="space-y-4">
                                    <input className="input-custom" placeholder="Link tai lieu quy che PDF/Drive" value={form.ruleDocumentUrl} onChange={(e) => setForm({ ...form, ruleDocumentUrl: e.target.value })} />
                                    <textarea rows="8" className="input-custom" value={form.competitionRules} onChange={(e) => setForm({ ...form, competitionRules: e.target.value })} placeholder="Nhap quy che, dieu kien nop bai, cach xu ly vi pham..." />
                                    <button type="submit" className="btn-primary" disabled={loading || !form.name}>Lưu thể lệ</button>
                                </form>
                            </Section>
                            <Section title="Cơ cấu giải thưởng" eyebrow="Giải thưởng và đội đạt giải">
                                <form onSubmit={savePrize} className="grid gap-3 lg:grid-cols-[1fr_1fr_220px_auto]">
                                    <input required className="input-custom" value={prizeForm.name} onChange={(e) => setPrizeForm({ ...prizeForm, name: e.target.value })} placeholder="Tên giải thưởng" />
                                    <input className="input-custom" value={prizeForm.description} onChange={(e) => setPrizeForm({ ...prizeForm, description: e.target.value })} placeholder="Mô tả hoặc phần thưởng" />
                                    <select className="input-custom" value={prizeForm.teamId} onChange={(e) => setPrizeForm({ ...prizeForm, teamId: e.target.value })}>
                                        <option value="">Chưa trao cho đội</option>
                                        {eventTeams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
                                    </select>
                                    <button type="submit" className="btn-primary" disabled={!selectedEventId || loading}>{prizeForm.id ? 'Cập nhật' : 'Thêm giải'}</button>
                                </form>
                                <div className="mt-5 divide-y divide-blue-50 rounded-lg border border-blue-100">
                                    {prizes.map((prize) => (
                                        <div key={prize.id} className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
                                            <div>
                                                <p className="font-black text-slate-900">{prize.name}</p>
                                                <p className="text-sm text-slate-600">{prize.description || 'Chưa có mô tả'} {prize.teamName ? `- ${prize.teamName}` : ''}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button type="button" className="btn-secondary" onClick={() => setPrizeForm({ id: prize.id, name: prize.name || '', description: prize.description || '', teamId: prize.teamId || '' })}>Sua</button>
                                                <button type="button" className="btn-secondary" onClick={async () => { await axiosClient.delete(`/events/prizes/${prize.id}`); await fetchPrizes(selectedEventId); }}>Xoa</button>
                                            </div>
                                        </div>
                                    ))}
                                    {prizes.length === 0 && <p className="p-4 text-sm text-slate-500">Chưa có giải thưởng.</p>}
                                </div>
                            </Section>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
