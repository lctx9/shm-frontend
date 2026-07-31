import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import Toast from '../components/Toast';

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
        { id: null, name: "Table A", mentorIds: [], maxTeams: null },
        { id: null, name: "Table B", mentorIds: [], maxTeams: null },
    ],
    submissionFields: defaultSubmissionFields,
    competitionRules: [
        'Moi doi nop bai dung deadline tren he thong.',
        'San pham phai do doi tu phat trien trong khuon kho su kien.',
        'Judges score each round using the published rubric.',
    ].join('\n'),
    ruleDocumentUrl: '',
    active: true,
    resultsPublished: false,
    draftPrizes: [{ name: "First Prize", description: '' }],
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
            ? event.tracks.map((track) => ({ id: track.id, name: track.name, mentorIds: track.mentors?.map((mentor) => mentor.id) || [], maxTeams: track.maxTeams || null }))
            : [{ id: null, name: "Table A", mentorIds: [], maxTeams: null }],
        submissionFields: parseJson(event.submissionFormSchema, defaultSubmissionFields),
        competitionRules: event.competitionRules || '',
        ruleDocumentUrl: event.ruleDocumentUrl || '',
        active: event.active !== false,
        resultsPublished: Boolean(event.resultsPublished),
        draftPrizes: [],
    };
}

function eventLifecycle(event) {
    const now = Date.now();
    const registrationStart = event.regStartDate ? new Date(event.regStartDate).getTime() : null;
    const registrationEnd = event.regEndDate ? new Date(event.regEndDate).getTime() : null;
    const eventStart = event.eventStartDate ? new Date(event.eventStartDate).getTime() : null;
    const eventEnd = event.eventEndDate ? new Date(event.eventEndDate).getTime() : null;
    if (eventEnd && now > eventEnd) return { id: 'ended', label: "Ended", className: 'border-slate-200 bg-slate-100 text-slate-600' };
    if (!event.active) return { id: 'inactive', label: "Pause", className: 'border-slate-200 bg-slate-100 text-slate-600' };
    if (registrationStart && now < registrationStart) return { id: 'upcoming', label: "Registration is about to open", className: 'border-violet-200 bg-violet-50 text-violet-700' };
    if (registrationEnd && now <= registrationEnd) return { id: 'registration', label: "Registration open", className: 'border-blue-200 bg-blue-50 text-blue-700' };
    if (eventStart && now < eventStart) return { id: 'preparing', label: "Preparing", className: 'border-amber-200 bg-amber-50 text-amber-700' };
    if (eventEnd && now <= eventEnd) return { id: 'running', label: "Ongoing", className: 'border-emerald-200 bg-emerald-50 text-emerald-700' };
    return { id: 'draft', label: "Not enough schedule", className: 'border-rose-200 bg-rose-50 text-rose-700' };
}

function shortDate(value) {
    return value ? new Date(value).toLocaleDateString('en-GB') : "Not scheduled";
}

