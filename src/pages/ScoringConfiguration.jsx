import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import Toast from '../components/Toast';

const defaultCriteria = [
    { id: 'presentation', label: "Presentation", description: "Storytelling and answering questions", maxScore: 100, weight: 25 },
    { id: 'innovation', label: "Creativity", description: "New levels and possibilities for impact", maxScore: 100, weight: 25 },
    { id: 'technical', label: "Technique", description: "Architecture, code quality and completeness", maxScore: 100, weight: 30 },
    { id: 'business', label: "Applicability", description: "Relevance and scalability", maxScore: 100, weight: 20 },
];

function displayCompetitionLabel(value, fallback = '') {
    return String(value || fallback)
        .replace(/Vòng chung kết/gi, 'Final Round')
        .replace(/Vòng\s*(\d+)/gi, 'Round $1')
        .replace(/Bảng\s*/gi, 'Track ');
}

const emptyForm = () => ({ guidelineUrl: '', submissionStartDate: '', submissionDeadline: '', durationMinutes: 60, topN: 10, judgeIds: [], criteria: defaultCriteria });

function parseCriteria(value) {
    if (!value) return defaultCriteria;
    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) && parsed.length ? parsed : defaultCriteria;
    } catch {
        return defaultCriteria;
    }
}

function formFromMatrix(matrix) {
    let duration = matrix?.durationMinutes || 60;
    if (matrix?.submissionStartDate && matrix?.submissionDeadline) {
        const diff = Math.round((new Date(matrix.submissionDeadline) - new Date(matrix.submissionStartDate)) / 60000);
        if (diff > 0) duration = diff;
    }
    return matrix ? {
        guidelineUrl: matrix.guidelineUrl || '',
        submissionStartDate: matrix.submissionStartDate?.slice(0, 16) || '',
        submissionDeadline: matrix.submissionDeadline?.slice(0, 16) || '',
        durationMinutes: duration,
        topN: matrix.topN ?? '',
        judgeIds: matrix.judges?.map((judge) => judge.id) || [],
        criteria: parseCriteria(matrix.scoringCriteriaJson),
    } : emptyForm();
}

