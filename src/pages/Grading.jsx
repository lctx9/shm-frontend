import { useEffect, useMemo, useState } from 'react';
import axiosClient from '../api/axiosClient';

const fallbackCriteria = [
    { id: 'presentation', label: 'Presentation', description: 'Cach trinh bay va tra loi cau hoi', maxScore: 100, weight: 25 },
    { id: 'innovation', label: 'Tinh sang tao', description: 'Muc do moi va khac biet', maxScore: 100, weight: 25 },
    { id: 'technical', label: 'Ky thuat', description: 'Chat luong thuc thi va do hoan thien', maxScore: 100, weight: 30 },
    { id: 'impact', label: 'Tinh ung dung', description: 'Gia tri thuc te va kha nang mo rong', maxScore: 100, weight: 20 },
];

function parseJson(value, fallback) {
    if (!value) return fallback;
    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : fallback;
    } catch {
        return fallback;
    }
}

function normalizeScores(criteria, savedJson) {
    const saved = parseJson(savedJson, []);
    return criteria.map((criterion) => {
        const match = saved.find((item) => item.id === criterion.id || item.label === criterion.label);
        return {
            ...criterion,
            score: match?.score ?? '',
            note: match?.note ?? '',
        };
    });
}

function weightedAverage(items) {
    const totalWeight = items.reduce((sum, item) => sum + Number(item.weight || 0), 0);
    if (!totalWeight) return 0;
    const total = items.reduce((sum, item) => {
        const maxScore = Number(item.maxScore || 100);
        const normalized = Math.min(Number(item.score || 0), maxScore) / maxScore * 100;
        return sum + normalized * Number(item.weight || 0);
    }, 0);
    return Math.round((total / totalWeight) * 10) / 10;
}

