import { useEffect, useMemo, useState } from 'react';
import axiosClient from '../api/axiosClient';
import Toast from '../components/Toast';

const fallbackCriteria = [
    { id: 'presentation', label: 'Trình bày', description: 'Cách trình bày và trả lời câu hỏi', maxScore: 100, weight: 25 },
    { id: 'innovation', label: 'Tính sáng tạo', description: 'Mức độ mới và khác biệt', maxScore: 100, weight: 25 },
    { id: 'technical', label: 'Kỹ thuật', description: 'Chất lượng thực thi và độ hoàn thiện', maxScore: 100, weight: 30 },
    { id: 'impact', label: 'Tính ứng dụng', description: 'Giá trị thực tế và khả năng mở rộng', maxScore: 100, weight: 20 },
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
        return { ...criterion, score: match?.score ?? '', note: match?.note ?? '' };
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
    const [successMsg, setSuccessMsg] = useState('');
    const [query, setQuery] = useState('');
    const [queueFilter, setQueueFilter] = useState('pending');

    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(''), 6000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    useEffect(() => {
        if (successMsg) {
            const timer = setTimeout(() => setSuccessMsg(''), 6000);
            return () => clearTimeout(timer);
        }
    }, [successMsg]);

    const storedRole = localStorage.getItem('role');
    const role = ['MENTOR', 'JUDGE'].includes(storedRole) ? 'STAFF' : storedRole;
    const email = localStorage.getItem('email');
    const [resolvedUserId, setResolvedUserId] = useState(localStorage.getItem('userId') || null);
    const canGrade = ['STAFF', 'JUDGE', 'ADMIN', 'COORDINATOR'].includes(role);

    const matrixById = useMemo(() => {
        const map = new Map();
        events.forEach((event) => (event.matrices || []).forEach((matrix) => map.set(String(matrix.id), { ...matrix, eventName: event.name })));
        return map;
    }, [events]);

    const visibleSubmissions = useMemo(() => {
        if (role === 'ADMIN' || role === 'COORDINATOR') return submissions;
        if (!resolvedUserId) return [];
        return submissions.filter((submission) => {
            const matrix = matrixById.get(String(submission.matrixId));
            return (matrix?.judges || []).some(
                (judge) => String(judge.id) === resolvedUserId
            );
        });
    }, [resolvedUserId, matrixById, role, submissions]);

    const summary = useMemo(() => ({
        total: visibleSubmissions.length,
        graded: visibleSubmissions.filter((submission) => submission.graded).length,
        pending: visibleSubmissions.filter((submission) => !submission.graded).length,
    }), [visibleSubmissions]);

    const filteredSubmissions = useMemo(() => {
        const keyword = query.trim().toLowerCase();
        return visibleSubmissions.filter((submission) => {
            const matrix = matrixById.get(String(submission.matrixId));
            const matchesStatus = queueFilter === 'all' || (queueFilter === 'graded' ? submission.graded : !submission.graded);
            const matchesSearch = !keyword || `${submission.teamName} ${submission.roundName} ${submission.trackName} ${matrix?.eventName || ''}`.toLowerCase().includes(keyword);
            return matchesStatus && matchesSearch;
        });
    }, [matrixById, query, queueFilter, visibleSubmissions]);

    const finalScore = useMemo(() => weightedAverage(criteriaScores), [criteriaScores]);
    const completedCriteria = criteriaScores.filter((item) => item.score !== '').length;
    const totalWeight = criteriaScores.reduce((sum, item) => sum + Number(item.weight || 0), 0);

    const fetchData = async () => {
        try {
            setLoading(true);
            let uid = localStorage.getItem('userId');
            if (!uid) {
                try {
                    const meRes = await axiosClient.get('/users/me');
                    uid = String(meRes.result?.id || '');
                    if (uid) localStorage.setItem('userId', uid);
                } catch {
                    // ignore
                }
            }
            setResolvedUserId(uid);

            const [submissionRes, eventRes] = await Promise.all([
                axiosClient.get('/submissions'),
                axiosClient.get('/events').catch(() => ({ result: [] })),
            ]);
            setSubmissions(submissionRes.result || []);
            setEvents(eventRes.result || []);
            setError('');
        } catch (err) {
            setError(err.message || 'Không tải được danh sách bài nộp.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleSelect = (submission) => {
        const matrix = matrixById.get(String(submission.matrixId));
        const criteria = parseJson(matrix?.scoringCriteriaJson, fallbackCriteria);
        setSelectedSub(submission);
        setCriteriaScores(normalizeScores(criteria, submission.criteriaScoresJson));
        setFeedback(submission.feedback || '');
        setEditReason('');
        setError('');
        setSuccessMsg('');
    };

    const updateCriterionScore = (index, patch) => {
        setCriteriaScores((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
    };

    const handleSubmitGrade = async (e) => {
        e.preventDefault();
        if (!selectedSub || !canGrade) return;
        const invalid = criteriaScores.some((item) => item.score === '' || Number(item.score) < 0 || Number(item.score) > Number(item.maxScore || 100));
        if (invalid) {
            setError('Vui lòng nhập điểm hợp lệ cho tất cả tiêu chí.');
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
            const teamName = selectedSub.teamName || `Đội #${selectedSub.teamId}`;
            setSuccessMsg(`Lưu kết quả chấm thành công cho ${teamName}!`);
            setError('');
            setSelectedSub(null);
            setCriteriaScores([]);
            await fetchData();
        } catch (err) {
            setError(err.message || 'Không lưu được điểm.');
            setSuccessMsg('');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="judge-grading-state">Đang tải không gian chấm điểm...</div>;

    const selectedMatrix = selectedSub ? matrixById.get(String(selectedSub.matrixId)) : null;

    return (
        <div className="judge-grading-page">
            <Toast error={error} success={successMsg} onClose={() => { setError(''); setSuccessMsg(''); }} />

            <header className="judge-grading-hero">
                <div><p>Judge workspace</p><h1>Chấm điểm bài thi</h1><span>Đánh giá từng tiêu chí theo rubric đã công bố và lưu phản hồi rõ ràng cho đội thi.</span></div>
                <div className="judge-grading-summary">
                    <div><span>Tổng bài</span><strong>{summary.total}</strong></div>
                    <div><span>Đã chấm</span><strong>{summary.graded}</strong></div>
                    <div><span>Chờ chấm</span><strong>{summary.pending}</strong></div>
                </div>
            </header>

            <div className="judge-grading-workspace">
                <aside className="judge-queue">
                    <div className="judge-queue__header"><div><p>Hàng đợi</p><h2>Bài được phân công</h2></div><span>{filteredSubmissions.length}</span></div>
                    <label className="judge-queue__search"><span>⌕</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm đội, vòng hoặc bảng..." /></label>
                    <div className="judge-queue__tabs">
                        {[['pending', `Chờ chấm (${summary.pending})`], ['graded', `Đã chấm (${summary.graded})`], ['all', 'Tất cả']].map(([value, label]) => <button type="button" key={value} className={queueFilter === value ? 'is-active' : ''} onClick={() => setQueueFilter(value)}>{label}</button>)}
                    </div>
                    <div className="judge-queue__list">
                        {filteredSubmissions.length ? filteredSubmissions.map((submission) => {
                            const matrix = matrixById.get(String(submission.matrixId));
                            return (
                                <button type="button" key={submission.id} onClick={() => handleSelect(submission)} className={selectedSub?.id === submission.id ? 'is-selected' : ''}>
                                    <div><strong>{submission.teamName || `Đội #${submission.teamId}`}</strong><span>{matrix?.eventName || 'Sự kiện'} · {submission.trackName || 'Bảng chung'}</span></div>
                                    <p>{submission.roundName || 'Vòng thi'}<span className={submission.graded ? 'is-graded' : 'is-pending'}>{submission.graded ? `${submission.score ?? 0}/100` : 'Chờ chấm'}</span></p>
                                </button>
                            );
                        }) : <div className="judge-queue__empty">Không có bài nộp phù hợp.</div>}
                    </div>
                </aside>

                <main className="judge-rubric">
                    {selectedSub ? (
                        <form onSubmit={handleSubmitGrade}>
                            <header className="judge-rubric__header">
                                <div><p>{selectedMatrix?.eventName || 'SEAL Hackathon'} · {selectedSub.roundName}</p><h2>{selectedSub.teamName || `Đội #${selectedSub.teamId}`}</h2><span>{selectedSub.trackName || 'Bảng chung'}</span></div>
                                <a href={selectedSub.fileUrl} target="_blank" rel="noreferrer">Mở bài nộp ↗</a>
                            </header>

                            <section className="judge-rubric__guide">
                                <div><strong>Rubric chấm điểm</strong><span>{completedCriteria}/{criteriaScores.length} tiêu chí đã nhập · Tổng trọng số {totalWeight}%</span></div>
                                <div><span style={{ width: `${criteriaScores.length ? completedCriteria / criteriaScores.length * 100 : 0}%` }} /></div>
                            </section>

                            <div className="judge-rubric__criteria">
                                {criteriaScores.map((criterion, index) => (
                                    <article key={criterion.id || index} className={criterion.score !== '' ? 'is-complete' : ''}>
                                        <div className="judge-criterion__number">{String(index + 1).padStart(2, '0')}</div>
                                        <div className="judge-criterion__content">
                                            <div className="judge-criterion__heading"><div><h3>{criterion.label}</h3><p>{criterion.description}</p></div><span>{criterion.weight}%</span></div>
                                            <div className="judge-criterion__inputs">
                                                <label>Điểm <span>0–{criterion.maxScore || 100}</span><input required type="number" step="0.1" min="0" max={criterion.maxScore || 100} value={criterion.score} onChange={(e) => updateCriterionScore(index, { score: e.target.value })} disabled={!canGrade} /></label>
                                                <label>Nhận xét cho tiêu chí<input value={criterion.note} onChange={(e) => updateCriterionScore(index, { note: e.target.value })} placeholder="Nêu điểm tốt hoặc nội dung cần cải thiện..." disabled={!canGrade} /></label>
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </div>

                            <section className="judge-feedback">
                                <label>Nhận xét chung <span>Phản hồi này sẽ được lưu cùng kết quả chấm.</span><textarea required rows="5" value={feedback} onChange={(e) => setFeedback(e.target.value)} disabled={!canGrade} placeholder="Tổng kết điểm mạnh, hạn chế và đề xuất cải thiện cho đội thi..." /></label>
                                {selectedSub.graded && canGrade && <label>Lý do sửa điểm <span>Bắt buộc để đảm bảo audit log minh bạch.</span><input required value={editReason} onChange={(e) => setEditReason(e.target.value)} placeholder="Ví dụ: rà soát lại rubric sau phiên Q&A" /></label>}
                                {!canGrade && <div className="judge-readonly">Tài khoản hiện tại chỉ được xem tiến độ. Quyền lưu điểm dành cho Judge.</div>}
                            </section>

                            <footer className="judge-submit-bar">
                                <div><span>Điểm tổng có trọng số</span><strong>{finalScore}<small>/100</small></strong></div>
                                <button type="submit" disabled={saving || !canGrade || completedCriteria !== criteriaScores.length}>{saving ? 'Đang lưu...' : selectedSub.graded ? 'Cập nhật điểm' : 'Lưu kết quả chấm'}</button>
                            </footer>
                        </form>
                    ) : (
                        <div className="judge-rubric__empty"><span>01</span><h2>Chọn một bài cần chấm</h2><p>Thông tin bài nộp, rubric và vùng nhập điểm sẽ xuất hiện tại đây.</p></div>
                    )}
                </main>
            </div>
        </div>
    );
}
