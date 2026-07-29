import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
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

const getPerformanceBadge = (score) => {
    const num = Number(score) || 0;
    if (num >= 85) return { label: 'Xuất Sắc', bg: '#dcfce7', text: '#15803d', border: '#86efac' };
    if (num >= 70) return { label: 'Khá Tốt', bg: '#e0f2fe', text: '#0369a1', border: '#7dd3fc' };
    if (num >= 50) return { label: 'Trung Bình', bg: '#fef3c7', text: '#b45309', border: '#fde047' };
    return { label: 'Cần Cải Thiện', bg: '#fee2e2', text: '#b91c1c', border: '#fca5a5' };
};

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
    const [lastGradedInfo, setLastGradedInfo] = useState(null);
    const [query, setQuery] = useState('');
    const [queueFilter, setQueueFilter] = useState('pending');
    const [showOverallCharts, setShowOverallCharts] = useState(false);

    const [showDisqualifyModal, setShowDisqualifyModal] = useState(false);
    const [disqualifyReasonOption, setDisqualifyReasonOption] = useState('Gian lận');
    const [disqualifyCustomReason, setDisqualifyCustomReason] = useState('');
    const [disqualifyingTeam, setDisqualifyingTeam] = useState(null);

    const scoreInputRefs = useRef([]);
    const feedbackRef = useRef(null);

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
    const [resolvedUserId, setResolvedUserId] = useState(localStorage.getItem('userId') || null);
    const canGrade = ['STAFF', 'JUDGE'].includes(role);

    const matrixById = useMemo(() => {
        const map = new Map();
        events.forEach((event) => (event.matrices || []).forEach((matrix) => map.set(String(matrix.id), { ...matrix, eventName: event.name })));
        return map;
    }, [events]);

    const visibleSubmissions = useMemo(() => {
        const withFile = submissions.filter((s) => s.fileUrl && s.fileUrl.trim() !== '');
        if (role === 'ADMIN' || role === 'COORDINATOR') return withFile;
        if (!resolvedUserId) return [];
        return withFile.filter((submission) => {
            const matrix = matrixById.get(String(submission.matrixId));
            return (matrix?.judges || []).some(
                (judge) => String(judge.id) === resolvedUserId
            );
        });
    }, [resolvedUserId, matrixById, role, submissions]);

    const summary = useMemo(() => {
        const activeSubmissions = visibleSubmissions.filter(
            (submission) => submission.disqualificationStatus !== 'APPROVED'
        );
        return {
            total: activeSubmissions.length,
            graded: activeSubmissions.filter((submission) => submission.graded).length,
            pending: activeSubmissions.filter((submission) => !submission.graded).length,
        };
    }, [visibleSubmissions]);

    const filteredSubmissions = useMemo(() => {
        const keyword = query.trim().toLowerCase();
        return visibleSubmissions.filter((submission) => {
            const matrix = matrixById.get(String(submission.matrixId));
            const isDisqualified = submission.disqualificationStatus === 'APPROVED';
            const matchesStatus = queueFilter === 'all'
                || (!isDisqualified && (queueFilter === 'graded' ? submission.graded : !submission.graded));
            const matchesSearch = !keyword || `${submission.teamName} ${submission.roundName} ${submission.trackName} ${matrix?.eventName || ''}`.toLowerCase().includes(keyword);
            return matchesStatus && matchesSearch;
        });
    }, [matrixById, query, queueFilter, visibleSubmissions]);

    const finalScore = useMemo(() => weightedAverage(criteriaScores), [criteriaScores]);
    const completedCriteria = criteriaScores.filter((item) => item.score !== '').length;
    const totalWeight = criteriaScores.reduce((sum, item) => sum + Number(item.weight || 0), 0);
    const selectedMatrixForPermission = selectedSub ? matrixById.get(String(selectedSub.matrixId)) : null;
    const canGradeSelected = Boolean(
        canGrade
        && selectedSub
        && !selectedSub.isPublished
        && !selectedMatrixForPermission?.isPublished
        && selectedSub.disqualificationStatus !== 'APPROVED'
        && selectedSub.disqualificationStatus !== 'PENDING'
        && resolvedUserId
        && (selectedMatrixForPermission?.judges || []).some(
            (judge) => String(judge.id) === String(resolvedUserId)
        )
    );
    const canDisqualifySelected = Boolean(
        canGrade
        && selectedSub
        && selectedSub.disqualificationStatus !== 'APPROVED'
        && selectedSub.disqualificationStatus !== 'PENDING'
        && resolvedUserId
        && (selectedMatrixForPermission?.judges || []).some(
            (judge) => String(judge.id) === String(resolvedUserId)
        )
    );

    const handleDisqualifyClick = (teamId, teamName) => {
        setDisqualifyingTeam({ id: teamId, name: teamName });
        setDisqualifyReasonOption('Gian lận');
        setDisqualifyCustomReason('');
        setShowDisqualifyModal(true);
    };

    const handleConfirmDisqualify = async () => {
        const finalReason = disqualifyReasonOption === 'Khác' ? disqualifyCustomReason.trim() : disqualifyReasonOption;
        if (!finalReason) {
            alert('Vui lòng chọn hoặc nhập lý do loại đội thi.');
            return;
        }
        try {
            setSaving(true);
            const teamId = disqualifyingTeam.id;
            const teamName = disqualifyingTeam.name;
            await axiosClient.post(`/teams/${teamId}/propose-disqualify`, { reason: finalReason });
            window.dispatchEvent(new Event('notifications:refresh'));
            setShowDisqualifyModal(false);
            setDisqualifyingTeam(null);
            setDisqualifyCustomReason('');
            setSuccessMsg(`Đã loại đội "${teamName}" khỏi giải đấu và lưu nhật ký Audit Log thành công.`);
            if (selectedSub && String(selectedSub.teamId) === String(teamId)) {
                setSelectedSub(null);
            }
            await fetchDataQuiet();
        } catch (err) {
            setError(err.message || 'Không thể loại đội thi.');
        } finally {
            setSaving(false);
        }
    };

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

    const fetchDataQuiet = async () => {
        try {
            const [submissionRes, eventRes] = await Promise.all([
                axiosClient.get('/submissions'),
                axiosClient.get('/events').catch(() => ({ result: [] })),
            ]);
            const newSubs = submissionRes.result || [];
            setSubmissions(newSubs);
            setEvents(eventRes.result || []);

            setSelectedSub((prevSub) => {
                if (!prevSub) return null;
                const updatedSubmission = newSubs.find((submission) => String(submission.id) === String(prevSub.id));
                if (!updatedSubmission) {
                    setError('Đội thi này vừa bị loại khỏi giải đấu.');
                    return null;
                }
                if (prevSub.disqualificationStatus !== 'APPROVED'
                    && updatedSubmission.disqualificationStatus === 'APPROVED') {
                    setError(`Đội "${updatedSubmission.teamName}" vừa bị loại khỏi cuộc thi.`);
                }
                return updatedSubmission;
            });
        } catch {
            // Silently ignore background poll failures
        }
    };

    useEffect(() => {
        fetchData();
        const pollId = window.setInterval(() => fetchDataQuiet(), 4000);
        return () => window.clearInterval(pollId);
    }, []);

    const handleSelect = (submission) => {
        const matrix = matrixById.get(String(submission.matrixId));
        const criteria = parseJson(matrix?.scoringCriteriaJson, fallbackCriteria);
        const normalizedScores = normalizeScores(criteria, submission.criteriaScoresJson);
        setSelectedSub(submission);
        setCriteriaScores(normalizedScores);
        setFeedback(submission.feedback || '');
        setEditReason('');
        setError('');
        setSuccessMsg('');
        setTimeout(() => {
            const firstBlankIndex = normalizedScores.findIndex((criterion) => criterion.score === '');
            const targetIndex = firstBlankIndex >= 0 ? firstBlankIndex : 0;
            scoreInputRefs.current[targetIndex]?.focus();
            scoreInputRefs.current[targetIndex]?.select();
        }, 0);
    };

    const updateCriterionScore = (index, patch) => {
        setCriteriaScores((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
    };

    const handleScoreKeyDown = (event, index) => {
        if (event.key !== 'Enter' || event.ctrlKey || event.metaKey) return;
        event.preventDefault();
        const nextScoreInput = scoreInputRefs.current[index + 1];
        if (nextScoreInput) {
            nextScoreInput.focus();
            nextScoreInput.select();
        } else {
            feedbackRef.current?.focus();
        }
    };

    const handleSubmitGrade = async (e) => {
        e.preventDefault();
        if (!selectedSub || !canGradeSelected) return;
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

            setLastGradedInfo({
                teamName,
                score: finalScore,
                criteria: [...criteriaScores],
                feedback,
            });

            setSuccessMsg(`Lưu kết quả chấm thành công cho ${teamName}!`);
            setError('');
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
                <div>
                    <p>Judge workspace</p>
                    <h1>Chấm điểm bài thi</h1>
                    <span>Đánh giá từng tiêu chí theo rubric đã công bố và xem thống kê trực quan.</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button
                        type="button"
                        onClick={() => setShowOverallCharts(!showOverallCharts)}
                        style={{
                            backgroundColor: showOverallCharts ? '#1e293b' : '#0f63c9',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '10px',
                            padding: '10px 16px',
                            fontWeight: '800',
                            fontSize: '13px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            boxShadow: '0 4px 12px rgba(15, 99, 201, 0.25)',
                        }}
                    >
                        <span>{showOverallCharts ? 'Ẩn Biểu Đồ Thống Kê' : 'Xem Biểu Đồ Thống Kê Điểm'}</span>
                    </button>
                    <div className="judge-grading-summary">
                        <div><span>Tổng bài</span><strong>{summary.total}</strong></div>
                        <div><span>Đã chấm</span><strong>{summary.graded}</strong></div>
                        <div><span>Chờ chấm</span><strong>{summary.pending}</strong></div>
                    </div>
                </div>
            </header>

            {/* DASHBOARD BIỂU ĐỒ THỐNG KÊ TỔNG QUAN */}
            {showOverallCharts && (
                <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', marginBottom: '24px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', pb: '12px' }}>
                        <div>
                            <h3 style={{ fontSize: '16px', fontWeight: '900', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Biểu Đồ Thống Kê Tiến Độ & Phân Bổ Điểm Chấm
                            </h3>
                            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                                Trực quan hóa tỷ lệ hoàn thành, dải phân bố điểm bài thi và trung bình theo nhánh chuyên môn
                            </p>
                        </div>
                        <Link
                            to="/dashboard/scoring-stats"
                            style={{ fontSize: '12px', fontWeight: '800', color: '#0f63c9', textDecoration: 'none', backgroundColor: '#eff6ff', padding: '6px 12px', borderRadius: '8px' }}
                        >
                            Xem Thống Kê Inter-Rater & Cohen's Kappa
                        </Link>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                        {/* Biểu đồ 1: Donut Tỷ lệ tiến độ */}
                        <div style={{ backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '12px' }}>
                                Tỷ Lệ Bài Đã Chấm
                            </span>
                            <div style={{ position: 'relative', width: '120px', height: '120px' }}>
                                <svg width="120" height="120" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                                    <circle cx="50" cy="50" r="40" stroke="#e2e8f0" strokeWidth="12" fill="none" />
                                    <circle
                                        cx="50"
                                        cy="50"
                                        r="40"
                                        stroke="#10b981"
                                        strokeWidth="12"
                                        fill="none"
                                        strokeDasharray="251.3"
                                        strokeDashoffset={251.3 - (251.3 * summary.percent) / 100}
                                        strokeLinecap="round"
                                        style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                                    />
                                </svg>
                                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                    <span style={{ fontSize: '22px', fontWeight: '900', color: '#0f172a' }}>{summary.percent}%</span>
                                    <span style={{ fontSize: '10px', fontWeight: '700', color: '#10b981' }}>HOÀN THÀNH</span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '16px', marginTop: '16px', fontSize: '12px', fontWeight: '700' }}>
                                <span style={{ color: '#10b981' }}>Đã chấm: {summary.graded}</span>
                                <span style={{ color: '#64748b' }}>Chờ chấm: {summary.pending}</span>
                            </div>
                        </div>

                        {/* Biểu đồ 2: Cột Phân bổ dải điểm */}
                        <div style={{ backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px', display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '12px' }}>
                                Phân Bổ Dải Điểm Bài Thi
                            </span>
                            <div style={{ display: 'flex', height: '110px', alignItems: 'flex-end', gap: '12px', padding: '0 8px', borderBottom: '1px solid #cbd5e1' }}>
                                {[
                                    { label: '85-100đ', count: scoreDistribution.excellent, color: '#10b981', tag: 'Xuất sắc' },
                                    { label: '70-84đ', count: scoreDistribution.good, color: '#0284c7', tag: 'Khá tốt' },
                                    { label: '50-69đ', count: scoreDistribution.average, color: '#f59e0b', tag: 'Trung bình' },
                                    { label: '<50đ', count: scoreDistribution.poor, color: '#ef4444', tag: 'Yếu' },
                                ].map((item) => {
                                    const maxCount = Math.max(scoreDistribution.totalGraded || 1, 1);
                                    const heightPercent = Math.max(10, (item.count / maxCount) * 100);
                                    return (
                                        <div key={item.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyEnd: 'flex-end' }}>
                                            <span style={{ fontSize: '11px', fontWeight: '900', color: '#0f172a', marginBottom: '4px' }}>{item.count}</span>
                                            <div
                                                style={{
                                                    width: '100%',
                                                    height: `${heightPercent}%`,
                                                    backgroundColor: item.color,
                                                    borderRadius: '6px 6px 0 0',
                                                    transition: 'height 0.5s ease',
                                                }}
                                                title={`${item.tag}: ${item.count} bài`}
                                            />
                                            <span style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', marginTop: '6px' }}>{item.label}</span>
                                        </div>
                                    );
                                })}
                            </div>
                            <span style={{ fontSize: '11px', color: '#64748b', textAlign: 'center', marginTop: '8px' }}>
                                Tổng số bài đã có điểm: <strong>{scoreDistribution.totalGraded}</strong>
                            </span>
                        </div>

                        {/* Biểu đồ 3: Điểm TB theo Track */}
                        <div style={{ backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px', display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '12px' }}>
                                Điểm Trung Bình Theo Track
                            </span>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, justifyContent: 'center' }}>
                                {trackAverages.map((t) => (
                                    <div key={t.name} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '700', color: '#334155' }}>
                                            <span>{t.name} ({t.count} bài)</span>
                                            <span style={{ color: '#0f63c9', fontWeight: '900' }}>{t.avg}đ</span>
                                        </div>
                                        <div style={{ height: '8px', width: '100%', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                                            <div style={{ height: '100%', width: `${Math.min(t.avg, 100)}%`, backgroundColor: '#0f63c9', borderRadius: '4px' }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* THÔNG BÁO VÀ BIỂU ĐỒ KẾT QUẢ VỪA CHẤM XONG */}
            {lastGradedInfo && (
                <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '16px', padding: '20px', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', justifyBetween: 'space-between', alignItems: 'center', borderBottom: '1px solid #dcfce7', pb: '12px' }}>
                        <div>
                            <span style={{ fontSize: '11px', fontWeight: '900', color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Vừa Hoàn Thành Chấm Điểm
                            </span>
                            <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#14532d', marginTop: '2px' }}>
                                {lastGradedInfo.teamName} — Điểm Tổng: {lastGradedInfo.score}/100đ
                            </h3>
                        </div>
                        <button
                            type="button"
                            onClick={() => setLastGradedInfo(null)}
                            style={{ background: 'none', border: 'none', fontSize: '18px', color: '#166534', cursor: 'pointer' }}
                        >
                            ✕
                        </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                        {lastGradedInfo.criteria.map((c) => {
                            const sc = Number(c.score || 0);
                            const max = Number(c.maxScore || 100);
                            const percent = Math.round((sc / max) * 100);
                            const weighted = Math.round((sc / max) * Number(c.weight || 0) * 10) / 10;
                            return (
                                <div key={c.id || c.label} style={{ backgroundColor: '#ffffff', padding: '12px', borderRadius: '10px', border: '1px solid #dcfce7' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '800', color: '#166534' }}>
                                        <span>{c.label} ({c.weight}%)</span>
                                        <span>{sc}/{max}</span>
                                    </div>
                                    <div style={{ height: '6px', width: '100%', backgroundColor: '#e2e8f0', borderRadius: '3px', marginTop: '6px', overflow: 'hidden' }}>
                                        <div style={{ height: '100%', width: `${percent}%`, backgroundColor: '#16a34a', borderRadius: '3px' }} />
                                    </div>
                                    <span style={{ fontSize: '10px', color: '#64748b', marginTop: '4px', display: 'block', fontWeight: '600' }}>
                                        Đóng góp: +{weighted} điểm
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className="judge-grading-workspace">
                <aside className="judge-queue">
                    <div className="judge-queue__header"><div><p>Hàng đợi</p><h2>Bài được phân công</h2></div><span>{filteredSubmissions.length}</span></div>
                    <label className="judge-queue__search"><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm đội, vòng hoặc bảng..." /></label>
                    <div className="judge-queue__tabs">
                        {[['pending', `Chờ chấm (${summary.pending})`], ['graded', `Đã chấm (${summary.graded})`], ['all', 'Tất cả']].map(([value, label]) => <button type="button" key={value} className={queueFilter === value ? 'is-active' : ''} onClick={() => setQueueFilter(value)}>{label}</button>)}
                    </div>
                    <div className="judge-queue__list">
                        {filteredSubmissions.length ? filteredSubmissions.map((submission) => {
                            const matrix = matrixById.get(String(submission.matrixId));
                            const isPendingDisqualify = submission.disqualificationStatus === 'PENDING';
                            const isDisqualified = submission.disqualificationStatus === 'APPROVED';
                            const handleClick = () => {
                                if (isPendingDisqualify) {
                                    alert(`Đội "${submission.teamName || `Đội #${submission.teamId}`}" đang trong quá trình xử lý kỷ luật/chờ duyệt loại.`);
                                    return;
                                }
                                handleSelect(submission);
                            };
                            return (
                                <button 
                                    type="button" 
                                    key={submission.id} 
                                    onClick={handleClick} 
                                    className={selectedSub?.id === submission.id ? 'is-selected' : ''}
                                    style={isPendingDisqualify || isDisqualified ? { opacity: 0.55, filter: 'grayscale(70%)' } : {}}
                                >
                                    <div>
                                        <strong>{submission.teamName || `Đội #${submission.teamId}`}</strong>
                                        <span>{matrix?.eventName || 'Sự kiện'} · {submission.trackName || 'Bảng chung'}</span>
                                        {isPendingDisqualify && <span style={{ color: '#b91c1c', fontSize: '10px', fontWeight: 'bold', marginLeft: '6px', backgroundColor: '#fee2e2', padding: '2px 6px', borderRadius: '4px' }}>Chờ duyệt loại</span>}
                                        {isDisqualified && <span style={{ color: '#991b1b', fontSize: '10px', fontWeight: 'bold', marginLeft: '6px', backgroundColor: '#fee2e2', padding: '2px 6px', borderRadius: '4px' }}>Đã bị loại</span>}
                                    </div>
                                    <p>{submission.roundName || 'Vòng thi'}<span className={submission.graded ? 'is-graded' : 'is-pending'}>{submission.graded ? `${submission.score ?? 0}/100` : 'Chờ chấm'}</span></p>
                                </button>
                            );
                        }) : <div className="judge-queue__empty">Không có bài nộp phù hợp.</div>}
                    </div>
                </aside>

                <main className="judge-rubric">
                    {selectedSub ? (
                        <form
                            onSubmit={handleSubmitGrade}
                            onKeyDown={(event) => {
                                if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
                                    event.preventDefault();
                                    event.currentTarget.requestSubmit();
                                }
                            }}
                        >
                            <header className="judge-rubric__header">
                                <div><p>{selectedMatrix?.eventName || 'SEAL Hackathon'} · {selectedSub.roundName}</p><h2>{selectedSub.teamName || `Đội #${selectedSub.teamId}`}</h2><span>{selectedSub.trackName || 'Bảng chung'}</span></div>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    <a href={selectedSub.fileUrl} target="_blank" rel="noreferrer">Mở bài nộp ↗</a>
                                    {canDisqualifySelected && (
                                        <button
                                            type="button"
                                            onClick={() => handleDisqualifyClick(selectedSub.teamId, selectedSub.teamName)}
                                            style={{ backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s', fontSize: '13px' }}
                                        >
                                            Loại đội (Disqualify)
                                        </button>
                                    )}
                                </div>
                            </header>

                            {selectedMatrix?.gradingRemainingSeconds != null && (
                                <div style={{ backgroundColor: '#fffbe8', border: '1px solid #fde68a', color: '#78350f', padding: '12px 16px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '16px' }}>⏱️</span>
                                        <div>
                                            <strong style={{ fontSize: '13px', display: 'block' }}>Thời gian chấm bài (Vòng {selectedSub.roundName})</strong>
                                            <span style={{ fontSize: '11px', opacity: 0.8 }}>Hệ thống đếm ngược thời gian chấm bài của Giám khảo</span>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <span style={{ fontSize: '20px', fontWeight: '900', color: '#b45309' }}>
                                            {Math.floor(selectedMatrix.gradingRemainingSeconds / 60)}:
                                            {String(selectedMatrix.gradingRemainingSeconds % 60).padStart(2, '0')}
                                        </span>
                                        <span style={{ fontSize: '10px', textTransform: 'uppercase', display: 'block', fontWeight: '700', color: '#92400e' }}>Thời gian còn lại</span>
                                    </div>
                                </div>
                            )}

                            {selectedSub.disqualificationStatus === 'PENDING' && (
                                <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fef3c7', color: '#92400e', padding: '12px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', marginBottom: '16px' }}>
                                    Đội thi này đang có đề xuất loại giải đấu chờ Coordinator duyệt.
                                    <span style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginTop: '4px', opacity: 0.85 }}>
                                        Lý do đề xuất: "{selectedSub.disqualificationReason}" (bởi {selectedSub.disqualifierEmail || 'Giám khảo'})
                                    </span>
                                </div>
                            )}
                            {selectedSub.disqualificationStatus === 'REJECTED' && (
                                <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fee2e2', color: '#991b1b', padding: '12px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', marginBottom: '16px' }}>
                                    Đề xuất loại đội thi đã bị Coordinator từ chối.
                                    <span style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginTop: '4px', opacity: 0.85 }}>
                                        Lý do từ chối: "{selectedSub.rejectionReason}"
                                    </span>
                                </div>
                            )}

                            {/* Multi-field parsed submission data */}
                            {selectedSub.submissionDataJson && (
                                <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', padding: '16px', borderRadius: '12px', marginBottom: '16px' }}>
                                    <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>Nội dung nộp bài chi tiết từ thí sinh</h4>
                                    <div style={{ display: 'grid', gap: '10px', fontSize: '13px' }}>
                                        {(() => {
                                            try {
                                                const parsed = JSON.parse(selectedSub.submissionDataJson);
                                                return Object.entries(parsed).map(([key, val]) => (
                                                    <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '2px', backgroundColor: '#ffffff', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                                                        <span style={{ fontSize: '11px', fontWeight: '800', color: '#475569', textTransform: 'uppercase' }}>{key}</span>
                                                        {typeof val === 'string' && val.startsWith('http') ? (
                                                            <a href={val} target="_blank" rel="noreferrer" style={{ color: '#0f63c9', fontWeight: '700', wordBreak: 'break-all' }}>{val}</a>
                                                        ) : (
                                                            <span style={{ color: '#0f172a', fontWeight: '600' }}>{String(val)}</span>
                                                        )}
                                                    </div>
                                                ));
                                            } catch {
                                                return null;
                                            }
                                        })()}
                                    </div>
                                </div>
                            )}

                            {/* BIỂU ĐỒ TRỰC QUAN TIÊU CHÍ BÀI CHẤM ĐANG CHỌN */}
                            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', marginBottom: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                    <span style={{ fontSize: '12px', fontWeight: '800', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        Biểu Đồ Trực Quan Tiêu Chí Đội Thi
                                    </span>
                                    {finalScore > 0 && (
                                        <span style={{ fontSize: '11px', fontWeight: '800', padding: '4px 10px', borderRadius: '20px', backgroundColor: getPerformanceBadge(finalScore).bg, color: getPerformanceBadge(finalScore).text, border: `1px solid ${getPerformanceBadge(finalScore).border}` }}>
                                            {getPerformanceBadge(finalScore).label}
                                        </span>
                                    )}
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                                    {criteriaScores.map((c) => {
                                        const sc = Number(c.score || 0);
                                        const max = Number(c.maxScore || 100);
                                        const percent = Math.min(100, Math.round((sc / max) * 100));
                                        const weighted = Math.round((sc / max) * Number(c.weight || 0) * 10) / 10;
                                        return (
                                            <div key={c.id || c.label} style={{ backgroundColor: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '700', color: '#334155' }}>
                                                    <span>{c.label}</span>
                                                    <span style={{ color: '#0f63c9', fontWeight: '800' }}>{c.score !== '' ? `${sc}/${max}` : '—'}</span>
                                                </div>
                                                <div style={{ height: '6px', width: '100%', backgroundColor: '#e2e8f0', borderRadius: '3px', marginTop: '6px', overflow: 'hidden' }}>
                                                    <div style={{ height: '100%', width: `${percent}%`, backgroundColor: '#0f63c9', borderRadius: '3px', transition: 'width 0.3s ease' }} />
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#64748b', marginTop: '4px' }}>
                                                    <span>Trọng số {c.weight}%</span>
                                                    <span style={{ fontWeight: '700', color: '#16a34a' }}>+{weighted}đ</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <section className="judge-rubric__guide">
                                <div><strong>Rubric chấm điểm</strong><span>{completedCriteria}/{criteriaScores.length} tiêu chí đã nhập · Tổng trọng số {totalWeight}%</span></div>
                                <div><span style={{ width: `${criteriaScores.length ? completedCriteria / criteriaScores.length * 100 : 0}%` }} /></div>
                            </section>

                            {canGradeSelected && (
                                <div className="judge-keyboard-guide" role="note">
                                    <strong>Chấm nhanh bằng bàn phím</strong>
                                    <span><kbd>Tab</kbd> hoặc <kbd>Enter</kbd> sang ô điểm kế tiếp · <kbd>Shift</kbd> + <kbd>Tab</kbd> quay lại · <kbd>Ctrl</kbd> + <kbd>Enter</kbd> lưu kết quả</span>
                                </div>
                            )}
                            {selectedSub.disqualificationStatus === 'APPROVED' && (
                                <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '12px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', marginBottom: '16px' }}>
                                    Đội thi này đã bị loại và không thể tiếp tục chấm điểm.
                                    <span style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginTop: '4px', opacity: 0.85 }}>
                                        Lý do: "{selectedSub.disqualificationReason}" (bởi {selectedSub.disqualifierEmail || 'Judge'})
                                    </span>
                                </div>
                            )}

                            <div className="judge-rubric__criteria">
                                {criteriaScores.map((criterion, index) => (
                                    <article key={criterion.id || index} className={criterion.score !== '' ? 'is-complete' : ''}>
                                        <div className="judge-criterion__number">{String(index + 1).padStart(2, '0')}</div>
                                        <div className="judge-criterion__content">
                                            <div className="judge-criterion__heading"><div><h3>{criterion.label}</h3><p>{criterion.description}</p></div><span>{criterion.weight}%</span></div>
                                            <div className="judge-criterion__inputs">
                                                <label className="judge-score-field">Điểm <span>0–{criterion.maxScore || 100}</span><input ref={(element) => { scoreInputRefs.current[index] = element; }} required type="number" inputMode="decimal" step="0.1" min="0" max={criterion.maxScore || 100} tabIndex={index + 1} aria-label={`Điểm tiêu chí ${index + 1}: ${criterion.label}`} value={criterion.score} onFocus={(event) => event.currentTarget.select()} onKeyDown={(event) => handleScoreKeyDown(event, index)} onChange={(e) => updateCriterionScore(index, { score: e.target.value })} disabled={!canGradeSelected} /></label>
                                                <label>Nhận xét cho tiêu chí<input tabIndex={criteriaScores.length + index + 1} value={criterion.note} onChange={(e) => updateCriterionScore(index, { note: e.target.value })} placeholder="Không bắt buộc — Tab để bỏ qua" disabled={!canGradeSelected} /></label>
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </div>

                            <section className="judge-feedback">
                                <label>Nhận xét chung <span>Phản hồi này sẽ được lưu cùng kết quả chấm.</span><textarea ref={feedbackRef} required rows="5" tabIndex={criteriaScores.length * 2 + 1} value={feedback} onChange={(e) => setFeedback(e.target.value)} disabled={!canGradeSelected} placeholder="Tổng kết điểm mạnh, hạn chế và đề xuất cải thiện cho đội thi..." /></label>
                                {selectedSub.graded && canGradeSelected && <label>Lý do sửa điểm <span>Bắt buộc để đảm bảo audit log minh bạch.</span><input required tabIndex={criteriaScores.length * 2 + 2} value={editReason} onChange={(e) => setEditReason(e.target.value)} placeholder="Ví dụ: rà soát lại rubric sau phiên Q&A" /></label>}
                                {!canGradeSelected && <div className="judge-readonly">{(selectedSub.isPublished || selectedMatrixForPermission?.isPublished) ? '🔒 Kết quả vòng đấu đã được công bố - Điểm số đã bị khóa và không thể chỉnh sửa.' : 'Tài khoản hiện tại chỉ được xem tiến độ hoặc chưa được phân công làm Judge cho bài này.'}</div>}
                            </section>

                            <footer className="judge-submit-bar">
                                <div><span>Điểm tổng có trọng số</span><strong>{finalScore}<small>/100</small></strong></div>
                                <button type="submit" tabIndex={criteriaScores.length * 2 + 3} disabled={saving || !canGradeSelected || completedCriteria !== criteriaScores.length}>{saving ? 'Đang lưu...' : selectedSub.graded ? 'Cập nhật điểm' : 'Lưu kết quả chấm'}</button>
                            </footer>
                        </form>
                    ) : (
                        <div className="judge-rubric__empty"><span>01</span><h2>Chọn một bài cần chấm</h2><p>Thông tin bài nộp, rubric và vùng nhập điểm sẽ xuất hiện tại đây.</p></div>
                    )}
                </main>
            </div>
            {showDisqualifyModal && disqualifyingTeam && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
                    <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', width: '100%', maxWidth: '480px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                            <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a' }}>Xác nhận loại đội thi</h3>
                            <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>Bạn đang thực hiện loại đội <strong>"{disqualifyingTeam.name}"</strong> khỏi giải đấu.</p>
                            <p style={{ fontSize: '12px', color: '#b91c1c', fontWeight: '700', marginTop: '8px' }}>Đội sẽ bị loại ngay, không cần Coordinator xác nhận. Thành viên đội và các Judge cùng được phân công sẽ nhận thông báo.</p>
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '13px', fontWeight: '700', color: '#475569' }}>Lý do loại đội:</label>
                            <select 
                                value={disqualifyReasonOption} 
                                onChange={(e) => setDisqualifyReasonOption(e.target.value)}
                                style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '8px 12px', fontSize: '14px', outline: 'none' }}
                            >
                                <option value="Gian lận">Gian lận (Cheating)</option>
                                <option value="Đạo văn">Đạo văn (Plagiarism)</option>
                                <option value="Vi phạm điều khoản">Vi phạm điều khoản & quy chế</option>
                                <option value="Không tham gia các hoạt động bắt buộc">Không tham gia các hoạt động hoạt động bắt buộc</option>
                                <option value="Khác">Khác (Nhập lý do riêng...)</option>
                            </select>
                        </div>

                        {disqualifyReasonOption === 'Khác' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '13px', fontWeight: '700', color: '#475569' }}>Nhập lý do khác:</label>
                                <textarea 
                                    required
                                    rows="3"
                                    value={disqualifyCustomReason}
                                    onChange={(e) => setDisqualifyCustomReason(e.target.value)}
                                    placeholder="Vui lòng nhập lý do cụ thể..."
                                    style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '8px 12px', fontSize: '14px', outline: 'none' }}
                                />
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowDisqualifyModal(false);
                                    setDisqualifyingTeam(null);
                                    setDisqualifyCustomReason('');
                                }}
                                style={{ flex: 1, backgroundColor: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '10px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}
                            >
                                Hủy bỏ
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmDisqualify}
                                style={{ flex: 1, backgroundColor: '#dc2626', color: '#ffffff', border: '1px solid #b91c1c', borderRadius: '8px', padding: '10px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}
                            >
                                Xác nhận
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
