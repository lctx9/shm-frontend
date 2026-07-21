import { useEffect, useMemo, useState } from 'react';
import axiosClient from '../api/axiosClient';

const defaultCriteria = [
    { id: 'presentation', label: 'Trình bày', description: 'Storytelling và trả lời câu hỏi', maxScore: 100, weight: 25 },
    { id: 'innovation', label: 'Tính sáng tạo', description: 'Mức độ mới và khả năng tạo tác động', maxScore: 100, weight: 25 },
    { id: 'technical', label: 'Kỹ thuật', description: 'Kiến trúc, chất lượng code và độ hoàn thiện', maxScore: 100, weight: 30 },
    { id: 'business', label: 'Tính ứng dụng', description: 'Độ phù hợp và khả năng mở rộng', maxScore: 100, weight: 20 },
];

const emptyForm = () => ({ guidelineUrl: '', submissionDeadline: '', topN: 10, judgeIds: [], criteria: defaultCriteria });

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
    return matrix ? {
        guidelineUrl: matrix.guidelineUrl || '',
        submissionDeadline: matrix.submissionDeadline?.slice(0, 16) || '',
        topN: matrix.topN || 10,
        judgeIds: matrix.judges?.map((judge) => judge.id) || [],
        criteria: parseCriteria(matrix.scoringCriteriaJson),
    } : emptyForm();
}