function displayCompetitionLabel(value, fallback = '') {
    return String(value || fallback)
        .replace(/Vòng chung kết/gi, 'Final Round')
        .replace(/Vòng\s*(\d+)/gi, 'Round $1')
        .replace(/Bảng\s*/gi, 'Track ');
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
    ['01', "Information"],
    ['02', "Time"],
    ['03', "Tracks"],
    ['04', "Confirm"],
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
    const readOnly = localStorage.getItem('role') === 'ADMIN';
    const [events, setEvents] = useState([]);
    const [teams, setTeams] = useState([]);
    const [mentors, setMentors] = useState([]);
    const [judges, setJudges] = useState([]);
    const [prizes, setPrizes] = useState([]);
    const [submissions, setSubmissions] = useState([]);
    const [selectedEventId, setSelectedEventId] = useState('');
    const [selectedMatrixId, setSelectedMatrixId] = useState('');
    const [form, setForm] = useState(emptyEvent);
    const [matrixForm, setMatrixForm] = useState({ guidelineUrl: '', submissionStartDate: '', submissionDeadline: '', gradingDurationMinutes: 10, topN: 10, judgeIds: [], criteria: defaultCriteria });
    const [prizeForm, setPrizeForm] = useState(emptyPrize);
    const [activeTab, setActiveTab] = useState('overview');
    const [createStep, setCreateStep] = useState(0);
    const [initialLoading, setInitialLoading] = useState(true);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [showCreate, setShowCreate] = useState(false);
    const [eventQuery, setEventQuery] = useState('');
    const [eventFilter, setEventFilter] = useState('all');
    const [templates, setTemplates] = useState([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState('');
    const [newTemplateName, setNewTemplateName] = useState('');
    const didBootstrap = useRef(false);

    const [searchParams, setSearchParams] = useSearchParams();

    const ensureCoordinator = () => {
        if (!readOnly) return true;
        setMessage({ type: 'error', text: "Admin can only view contest data. The new Coordinator has the right to operate." });
        return false;
    };

    useEffect(() => {
        const evId = searchParams.get('eventId');
        const tab = searchParams.get('tab');
        if (evId) {
            setSelectedEventId(evId);
        } else if (tab === 'overview') {
            setSelectedEventId('');
            setSelectedMatrixId('');
            setForm(emptyEvent());
            setPrizeForm(emptyPrize);
            setShowCreate(false);
        }
        if (tab) {
            setActiveTab(tab);
        }
    }, [searchParams]);

    useEffect(() => {
        const newParams = {};
        if (selectedEventId) newParams.eventId = selectedEventId;
        if (activeTab) newParams.tab = activeTab;
        setSearchParams(newParams, { replace: true });
    }, [selectedEventId, activeTab]);

    const selectedEvent = useMemo(
        () => events.find((event) => String(event.id) === String(selectedEventId)),
        [events, selectedEventId]
    );

    const selectedMatrix = useMemo(
        () => selectedEvent?.matrices?.find((matrix) => String(matrix.id) === String(selectedMatrixId)),
        [selectedEvent, selectedMatrixId]
    );

    const handlePublishAndAdvanceRound = async (roundOrder) => {
        if (!ensureCoordinator()) return;
        if (!selectedEventId || !roundOrder) return;
        try {
            setLoading(true);
            const res = await axiosClient.post(`/matrices/events/${selectedEventId}/rounds/${roundOrder}/publish-and-advance`);
            setMessage({ type: 'success', text: res.result || "The results have been announced and the next round has been successfully opened!" });
            await fetchAll(selectedEventId);
        } catch (err) {
            setMessage({ type: 'error', text: err.message || "It is not possible to announce the results and open a new round." });
        } finally {
            setLoading(false);
        }
    };

    const handleEndEventEarly = async () => {
        if (!ensureCoordinator()) return;
        if (!selectedEventId) return;
        if (window.confirm(`Confirm end of event"${selectedEvent?.name}"earlier than expected?`)) {
            try {
                setLoading(true);
                await axiosClient.post(`/events/${selectedEventId}/end-early`);
                setMessage({ type: 'success', text: "Successfully ended the event earlier than expected!" });
                await fetchAll(selectedEventId);
            } catch (err) {
                setMessage({ type: 'error', text: err.message || "The event cannot be ended early." });
            } finally {
                setLoading(false);
            }
        }
    };

    const eventTeams = useMemo(
        () => teams.filter((team) => String(team.eventId) === String(selectedEventId)),
        [teams, selectedEventId]
    );

    const pendingDisqualifications = useMemo(
        () => teams.filter((team) => {
            const matchesEvent = !selectedEventId || String(team.eventId) === String(selectedEventId);
            return matchesEvent && team.disqualificationStatus === 'PENDING';
        }),
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
        const [eventRes, teamRes, staffRes, templateRes, submissionRes] = await Promise.all([
            axiosClient.get('/events'),
            axiosClient.get('/teams').catch(() => ({ result: [] })),
            axiosClient.get('/users/role/STAFF').catch(() => ({ result: [] })),
            axiosClient.get('/rule-templates').catch(() => ({ result: [] })),
            axiosClient.get('/submissions').catch(() => ({ result: [] })),
        ]);

        const loadedEvents = eventRes.result || [];
        const urlEventId = searchParams.get('eventId');
        const nextEventId = preferredEventId || urlEventId || selectedEventId || '';
        const nextEvent = loadedEvents.find((item) => String(item.id) === String(nextEventId));

        setEvents(loadedEvents);
        setTeams(teamRes.result || []);
        setMentors(staffRes.result || []);
        setJudges(staffRes.result || []);
        setTemplates(templateRes.result || []);
        setSubmissions(submissionRes.result || []);
        setSelectedEventId(nextEvent ? String(nextEventId) : '');
        setSelectedMatrixId((currentMatrixId) => {
            const keepMatrix = nextEvent?.matrices?.find((matrix) => String(matrix.id) === String(currentMatrixId));
            return keepMatrix?.id || nextEvent?.matrices?.[0]?.id || '';
        });
        setForm(nextEvent ? eventToForm(nextEvent) : emptyEvent());
        await fetchPrizes(nextEvent ? nextEventId : '');
    };

    useEffect(() => {
        if (didBootstrap.current) return;
        didBootstrap.current = true;
        fetchAll()
            .catch((err) => setMessage({ type: 'error', text: err.message || "Unable to download contest data." }))
            .finally(() => setInitialLoading(false));
        // Initial bootstrap only; later refreshes are triggered explicitly after mutations.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!selectedMatrix) {
            setMatrixForm({ guidelineUrl: '', submissionStartDate: '', submissionDeadline: '', gradingDurationMinutes: 10, topN: 10, judgeIds: [], criteria: defaultCriteria });
            return;
        }

        setMatrixForm({
            guidelineUrl: selectedMatrix.guidelineUrl || '',
            submissionStartDate: toLocalInput(selectedMatrix.submissionStartDate),
            submissionDeadline: toLocalInput(selectedMatrix.submissionDeadline),
            gradingDurationMinutes: selectedMatrix.gradingDurationMinutes || 10,
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

    const handleAutofill = () => {
        const now = new Date();
        const year = now.getFullYear();

        const formatDate = (d) => {
            const pad = (n) => String(n).padStart(2, '0');
            return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        };

        const regStart = new Date(now.getTime() - 10 * 60 * 1000); // Mở đăng ký: 10 phút trước
        const regEnd = new Date(now.getTime() - 7 * 60 * 1000);   // Đóng đăng ký: 7 phút trước
        const eventStart = new Date(now.getTime() - 5 * 60 * 1000); // Bắt đầu cuộc thi: 5 phút trước
        const deadline = new Date(now.getTime() - 2 * 60 * 1000);   // Hạn nộp bài mặc định: 2 phút trước (đã qua để chấm điểm được ngay)
        const eventEnd = new Date(now.getTime() + 10 * 60 * 1000);  // Kết thúc cuộc thi: 10 phút sau (cuộc thi đang diễn ra)

        const track1Mentors = [];
        const track2Mentors = [];
        if (mentors.length > 0) {
            track1Mentors.push(mentors[0].id);
            if (mentors.length > 1) {
                track1Mentors.push(mentors[1].id);
            }
            if (mentors.length > 2) {
                track2Mentors.push(mentors[2].id);
            } else {
                track2Mentors.push(mentors[0].id);
            }
            if (mentors.length > 3) {
                track2Mentors.push(mentors[3].id);
            } else if (mentors.length > 1) {
                track2Mentors.push(mentors[1].id);
            }
        }

        setForm({
            id: null,
            name: `SEAL Hackathon ${form.season || 'SPRING'} ${year}`,
            description: "The Hackathon programming competition aims to find and develop innovative technology products, artificial intelligence (AI) applications and breakthrough software solutions to solve practical problems in life and business.",
            season: form.season || 'SPRING',
            year: year,
            regStartDate: formatDate(regStart),
            regEndDate: formatDate(regEnd),
            eventStartDate: formatDate(eventStart),
            eventEndDate: formatDate(eventEnd),
            submissionDeadline: formatDate(deadline),
            roundCount: 3,
            tracks: [
                { id: null, name: "Table A (Technology & AI)", mentorIds: track1Mentors, maxTeams: 15 },
                { id: null, name: "Table B (Enterprise solutions)", mentorIds: track2Mentors, maxTeams: 15 }
            ],
            submissionFields: defaultSubmissionFields,
            competitionRules: [
                "Each team submits their work on time on the system.",
                "Products must be developed by the team within the framework of the event.",
                "The judging panel will score independently using the published rubric for each round.",
                "Cheating or copying source code will be directly disqualified."
            ].join('\n'),
            ruleDocumentUrl: 'https://docs.google.com/document/d/example-rules',
            active: true,
            resultsPublished: false,
            draftPrizes: [
                { name: "First Prize", description: "Gold Cup of Honor + Electronic Certificate of Merit + 15,000,000 VND in cash" },
                { name: "Second Prize", description: "Electronic certificate of merit + 8,000,000 VND in cash" },
                { name: "Third Prize", description: "Electronic certificate of merit + 4,000,000 VND in cash" }
            ]
        });

        setMessage({ type: 'success', text: "⚡ Successfully auto-populated sample event information! You can click Continue to view and refine further." });
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
            .map((track) => ({ id: track.id || null, name: track.name.trim(), mentorIds: track.mentorIds.map(Number), maxTeams: track.maxTeams || null })),
        submissionFormSchema: JSON.stringify(form.submissionFields),
        competitionRules: form.competitionRules,
        ruleDocumentUrl: form.ruleDocumentUrl,
        active: form.active,
        resultsPublished: form.resultsPublished || false,
    });

    const validateCreateStep = (step) => {
        if (step === 0 && (!form.name.trim() || !form.description.trim() || !form.year)) {
            return "Please enter your name, year and contest description.";
        }
        if (step === 1) {
            if (!form.regStartDate || !form.regEndDate || !form.eventStartDate || !form.eventEndDate) {
                return "Please enter enough registration time and event time.";
            }
            if (new Date(form.regStartDate) >= new Date(form.regEndDate)) return "Registration closing time must be after opening time.";
            if (new Date(form.regEndDate) > new Date(form.eventStartDate)) return "Registration must close before the competition begins.";
            if (new Date(form.eventStartDate) >= new Date(form.eventEndDate)) return "The end time must be after the start time.";
        }
        if (step === 2) {
            if (!form.tracks.length || form.tracks.some((track) => !track.name.trim())) return "Each group needs a name.";
            if (form.tracks.some((track) => track.mentorIds.length < 1 || track.mentorIds.length > 2)) return "Each group needs 1 to 2 mentors.";
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
        if (!ensureCoordinator()) return;
        const error = validateCreateStep(2);
        if (error) {
            setMessage({ type: 'error', text: error });
            setCreateStep(2);
            return;
        }

        setLoading(true);
        setMessage(null);
        try {
            const validPrizes = form.draftPrizes.filter((prize) => prize.name.trim());
            const response = await axiosClient.post('/events/setup', {
                event: eventPayload(),
                prizes: validPrizes.map((prize) => ({
                name: prize.name.trim(),
                description: prize.description.trim(),
                teamId: null,
                })),
            });
            const eventId = response.result?.id;
            await fetchAll(eventId);
            setActiveTab('overview');
            setMessage({ type: 'success', text: "Created competition and match schedule. Use the Grading Configuration section on the sidebar to set up rubric, Top N and Judge." });
        } catch (err) {
            setMessage({ type: 'error', text: err.message || "Cannot create contest." });
        } finally {
            setLoading(false);
        }
    };

    const saveEvent = async (e) => {
        e.preventDefault();
        if (!ensureCoordinator()) return;
        if (form.id) {
            setMessage({ type: 'error', text: "Event configuration is locked and cannot be modified after creation." });
            return;
        }
        if (form.tracks.some((track) => track.mentorIds.length < 1 || track.mentorIds.length > 2)) {
            setMessage({ type: 'error', text: "Each group needs to be assigned 1 to 2 mentors." });
            return;
        }
        setLoading(true);
        setMessage(null);

        try {
            const response = await axiosClient.post('/events', eventPayload());
            setMessage({ type: 'success', text: "Event created successfully." });
            await fetchAll(response.result?.id || '');
        } catch (err) {
            setMessage({ type: 'error', text: err.message || 'Unable to save the event.' });
        } finally {
            setLoading(false);
        }
    };

    const deleteEvent = async () => {
        if (!ensureCoordinator()) return;
        if (!selectedEventId) return;
        const hasTeams = selectedEvent && Number(selectedEvent.teamCount || 0) > 0;
        const confirmMsg = hasTeams 
            ? "Are you sure you want to pause this event? Team history will be preserved."
            : "Are you sure you want to COMPLETELY REMOVE this draft event from your system? This operation cannot be undone.";
            
        if (!window.confirm(confirmMsg)) return;

        setLoading(true);
        try {
            await axiosClient.delete(`/events/${selectedEventId}`);
            setMessage({ 
                type: 'success', 
                text: hasTeams ? "Event operations have been paused." : "The event has been completely removed from the system."
            });
            await fetchAll('');
            if (!hasTeams) {
                setSelectedEventId(null);
                setSelectedEvent(null);
                setActiveTab('list');
            }
        } catch (err) {
            setMessage({ type: 'error', text: err.message || "The request could not be fulfilled." });
        } finally {
            setLoading(false);
        }
    };

    const handleApproveDisqualify = async (teamId, teamName) => {
        if (!ensureCoordinator()) return;
        if (window.confirm(`CONFIRM: You really want to ELIMINATE the team"${teamName}" from the tournament?\nThis action cannot be undone, all submissions and team members will be removed from the tournament.`)) {
            try {
                setLoading(true);
                await axiosClient.post(`/teams/${teamId}/approve-disqualify`);
                setMessage({ type: 'success', text: `Team type approved"${teamName}" from the tournament.` });
                await fetchAll(selectedEventId);
            } catch (err) {
                setMessage({ type: 'error', text: err.message || "Unable to browse team types." });
            } finally {
                setLoading(false);
            }
        }
    };

    const handleRejectDisqualify = async (teamId, teamName) => {
        if (!ensureCoordinator()) return;
        const reason = window.prompt(`Enter the reason for rejecting the team disqualification request"${teamName}" (this reason will be sent to the Judge):`);
        if (reason === null) return;
        if (!reason.trim()) {
            alert("You must enter the reason for rejecting the type request.");
            return;
        }

        try {
            setLoading(true);
            await axiosClient.post(`/teams/${teamId}/reject-disqualify`, { reason: reason.trim() });
            setMessage({ type: 'success', text: `Rejected proposal to disqualify team"${teamName}".` });
            await fetchAll(selectedEventId);
        } catch (err) {
            setMessage({ type: 'error', text: err.message || "The type proposal cannot be rejected." });
        } finally {
            setLoading(false);
        }
    };

    const togglePublishResults = async () => {
        if (!ensureCoordinator()) return;
        if (!selectedEventId || !selectedEvent) return;
        const newStatus = !selectedEvent.resultsPublished;
        const confirmMsg = newStatus
            ? "Are you sure you want to PUBLISH THE RESULTS of this event? The rankings will be publicly visible to everyone."
            : "Are you sure you want to CANCEL THE RESULTS of this event? The rankings will be hidden.";
            
        if (!window.confirm(confirmMsg)) return;

        setLoading(true);
        setMessage(null);
        try {
            const payload = {
                ...eventPayload(),
                resultsPublished: newStatus
            };
            await axiosClient.put(`/events/${selectedEventId}`, payload);
            setMessage({ 
                type: 'success', 
                text: newStatus ? "Event results published successfully." : "Event result publication has been canceled."
            });
            await fetchAll(selectedEventId);
        } catch (err) {
            setMessage({ type: 'error', text: err.message || "Cannot change publication status." });
        } finally {
            setLoading(false);
        }
    };

    const initializeStructure = async () => {
        if (!ensureCoordinator()) return;
        if (!selectedEventId) return;
        setLoading(true);
        try {
            const response = await axiosClient.post(`/events/${selectedEventId}/initialize-structure`);
            setMessage({ type: 'success', text: 'Da tao matrix Track x Round.' });
            await fetchAll(response.result?.id || selectedEventId);
        } catch (err) {
            setMessage({ type: 'error', text: err.message || 'Unable to initialize the round structure.' });
        } finally {
            setLoading(false);
        }
    };

    const saveMatrix = async (e) => {
        e.preventDefault();
        if (!ensureCoordinator()) return;
        if (!selectedMatrixId) return;
        if (matrixForm.judgeIds.length < 2 || matrixForm.judgeIds.length > 4) {
            setMessage({ type: 'error', text: "Each round requires 2 to 4 judges." });
            return;
        }

        if (matrixForm.submissionStartDate && matrixForm.submissionDeadline && new Date(matrixForm.submissionStartDate) > new Date(matrixForm.submissionDeadline)) {
            setMessage({ type: 'error', text: "The submission opening time cannot be after the submission deadline." });
            return;
        }

        const currentOrder = selectedMatrix.roundOrder;
        const reqStart = matrixForm.submissionStartDate ? new Date(matrixForm.submissionStartDate) : null;
        const reqEnd = matrixForm.submissionDeadline ? new Date(matrixForm.submissionDeadline) : null;

        for (const other of selectedEvent.matrices || []) {
            if (String(other.id) === String(selectedMatrixId)) continue;

            if (other.roundOrder === currentOrder - 1) {
                let isPreceding = false;
                if (selectedMatrix.finalRound) {
                    isPreceding = true;
                } else if (!other.finalRound && String(other.trackId) === String(selectedMatrix.trackId)) {
                    isPreceding = true;
                }

                if (isPreceding && other.submissionDeadline && reqStart) {
                    if (reqStart < new Date(other.submissionDeadline)) {
                        setMessage({ type: 'error', text: `The submission deadline cannot be before the deadline of the previous round (${other.roundName}).` });
                        return;
                    }
                }
            }

            if (other.roundOrder === currentOrder + 1) {
                let isSucceeding = false;
                if (other.finalRound) {
                    isSucceeding = true;
                } else if (!selectedMatrix.finalRound && String(other.trackId) === String(selectedMatrix.trackId)) {
                    isSucceeding = true;
                }

                if (isSucceeding && other.submissionStartDate && reqEnd) {
                    if (reqEnd > new Date(other.submissionStartDate)) {
                        setMessage({ type: 'error', text: `Deadline cannot be after the submission opening time of the next round (${other.roundName}).` });
                        return;
                    }
                }
            }
        }

        setLoading(true);
        try {
            await axiosClient.put(`/events/matrices/${selectedMatrixId}`, {
                guidelineUrl: matrixForm.guidelineUrl,
                submissionStartDate: matrixForm.submissionStartDate || null,
                submissionDeadline: matrixForm.submissionDeadline || null,
                gradingDurationMinutes: Number(matrixForm.gradingDurationMinutes) || 10,
                judgeIds: matrixForm.judgeIds.map(Number),
                topN: selectedMatrix?.finalRound ? null : Math.max(1, Number(matrixForm.topN)),
                scoringCriteriaJson: JSON.stringify(matrixForm.criteria),
            });
            setMessage({ type: 'success', text: 'Rubric and judge assignments saved.' });
            await fetchAll(selectedEventId);
        } catch (err) {
            setMessage({ type: 'error', text: err.message || 'Unable to save the rubric.' });
        } finally {
            setLoading(false);
        }
    };

    const applyMatrixToSameRound = async () => {
        if (!ensureCoordinator()) return;
        if (!selectedMatrix || matrixForm.judgeIds.length < 2 || matrixForm.judgeIds.length > 4) {
            setMessage({ type: 'error', text: "Please select 2 to 4 judges before mass adoption." });
            return;
        }
        if (matrixForm.submissionStartDate && matrixForm.submissionDeadline && new Date(matrixForm.submissionStartDate) > new Date(matrixForm.submissionDeadline)) {
            setMessage({ type: 'error', text: "The submission opening time cannot be after the submission deadline." });
            return;
        }

        const currentOrder = selectedMatrix.roundOrder;
        const reqStart = matrixForm.submissionStartDate ? new Date(matrixForm.submissionStartDate) : null;
        const reqEnd = matrixForm.submissionDeadline ? new Date(matrixForm.submissionDeadline) : null;

        for (const other of selectedEvent.matrices || []) {
            if (other.roundOrder === currentOrder - 1) {
                let isPreceding = false;
                if (selectedMatrix.finalRound) {
                    isPreceding = true;
                } else if (!other.finalRound && String(other.trackId) === String(selectedMatrix.trackId)) {
                    isPreceding = true;
                }

                if (isPreceding && other.submissionDeadline && reqStart) {
                    if (reqStart < new Date(other.submissionDeadline)) {
                        setMessage({ type: 'error', text: `The submission deadline cannot be before the deadline of the previous round (${other.roundName}).` });
                        return;
                    }
                }
            }

            if (other.roundOrder === currentOrder + 1) {
                let isSucceeding = false;
                if (other.finalRound) {
                    isSucceeding = true;
                } else if (!selectedMatrix.finalRound && String(other.trackId) === String(selectedMatrix.trackId)) {
                    isSucceeding = true;
                }

                if (isSucceeding && other.submissionStartDate && reqEnd) {
                    if (reqEnd > new Date(other.submissionStartDate)) {
                        setMessage({ type: 'error', text: `Deadline cannot be after the submission opening time of the next round (${other.roundName}).` });
                        return;
                    }
                }
            }
        }

        const sameRoundMatrices = (selectedEvent?.matrices || []).filter(
            (matrix) => matrix.roundOrder === selectedMatrix.roundOrder
        );
        setLoading(true);
        setMessage(null);
        try {
            await axiosClient.put('/events/matrices/batch', {
                updates: sameRoundMatrices.map((matrix) => ({
                    matrixId: matrix.id,
                    config: {
                        guidelineUrl: matrixForm.guidelineUrl,
                        submissionStartDate: matrixForm.submissionStartDate || null,
                        submissionDeadline: matrixForm.submissionDeadline || null,
                        gradingDurationMinutes: Number(matrixForm.gradingDurationMinutes) || 10,
                        judgeIds: matrixForm.judgeIds.map(Number),
                        topN: matrix.finalRound ? null : Math.max(1, Number(matrixForm.topN)),
                        scoringCriteriaJson: JSON.stringify(matrixForm.criteria),
                    },
                })),
            });
            setMessage({ type: 'success', text: `Configuration applied to ${sameRoundMatrices.length} tracks in ${selectedMatrix.roundName}.` });
            await fetchAll(selectedEventId);
        } catch (err) {
            setMessage({ type: 'error', text: err.message || "Bulk configuration cannot be applied." });
        } finally {
            setLoading(false);
        }
    };

    const applyTemplate = (templateId) => {
        setSelectedTemplateId(templateId);
        if (!templateId) return;
        const found = templates.find((t) => String(t.id) === String(templateId));
        if (found) {
            setForm((current) => ({ ...current, competitionRules: found.content }));
        }
    };

    const saveTemplate = async () => {
        if (!ensureCoordinator()) return;
        if (!form.competitionRules.trim()) {
            setMessage({ type: 'error', text: "Rules content is empty, cannot be saved." });
            return;
        }
        const templateName = window.prompt("Enter the new rule template name:");
        if (templateName === null) return; // User cancelled
        const trimmedName = templateName.trim();
        if (!trimmedName) {
            setMessage({ type: 'error', text: "Please enter the name of the template to save." });
            return;
        }
        setLoading(true);
        try {
            const res = await axiosClient.post('/rule-templates', {
                name: trimmedName,
                content: form.competitionRules
            });
            setMessage({ type: 'success', text: "Sample rules saved successfully!" });
            const templateRes = await axiosClient.get('/rule-templates');
            setTemplates(templateRes.result || []);
            setSelectedTemplateId(res.result?.id || '');
        } catch (err) {
            setMessage({ type: 'error', text: err.message || "Unable to save sample rules." });
        } finally {
            setLoading(false);
        }
    };

    const deleteTemplate = async () => {
        if (!ensureCoordinator()) return;
        if (!selectedTemplateId) return;
        const found = templates.find((t) => String(t.id) === String(selectedTemplateId));
        if (!found) return;
        if (!window.confirm(`Are you sure you want to delete the template?${found.name}"?`)) return;

        setLoading(true);
        try {
            await axiosClient.delete(`/rule-templates/${selectedTemplateId}`);
            setMessage({ type: 'success', text: "Sample rules removed." });
            setSelectedTemplateId('');
            const templateRes = await axiosClient.get('/rule-templates');
            setTemplates(templateRes.result || []);
        } catch (err) {
            setMessage({ type: 'error', text: err.message || "Cannot delete template rules." });
        } finally {
            setLoading(false);
        }
    };

    const savePrize = async (e) => {
        e.preventDefault();
        if (!ensureCoordinator()) return;
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
            setMessage({ type: 'success', text: 'Prize saved.' });
            await fetchPrizes(selectedEventId);
        } catch (err) {
            setMessage({ type: 'error', text: err.message || 'Unable to save the prize.' });
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        { id: 'overview', label: "Overview" },
        { id: 'event', label: "Information & calendar" },
        { id: 'submission', label: "Submission form" },
        { id: 'rules', label: "Rules & prizes" },
    ];
    const managementSteps = [
        { id: 'event', label: "Event information and schedule", description: "Name, registration dates, event dates, tracks, and mentor assignments.", done: Boolean(form.name && form.regStartDate && form.regEndDate && form.eventStartDate && form.eventEndDate && form.tracks.length) },
        { id: 'submission', label: "Team submission form", description: "Define the information Team Leaders must submit for each round.", done: completion.form },
        { id: 'rules', label: "Rules and prizes", description: "Configure competition rules, guidance documents, and prizes.", done: completion.rules },
        { id: 'scoring', label: "Scoring and judge assignments", description: "Configure rubrics, weights, deadlines, Top N, and assigned judges.", done: completion.rubric },
    ];
    const completedManagementSteps = managementSteps.filter((step) => step.done).length;
    const managementProgress = Math.round((completedManagementSteps / managementSteps.length) * 100);

    if (initialLoading) {
        return (
            <div className="mx-auto max-w-7xl animate-pulse space-y-5" aria-label="Loading contest data">
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
                <section className="overflow-hidden rounded-xl border border-[var(--shield-line)] bg-white p-6 text-slate-800 shadow-sm">
                    <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#0f63c9]">Event operations</p>
                            <h2 className="mt-1 text-xl font-black text-[#071936] sm:text-2xl">Event overview</h2>
                            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--shield-copy)]">Track your entire season, configuration progress, and operational status in one place.</p>
                        </div>
                        <button type="button" disabled={readOnly} className="btn-primary disabled:cursor-not-allowed disabled:opacity-60" onClick={() => { setForm(emptyEvent()); setShowCreate(true); setCreateStep(0); setMessage(null); }}>{readOnly ? "Admin can only view" : "+ Create new event"}</button>
                    </div>
                </section>

                <Toast message={message} onClose={() => setMessage(null)} />

                {readOnly && <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm font-bold text-blue-800">View-only mode for Admin. Coordinator is in charge of running the contest.</div>}

                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {[
                        ["Total event", eventStats.total, "All season"],
                        ["Active", eventStats.live, "Registered or taking the exam"],
                        ["Coming soon", eventStats.upcoming, "Preparing"],
                        ["Total teams", eventStats.teams, "Across all events"],
                    ].map(([label, value, hint]) => <div key={label} className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm"><p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">{label}</p><p className="mt-2 text-3xl font-black text-[#071936]">{value}</p><p className="mt-1 text-xs text-slate-500">{hint}</p></div>)}
                </section>

                <section className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm">
                    <div className="flex flex-col gap-4 border-b border-blue-100 p-5 lg:flex-row lg:items-center lg:justify-between">
                        <div><h3 className="text-lg font-black text-slate-900">Event list</h3><p className="mt-1 text-sm text-slate-500">{eventOverview.length} matching events</p></div>
                        <div className="flex flex-col gap-3 sm:flex-row">
                            <input className="input-custom min-w-72" value={eventQuery} onChange={(event) => setEventQuery(event.target.value)} placeholder="Search by name, season or year..." />
                            <select className="input-custom min-w-48" value={eventFilter} onChange={(event) => setEventFilter(event.target.value)}>
                                <option value="all">All status</option>
                                <option value="registration">Registration open</option>
                                <option value="running">Ongoing</option>
                                <option value="upcoming">Registration is about to open</option>
                                <option value="preparing">Preparing</option>
                                <option value="ended">Ended</option>
                                <option value="inactive">Pause</option>
                                <option value="draft">Not enough schedule</option>
                            </select>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-[920px] text-left">
                            <thead className="bg-slate-50"><tr><th className="px-5 py-3">Event</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Schedule</th><th className="px-5 py-3">Structure</th><th className="px-5 py-3 text-center">Teams</th><th className="px-5 py-3 text-right">Actions</th></tr></thead>
                            <tbody className="divide-y divide-blue-50">
                                {eventOverview.map((event) => {
                                    const matrixTotal = event.matrices?.length || 0;
                                    const configured = event.matrices?.filter((matrix) => matrix.scoringCriteriaJson && matrix.submissionDeadline && matrix.judges?.length >= 2).length || 0;
                                    return <tr key={event.id} className="transition hover:bg-blue-50/50">
                                        <td className="px-5 py-4"><p className="font-black text-slate-900">{event.name}</p><p className="mt-1 text-xs font-bold uppercase tracking-wide text-[#0f63c9]">{event.season} {event.year}</p></td>
                                        <td className="px-5 py-4"><span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-black ${event.lifecycle.className}`}>{event.lifecycle.label}</span></td>
                                        <td className="px-5 py-4"><p className="text-sm font-bold text-slate-700">{shortDate(event.eventStartDate)} → {shortDate(event.eventEndDate)}</p><p className="mt-1 text-xs text-slate-500">Close registration: {shortDate(event.regEndDate)}</p></td>
                                        <td className="px-5 py-4"><p className="text-sm font-bold text-slate-700">{event.tracks?.length || 0} tracks · {event.roundCount || 0} rounds</p><p className={`mt-1 text-xs font-bold ${configured === matrixTotal && matrixTotal > 0 ? 'text-emerald-600' : 'text-amber-700'}`}>{matrixTotal ? `${configured}/${matrixTotal} rounds configured` : "Round structure not initialized"}</p></td>
                                        <td className="px-5 py-4 text-center text-lg font-black text-slate-900">{event.teamCount || 0}</td>
                                        <td className="px-5 py-4"><div className="flex justify-end gap-2"><Link to={`/events/${event.id}`} className="btn-secondary">Public page</Link><button type="button" className="btn-primary" onClick={() => { selectEvent(event.id); setActiveTab('overview'); }}>{readOnly ? 'Xem' : "Manage"}</button></div></td>
                                    </tr>;
                                })}
                                {!eventOverview.length && <tr><td colSpan="6" className="px-5 py-12 text-center text-sm text-slate-500">No matching events were found.</td></tr>}
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
                    <Toast message={message} onClose={() => setMessage(null)} />

                    <div className="overflow-hidden rounded-2xl border border-[var(--app-border)] bg-white shadow-[var(--app-shadow)]">
                    <header className="event-create-header px-6 py-7 text-white md:px-10">
                        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                            <div>
                                <p className="event-create-header__eyebrow text-xs font-black uppercase tracking-[0.22em]">Coordinator · Create contest</p>
                                <h1 className="event-create-header__title mt-1.5 text-2xl font-black md:text-3xl">Set up a new contest</h1>
                                <p className="mt-1.5 max-w-2xl text-sm font-medium text-slate-100">Complete each step. The system will generate tracks, qualifying rounds, and one final round.</p>
                            </div>
                            <button
                                type="button"
                                className="event-create-cancel rounded-lg px-5 py-2.5 text-sm font-black shadow-sm transition active:translate-y-px"
                                onClick={() => { setShowCreate(false); setForm(emptyEvent()); }}
                            >
                                Cancel creating new
                            </button>
                        </div>
                    </header>

                    <div className="border-b border-slate-200 bg-slate-50 px-5 py-4 md:px-10">
                        <div className="grid grid-cols-4 gap-2">
                            {createSteps.map(([number, label], index) => (
                                <button key={number} type="button" onClick={() => index < createStep && setCreateStep(index)} className="text-left" disabled={index > createStep}>
                                    <div className={`h-1.5 rounded-full ${index <= createStep ? 'bg-[var(--seal-600)]' : 'bg-slate-200'}`} />
                                    <div className="mt-2 flex items-center gap-2">
                                        <span className={`hidden h-7 w-7 items-center justify-center rounded-full text-xs font-black sm:flex ${index === createStep ? 'bg-[var(--seal-600)] text-white' : index < createStep ? 'bg-[var(--seal-100)] text-[var(--seal-700)]' : 'bg-slate-200 text-slate-500'}`}>{number}</span>
                                        <span className={`text-xs font-black sm:text-sm ${index === createStep ? 'text-[var(--seal-700)]' : 'text-slate-500'}`}>{label}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="min-h-[520px] p-6 md:p-10">
                        {createStep === 0 && (
                            <div className="mx-auto max-w-3xl space-y-6">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
                                    <div>
                                        <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--seal-600)]">Step 1/4</p>
                                        <h2 className="mt-2 text-2xl font-black text-slate-900">Contest information</h2>
                                        <p className="mt-1 text-sm text-slate-500">Information participants will see on the event page.</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleAutofill}
                                        className="event-create-quick-fill flex shrink-0 items-center gap-1.5 self-start rounded-lg px-4 py-2.5 text-xs font-black shadow-sm transition-all active:translate-y-px sm:self-center"
                                    >
                                        <span>⚡</span> Quickly fill out form information
                                    </button>
                                </div>
                                <WizardField label="Contest name">
                                    <input autoFocus className="input-custom text-base" placeholder="For example: SEAL Innovation Challenge 2026" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                                </WizardField>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <WizardField label="Season">
                                        <select className="input-custom" value={form.season} onChange={(e) => setForm({ ...form, season: e.target.value })}>
                                            <option value="SPRING">Spring</option><option value="SUMMER">Summer</option><option value="FALL">Fall</option>
                                        </select>
                                    </WizardField>
                                    <WizardField label="Year of organization">
                                        <input type="number" min="2020" max="2100" className="input-custom" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} />
                                    </WizardField>
                                </div>
                                <WizardField label="Describe" hint="Obligatory">
                                    <textarea rows="6" className="input-custom" placeholder="Objectives, participants and main content of the contest..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                                </WizardField>
                            </div>
                        )}

                        {createStep === 1 && (
                            <div className="mx-auto max-w-4xl space-y-6">
                                <div>
                                    <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--seal-600)]">Step 2/4</p>
                                    <h2 className="mt-2 text-2xl font-black text-slate-900">Timeline</h2>
                                    <p className="mt-2 text-sm text-slate-500">Enter in order from registration to the end of the contest.</p>
                                </div>
                                <div className="grid gap-5 rounded-xl border border-[var(--seal-100)] bg-[var(--seal-50)] p-5 md:grid-cols-2">
                                    <WizardField label="1. Open registration"><input type="datetime-local" className="input-custom bg-white" value={form.regStartDate} onChange={(e) => setForm({ ...form, regStartDate: e.target.value })} /></WizardField>
                                    <WizardField label="2. Close registration"><input type="datetime-local" className="input-custom bg-white" value={form.regEndDate} onChange={(e) => setForm({ ...form, regEndDate: e.target.value })} /></WizardField>
                                    <WizardField label="3. Start the contest"><input type="datetime-local" className="input-custom bg-white" value={form.eventStartDate} onChange={(e) => setForm({ ...form, eventStartDate: e.target.value })} /></WizardField>
                                    <WizardField label="4. End of the contest"><input type="datetime-local" className="input-custom bg-white" value={form.eventEndDate} onChange={(e) => setForm({ ...form, eventEndDate: e.target.value })} /></WizardField>
                                </div>
                                <div className="grid gap-5 md:grid-cols-1">
                                    <WizardField label="Total rounds" hint="Final round included"><input type="number" min="2" className="input-custom" value={form.roundCount} onChange={(e) => setForm({ ...form, roundCount: Math.max(2, Number(e.target.value)) })} /></WizardField>
                                </div>
                                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                                    <strong>{Number(form.roundCount) - 1} qualifying round by group</strong> and <strong>1 final round</strong> will be created automatically.
                                </div>
                            </div>
                        )}

                        {createStep === 2 && (
                            <div className="space-y-6">
                                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                                    <div>
                                        <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--seal-600)]">Step 3/4</p>
                                        <h2 className="mt-2 text-2xl font-black text-slate-900">Tracks and mentors</h2>
                                        <p className="mt-2 text-sm text-slate-500">Add tracks and assign one or two mentors to each track.</p>
                                    </div>
                                    <button type="button" className="btn-primary" onClick={() => setForm((current) => ({ ...current, tracks: [...current.tracks, { id: null, name: `Track ${String.fromCharCode(65 + current.tracks.length)}`, mentorIds: [], maxTeams: null }] }))}>+ Add track</button>
                                </div>
                                <div className="grid gap-4 lg:grid-cols-2">
                                    {form.tracks.map((track, index) => (
                                        <div key={index} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                                            <div className="flex gap-2">
                                                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[var(--seal-100)] font-black text-[var(--seal-700)]">{index + 1}</span>
                                                <input className="input-custom font-black" value={track.name} onChange={(e) => updateTrack(index, { name: e.target.value })} placeholder="Tournament name" />
                                                <button type="button" className="btn-secondary" disabled={form.tracks.length <= 1} onClick={() => setForm((current) => ({ ...current, tracks: current.tracks.filter((_, itemIndex) => itemIndex !== index) }))}>Erase</button>
                                            </div>
                                            <label className="mt-3 block text-xs font-bold text-slate-700">
                                                Limit the number of registered teams (0 or leave blank = unlimited)
                                                <input 
                                                    type="number" 
                                                    min="0" 
                                                    className="input-custom mt-1.5" 
                                                    value={track.maxTeams || ''} 
                                                    onChange={(e) => updateTrack(index, { maxTeams: e.target.value ? Number(e.target.value) : null })} 
                                                    placeholder="For example: 15"
                                                />
                                            </label>
                                            <div className="mt-4 flex items-center justify-between">
                                                <p className="text-xs font-black uppercase tracking-wide text-slate-500">Choose Staff as Mentor</p>
                                                <span className={`rounded-full px-2 py-1 text-xs font-black ${track.mentorIds.length >= 1 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{track.mentorIds.length}/2</span>
                                            </div>
                                            <div className="mt-2 max-h-44 space-y-1 overflow-auto rounded-lg border border-slate-100 p-2">
                                                {mentors.map((user) => {
                                                    const checked = track.mentorIds.some((id) => String(id) === String(user.id));
                                                    return <label key={user.id} className={`flex cursor-pointer items-center gap-3 rounded-lg p-2.5 text-sm ${checked ? 'bg-[var(--seal-50)] font-bold text-[var(--seal-800)]' : 'hover:bg-slate-50'}`}><input type="checkbox" checked={checked} disabled={!checked && track.mentorIds.length >= 2} onChange={() => toggleTrackMentor(index, user.id)} /><span>{user.fullName || user.email}</span></label>;
                                                })}
                                                {!mentors.length && <p className="p-2 text-sm text-amber-700">Don't have a Mentor account yet. Let's create a Mentor in User Management.</p>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="rounded-xl bg-[var(--seal-800)] p-5 text-white shadow-sm">
                                    <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--seal-200)]">Structure preview</p>
                                    <p className="mt-2 text-xl font-black text-white">{form.tracks.length} tracks × {Number(form.roundCount) - 1} qualifying rounds + 1 final = {matchCount} rounds</p>
                                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-[var(--seal-100)]">
                                        {form.tracks.map((track) => <span key={track.name} className="rounded-full bg-white/15 px-3 py-1.5">{track.name || "Unnamed"}</span>)}
                                        <span className="rounded-full bg-emerald-400/20 px-3 py-1.5 text-emerald-100">Finals</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {createStep === 3 && (
                            <div className="mx-auto max-w-4xl space-y-6">
                                <div>
                                    <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--seal-600)]">Step 4/4</p>
                                    <h2 className="mt-2 text-2xl font-black text-slate-900">Awards and endorsements</h2>
                                    <p className="mt-2 text-sm text-slate-500">Add prizes now or manage once the contest is created.</p>
                                </div>
                                <WizardField label="Rules / notes">
                                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-4 mb-4">
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                                            <div className="flex-1">
                                                <span className="text-xs font-black uppercase tracking-wide text-slate-500 block mb-1.5">Select the saved rule template</span>
                                                <select 
                                                    className="input-custom bg-white font-medium text-slate-800" 
                                                    value={selectedTemplateId} 
                                                    onChange={(e) => applyTemplate(e.target.value)}
                                                >
                                                    <option value="">-- Select sample template --</option>
                                                    {templates.map((t) => (
                                                        <option key={t.id} value={t.id}>{t.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            {selectedTemplateId && (
                                                <button 
                                                    type="button" 
                                                    className="rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 text-sm font-black hover:bg-red-100 transition shadow-sm h-[42px]"
                                                    onClick={deleteTemplate}
                                                >
                                                    Delete template
                                                </button>
                                            )}
                                        </div>

                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-end border-t border-slate-200 pt-3">
                                            <button 
                                                type="button" 
                                                className="btn-secondary h-[42px] px-5 w-full sm:w-auto"
                                                onClick={saveTemplate}
                                            >
                                                Save the current rule as a new template
                                            </button>
                                        </div>
                                    </div>
                                    <textarea rows="5" className="input-custom" value={form.competitionRules} onChange={(e) => setForm({ ...form, competitionRules: e.target.value })} placeholder="Rules for submitting assignments, how to handle violations..." />
                                </WizardField>
                                <div>
                                    <div className="flex items-center justify-between"><p className="text-sm font-black text-slate-800">Prize</p><button type="button" className="btn-secondary" onClick={() => setForm((current) => ({ ...current, draftPrizes: [...current.draftPrizes, { name: '', description: '' }] }))}>+ Added prizes</button></div>
                                    <div className="mt-3 space-y-3">
                                        {form.draftPrizes.map((prize, index) => (
                                            <div key={index} className="grid gap-3 rounded-xl border border-slate-200 p-4 md:grid-cols-[1fr_1.5fr_auto]">
                                                <input className="input-custom font-bold" placeholder="Award name" value={prize.name} onChange={(e) => setForm((current) => ({ ...current, draftPrizes: current.draftPrizes.map((item, itemIndex) => itemIndex === index ? { ...item, name: e.target.value } : item) }))} />
                                                <input className="input-custom" placeholder="Bonuses/benefits" value={prize.description} onChange={(e) => setForm((current) => ({ ...current, draftPrizes: current.draftPrizes.map((item, itemIndex) => itemIndex === index ? { ...item, description: e.target.value } : item) }))} />
                                                <button type="button" className="btn-secondary" onClick={() => setForm((current) => ({ ...current, draftPrizes: current.draftPrizes.filter((_, itemIndex) => itemIndex !== index) }))}>Erase</button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="grid gap-3 rounded-xl border border-[var(--seal-200)] bg-[var(--seal-50)] p-5 sm:grid-cols-3">
                                    <div><p className="text-xs font-bold text-slate-500">COMPETITION</p><p className="mt-1 font-black text-slate-900">{form.name}</p></div>
                                    <div><p className="text-xs font-bold text-slate-500">STRUCTURE</p><p className="mt-1 font-black text-slate-900">{form.tracks.length} tracks · {matchCount} rounds</p></div>
                                    <div><p className="text-xs font-bold text-slate-500">PRIZE</p><p className="mt-1 font-black text-slate-900">{form.draftPrizes.filter((prize) => prize.name.trim()).length} prize</p></div>
                                </div>
                            </div>
                        )}
                    </div>

                    <footer className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-5 md:px-10">
                        <button type="button" className="btn-secondary" disabled={createStep === 0 || loading} onClick={() => { setMessage(null); setCreateStep((step) => step - 1); }}>← Go back</button>
                        <span className="hidden text-xs font-bold text-slate-400 sm:block">Step {createStep + 1} / 4</span>
                        {createStep < 3
                            ? <button type="button" className="btn-primary min-w-32" onClick={goToNextCreateStep}>Continue →</button>
                            : <button type="button" className="btn-primary min-w-44" disabled={loading} onClick={createCompetition}>{loading ? "Creating..." : "Create competitions & match schedules"}</button>}
                    </footer>
                    </div>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-7xl space-y-6">
            <Toast message={message} onClose={() => setMessage(null)} />

            {readOnly && <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm font-bold text-blue-800">View-only mode for Admin. Coordinator is in charge of editing, publishing and opening new rounds.</div>}

            <div className="space-y-6">
                <section className="overflow-hidden rounded-xl border border-[var(--shield-line)] bg-white p-6 shadow-sm">
                    <button type="button" className="text-xs font-black text-[var(--shield-blue)] hover:underline" onClick={() => { setForm(emptyEvent()); setSelectedEventId(''); setShowCreate(false); setMessage(null); }}>← Return to event list</button>
                    <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-full bg-[var(--shield-blue-soft)] px-3 py-1 text-xs font-black text-[var(--shield-blue)]">{selectedEvent?.season} {selectedEvent?.year}</span>
                                <span className={`rounded-full border px-3 py-1 text-xs font-black ${eventLifecycle(selectedEvent).className}`}>{eventLifecycle(selectedEvent).label}</span>
                            </div>
                            <h2 className="mt-3 text-2xl font-black text-[#071936] md:text-3xl">{selectedEvent?.name}</h2>
                            <p className="mt-2 text-sm text-[var(--shield-copy)]">{selectedEvent?.teamCount || 0} teams · {selectedEvent?.tracks?.length || 0} tracks · {selectedEvent?.roundCount || 0} rounds</p>
                        </div>
                            {selectedEvent && (() => {
                                const unpublishedMatrices = (selectedEvent.matrices || []).filter((matrix) => !matrix.isPublished);
                                const nextRoundOrder = unpublishedMatrices.length
                                    ? Math.min(...unpublishedMatrices.map((matrix) => Number(matrix.roundOrder)))
                                    : null;
                                const roundMatrices = unpublishedMatrices.filter((matrix) => Number(matrix.roundOrder) === nextRoundOrder);

                                const totalRounds = Number(selectedEvent.roundCount || 0) || Math.max(...(selectedEvent.rounds || []).map((r) => Number(r.orderIndex) || 1), ...(selectedEvent.matrices || []).map((m) => Number(m.roundOrder) || 1), 1);
                                const isCurrentRoundFinal = Boolean(nextRoundOrder && nextRoundOrder >= totalRounds);

                                const currentRoundName = displayCompetitionLabel(roundMatrices[0]?.roundName, `Round ${nextRoundOrder}`);

                                // Next round name resolution for intermediate rounds
                                const nextRoundObj = (selectedEvent.rounds || []).find((r) => Number(r.orderIndex) === nextRoundOrder + 1);
                                const nextMatrixObj = (selectedEvent.matrices || []).find((m) => Number(m.roundOrder) === nextRoundOrder + 1);
                                const rawNextName = displayCompetitionLabel(nextRoundObj?.name || nextMatrixObj?.roundName);
                                const nextRoundName = rawNextName
                                    ? (rawNextName.toLowerCase().includes("round") ? rawNextName : `Round ${rawNextName}`)
                                    : `Round ${nextRoundOrder + 1}`;

                                const finalRoundPublished = (selectedEvent.matrices || []).some((m) => Number(m.roundOrder) >= totalRounds && m.isPublished);
                                const isEventEnded = Boolean(selectedEvent.endedEarly || eventLifecycle(selectedEvent).id === 'ended');

                                return (
                                    <div className="flex flex-wrap gap-2">
                                        <Link to={`/events/${selectedEventId}`} className="rounded-xl border border-[#071936] px-4 py-2.5 text-sm font-black transition shadow-sm" style={{ backgroundColor: '#071936', color: '#ffffff' }}>View public page</Link>
                                        <Link to={`/dashboard/scoring-config?eventId=${selectedEventId}`} className="rounded-xl border border-[#0b3d49]/20 px-4 py-2.5 text-sm font-black transition shadow-sm" style={{ backgroundColor: '#ffffff', color: '#0b3d49' }}>{readOnly ? "View scoring configuration" : "Scoring configuration"}</Link>

                                        {/* Nút 1: Công bố kết quả vòng thi */}
                                        {roundMatrices.length > 0 && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (isCurrentRoundFinal) {
                                                        if (window.confirm(`Confirmed ANNOUNCEMENT OF POINTS & RANKINGS Final round (${currentRoundName}) for the entire tournament"${selectedEvent.name}"?\n\nNotifications and final rankings will be automatically sent to all contestants and judges.`)) {
                                                            handlePublishAndAdvanceRound(nextRoundOrder);
                                                        }
                                                    } else {
                                                        if (window.confirm(`Confirmation of results announcement ${currentRoundName} and open ${nextRoundName} for the tournament"${selectedEvent.name}"?`)) {
                                                            handlePublishAndAdvanceRound(nextRoundOrder);
                                                        }
                                                    }
                                                }}
                                                disabled={loading || readOnly}
                                                className={`rounded-xl border px-4 py-2.5 text-sm font-black transition shadow-sm text-white cursor-pointer flex items-center gap-1.5 ${
                                                    isCurrentRoundFinal
                                                        ? 'bg-purple-600 border-purple-600 hover:bg-purple-700'
                                                        : 'bg-indigo-600 border-indigo-600 hover:bg-indigo-700'
                                                }`}
                                            >
                                                {isCurrentRoundFinal ? (
                                                    <span>🏆 Announcement of results & Ranking</span>
                                                ) : (
                                                    <span>Results announced & Open {nextRoundName}</span>
                                                )}
                                            </button>
                                        )}

                                        {/* Nút 2: Kết thúc sự kiện - CHỈ HIỆN SAU KHI VÒNG CHUNG KẾT ĐÃ CÔNG BỐ và sự kiện chưa đóng */}
                                        {finalRoundPublished && !isEventEnded && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (window.confirm(`Confirm END OF EVENT "${selectedEvent.name}"?\n\nThe system will close the tournament and send a THANK YOU LETTER to all Judges, Mentors and Contestants.`)) {
                                                        handleEndEventEarly();
                                                    }
                                                }}
                                                disabled={loading || readOnly}
                                                className="rounded-xl border px-4 py-2.5 text-sm font-black transition shadow-sm text-white bg-red-600 border-red-600 hover:bg-red-700 cursor-pointer flex items-center gap-1.5"
                                            >
                                                <span>🏁 End of the event</span>
                                            </button>
                                        )}
                                    </div>
                                );
                            })()}
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
                                    <div><p className="text-xs font-black uppercase tracking-[0.18em] text-[#0f63c9]">Setup instructions</p><h3 className="mt-1 text-xl font-black text-slate-900">Tasks that need to be completed</h3><p className="mt-1 text-sm text-slate-500">Go from top to bottom. Each item will automatically check when it has enough information.</p></div>
                                    <div className="text-right"><p className="text-3xl font-black text-[#0f63c9]">{managementProgress}%</p><p className="text-xs font-bold text-slate-500">{completedManagementSteps}/{managementSteps.length} Item is complete</p></div>
                                </div>
                                <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-[#0f63c9] to-[#48a0ff] transition-all" style={{ width: `${managementProgress}%` }} /></div>
                                <div className="mt-5 space-y-3">
                                    {managementSteps.map((step, index) => {
                                        const content = <><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-black ${step.done ? 'bg-emerald-500 text-white' : 'bg-blue-100 text-[#0f63c9]'}`}>{step.done ? '✓' : index + 1}</span><span className="min-w-0 flex-1 text-left"><span className="block font-black text-slate-900">{step.label}</span><span className="mt-1 block text-sm leading-5 text-slate-500">{step.description}</span></span><span className="shrink-0 text-sm font-black text-[#0f63c9]">{step.done ? "Review" : "Establish"} →</span></>;
                                        return step.id === 'scoring'
                                            ? <Link key={step.id} to={`/dashboard/scoring-config?eventId=${selectedEventId}`} className="flex items-center gap-4 rounded-xl border border-slate-200 p-4 transition hover:border-blue-300 hover:bg-blue-50/50">{content}</Link>
                                            : <button key={step.id} type="button" onClick={() => setActiveTab(step.id)} className="flex w-full items-center gap-4 rounded-xl border border-slate-200 p-4 transition hover:border-blue-300 hover:bg-blue-50/50">{content}</button>;
                                    })}
                                </div>
                            </section>

                            <aside className="space-y-5">
                                <section className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm"><p className="text-xs font-black uppercase tracking-[0.16em] text-[#0f63c9]">Key dates</p><div className="mt-4 space-y-4">{[["Registration opens", selectedEvent?.regStartDate], ["Registration closes", selectedEvent?.regEndDate], ["Event starts", selectedEvent?.eventStartDate], ["Event ends", selectedEvent?.eventEndDate]].map(([label, value]) => <div key={label} className="flex items-start justify-between gap-4"><span className="text-sm text-slate-500">{label}</span><strong className="text-right text-sm text-slate-900">{value ? new Date(value).toLocaleString('en-GB') : "Not scheduled"}</strong></div>)}</div></section>
                                <section className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm"><p className="text-xs font-black uppercase tracking-[0.16em] text-[#0f63c9]">Competition structure</p><div className="mt-4 grid grid-cols-2 gap-3"><div className="rounded-xl bg-blue-50 p-3"><p className="text-2xl font-black text-[#071936]">{selectedEvent?.tracks?.length || 0}</p><p className="text-xs font-bold text-slate-500">Tracks</p></div><div className="rounded-xl bg-blue-50 p-3"><p className="text-2xl font-black text-[#071936]">{selectedEvent?.roundCount || 0}</p><p className="text-xs font-bold text-slate-500">Rounds</p></div><div className="rounded-xl bg-blue-50 p-3"><p className="text-2xl font-black text-[#071936]">{selectedEvent?.teamCount || 0}</p><p className="text-xs font-bold text-slate-500">Teams</p></div><div className="rounded-xl bg-blue-50 p-3"><p className="text-2xl font-black text-[#071936]">{completion.readyMatrices}/{completion.totalMatrices}</p><p className="text-xs font-bold text-slate-500">Rounds ready</p></div></div></section>
                            </aside>
                        </div>
                    )}

                    {activeTab === 'event' && (
                        <Section
                            title="Information and event calendar"
                            eyebrow="Basic configuration"
                            actions={null}
                        >
                            <form onSubmit={saveEvent} className="space-y-5">
                                <fieldset disabled={readOnly || Boolean(form.id)} className="contents">
                                <div><h3 className="font-black text-slate-900">1. Identification information</h3><p className="mt-1 text-sm text-slate-500">The underlying content is visible to participants on a public page.</p></div>
                                <div className="grid gap-4 md:grid-cols-[1fr_180px_140px]">
                                    <input required className="input-custom" placeholder="Event name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                                    <select className="input-custom" value={form.season} onChange={(e) => setForm({ ...form, season: e.target.value })}>
                                        <option value="SPRING">Spring</option>
                                        <option value="SUMMER">Summer</option>
                                        <option value="FALL">Fall</option>
                                    </select>
                                    <input required type="number" className="input-custom" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} />
                                </div>
                                <textarea rows="4" className="input-custom" placeholder="Describe the goals, participants and event content..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                                <div className="border-t border-blue-100 pt-5"><h3 className="font-black text-slate-900">2. Timelines</h3><p className="mt-1 text-sm text-slate-500">Milestones must be in order from opening registration to ending the contest.</p></div>
                                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                    <label className="text-sm font-bold text-slate-700">Open registration<input required type="datetime-local" className="input-custom mt-1" value={form.regStartDate} onChange={(e) => setForm({ ...form, regStartDate: e.target.value })} /></label>
                                    <label className="text-sm font-bold text-slate-700">Close registration<input required type="datetime-local" className="input-custom mt-1" value={form.regEndDate} onChange={(e) => setForm({ ...form, regEndDate: e.target.value })} /></label>
                                    <label className="text-sm font-bold text-slate-700">Start exam<input required type="datetime-local" className="input-custom mt-1" value={form.eventStartDate} onChange={(e) => setForm({ ...form, eventStartDate: e.target.value })} /></label>
                                    <label className="text-sm font-bold text-slate-700">End of exam<input required type="datetime-local" className="input-custom mt-1" value={form.eventEndDate} onChange={(e) => setForm({ ...form, eventEndDate: e.target.value })} /></label>
                                    <label className="text-sm font-bold text-slate-700">Total number of rounds (including finals)<input required min="2" type="number" disabled={Boolean(selectedEvent?.structureInitialized)} className="input-custom mt-1 disabled:cursor-not-allowed disabled:bg-slate-100" value={form.roundCount} onChange={(e) => setForm({ ...form, roundCount: Math.max(2, Number(e.target.value)) })} /></label>
                                </div>
                                 <div className="rounded-xl border border-blue-100 bg-slate-50 p-5 shadow-sm">
                                     <div className="mb-4 flex items-center justify-between border-b border-blue-100 pb-3">
                                         <div>
                                             <h3 className="text-base font-black text-slate-900">Grading Progress & Assigned Judges by Round</h3>
                                             <p className="mt-0.5 text-xs text-slate-500">Monitor judge grading completion for each round before announcing results.</p>
                                         </div>
                                         <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-black text-[#0f63c9]">
                                             {selectedEvent?.matrices?.length || 0} Rounds / Tracks
                                         </span>
                                     </div>

                                     {selectedEvent?.matrices?.length ? (
                                         <div className="space-y-4">
                                             {selectedEvent.matrices.map((matrix) => {
                                                 const matrixSubs = submissions.filter((sub) => String(sub.matrixId) === String(matrix.id));
                                                 const totalSubs = matrixSubs.length;
                                                 const gradedSubs = matrixSubs.filter((sub) => Boolean(sub.graded || sub.score != null)).length;
                                                 const isFullyGraded = totalSubs > 0 && gradedSubs === totalSubs;
                                                 const progressPct = totalSubs > 0 ? Math.round((gradedSubs / totalSubs) * 100) : 0;

                                                 return (
                                                     <div key={matrix.id} className="rounded-xl border border-blue-100 bg-white p-4 shadow-sm">
                                                         <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                                             <div>
                                                                 <span className="text-[11px] font-black uppercase tracking-wider text-[#0f63c9]">
                                                                     {displayCompetitionLabel(matrix.roundName)}
                                                                 </span>
                                                                 <h4 className="font-black text-slate-900">
                                                                     {matrix.finalRound ? "Final Round (All Tracks)" : displayCompetitionLabel(matrix.trackName)}
                                                                 </h4>
                                                             </div>
                                                             <div className="flex items-center gap-3">
                                                                 <span className={`rounded-full px-3 py-1 text-xs font-black ${isFullyGraded ? 'bg-emerald-100 text-emerald-800' : gradedSubs > 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'}`}>
                                                                     {totalSubs === 0 ? "No submissions yet" : `${gradedSubs} / ${totalSubs} Submissions Graded (${progressPct}%)`}
                                                                 </span>
                                                             </div>
                                                         </div>

                                                         {totalSubs > 0 && (
                                                             <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                                                                 <div
                                                                     className={`h-full transition-all duration-300 ${isFullyGraded ? 'bg-emerald-500' : 'bg-[#0f63c9]'}`}
                                                                     style={{ width: `${progressPct}%` }}
                                                                 />
                                                             </div>
                                                         )}

                                                         <div className="mt-3 pt-3 border-t border-slate-100">
                                                             <p className="text-xs font-bold text-slate-500 mb-2">Assigned Judges ({matrix.judges?.length || 0}):</p>
                                                             {matrix.judges?.length ? (
                                                                 <div className="flex flex-wrap gap-2">
                                                                     {matrix.judges.map((judge) => (
                                                                         <span key={judge.id} className="inline-flex items-center gap-1.5 rounded-lg border border-blue-100 bg-blue-50/70 px-2.5 py-1 text-xs font-bold text-blue-900">
                                                                             👤 {judge.fullName || judge.email}
                                                                         </span>
                                                                     ))}
                                                                 </div>
                                                             ) : (
                                                                 <p className="text-xs text-amber-700 font-medium">⚠️ No judges assigned yet to this round. Configure judges in Scoring Configuration.</p>
                                                             )}
                                                         </div>
                                                     </div>
                                                 );
                                             })}
                                         </div>
                                     ) : (
                                         <div className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center text-xs font-medium text-slate-500">
                                             No rounds initialized yet for this event.
                                         </div>
                                     )}
                                 </div>
                                {!form.id && (
                                    <button type="submit" className="btn-primary w-full" disabled={loading || readOnly}>{loading ? "Saving..." : "Save changes"}</button>
                                )}
                                </fieldset>
                            </form>
                        </Section>
                    )}

                    {activeTab === 'submission' && (
                        <Section title="Team submission form" eyebrow="Content Team Leader needs to provide">
                            <form onSubmit={saveEvent} className="space-y-4">
                                <fieldset disabled={readOnly} className="contents">
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
                                    <button type="button" className="btn-secondary" onClick={() => setForm((current) => ({ ...current, submissionFields: [...current.submissionFields, { id: `field_${Date.now()}`, label: '', type: 'text', required: false }] }))}>+ Add field</button>
                                    <button type="submit" className="btn-primary" disabled={loading || readOnly || !form.name}>Save the submission form</button>
                                </div>
                                </fieldset>
                            </form>
                        </Section>
                    )}

                    {activeTab === 'rubric' && (
                        <Section
                            title="Round, Top N & judges"
                            eyebrow="Competition structure"
                            actions={<button type="button" className="btn-secondary" disabled={readOnly || !selectedEvent || selectedEvent.structureInitialized || loading} onClick={initializeStructure}>Create automatic match schedules</button>}
                        >
                            {!selectedEvent?.structureInitialized ? (
                                <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm font-bold text-amber-800">
                                    Save the contest information first, then click "Create automatic match schedule". The system only creates one final.
                                </div>
                            ) : (
                                <form onSubmit={saveMatrix} className="space-y-5">
                                    <fieldset disabled={readOnly} className="contents">
                                    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                                        {(selectedEvent?.matrices || []).map((matrix) => (
                                            <button key={matrix.id} type="button" onClick={() => setSelectedMatrixId(matrix.id)} className={`rounded-lg border p-3 text-left ${String(selectedMatrixId) === String(matrix.id) ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-100' : 'border-slate-200 bg-white hover:border-blue-300'}`}>
                                                <p className="font-black text-slate-900">{matrix.roundName}</p>
                                                <p className="mt-1 text-sm text-slate-600">{matrix.finalRound ? "All Groups · Finals" : matrix.trackName}</p>
                                                <p className="mt-2 text-xs font-bold text-[#0f63c9]">{matrix.finalRound ? "Final round" : `Top ${matrix.topN || '—'} advance`} · {matrix.judges?.length || 0}/4 judges</p>
                                            </button>
                                        ))}
                                    </div>
                                    <div className="grid gap-4 md:grid-cols-4">
                                        <div>
                                            <label className="mb-1 block text-xs font-bold text-slate-700">Guideline / Topic</label>
                                            <input className="input-custom" placeholder="Link to guidelines, challenge brief, or round rules" value={matrixForm.guidelineUrl} onChange={(e) => setMatrixForm({ ...matrixForm, guidelineUrl: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-xs font-bold text-slate-700">Open submission time</label>
                                            <input type="datetime-local" className="input-custom" value={matrixForm.submissionStartDate} onChange={(e) => setMatrixForm({ ...matrixForm, submissionStartDate: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-xs font-bold text-slate-700">Deadline</label>
                                            <input type="datetime-local" className="input-custom" value={matrixForm.submissionDeadline} onChange={(e) => setMatrixForm({ ...matrixForm, submissionDeadline: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-xs font-bold text-slate-700">Grading duration (Minutes)</label>
                                            <input type="number" min="1" className="input-custom font-bold text-emerald-700" placeholder="e.g. 10, 15, 30" value={matrixForm.gradingDurationMinutes || ''} onChange={(e) => setMatrixForm({ ...matrixForm, gradingDurationMinutes: e.target.value })} />
                                        </div>
                                    </div>
                                    {!selectedMatrix?.finalRound && (
                                        <label className="block rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-900">
                                            Automatically advance Top N teams to the next round
                                            <input required min="1" type="number" className="input-custom mt-2 max-w-xs bg-white" value={matrixForm.topN} onChange={(e) => setMatrixForm({ ...matrixForm, topN: e.target.value })} />
                                            <span className="mt-2 block text-xs font-medium text-emerald-700">Only rate after all assigned judges have finished scoring.</span>
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
                                    <button type="button" className="btn-secondary" onClick={() => setMatrixForm((current) => ({ ...current, criteria: [...current.criteria, { id: `criterion_${Date.now()}`, label: '', description: '', maxScore: 100, weight: 10 }] }))}>Add criterion</button>
                                    <div>
                                            <p className="mb-2 text-sm font-bold text-slate-700">Staff as Judge (choose 2–4 people)</p>
                                            <div className="max-h-56 space-y-2 overflow-auto rounded-lg border border-blue-100 p-3">
                                                {judges.map((user) => (
                                                    <label key={user.id} className="flex items-center gap-2 text-sm">
                                                        <input type="checkbox" checked={matrixForm.judgeIds.some((id) => String(id) === String(user.id))} disabled={!matrixForm.judgeIds.some((id) => String(id) === String(user.id)) && matrixForm.judgeIds.length >= 4} onChange={() => toggleMatrixUser('judgeIds', user.id)} />
                                                        {user.fullName || user.email}
                                                    </label>
                                                ))}
                                                {judges.length === 0 && <p className="text-sm text-slate-500">There is no judge yet.</p>}
                                            </div>
                                    </div>
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <button type="submit" className="btn-primary w-full" disabled={loading || readOnly}>Save this round separately</button>
                                        <button type="button" className="btn-secondary w-full" disabled={loading || readOnly} onClick={applyMatrixToSameRound}>Applies to all groups of the same round</button>
                                    </div>
                                    </fieldset>
                                </form>
                            )}
                        </Section>
                    )}

                    {activeTab === 'rules' && (
                        <div className="space-y-6">
                            <Section title="Contest rules" eyebrow="Rules for competing teams">
                                <form onSubmit={saveEvent} className="space-y-4">
                                    <fieldset disabled={readOnly} className="contents">
                                    <input className="input-custom" placeholder="Link to the rules document (PDF or Drive)" value={form.ruleDocumentUrl} onChange={(e) => setForm({ ...form, ruleDocumentUrl: e.target.value })} />
                                    
                                    <div className="rounded-xl border border-blue-100 bg-slate-50 p-4 space-y-4">
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                                            <div className="flex-1">
                                                <span className="text-xs font-black uppercase tracking-wide text-slate-500 block mb-1.5">Select the saved rule template</span>
                                                <select 
                                                    className="input-custom bg-white font-medium text-slate-800" 
                                                    value={selectedTemplateId} 
                                                    onChange={(e) => applyTemplate(e.target.value)}
                                                >
                                                    <option value="">-- Select sample template --</option>
                                                    {templates.map((t) => (
                                                        <option key={t.id} value={t.id}>{t.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            {selectedTemplateId && (
                                                <button 
                                                    type="button" 
                                                    className="rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 text-sm font-black hover:bg-red-100 transition shadow-sm h-[42px]"
                                                    onClick={deleteTemplate}
                                                >
                                                    Delete template
                                                </button>
                                            )}
                                        </div>

                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-end border-t border-slate-200 pt-3">
                                            <button 
                                                type="button" 
                                                className="btn-secondary h-[42px] px-5 w-full sm:w-auto"
                                                onClick={saveTemplate}
                                            >
                                                Save the current rule as a new template
                                            </button>
                                        </div>
                                    </div>

                                    <textarea rows="8" className="input-custom" value={form.competitionRules} onChange={(e) => setForm({ ...form, competitionRules: e.target.value })} placeholder="Enter competition rules, submission requirements, and violation policies..." />
                                    <button type="submit" className="btn-primary" disabled={loading || readOnly || !form.name}>Save the rules</button>
                                    </fieldset>
                                </form>
                            </Section>
                            <Section title="Prize structure" eyebrow="Prizes and winning teams">
                                <form onSubmit={savePrize} className="grid gap-3 lg:grid-cols-[1fr_1fr_220px_auto]">
                                    <fieldset disabled={readOnly} className="contents">
                                    <input required className="input-custom" value={prizeForm.name} onChange={(e) => setPrizeForm({ ...prizeForm, name: e.target.value })} placeholder="Award name" />
                                    <input className="input-custom" value={prizeForm.description} onChange={(e) => setPrizeForm({ ...prizeForm, description: e.target.value })} placeholder="Description or reward" />
                                    <select className="input-custom" value={prizeForm.teamId} onChange={(e) => setPrizeForm({ ...prizeForm, teamId: e.target.value })}>
                                        <option value="">Not given to the team yet</option>
                                        {eventTeams.map((team) => {
                                            const isEligible = (team.memberCount || team.members?.length || 0) >= 3;
                                            return (
                                                <option key={team.id} value={team.id} disabled={!isEligible}>
                                                    {team.name} {!isEligible ? "(Not enough 3 TVs - Not official yet)" : "(Official team)"}
                                                </option>
                                            );
                                        })}
                                    </select>
                                    <button type="submit" className="btn-primary" disabled={readOnly || !selectedEventId || loading}>{prizeForm.id ? "Update" : "Add prizes"}</button>
                                    </fieldset>
                                </form>
                                <div className="mt-5 divide-y divide-blue-50 rounded-lg border border-blue-100">
                                    {prizes.map((prize) => (
                                        <div key={prize.id} className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
                                            <div>
                                                <p className="font-black text-slate-900">{prize.name}</p>
                                                <p className="text-sm text-slate-600">{prize.description || "No description yet"} {prize.teamName ? `- ${prize.teamName}` : ''}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button type="button" className="btn-secondary" onClick={() => setPrizeForm({ id: prize.id, name: prize.name || '', description: prize.description || '', teamId: prize.teamId || '' })}>Sua</button>
                                                <button type="button" className="btn-secondary" disabled={readOnly} onClick={async () => { await axiosClient.delete(`/events/prizes/${prize.id}`); await fetchPrizes(selectedEventId); }}>Xoa</button>
                                            </div>
                                        </div>
                                    ))}
                                    {prizes.length === 0 && <p className="p-4 text-sm text-slate-500">No prizes yet.</p>}
                                </div>
                            </Section>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
