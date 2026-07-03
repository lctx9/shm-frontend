import { useEffect, useMemo, useState } from 'react';
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
    season: 'SPRING',
    year: new Date().getFullYear(),
    regStartDate: '',
    regEndDate: '',
    eventStartDate: '',
    eventEndDate: '',
    submissionDeadline: '',
    roundCount: 2,
    tracks: ['Software Engineering', 'AI Application'],
    submissionFields: defaultSubmissionFields,
    competitionRules: [
        'Moi doi nop bai dung deadline tren he thong.',
        'San pham phai do doi tu phat trien trong khuon kho su kien.',
        'Judge cham diem theo rubric da cong bo cho tung round.',
    ].join('\n'),
    ruleDocumentUrl: '',
    active: true,
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
        season: event.season || 'SPRING',
        year: event.year || new Date().getFullYear(),
        regStartDate: toLocalInput(event.regStartDate),
        regEndDate: toLocalInput(event.regEndDate),
        eventStartDate: toLocalInput(event.eventStartDate),
        eventEndDate: toLocalInput(event.eventEndDate),
        submissionDeadline: toLocalInput(event.defaultSubmissionDeadline),
        roundCount: event.roundCount || 1,
        tracks: event.tracks?.length ? event.tracks.map((track) => track.name) : ['Bang chung'],
        submissionFields: parseJson(event.submissionFormSchema, defaultSubmissionFields),
        competitionRules: event.competitionRules || '',
        ruleDocumentUrl: event.ruleDocumentUrl || '',
        active: event.active !== false,
    };
}