export default function Grading() {
    const [submissions, setSubmissions] = useState([]);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSub, setSelectedSub] = useState(null);
    const [criteriaScores, setCriteriaScores] = useState([]);
    const [feedback, setFeedback] = useState('');
    const [editReason, setEditReason] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const role = localStorage.getItem('role');
    const canGrade = role === 'JUDGE';

    const matrixById = useMemo(() => {
        const map = new Map();
        events.forEach((event) => {
            (event.matrices || []).forEach((matrix) => map.set(String(matrix.id), { ...matrix, eventName: event.name }));
        });
        return map;
    }, [events]);

    const summary = useMemo(() => ({
        total: submissions.length,
        graded: submissions.filter((submission) => submission.graded).length,
        pending: submissions.filter((submission) => !submission.graded).length,
    }), [submissions]);

    const finalScore = useMemo(() => weightedAverage(criteriaScores), [criteriaScores]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [submissionRes, eventRes] = await Promise.all([
                axiosClient.get('/submissions'),
                axiosClient.get('/events').catch(() => ({ result: [] })),
            ]);
            setSubmissions(submissionRes.result || []);
            setEvents(eventRes.result || []);
            setError('');
        } catch (err) {
            setError(err.message || 'Khong tai duoc danh sach bai nop.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const getCriteriaForSubmission = (submission) => {
        const matrix = matrixById.get(String(submission.matrixId));
        return parseJson(matrix?.scoringCriteriaJson, fallbackCriteria);
    };

    const handleSelect = (submission) => {
        const criteria = getCriteriaForSubmission(submission);
        setSelectedSub(submission);
        setCriteriaScores(normalizeScores(criteria, submission.criteriaScoresJson));
        setFeedback(submission.feedback || '');
        setEditReason('');
        setError('');
    };

    const updateCriterionScore = (index, patch) => {
        setCriteriaScores((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
    };

    const handleSubmitGrade = async (e) => {
        e.preventDefault();
        if (!selectedSub || !canGrade) return;

        const invalid = criteriaScores.some((item) => item.score === '' || Number(item.score) < 0 || Number(item.score) > Number(item.maxScore || 100));
        if (invalid) {
            setError('Hay nhap diem hop le cho tat ca tieu chi.');
            return;
        }

        try {
            setSaving(true);
            await axiosClient.post('/scores/grade', {
                submissionId: selectedSub.id,
                scoreValue: finalScore,
                criteriaScoresJson: JSON.stringify(criteriaScores),
                comment: feedback,
                editReason: selectedSub.graded ? editReason : '',
            });
            setSelectedSub(null);
            setCriteriaScores([]);
            await fetchData();
        } catch (err) {
            setError(err.message || 'Khong luu duoc diem.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="rounded-lg bg-white p-8 text-center text-gray-500">Dang tai danh sach bai nop...</div>;
    }

    return (
        <div className="mx-auto max-w-7xl space-y-6">
            <section className="grid gap-4 md:grid-cols-3">
                {[
                    ['Tong bai nop', summary.total],
                    ['Da cham', summary.graded],
                    ['Cho cham', summary.pending],
                ].map(([label, value]) => (
                    <div key={label} className="rounded-lg border border-blue-100 bg-white p-5 shadow-sm">
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0f63c9]">{label}</p>
                        <p className="mt-2 text-3xl font-black text-slate-900">{value}</p>
                    </div>
                ))}
            </section>

            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
                    {error}
                </div>
            )}

            <div className="grid gap-6 lg:grid-cols-[1fr_500px]">
                <section className="rounded-lg border border-blue-100 bg-white shadow-sm">
                    <div className="border-b border-blue-100 bg-blue-50 px-6 py-4">
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0f63c9]">Submission queue</p>
                        <h2 className="mt-1 text-lg font-black uppercase tracking-wide text-slate-900">Bai nop can cham</h2>
                    </div>

                    {submissions.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">Chua co bai nop nao.</div>
                    ) : (
                        <div className="divide-y divide-blue-50">
                            {submissions.map((submission) => {
                                const matrix = matrixById.get(String(submission.matrixId));
                                return (
                                    <button
                                        type="button"
                                        key={submission.id}
                                        onClick={() => handleSelect(submission)}
                                        className={`block w-full px-6 py-5 text-left transition hover:bg-blue-50 ${selectedSub?.id === submission.id ? 'bg-blue-50' : ''}`}
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="min-w-0">
                                                <p className="font-black text-slate-900">{submission.teamName || `Doi #${submission.teamId}`}</p>
                                                <p className="mt-1 text-sm text-slate-500">
                                                    {matrix?.eventName || 'Event'} - {submission.roundName || 'Round'} - {submission.trackName || 'Track'}
                                                </p>
                                                <p className="mt-1 truncate text-sm font-semibold text-blue-700">{submission.fileUrl}</p>
                                            </div>
                                            <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${submission.graded ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                                {submission.graded ? `${submission.score ?? 0}/100` : 'Cho cham'}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </section>

                <section className="rounded-lg border border-blue-100 bg-white shadow-sm">
                    {selectedSub ? (
                        <form onSubmit={handleSubmitGrade}>
                            <div className="border-b border-blue-100 p-6">
                                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0f63c9]">
                                    {selectedSub.roundName} - {selectedSub.trackName}
                                </p>
                                <h2 className="mt-2 text-xl font-black text-slate-900">
                                    {selectedSub.teamName || `Doi #${selectedSub.teamId}`}
                                </h2>
                                <a
                                    href={selectedSub.fileUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mt-4 block break-all rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm font-bold text-blue-700"
                                >
                                    {selectedSub.fileUrl}
                                </a>
                            </div>

                            <div className="space-y-4 p-6">
                                <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
                                    <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0f63c9]">Diem tong</p>
                                    <p className="mt-1 text-4xl font-black text-slate-900">{finalScore}/100</p>
                                    <p className="mt-1 text-sm font-semibold text-slate-600">Tinh theo trung binh co trong so cua cac cot diem.</p>
                                </div>

                                {criteriaScores.map((criterion, index) => (
                                    <div key={criterion.id || index} className="rounded-lg border border-blue-100 p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="font-black text-slate-900">{criterion.label}</p>
                                                <p className="mt-1 text-sm text-slate-600">{criterion.description}</p>
                                            </div>
                                            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-[#0f63c9]">
                                                {criterion.weight}%
                                            </span>
                                        </div>
                                        <div className="mt-4 grid gap-3 md:grid-cols-[140px_1fr]">
                                            <input
                                                required
                                                type="number"
                                                step="0.1"
                                                min="0"
                                                max={criterion.maxScore || 100}
                                                className="input-custom"
                                                value={criterion.score}
                                                onChange={(e) => updateCriterionScore(index, { score: e.target.value })}
                                                disabled={!canGrade}
                                            />
                                            <input
                                                className="input-custom"
                                                value={criterion.note}
                                                onChange={(e) => updateCriterionScore(index, { note: e.target.value })}
                                                placeholder="Nhan xet rieng cho tieu chi nay"
                                                disabled={!canGrade}
                                            />
                                        </div>
                                    </div>
                                ))}

                                <div>
                                    <label className="mb-1 block text-sm font-bold text-slate-700">Nhan xet chung</label>
                                    <textarea
                                        required
                                        rows="5"
                                        className="input-custom"
                                        value={feedback}
                                        onChange={(e) => setFeedback(e.target.value)}
                                        disabled={!canGrade}
                                    />
                                </div>

                                {selectedSub.graded && canGrade && (
                                    <div>
                                        <label className="mb-1 block text-sm font-bold text-slate-700">Ly do sua diem</label>
                                        <input
                                            required
                                            className="input-custom"
                                            value={editReason}
                                            onChange={(e) => setEditReason(e.target.value)}
                                            placeholder="Vi du: review lai rubric sau phien Q&A"
                                        />
                                    </div>
                                )}

                                {!canGrade && (
                                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-800">
                                        Tai khoan hien tai chi xem tien do cham diem. Chuc nang luu diem danh cho Judge.
                                    </div>
                                )}

                                <button type="submit" disabled={saving || !canGrade} className="btn-primary w-full">
                                    {saving ? 'Dang luu...' : selectedSub.graded ? 'Cap nhat diem' : 'Luu diem'}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="p-6">
                            <div className="rounded-lg border border-blue-100 bg-blue-50 p-6 text-sm font-semibold text-blue-900">
                                Chon mot bai nop ben trai de xem rubric va cham diem theo tung tieu chi.
                            </div>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