export default function ScoringConfiguration() {
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
    const configuredCount = selectedEvent?.matrices?.filter((matrix) => matrix.scoringCriteriaJson && matrix.submissionDeadline && matrix.judges?.length >= 2).length || 0;
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
        { id: 'setup', number: 1, label: 'Thiết lập vòng', hint: 'Đề bài, deadline, Top N', done: Boolean(form.submissionDeadline) },
        { id: 'rubric', number: 2, label: 'Tiêu chí chấm', hint: `${form.criteria.length} tiêu chí · ${totalWeight}%`, done: form.criteria.length > 0 && totalWeight === 100 },
        { id: 'judges', number: 3, label: 'Phân công Judge', hint: `${form.judgeIds.length}/4 người`, done: form.judgeIds.length >= 2 && form.judgeIds.length <= 4 },
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
        loadData('', '')
            .catch((error) => setMessage({ type: 'error', text: error.message || 'Không tải được cấu hình chấm điểm.' }))
            .finally(() => setLoading(false));
        // Initial load only; mutations refresh explicitly.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
        if (!selectedMatrix) return 'Hãy chọn một vòng đấu.';
        if (!form.submissionDeadline) return 'Hãy đặt deadline cho vòng đấu.';
        if (form.judgeIds.length < 2 || form.judgeIds.length > 4) return 'Mỗi vòng đấu cần từ 2 đến 4 Judge.';
        if (!form.criteria.length || form.criteria.some((criterion) => !criterion.label.trim() || Number(criterion.maxScore) <= 0 || Number(criterion.weight) <= 0)) return 'Mỗi tiêu chí cần tên, điểm tối đa và trọng số hợp lệ.';
        if (totalWeight !== 100) return `Tổng trọng số hiện là ${totalWeight}%. Hãy điều chỉnh về 100%.`;
        return null;
    };

    const payloadFor = (matrix) => ({
        guidelineUrl: form.guidelineUrl,
        submissionDeadline: form.submissionDeadline,
        judgeIds: form.judgeIds.map(Number),
        topN: matrix.finalRound ? null : Math.max(1, Number(form.topN)),
        scoringCriteriaJson: JSON.stringify(form.criteria),
    });

    const save = async (applyToRound) => {
        const error = validate();
        if (error) return setMessage({ type: 'error', text: error });
        const targets = applyToRound ? selectedEvent.matrices.filter((matrix) => matrix.roundOrder === selectedMatrix.roundOrder) : [selectedMatrix];
        setSaving(true);
        setMessage(null);
        try {
            await Promise.all(targets.map((matrix) => axiosClient.put(`/events/matrices/${matrix.id}`, payloadFor(matrix))));
            setMessage({ type: 'success', text: applyToRound ? `Đã áp dụng cho ${targets.length} bảng trong ${selectedMatrix.roundName}.` : 'Đã lưu cấu hình vòng đấu.' });
            await loadData(selectedEventId, selectedMatrixId);
        } catch (error) {
            setMessage({ type: 'error', text: error.message || 'Không lưu được cấu hình chấm điểm.' });
        } finally {
            setSaving(false);
        }
    };

    const initializeStructure = async () => {
        if (!selectedEvent) return;
        setSaving(true);
        try {
            await axiosClient.post(`/events/${selectedEvent.id}/initialize-structure`);
            await loadData(selectedEvent.id, '');
            setMessage({ type: 'success', text: 'Đã khởi tạo các vòng đấu. Bạn có thể bắt đầu cấu hình rubric.' });
        } catch (error) {
            setMessage({ type: 'error', text: error.message || 'Không khởi tạo được vòng đấu.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="mx-auto h-96 max-w-7xl animate-pulse rounded-2xl border border-blue-100 bg-white" />;

    return (
        <div className="mx-auto max-w-7xl space-y-6">
            <section className="overflow-hidden rounded-2xl bg-gradient-to-r from-[#0b3d49] via-[#0e5362] to-[#0f6b7e] p-6 text-white shadow-lg md:p-8">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-teal-200">Scoring workspace</p>
                        <h2 className="mt-2 text-2xl font-black text-white">Cấu hình chấm điểm</h2>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-teal-100/90">Quản lý rubric, deadline, Top N và phân công Judge riêng cho từng vòng đấu.</p>
                    </div>
                    <label className="min-w-72 text-xs font-black uppercase tracking-wide text-teal-200">
                        Sự kiện
                        <select className="input-custom mt-2 !border-white/30 !bg-white !text-slate-900 shadow-sm" value={selectedEventId} onChange={(e) => changeEvent(e.target.value)}>
                            {events.map((event) => <option key={event.id} value={event.id}>{event.name}</option>)}
                        </select>
                    </label>
                </div>
            </section>

            {message && <div className={`rounded-xl border p-4 text-sm font-bold ${message.type === 'success' ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'}`}>{message.text}</div>}

            {!selectedEvent ? (
                <section className="rounded-2xl border border-blue-100 bg-white p-10 text-center text-slate-500">Chưa có sự kiện. Hãy tạo sự kiện trước khi cấu hình chấm điểm.</section>
            ) : !selectedEvent.structureInitialized ? (
                <section className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center"><h3 className="text-xl font-black text-amber-900">Sự kiện chưa có cấu trúc vòng đấu</h3><p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-amber-800">Hệ thống sẽ tạo ma trận Track × Round từ số vòng và bảng đấu đã khai báo.</p><button type="button" className="btn-primary mt-5" disabled={saving} onClick={initializeStructure}>Khởi tạo vòng đấu</button></section>
            ) : (
                <div className="grid gap-6 xl:grid-cols-[310px_1fr]">
                    <aside className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm">
                        <div className="border-b border-blue-100 bg-blue-50 p-5"><div className="flex items-center justify-between gap-3"><h3 className="font-black text-slate-900">Vòng đấu</h3><span className="rounded-full bg-white px-2.5 py-1 text-xs font-black text-[#0f63c9]">{configuredCount}/{matrixCount}</span></div><p className="mt-1 text-xs text-slate-500">Đã cấu hình đầy đủ</p></div>
                        <div className="max-h-[720px] overflow-y-auto">{matrixGroups.map((group) => <section key={group.roundName} className="border-b border-blue-100"><p className="bg-slate-50 px-4 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">{group.roundName}</p><div className="divide-y divide-blue-50">{group.matrices.map((matrix) => { const ready = matrix.scoringCriteriaJson && matrix.submissionDeadline && matrix.judges?.length >= 2; return <button key={matrix.id} type="button" onClick={() => { selectMatrix(matrix); setActiveStep('setup'); setMessage(null); }} className={`block w-full p-4 text-left transition ${String(matrix.id) === String(selectedMatrixId) ? 'bg-blue-50' : 'hover:bg-slate-50'}`}><div className="flex items-start justify-between gap-3"><div><p className="font-black text-slate-900">{matrix.finalRound ? 'Tất cả bảng' : matrix.trackName}</p><p className="mt-1 text-xs font-bold text-[#0f63c9]">{matrix.finalRound ? 'Vòng cuối' : `Top ${matrix.topN || '—'}`} · {matrix.judges?.length || 0} Judge</p></div><span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${ready ? 'bg-emerald-500' : 'bg-amber-400'}`} /></div></button>; })}</div></section>)}</div>
                    </aside>

                    <main className="min-w-0 space-y-5">
                        <section className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-[#0f63c9]">Đang cấu hình</p><h3 className="mt-1 text-xl font-black text-slate-900">{selectedMatrix?.roundName} · {selectedMatrix?.trackName || 'Tất cả bảng'}</h3></div><span className={`w-fit rounded-full px-3 py-1 text-xs font-black ${steps.every((step) => step.done) ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'}`}>{steps.filter((step) => step.done).length}/3 bước hoàn tất</span></div>
                            <div className="mt-5 grid gap-2 md:grid-cols-3">{steps.map((step) => <button key={step.id} type="button" onClick={() => setActiveStep(step.id)} className={`rounded-xl border p-3 text-left transition ${activeStep === step.id ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-100' : 'border-slate-200 hover:border-blue-300'}`}><span className="flex items-center gap-2"><span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-black ${step.done ? 'bg-emerald-500 text-white' : activeStep === step.id ? 'bg-[#0f63c9] text-white' : 'bg-slate-200 text-slate-600'}`}>{step.done ? '✓' : step.number}</span><span className="font-black text-slate-900">{step.label}</span></span><span className="mt-2 block pl-9 text-xs text-slate-500">{step.hint}</span></button>)}</div>
                        </section>

                        {activeStep === 'setup' && <section className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
                            <div className="border-b border-blue-100 pb-4"><p className="text-xs font-black uppercase tracking-[0.18em] text-[#0f63c9]">Bước 1/3</p><h3 className="mt-1 text-lg font-black text-slate-900">Thiết lập vòng đấu</h3><p className="mt-1 text-sm text-slate-500">Đặt tài liệu, thời hạn nộp và số đội được đi tiếp.</p></div>
                            <div className="mt-5 grid gap-4 md:grid-cols-2"><label className="text-sm font-bold text-slate-700">Guideline / đề bài<input className="input-custom mt-2" placeholder="Link PDF, Drive hoặc tài liệu" value={form.guidelineUrl} onChange={(event) => setForm({ ...form, guidelineUrl: event.target.value })} /></label><label className="text-sm font-bold text-slate-700">Deadline vòng đấu<input type="datetime-local" className="input-custom mt-2" value={form.submissionDeadline} onChange={(event) => setForm({ ...form, submissionDeadline: event.target.value })} /></label></div>
                            {!selectedMatrix?.finalRound && <label className="mt-4 block max-w-xs text-sm font-bold text-slate-700">Số đội đi tiếp (Top N)<input type="number" min="1" className="input-custom mt-2" value={form.topN} onChange={(event) => setForm({ ...form, topN: event.target.value })} /></label>}
                        </section>}

                        {activeStep === 'rubric' && <section className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
                            <div className="flex flex-col gap-4 border-b border-blue-100 pb-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-[#0f63c9]">Bước 2/3</p><h3 className="mt-1 text-lg font-black text-slate-900">Tiêu chí chấm điểm</h3><p className="mt-1 text-sm text-slate-500">Tổng trọng số của rubric phải bằng 100%.</p></div><div className="flex items-center gap-2"><span className={`rounded-full px-3 py-2 text-xs font-black ${totalWeight === 100 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'}`}>{totalWeight}/100%</span><button type="button" className="btn-secondary" onClick={() => setForm((current) => ({ ...current, criteria: [...current.criteria, { id: `criterion_${Date.now()}`, label: '', description: '', maxScore: 100, weight: 10 }] }))}>+ Thêm tiêu chí</button></div></div>
                            <div className="mt-5 space-y-3">{form.criteria.map((criterion, index) => <div key={criterion.id || index} className="grid gap-3 rounded-xl border border-blue-100 bg-slate-50/60 p-4 lg:grid-cols-[1fr_1.35fr_110px_110px_auto]"><input className="input-custom font-bold" value={criterion.label} onChange={(event) => updateCriterion(index, { label: event.target.value, id: criterion.id || event.target.value.toLowerCase().replaceAll(' ', '_') })} placeholder="Tên tiêu chí" /><input className="input-custom" value={criterion.description} onChange={(event) => updateCriterion(index, { description: event.target.value })} placeholder="Mô tả cách đánh giá" /><label className="text-xs font-bold text-slate-500">Điểm tối đa<input type="number" min="1" className="input-custom mt-1" value={criterion.maxScore} onChange={(event) => updateCriterion(index, { maxScore: Number(event.target.value) })} /></label><label className="text-xs font-bold text-slate-500">Trọng số %<input type="number" min="1" className="input-custom mt-1" value={criterion.weight} onChange={(event) => updateCriterion(index, { weight: Number(event.target.value) })} /></label><button type="button" className="btn-secondary self-end" disabled={form.criteria.length === 1} onClick={() => setForm((current) => ({ ...current, criteria: current.criteria.filter((_, criterionIndex) => criterionIndex !== index) }))}>Xóa</button></div>)}</div>
                        </section>}

                        {activeStep === 'judges' && <section className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
                            <div className="flex items-center justify-between border-b border-blue-100 pb-4"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-[#0f63c9]">Bước 3/3</p><h3 className="mt-1 text-lg font-black text-slate-900">Phân công Judge</h3><p className="mt-1 text-sm text-slate-500">Chọn từ 2 đến 4 người phụ trách chấm vòng này.</p></div><span className="rounded-full bg-blue-50 px-3 py-2 text-sm font-black text-[#0f63c9]">{form.judgeIds.length}/4</span></div>
                            <div className="mt-4 grid gap-2 sm:grid-cols-2">{judges.map((judge) => { const checked = form.judgeIds.some((id) => String(id) === String(judge.id)); return <label key={judge.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm ${checked ? 'border-blue-300 bg-blue-50 font-bold text-blue-900' : 'border-slate-200 hover:bg-slate-50'}`}><input type="checkbox" checked={checked} disabled={!checked && form.judgeIds.length >= 4} onChange={() => toggleJudge(judge.id)} /><span>{judge.fullName || judge.email}</span></label>; })}{!judges.length && <p className="text-sm text-amber-700">Chưa có tài khoản Staff để phân công.</p>}</div>
                        </section>}

                        <div className="flex flex-col gap-3 rounded-2xl border border-blue-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                            <button type="button" className="btn-secondary" disabled={stepIndex === 0} onClick={() => setActiveStep(steps[stepIndex - 1].id)}>← Quay lại</button>
                            {stepIndex < steps.length - 1 ? <button type="button" className="btn-primary" onClick={() => setActiveStep(steps[stepIndex + 1].id)}>Tiếp tục →</button> : <div className="flex flex-col gap-2 sm:flex-row"><button type="button" className="btn-secondary" disabled={saving} onClick={() => save(true)}>Áp dụng cho cả vòng</button><button type="button" className="btn-primary" disabled={saving} onClick={() => save(false)}>{saving ? 'Đang lưu...' : 'Lưu cấu hình'}</button></div>}
                        </div>
                    </main>
                </div>
            )}
        </div>
    );
}