function statusClass(active) {
    return active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-100 text-slate-600 border-slate-200';
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

export default function EventManagement() {
    const [events, setEvents] = useState([]);
    const [teams, setTeams] = useState([]);
    const [mentors, setMentors] = useState([]);
    const [judges, setJudges] = useState([]);
    const [prizes, setPrizes] = useState([]);
    const [selectedEventId, setSelectedEventId] = useState('');
    const [selectedMatrixId, setSelectedMatrixId] = useState('');
    const [form, setForm] = useState(emptyEvent);
    const [matrixForm, setMatrixForm] = useState({ guidelineUrl: '', submissionDeadline: '', mentorIds: [], judgeIds: [], criteria: defaultCriteria });
    const [prizeForm, setPrizeForm] = useState(emptyPrize);
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

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

    const fetchPrizes = async (eventId) => {
        if (!eventId) {
            setPrizes([]);
            return;
        }
        const response = await axiosClient.get(`/events/${eventId}/prizes`).catch(() => ({ result: [] }));
        setPrizes(response.result || []);
    };

    const fetchAll = async (preferredEventId = selectedEventId) => {
        const [eventRes, teamRes, mentorRes, judgeRes] = await Promise.all([
            axiosClient.get('/events'),
            axiosClient.get('/teams').catch(() => ({ result: [] })),
            axiosClient.get('/users/role/MENTOR').catch(() => ({ result: [] })),
            axiosClient.get('/users/role/JUDGE').catch(() => ({ result: [] })),
        ]);

        const loadedEvents = eventRes.result || [];
        const nextEventId = preferredEventId || loadedEvents[0]?.id || '';
        const nextEvent = loadedEvents.find((item) => String(item.id) === String(nextEventId));

        setEvents(loadedEvents);
        setTeams(teamRes.result || []);
        setMentors(mentorRes.result || []);
        setJudges(judgeRes.result || []);
        setSelectedEventId(nextEventId);
        setSelectedMatrixId(nextEvent?.matrices?.[0]?.id || '');
        setForm(eventToForm(nextEvent));
        await fetchPrizes(nextEventId);
    };

    useEffect(() => {
        fetchAll().catch((err) => setMessage({ type: 'error', text: err.message || 'Khong tai duoc du lieu event.' }));
    }, []);

    useEffect(() => {
        if (!selectedMatrix) {
            setMatrixForm({ guidelineUrl: '', submissionDeadline: '', mentorIds: [], judgeIds: [], criteria: defaultCriteria });
            return;
        }

        setMatrixForm({
            guidelineUrl: selectedMatrix.guidelineUrl || '',
            submissionDeadline: toLocalInput(selectedMatrix.submissionDeadline),
            mentorIds: selectedMatrix.mentors?.map((user) => user.id) || [],
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
        fetchPrizes(eventId);
    };

    const updateArrayItem = (field, index, patch) => {
        setForm((current) => ({
            ...current,
            [field]: current[field].map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item),
        }));
    };

    const updateTrack = (index, value) => {
        setForm((current) => ({
            ...current,
            tracks: current.tracks.map((track, trackIndex) => trackIndex === index ? value : track),
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
        season: form.season,
        year: Number(form.year),
        regStartDate: form.regStartDate || null,
        regEndDate: form.regEndDate || null,
        eventStartDate: form.eventStartDate || null,
        eventEndDate: form.eventEndDate || null,
        submissionDeadline: form.submissionDeadline || null,
        roundCount: Number(form.roundCount),
        tracks: form.tracks.map((track) => track.trim()).filter(Boolean),
        submissionFormSchema: JSON.stringify(form.submissionFields),
        competitionRules: form.competitionRules,
        ruleDocumentUrl: form.ruleDocumentUrl,
        active: form.active,
    });

    const saveEvent = async (e) => {
        e.preventDefault();
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
        if (matrixForm.judgeIds.length < 1) {
            setMessage({ type: 'error', text: 'Hay chon it nhat 1 judge cho round/track nay.' });
            return;
        }

        setLoading(true);
        try {
            await axiosClient.put(`/events/matrices/${selectedMatrixId}`, {
                guidelineUrl: matrixForm.guidelineUrl,
                submissionDeadline: matrixForm.submissionDeadline || null,
                mentorIds: matrixForm.mentorIds.map(Number),
                judgeIds: matrixForm.judgeIds.map(Number),
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
        { id: 'overview', label: 'Tong quan' },
        { id: 'event', label: 'CRUD Event' },
        { id: 'submission', label: 'Form thi sinh' },
        { id: 'rubric', label: 'Rubric judge' },
        { id: 'rules', label: 'Quy che & giai' },
    ];

    return (
        <div className="mx-auto max-w-7xl space-y-6">
            {message && (
                <div className={`rounded-lg border p-4 text-sm font-bold ${message.type === 'success' ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
                    {message.text}
                </div>
            )}

            <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
                <aside className="rounded-lg border border-blue-100 bg-white shadow-sm">
                    <div className="border-b border-blue-100 p-5">
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0f63c9]">Event CRUD</p>
                        <h2 className="mt-1 text-lg font-black text-slate-900">Danh sach su kien</h2>
                        <button type="button" className="btn-primary mt-4 w-full" onClick={() => {
                            setForm(emptyEvent());
                            setSelectedEventId('');
                            setSelectedMatrixId('');
                            setPrizes([]);
                            setActiveTab('event');
                        }}>
                            Tao event moi
                        </button>
                    </div>
                    <div className="max-h-[680px] divide-y divide-blue-50 overflow-y-auto">
                        {events.map((event) => (
                            <button
                                key={event.id}
                                type="button"
                                onClick={() => selectEvent(event.id)}
                                className={`block w-full p-5 text-left hover:bg-blue-50 ${String(selectedEventId) === String(event.id) ? 'bg-blue-50' : ''}`}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="font-black text-slate-900">{event.name}</p>
                                        <p className="mt-1 text-sm text-slate-500">{event.season} {event.year} - {event.teamCount || 0} doi</p>
                                    </div>
                                    <span className={`rounded-full border px-2 py-1 text-[11px] font-black uppercase ${statusClass(event.active)}`}>
                                        {event.active ? 'Active' : 'Off'}
                                    </span>
                                </div>
                            </button>
                        ))}
                        {events.length === 0 && <p className="p-5 text-sm text-slate-500">Chua co event.</p>}
                    </div>
                </aside>

                <main className="min-w-0 space-y-6">
                    <div className="rounded-lg border border-blue-100 bg-white p-2 shadow-sm">
                        <div className="grid gap-2 md:grid-cols-5">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`rounded-lg px-4 py-3 text-sm font-black uppercase ${activeTab === tab.id ? 'bg-[#0f63c9] text-white' : 'text-slate-600 hover:bg-blue-50 hover:text-[#0f63c9]'}`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {activeTab === 'overview' && (
                        <Section title="Trang thai cau hinh" eyebrow={selectedEvent?.name || 'Chua chon event'}>
                            <div className="grid gap-4 md:grid-cols-4">
                                {[
                                    ['Thong tin', form.name ? 'Da co thong tin co ban' : 'Can nhap thong tin'],
                                    ['Matrix', completion.structure ? `${completion.totalMatrices} o matrix` : 'Chua initialize'],
                                    ['Form thi sinh', completion.form ? `${form.submissionFields.length} truong` : 'Chua cau hinh'],
                                    ['Rubric', completion.rubric ? 'Da phu toan bo matrix' : `${completion.readyMatrices}/${completion.totalMatrices} o san sang`],
                                ].map(([title, text]) => (
                                    <div key={title} className="rounded-lg border border-blue-100 bg-blue-50 p-4">
                                        <p className="text-xs font-black uppercase tracking-[0.16em] text-[#0f63c9]">{title}</p>
                                        <p className="mt-2 text-sm font-bold text-slate-800">{text}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-6 overflow-x-auto rounded-lg border border-blue-100">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-blue-50 text-xs font-black uppercase text-slate-500">
                                        <tr>
                                            <th className="px-4 py-3">Track</th>
                                            <th className="px-4 py-3">Round</th>
                                            <th className="px-4 py-3">Deadline</th>
                                            <th className="px-4 py-3">Rubric</th>
                                            <th className="px-4 py-3">Judge</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-blue-50">
                                        {(selectedEvent?.matrices || []).map((matrix) => (
                                            <tr key={matrix.id}>
                                                <td className="px-4 py-3 font-bold">{matrix.trackName}</td>
                                                <td className="px-4 py-3">{matrix.roundName}</td>
                                                <td className="px-4 py-3">{matrix.submissionDeadline ? new Date(matrix.submissionDeadline).toLocaleString('vi-VN') : 'Chua dat'}</td>
                                                <td className="px-4 py-3">{parseJson(matrix.scoringCriteriaJson, []).length} tieu chi</td>
                                                <td className="px-4 py-3">{matrix.judges?.length || 0}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Section>
                    )}

                    {activeTab === 'event' && (
                        <Section
                            title={form.id ? 'Sua event' : 'Tao event'}
                            eyebrow="Thong tin co ban"
                            actions={selectedEvent && <button type="button" className="btn-secondary" onClick={deleteEvent} disabled={loading}>Tat hoat dong</button>}
                        >
                            <form onSubmit={saveEvent} className="space-y-5">
                                <div className="grid gap-4 md:grid-cols-[1fr_180px_140px]">
                                    <input required className="input-custom" placeholder="Ten event" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                                    <select className="input-custom" value={form.season} onChange={(e) => setForm({ ...form, season: e.target.value })}>
                                        <option value="SPRING">Spring</option>
                                        <option value="SUMMER">Summer</option>
                                        <option value="FALL">Fall</option>
                                    </select>
                                    <input required type="number" className="input-custom" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} />
                                </div>
                                <div className="grid gap-4 md:grid-cols-3">
                                    <label className="text-sm font-bold text-slate-700">Mo dang ky<input required type="datetime-local" className="input-custom mt-1" value={form.regStartDate} onChange={(e) => setForm({ ...form, regStartDate: e.target.value })} /></label>
                                    <label className="text-sm font-bold text-slate-700">Dong dang ky<input required type="datetime-local" className="input-custom mt-1" value={form.regEndDate} onChange={(e) => setForm({ ...form, regEndDate: e.target.value })} /></label>
                                    <label className="text-sm font-bold text-slate-700">Deadline mac dinh<input type="datetime-local" className="input-custom mt-1" value={form.submissionDeadline} onChange={(e) => setForm({ ...form, submissionDeadline: e.target.value })} /></label>
                                    <label className="text-sm font-bold text-slate-700">Bat dau thi<input required type="datetime-local" className="input-custom mt-1" value={form.eventStartDate} onChange={(e) => setForm({ ...form, eventStartDate: e.target.value })} /></label>
                                    <label className="text-sm font-bold text-slate-700">Ket thuc thi<input required type="datetime-local" className="input-custom mt-1" value={form.eventEndDate} onChange={(e) => setForm({ ...form, eventEndDate: e.target.value })} /></label>
                                    <label className="text-sm font-bold text-slate-700">So round<input required min="1" type="number" className="input-custom mt-1" value={form.roundCount} onChange={(e) => setForm({ ...form, roundCount: e.target.value })} /></label>
                                </div>
                                <div>
                                    <div className="mb-2 flex items-center justify-between">
                                        <p className="text-sm font-bold text-slate-700">Track thi dau</p>
                                        <button type="button" className="btn-secondary" onClick={() => setForm((current) => ({ ...current, tracks: [...current.tracks, ''] }))}>Them track</button>
                                    </div>
                                    <div className="space-y-2">
                                        {form.tracks.map((track, index) => (
                                            <div key={index} className="grid gap-2 md:grid-cols-[1fr_auto]">
                                                <input required className="input-custom" value={track} onChange={(e) => updateTrack(index, e.target.value)} />
                                                <button type="button" className="btn-secondary" disabled={selectedEvent?.structureInitialized || form.tracks.length <= 1} onClick={() => setForm((current) => ({ ...current, tracks: current.tracks.filter((_, itemIndex) => itemIndex !== index) }))}>Xoa</button>
                                            </div>
                                        ))}
                                    </div>
                                    {selectedEvent?.structureInitialized && <p className="mt-2 text-xs font-semibold text-amber-700">Event da co matrix, khong nen sua track de tranh lech submission.</p>}
                                </div>
                                <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                    <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
                                    Event dang hoat dong
                                </label>
                                <button type="submit" className="btn-primary w-full" disabled={loading}>{loading ? 'Dang luu...' : 'Luu event'}</button>
                            </form>
                        </Section>
                    )}

                    {activeTab === 'submission' && (
                        <Section title="Config form nop bai cho thi sinh" eyebrow="Submission form">
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
                                    <button type="button" className="btn-secondary" onClick={() => setForm((current) => ({ ...current, submissionFields: [...current.submissionFields, { id: `field_${Date.now()}`, label: '', type: 'text', required: false }] }))}>Them truong</button>
                                    <button type="submit" className="btn-primary" disabled={loading || !form.name}>Luu form thi sinh</button>
                                </div>
                            </form>
                        </Section>
                    )}

                    {activeTab === 'rubric' && (
                        <Section
                            title="Config rubric cham diem"
                            eyebrow="Judge scoring form"
                            actions={<button type="button" className="btn-secondary" disabled={!selectedEvent || selectedEvent.structureInitialized || loading} onClick={initializeStructure}>Initialize matrix</button>}
                        >
                            {!selectedEvent?.structureInitialized ? (
                                <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm font-bold text-amber-800">
                                    Hay luu event va initialize matrix truoc khi gan judge/rubric cho tung Track x Round.
                                </div>
                            ) : (
                                <form onSubmit={saveMatrix} className="space-y-5">
                                    <select className="input-custom" value={selectedMatrixId} onChange={(e) => setSelectedMatrixId(e.target.value)}>
                                        {(selectedEvent?.matrices || []).map((matrix) => (
                                            <option key={matrix.id} value={matrix.id}>{matrix.roundName} - {matrix.trackName}</option>
                                        ))}
                                    </select>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <input className="input-custom" placeholder="Guideline / de bai / link quy che rieng" value={matrixForm.guidelineUrl} onChange={(e) => setMatrixForm({ ...matrixForm, guidelineUrl: e.target.value })} />
                                        <input type="datetime-local" className="input-custom" value={matrixForm.submissionDeadline} onChange={(e) => setMatrixForm({ ...matrixForm, submissionDeadline: e.target.value })} />
                                    </div>
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
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div>
                                            <p className="mb-2 text-sm font-bold text-slate-700">Mentor</p>
                                            <div className="max-h-56 space-y-2 overflow-auto rounded-lg border border-blue-100 p-3">
                                                {mentors.map((user) => (
                                                    <label key={user.id} className="flex items-center gap-2 text-sm">
                                                        <input type="checkbox" checked={matrixForm.mentorIds.some((id) => String(id) === String(user.id))} onChange={() => toggleMatrixUser('mentorIds', user.id)} />
                                                        {user.fullName || user.email}
                                                    </label>
                                                ))}
                                                {mentors.length === 0 && <p className="text-sm text-slate-500">Chua co mentor.</p>}
                                            </div>
                                        </div>
                                        <div>
                                            <p className="mb-2 text-sm font-bold text-slate-700">Judge</p>
                                            <div className="max-h-56 space-y-2 overflow-auto rounded-lg border border-blue-100 p-3">
                                                {judges.map((user) => (
                                                    <label key={user.id} className="flex items-center gap-2 text-sm">
                                                        <input type="checkbox" checked={matrixForm.judgeIds.some((id) => String(id) === String(user.id))} onChange={() => toggleMatrixUser('judgeIds', user.id)} />
                                                        {user.fullName || user.email}
                                                    </label>
                                                ))}
                                                {judges.length === 0 && <p className="text-sm text-slate-500">Chua co judge.</p>}
                                            </div>
                                        </div>
                                    </div>
                                    <button type="submit" className="btn-primary w-full" disabled={loading}>Luu rubric va phan cong</button>
                                </form>
                            )}
                        </Section>
                    )}

                    {activeTab === 'rules' && (
                        <div className="space-y-6">
                            <Section title="Quy che thi dau" eyebrow="Rules">
                                <form onSubmit={saveEvent} className="space-y-4">
                                    <input className="input-custom" placeholder="Link tai lieu quy che PDF/Drive" value={form.ruleDocumentUrl} onChange={(e) => setForm({ ...form, ruleDocumentUrl: e.target.value })} />
                                    <textarea rows="8" className="input-custom" value={form.competitionRules} onChange={(e) => setForm({ ...form, competitionRules: e.target.value })} placeholder="Nhap quy che, dieu kien nop bai, cach xu ly vi pham..." />
                                    <button type="submit" className="btn-primary" disabled={loading || !form.name}>Luu quy che</button>
                                </form>
                            </Section>
                            <Section title="Quan ly giai thuong" eyebrow="Prize CRUD">
                                <form onSubmit={savePrize} className="grid gap-3 lg:grid-cols-[1fr_1fr_220px_auto]">
                                    <input required className="input-custom" value={prizeForm.name} onChange={(e) => setPrizeForm({ ...prizeForm, name: e.target.value })} placeholder="Ten giai" />
                                    <input className="input-custom" value={prizeForm.description} onChange={(e) => setPrizeForm({ ...prizeForm, description: e.target.value })} placeholder="Mo ta / phan thuong" />
                                    <select className="input-custom" value={prizeForm.teamId} onChange={(e) => setPrizeForm({ ...prizeForm, teamId: e.target.value })}>
                                        <option value="">Chua trao doi</option>
                                        {eventTeams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
                                    </select>
                                    <button type="submit" className="btn-primary" disabled={!selectedEventId || loading}>{prizeForm.id ? 'Cap nhat' : 'Them'}</button>
                                </form>
                                <div className="mt-5 divide-y divide-blue-50 rounded-lg border border-blue-100">
                                    {prizes.map((prize) => (
                                        <div key={prize.id} className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
                                            <div>
                                                <p className="font-black text-slate-900">{prize.name}</p>
                                                <p className="text-sm text-slate-600">{prize.description || 'Chua co mo ta'} {prize.teamName ? `- ${prize.teamName}` : ''}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button type="button" className="btn-secondary" onClick={() => setPrizeForm({ id: prize.id, name: prize.name || '', description: prize.description || '', teamId: prize.teamId || '' })}>Sua</button>
                                                <button type="button" className="btn-secondary" onClick={async () => { await axiosClient.delete(`/events/prizes/${prize.id}`); await fetchPrizes(selectedEventId); }}>Xoa</button>
                                            </div>
                                        </div>
                                    ))}
                                    {prizes.length === 0 && <p className="p-4 text-sm text-slate-500">Chua co giai thuong.</p>}
                                </div>
                            </Section>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