export default function ScoringConfiguration() {
    const [searchParams] = useSearchParams();
    const queryEventId = searchParams.get('eventId');
    const readOnly = localStorage.getItem('role') === 'ADMIN';

    const [events, setEvents] = useState([]);
    const [judges, setJudges] = useState([]);
    const [selectedEventId, setSelectedEventId] = useState('');
    const [selectedMatrixId, setSelectedMatrixId] = useState('');
    const [form, setForm] = useState(emptyForm);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);
    const [activeStep, setActiveStep] = useState('setup');

    const selectedEvent = useMemo(() => events.find((event) => String(event.id) === String(selectedEventId)), [events, selectedEventId]);
    const selectedMatrix = useMemo(() => selectedEvent?.matrices?.find((matrix) => String(matrix.id) === String(selectedMatrixId)), [selectedEvent, selectedMatrixId]);
    const matrixCount = selectedEvent?.matrices?.length || 0;
    const configuredCount = selectedEvent?.matrices?.filter((matrix) =>
        matrix.scoringCriteriaJson
        && matrix.submissionDeadline
        && matrix.judges?.length >= 2
        && (matrix.finalRound || Number(matrix.topN) >= 1)
    ).length || 0;
    const totalWeight = form.criteria.reduce((sum, criterion) => sum + Number(criterion.weight || 0), 0);
    const matrixGroups = useMemo(() => {
        const groups = [];
        (selectedEvent?.matrices || []).forEach((matrix) => {
            let group = groups.find((item) => item.roundName === matrix.roundName);
            if (!group) {
                group = { roundName: matrix.roundName, matrices: [] };
                groups.push(group);
            }
            group.matrices.push(matrix);
        });
        return groups;
    }, [selectedEvent]);
    const stepIndex = ['setup', 'rubric', 'judges'].indexOf(activeStep);
    const steps = [
        { id: 'setup', number: 1, label: "Set up the round", hint: "Guidelines, duration, and Top N", done: Boolean(form.submissionDeadline) },
        { id: 'rubric', number: 2, label: "Scoring criteria", hint: `${form.criteria.length} criteria · ${totalWeight}%`, done: form.criteria.length > 0 && totalWeight === 100 },
        { id: 'judges', number: 3, label: "Assign Judge", hint: `${form.judgeIds.length}/4 people`, done: form.judgeIds.length >= 2 && form.judgeIds.length <= 4 },
    ];

    const selectMatrix = (matrix) => {
        setSelectedMatrixId(matrix?.id || '');
        setForm(formFromMatrix(matrix));
    };

    const loadData = async (eventId = selectedEventId, matrixId = selectedMatrixId) => {
        const [eventResponse, staffResponse] = await Promise.all([
            axiosClient.get('/events'),
            axiosClient.get('/users/role/STAFF').catch(() => ({ result: [] })),
        ]);
        const loadedEvents = eventResponse.result || [];
        const nextEvent = loadedEvents.find((event) => String(event.id) === String(eventId)) || loadedEvents[0];
        const nextMatrix = nextEvent?.matrices?.find((matrix) => String(matrix.id) === String(matrixId)) || nextEvent?.matrices?.[0];
        setEvents(loadedEvents);
        setJudges(staffResponse.result || []);
        setSelectedEventId(nextEvent?.id || '');
        selectMatrix(nextMatrix);
    };

    useEffect(() => {
        loadData(queryEventId || '', '')
            .catch((error) => setMessage({ type: 'error', text: error.message || "Unable to load scoring configuration." }))
            .finally(() => setLoading(false));
        // Initial load only; mutations refresh explicitly.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [queryEventId]);

    const changeEvent = (eventId) => {
        const event = events.find((item) => String(item.id) === String(eventId));
        setSelectedEventId(eventId);
        selectMatrix(event?.matrices?.[0]);
        setActiveStep('setup');
        setMessage(null);
    };

    const updateCriterion = (index, patch) => setForm((current) => ({
        ...current,
        criteria: current.criteria.map((criterion, criterionIndex) => criterionIndex === index ? { ...criterion, ...patch } : criterion),
    }));

    const toggleJudge = (id) => setForm((current) => {
        const checked = current.judgeIds.some((judgeId) => String(judgeId) === String(id));
        return { ...current, judgeIds: checked ? current.judgeIds.filter((judgeId) => String(judgeId) !== String(id)) : [...current.judgeIds, id] };
    });

    const validate = () => {
        if (readOnly) return "Admins can only view scoring configuration. Only Coordinators can make changes.";
        if (!selectedMatrix) return "Please choose a round.";
        if (selectedMatrix.isPublished) return "The round has been announced so the scoring configuration is locked.";
        if (!form.durationMinutes || Number(form.durationMinutes) <= 0) return "Please enter the test duration for the round (minutes greater than 0).";

        if (form.judgeIds.length < 2 || form.judgeIds.length > 4) return "Each round requires from 2 to 4 Judges.";
        if (!form.criteria.length || form.criteria.some((criterion) => !criterion.label.trim() || Number(criterion.maxScore) <= 0 || Number(criterion.weight) <= 0)) return "Each criterion needs a name, maximum score, and valid weight.";
        if (totalWeight !== 100) return `The total weight is now ${totalWeight}%. Please adjust to 100%.`;
        return null;
    };

    const payloadFor = (matrix) => ({
        guidelineUrl: form.guidelineUrl,
        submissionStartDate: form.submissionStartDate || null,
        submissionDeadline: form.submissionDeadline || null,
        durationMinutes: Number(form.durationMinutes) || 60,
        judgeIds: form.judgeIds.map(Number),
        topN: matrix.finalRound ? null : Math.max(1, Number(form.topN)),
        scoringCriteriaJson: JSON.stringify(form.criteria),
    });

    const save = async (applyToRound) => {
        if (readOnly) {
            setMessage({ type: 'error', text: "Admin can only view. The new Coordinator has permission to save the configuration." });
            return;
        }
        const error = validate();
        if (error) return setMessage({ type: 'error', text: error });
        const targets = applyToRound ? selectedEvent.matrices.filter((matrix) => matrix.roundOrder === selectedMatrix.roundOrder) : [selectedMatrix];
        setSaving(true);
        setMessage(null);
        try {
            await Promise.all(targets.map((matrix) => axiosClient.put(`/events/matrices/${matrix.id}`, payloadFor(matrix))));
            setMessage({ type: 'success', text: applyToRound ? `Applied the duration and configuration to ${targets.length} tracks in ${displayCompetitionLabel(selectedMatrix.roundName)}.` : "Round configuration saved." });
            await loadData(selectedEventId, selectedMatrixId);
        } catch (error) {
            setMessage({ type: 'error', text: error.message || "Unable to save scoring configuration." });
        } finally {
            setSaving(false);
        }
    };

    const initializeStructure = async () => {
        if (readOnly) {
            setMessage({ type: 'error', text: "Admin can only view. The new Coordinator has the right to initiate the round." });
            return;
        }
        if (!selectedEvent) return;
        setSaving(true);
        try {
            await axiosClient.post(`/events/${selectedEvent.id}/initialize-structure`);
            await loadData(selectedEvent.id, '');
            setMessage({ type: 'success', text: "Initialized rounds. You can start configuring rubric." });
        } catch (error) {
            setMessage({ type: 'error', text: error.message || "Unable to initialize round." });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="mx-auto h-96 max-w-7xl animate-pulse rounded-2xl border border-blue-100 bg-white" />;

    return (
        <div className="scoring-config-page mx-auto max-w-7xl space-y-6">
            <section className="overflow-hidden rounded-xl border border-[var(--shield-line)] bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#0f63c9]">Scoring workspace</p>
                        <h2 className="mt-1 text-xl font-black text-[#071936] sm:text-2xl">Scoring configuration</h2>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--shield-copy)]">Manage exam time (minutes), rubrics and assign separate Judges for each round.</p>
                    </div>
                    <label className="min-w-72 text-xs font-black uppercase tracking-wide text-[var(--shield-copy)]">
                        Event
                        <select className="input-custom mt-2 shadow-sm" value={selectedEventId} onChange={(e) => changeEvent(e.target.value)}>
                            {events.map((event) => <option key={event.id} value={event.id}>{event.name}</option>)}
                        </select>
                    </label>
                </div>
            </section>

            <Toast message={message} onClose={() => setMessage(null)} />

            {readOnly && (
                <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm font-bold text-blue-800">
                    View-only mode for Admin. Coordinator is in charge of configuration and grading operations.
                </div>
            )}

            {!selectedEvent ? (
                <section className="rounded-2xl border border-blue-100 bg-white p-10 text-center text-slate-500">There are no events yet. Please create the event before configuring grading.</section>
            ) : !selectedEvent.structureInitialized ? (
                <section className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center"><h3 className="text-xl font-black text-amber-900">The event does not yet have a round structure</h3><p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-amber-800">The system will create a Track × Round matrix from the declared number of rounds and groups.</p><button type="button" className="btn-primary mt-5" disabled={saving || readOnly} onClick={initializeStructure}>Initiate round</button></section>
            ) : (
                <div className="grid gap-6 xl:grid-cols-[310px_1fr]">
                    <aside className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm">
                        <div className="border-b border-blue-100 bg-blue-50 p-5"><div className="flex items-center justify-between gap-3"><h3 className="font-black text-slate-900">Round</h3><span className="rounded-full bg-white px-2.5 py-1 text-xs font-black text-[#0f63c9]">{configuredCount}/{matrixCount}</span></div><p className="mt-1 text-xs text-slate-500">Fully configured</p></div>
                        <div className="max-h-[720px] overflow-y-auto">{matrixGroups.map((group) => <section key={group.roundName} className="border-b border-blue-100"><p className="bg-slate-50 px-4 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">{displayCompetitionLabel(group.roundName)}</p><div className="divide-y divide-blue-50">{group.matrices.map((matrix) => { const ready = matrix.scoringCriteriaJson && (matrix.durationMinutes || matrix.submissionDeadline) && matrix.judges?.length >= 2; return <button key={matrix.id} type="button" onClick={() => { selectMatrix(matrix); setActiveStep('setup'); setMessage(null); }} className={`block w-full p-4 text-left transition ${String(matrix.id) === String(selectedMatrixId) ? 'bg-blue-50' : 'hover:bg-slate-50'}`}><div className="flex items-start justify-between gap-3"><div><p className="font-black text-slate-900">{matrix.finalRound ? "All tracks" : displayCompetitionLabel(matrix.trackName)}</p><p className="mt-1 text-xs font-bold text-[#0f63c9]">{matrix.durationMinutes || 60} min · {matrix.finalRound ? "Final round" : `Top ${matrix.topN || '—'}`} · {matrix.judges?.length || 0} judges</p></div><span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${ready ? 'bg-emerald-500' : 'bg-amber-400'}`} /></div></button>; })}</div></section>)}</div>
                    </aside>

                    <main className="min-w-0 space-y-5">
                        <section className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-[#0f63c9]">Configuring</p><h3 className="mt-1 text-xl font-black text-slate-900">{displayCompetitionLabel(selectedMatrix?.roundName)} · {selectedMatrix?.finalRound ? "All tracks" : displayCompetitionLabel(selectedMatrix?.trackName)}</h3></div><span className={`w-fit rounded-full px-3 py-1 text-xs font-black ${steps.every((step) => step.done) ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'}`}>{steps.filter((step) => step.done).length}/3 steps completed</span></div>
                            <div className="mt-5 grid gap-2 md:grid-cols-3">{steps.map((step) => <button key={step.id} type="button" onClick={() => setActiveStep(step.id)} className={`rounded-xl border p-3 text-left transition ${activeStep === step.id ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-100' : 'border-slate-200 hover:border-blue-300'}`}><span className="flex items-center gap-2"><span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-black ${step.done ? 'bg-emerald-500 text-white' : activeStep === step.id ? 'bg-[#0f63c9] text-white' : 'bg-slate-200 text-slate-600'}`}>{step.done ? '✓' : step.number}</span><span className="font-black text-slate-900">{step.label}</span></span><span className="mt-2 block pl-9 text-xs text-slate-500">{step.hint}</span></button>)}</div>
                        </section>

                        {selectedMatrix?.isPublished && (
                            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-800">
                                The round results have been announced. Configuration remains in view only.
                            </div>
                        )}

                        <fieldset disabled={readOnly || Boolean(selectedMatrix?.isPublished)} className="contents">
                        {activeStep === 'setup' && <section className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
                            <div className="border-b border-blue-100 pb-4"><p className="text-xs font-black uppercase tracking-[0.18em] text-[#0f63c9]">Step 1/3</p><h3 className="mt-1 text-lg font-black text-slate-900">Set up the round</h3><p className="mt-1 text-sm text-slate-500">Set guideline documents, test duration (minutes) and number of teams to continue.</p></div>
                            <div className="mt-5 grid gap-4 md:grid-cols-2">
                                <label className="text-sm font-bold text-slate-700">Guideline / topic<input className="input-custom mt-2" placeholder="Link to PDF, Drive or instruction manual" value={form.guidelineUrl} onChange={(event) => setForm({ ...form, guidelineUrl: event.target.value })} /></label>
                                <label className="text-sm font-bold text-slate-700">Test duration (Minutes)<input type="number" min="1" className="input-custom mt-2 font-bold text-[#0f63c9]" placeholder="VD: 60, 90, 120" value={form.durationMinutes} onChange={(event) => setForm({ ...form, durationMinutes: event.target.value })} /></label>
                            </div>
                            <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/70 p-3.5 text-xs text-blue-900 leading-relaxed font-medium">
                                ⏱️ <strong>Time mechanism:</strong> The submission time is the duration of the competition round (<strong>{form.durationMinutes || 60} minute</strong>).
                                {Number(selectedMatrix?.roundOrder) === 1 ? (
                                    <span> Round 1 will automatically count down correctly {form.durationMinutes || 60} minutes starting from the mark <strong>Tournament start time</strong>.</span>
                                ) : (
                                    <span> Subsequent rounds will automatically count down correctly {form.durationMinutes || 60} minutes right from the mark <strong>Coordinator presses the Open New Round button</strong>.</span>
                                )}
                            </div>
                            {!selectedMatrix?.finalRound && <label className="mt-4 block max-w-xs text-sm font-bold text-slate-700">Number of teams moving on (Top N)<input type="number" min="1" className="input-custom mt-2" value={form.topN} onChange={(event) => setForm({ ...form, topN: event.target.value })} /></label>}
                        </section>}

                        {activeStep === 'rubric' && <section className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
                            <div className="flex flex-col gap-4 border-b border-blue-100 pb-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-[#0f63c9]">Step 2/3</p><h3 className="mt-1 text-lg font-black text-slate-900">Scoring criteria</h3><p className="mt-1 text-sm text-slate-500">The total weight of the rubric must be 100%.</p></div><div className="flex items-center gap-2"><span className={`rounded-full px-3 py-2 text-xs font-black ${totalWeight === 100 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700 font-bold border border-red-200'}`}>{totalWeight}/100%</span><button type="button" className="btn-secondary" onClick={() => setForm((current) => ({ ...current, criteria: [...current.criteria, { id: `criterion_${Date.now()}`, label: '', description: '', maxScore: 100, weight: 10 }] }))}>+ Add criteria</button></div></div>
                            {totalWeight !== 100 && (
                                <p className="mt-3 text-xs font-bold text-red-600 animate-pulse">
                                    * The current total weight is {totalWeight}%. Please adjust the weights to 100% to be able to save the configuration.
                                </p>
                            )}
                            <div className="mt-5 space-y-3">{form.criteria.map((criterion, index) => <div key={criterion.id || index} className="grid gap-3 rounded-xl border border-blue-100 bg-slate-50/60 p-4 lg:grid-cols-[1fr_1.35fr_110px_110px_auto]"><input className="input-custom font-bold" value={criterion.label} onChange={(event) => updateCriterion(index, { label: event.target.value, id: criterion.id || event.target.value.toLowerCase().replaceAll(' ', '_') })} placeholder="Criterion name" /><input className="input-custom" value={criterion.description} onChange={(event) => updateCriterion(index, { description: event.target.value })} placeholder="Describe how to evaluate" /><label className="text-xs font-bold text-slate-500">Maximum score<input type="number" min="1" className="input-custom mt-1" value={criterion.maxScore} onChange={(event) => updateCriterion(index, { maxScore: Number(event.target.value) })} /></label><label className="text-xs font-bold text-slate-500">Weight %<input type="number" min="1" className="input-custom mt-1" value={criterion.weight} onChange={(event) => updateCriterion(index, { weight: Number(event.target.value) })} /></label><button type="button" className="btn-secondary self-end" disabled={form.criteria.length === 1} onClick={() => setForm((current) => ({ ...current, criteria: current.criteria.filter((_, criterionIndex) => criterionIndex !== index) }))}>Erase</button></div>)}</div>
                        </section>}

                        {activeStep === 'judges' && <section className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
                            <div className="flex items-center justify-between border-b border-blue-100 pb-4"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-[#0f63c9]">Step 3/3</p><h3 className="mt-1 text-lg font-black text-slate-900">Assign Judge</h3><p className="mt-1 text-sm text-slate-500">Choose from 2 to 4 people to be in charge of judging this round.</p></div><span className="rounded-full bg-blue-50 px-3 py-2 text-sm font-black text-[#0f63c9]">{form.judgeIds.length}/4</span></div>
                            <div className="mt-4 grid gap-2 sm:grid-cols-2">
                                {judges.map((judge) => {
                                    const checked = form.judgeIds.some((id) => String(id) === String(judge.id));
                                    const isMentorOfMatrix = selectedMatrix?.mentors?.some((m) => String(m.id) === String(judge.id));
                                    return (
                                        <label key={judge.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm ${isMentorOfMatrix ? 'border-slate-100 bg-slate-50 text-slate-400 cursor-not-allowed opacity-60' : checked ? 'border-blue-300 bg-blue-50 font-bold text-blue-900' : 'border-slate-200 hover:bg-slate-50'}`}>
                                            <input type="checkbox" checked={checked} disabled={isMentorOfMatrix || (!checked && form.judgeIds.length >= 4)} onChange={() => toggleJudge(judge.id)} />
                                            <span>
                                                {judge.fullName || judge.email}
                                                {isMentorOfMatrix && <span className="ml-2 text-xs text-red-500 font-normal">(Working as a Mentor)</span>}
                                            </span>
                                        </label>
                                    );
                                })}
                                {!judges.length && <p className="text-sm text-amber-700">There is no Staff account to assign.</p>}
                            </div>
                        </section>}
                        </fieldset>

                        <div className="flex flex-col gap-3 rounded-2xl border border-blue-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                            <button type="button" className="btn-secondary" disabled={stepIndex === 0} onClick={() => setActiveStep(steps[stepIndex - 1].id)}>← Go back</button>
                            {stepIndex < steps.length - 1 ? <button type="button" className="btn-primary" onClick={() => setActiveStep(steps[stepIndex + 1].id)}>Continue →</button> : <div className="flex flex-col gap-2 sm:flex-row"><button type="button" className="btn-secondary" disabled={saving || readOnly || selectedMatrix?.isPublished} onClick={() => save(true)}>Applies to the whole round</button><button type="button" className="btn-primary" disabled={saving || readOnly || selectedMatrix?.isPublished} onClick={() => save(false)}>{saving ? "Saving..." : "Save configuration"}</button></div>}
                        </div>
                    </main>
                </div>
            )}
        </div>
    );
}
