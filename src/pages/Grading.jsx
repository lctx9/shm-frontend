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
    const [selectedRoundFilter, setSelectedRoundFilter] = useState('ALL');
    const [selectedTrackFilter, setSelectedTrackFilter] = useState('ALL');

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

    const uniqueRounds = useMemo(() => {
        const set = new Set();
        visibleSubmissions.forEach((s) => {
            if (s.roundName) set.add(s.roundName);
        });
        return Array.from(set).sort();
    }, [visibleSubmissions]);

    const uniqueTracks = useMemo(() => {
        const set = new Set();
        visibleSubmissions.forEach((s) => {
            if (s.trackName) set.add(s.trackName);
        });
        return Array.from(set).sort();
    }, [visibleSubmissions]);

    const filteredSubmissions = useMemo(() => {
        const keyword = query.trim().toLowerCase();
        return visibleSubmissions.filter((submission) => {
            const matrix = matrixById.get(String(submission.matrixId));
            const isDisqualified = submission.disqualificationStatus === 'APPROVED';
            
            // Status match
            const matchesStatus = queueFilter === 'all'
                || (!isDisqualified && (queueFilter === 'graded' ? submission.graded : !submission.graded));
            if (!matchesStatus) return false;
            
            // Search match
            const matchesSearch = !keyword || `${submission.teamName} ${submission.roundName} ${submission.trackName} ${matrix?.eventName || ''}`.toLowerCase().includes(keyword);
            if (!matchesSearch) return false;

            // Round match
            if (selectedRoundFilter !== 'ALL' && submission.roundName !== selectedRoundFilter) return false;

            // Track match
            if (selectedTrackFilter !== 'ALL' && submission.trackName !== selectedTrackFilter) return false;

            return true;
        });
    }, [matrixById, query, queueFilter, visibleSubmissions, selectedRoundFilter, selectedTrackFilter]);

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
        const secondTimer = window.setInterval(() => {
            setEvents((prevEvents) =>
                prevEvents.map((event) => ({
                    ...event,
                    matrices: (event.matrices || []).map((matrix) => {
                        if (matrix.gradingRemainingSeconds != null && matrix.gradingRemainingSeconds > 0) {
                            return { ...matrix, gradingRemainingSeconds: matrix.gradingRemainingSeconds - 1 };
                        }
                        return matrix;
                    }),
                }))
            );
        }, 1000);

        return () => {
            window.clearInterval(pollId);
            window.clearInterval(secondTimer);
        };
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


            {/* DASHBOARD BIỂU ĐỒ THỐNG KÊ TỔNG QUAN */}
            {showOverallCharts && (
                <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', marginBottom: '24px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', pb: '12px' }}>
                        <div>
                            <h3 style={{ fontSize: '16px', fontWeight: '900', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Grading Progress & Distribution Dashboard
                            </h3>
                            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                                Visualize completion rate, grade distribution ranges, and averages by track.
                            </p>
                        </div>
                        <Link
                            to="/dashboard/scoring-stats"
                            style={{ fontSize: '12px', fontWeight: '800', color: '#0f63c9', textDecoration: 'none', backgroundColor: '#eff6ff', padding: '6px 12px', borderRadius: '8px' }}
                        >
                            View Inter-Rater Stats & Cohen's Kappa
                        </Link>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                        {/* Biểu đồ 1: Donut Tỷ lệ tiến độ */}
                        <div style={{ backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '12px' }}>
                                Graded Ratio
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
                                    <span style={{ fontSize: '10px', fontWeight: '700', color: '#10b981' }}>COMPLETED</span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '16px', marginTop: '16px', fontSize: '12px', fontWeight: '700' }}>
                                <span style={{ color: '#10b981' }}>Graded: {summary.graded}</span>
                                <span style={{ color: '#64748b' }}>Pending: {summary.pending}</span>
                            </div>
                        </div>

                        {/* Biểu đồ 2: Cột Phân bổ dải điểm */}
                        <div style={{ backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px', display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '12px' }}>
                                Submission Score Distribution
                            </span>
                            <div style={{ display: 'flex', height: '110px', alignItems: 'flex-end', gap: '12px', padding: '0 8px', borderBottom: '1px solid #cbd5e1' }}>
                                {[
                                    { label: '85-100 pts', count: scoreDistribution.excellent, color: '#10b981', tag: 'Excellent' },
                                    { label: '70-84 pts', count: scoreDistribution.good, color: '#0284c7', tag: 'Good' },
                                    { label: '50-69 pts', count: scoreDistribution.average, color: '#f59e0b', tag: 'Average' },
                                    { label: '<50 pts', count: scoreDistribution.poor, color: '#ef4444', tag: 'Needs Improvement' },
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
                                                title={`${item.tag}: ${item.count} submissions`}
                                            />
                                            <span style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', marginTop: '6px' }}>{item.label}</span>
                                        </div>
                                    );
                                })}
                            </div>
                            <span style={{ fontSize: '11px', color: '#64748b', textAlign: 'center', marginTop: '8px' }}>
                                Total graded submissions: <strong>{scoreDistribution.totalGraded}</strong>
                            </span>
                        </div>

                        {/* Biểu đồ 3: Điểm TB theo Track */}
                        <div style={{ backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px', display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '12px' }}>
                                Average Score by Track
                            </span>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, justifyContent: 'center' }}>
                                {trackAverages.map((t) => (
                                    <div key={t.name} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                        <div style={{ display: 'flex', justifyBetween: 'space-between', fontSize: '11px', fontWeight: '700', color: '#334155' }}>
                                            <span>{t.name} ({t.count} submissions)</span>
                                            <span style={{ color: '#0f63c9', fontWeight: '900' }}>{t.avg} pts</span>
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



            <div className="judge-grading-workspace no-scrollbar">
                <aside className="judge-queue no-scrollbar">
                    <div className="judge-queue__header"><div><p>Queue</p><h2>Assigned Submissions</h2></div><span>{filteredSubmissions.length}</span></div>
                    <label className="judge-queue__search"><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search teams, rounds, or tracks..." /></label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', padding: '0 16px 12px 16px' }}>
                        <select 
                            value={selectedRoundFilter} 
                            onChange={(e) => setSelectedRoundFilter(e.target.value)}
                            style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '6px 10px', fontSize: '11px', fontWeight: '800', outline: 'none', backgroundColor: '#f8fafc', color: '#334155' }}
                        >
                            <option value="ALL">All Rounds</option>
                            {uniqueRounds.map((r) => <option key={r} value={r}>{r}</option>)}
                        </select>
                        <select 
                            value={selectedTrackFilter} 
                            onChange={(e) => setSelectedTrackFilter(e.target.value)}
                            style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '6px 10px', fontSize: '11px', fontWeight: '800', outline: 'none', backgroundColor: '#f8fafc', color: '#334155' }}
                        >
                            <option value="ALL">All Tracks</option>
                            {uniqueTracks.map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <div className="judge-queue__tabs">
                        {[['pending', `Pending (${summary.pending})`], ['graded', `Graded (${summary.graded})`], ['all', 'All']].map(([value, label]) => (
                            <button 
                                type="button" 
                                key={value} 
                                className={queueFilter === value ? 'is-active' : ''} 
                                onClick={() => setQueueFilter(value)}
                                style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}
                            >
                                {value === 'pending' && summary.pending > 0 && (
                                    <span style={{ color: '#ef4444', fontSize: '12px' }}>🔔</span>
                                )}
                                {label}
                            </button>
                        ))}
                    </div>
                    <div className="judge-queue__list no-scrollbar">
                        {filteredSubmissions.length ? filteredSubmissions.map((submission) => {
                            const matrix = matrixById.get(String(submission.matrixId));
                            const isPendingDisqualify = submission.disqualificationStatus === 'PENDING';
                            const isDisqualified = submission.disqualificationStatus === 'APPROVED';
                            const handleClick = () => {
                                  if (isPendingDisqualify) {
                                      alert(`Team "${submission.teamName || `Team #${submission.teamId}`}" is currently undergoing disciplinary review / awaiting coordinator approval.`);
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
                                        <strong>{submission.teamName || `Team #${submission.teamId}`}</strong>
                                        <span>{matrix?.eventName || 'Event'} · {submission.trackName || 'General Track'}</span>
                                        {isPendingDisqualify && <span style={{ color: '#b91c1c', fontSize: '10px', fontWeight: 'bold', marginLeft: '6px', backgroundColor: '#fee2e2', padding: '2px 6px', borderRadius: '4px' }}>Pending Disqualify</span>}
                                        {isDisqualified && <span style={{ color: '#991b1b', fontSize: '10px', fontWeight: 'bold', marginLeft: '6px', backgroundColor: '#fee2e2', padding: '2px 6px', borderRadius: '4px' }}>Disqualified</span>}
                                    </div>
                                    <p>
                                        {submission.roundName || 'Round'}
                                        <span className={submission.graded ? 'is-graded' : 'is-pending'} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                            {!submission.graded && (
                                                <span style={{ color: '#ef4444', fontSize: '10px' }}>🔔</span>
                                            )}
                                            {submission.graded ? `${submission.score ?? 0}/100` : 'Pending'}
                                        </span>
                                    </p>
                                </button>
                            );
                        }) : <div className="judge-queue__empty">No matching submissions found.</div>}
                    </div>
                </aside>

                <main className="judge-rubric flex flex-col h-full min-h-0 overflow-hidden bg-white">
                    {selectedSub ? (
                        <form
                            onSubmit={handleSubmitGrade}
                            onKeyDown={(event) => {
                                if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
                                    event.preventDefault();
                                    event.currentTarget.requestSubmit();
                                }
                            }}
                            className="flex flex-col h-full min-h-0 overflow-hidden"
                        >
                            <header className="judge-rubric__header shrink-0 flex items-center justify-between border-b border-slate-200 px-6 py-4">
                                <div>
                                    <p className="text-xs font-black uppercase tracking-[0.16em] text-[#0f63c9]">{selectedMatrix?.eventName || 'SEAL Hackathon'} · {selectedSub.roundName}</p>
                                    <h2 className="text-lg font-black text-slate-900 mt-1">{selectedSub.teamName || `Team #${selectedSub.teamId}`}</h2>
                                    <span className="inline-block mt-1 bg-blue-50 text-[#0f63c9] border border-blue-100 rounded px-2.5 py-0.5 text-xs font-black uppercase">{selectedSub.trackName || 'General Track'}</span>
                                </div>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    <a href={selectedSub.fileUrl} target="_blank" rel="noreferrer" className="btn-secondary text-xs px-3 py-1.5 font-bold">Open Attachment ↗</a>
                                    {canDisqualifySelected && (
                                        <button
                                            type="button"
                                            onClick={() => handleDisqualifyClick(selectedSub.teamId, selectedSub.teamName)}
                                            style={{ backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s', fontSize: '13px' }}
                                        >
                                            Disqualify Team
                                        </button>
                                    )}
                                </div>
                            </header>

                            {selectedMatrix?.gradingRemainingSeconds != null && (
                                <div className="shrink-0 mx-6 mt-4 bg-amber-50 border border-amber-200 text-amber-900 px-4 py-2.5 rounded-lg flex items-center justify-between text-xs">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '16px' }}>⏱️</span>
                                        <div>
                                            <strong style={{ fontSize: '13px', display: 'block' }}>Grading Window (Round {selectedSub.roundName})</strong>
                                            <span style={{ fontSize: '11px', opacity: 0.8 }}>Countdown timer for judges evaluation</span>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <span style={{ fontSize: '20px', fontWeight: '900', color: '#b45309' }}>
                                            {Math.floor(selectedMatrix.gradingRemainingSeconds / 60)}:
                                            {String(selectedMatrix.gradingRemainingSeconds % 60).padStart(2, '0')}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {selectedSub.disqualificationStatus === 'PENDING' && (
                                <div className="shrink-0 mx-6 mt-4 bg-amber-50 border border-amber-200 text-amber-900 px-4 py-2.5 rounded-lg text-xs font-semibold">
                                    This team is undergoing disciplinary review / awaiting coordinator approval.
                                    <span style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginTop: '4px', opacity: 0.85 }}>
                                        Proposed reason: "{selectedSub.disqualificationReason}" (by {selectedSub.disqualifierEmail || 'Judge'})
                                    </span>
                                </div>
                            )}
                            {selectedSub.disqualificationStatus === 'REJECTED' && (
                                <div className="shrink-0 mx-6 mt-4 bg-red-50 border border-red-200 text-red-900 px-4 py-2.5 rounded-lg text-xs font-semibold">
                                    Disqualification request was rejected by Coordinator.
                                    <span style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginTop: '4px', opacity: 0.85 }}>
                                        Rejection reason: "{selectedSub.rejectionReason}"
                                    </span>
                                </div>
                            )}

                            {/* Split Pane Workspace */}
                            <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 divide-x divide-slate-200 overflow-hidden mt-4 no-scrollbar">
                                {/* Left Column: Submission Content */}
                                <div className="overflow-y-auto p-4 space-y-4 no-scrollbar">
                                    {/* Submission file link card */}
                                    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs flex items-center justify-between">
                                        <div>
                                            <h4 className="text-xs font-black text-slate-800">Submission Attachment File</h4>
                                            <p className="text-[10px] text-slate-400 mt-0.5">Review the uploaded documentation or codebase repository.</p>
                                        </div>
                                        <a 
                                            href={selectedSub.fileUrl} 
                                            target="_blank" 
                                            rel="noreferrer" 
                                            className="btn-primary inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold bg-[#0f63c9] text-white rounded hover:bg-blue-700 transition-all shadow-xs"
                                        >
                                            Open File ↗
                                        </a>
                                    </div>

                                    {/* Submission data parsed */}
                                    {(() => {
                                        let parsed = null;
                                        if (selectedSub.submissionDataJson) {
                                            try {
                                                const temp = JSON.parse(selectedSub.submissionDataJson);
                                                if (temp && Object.keys(temp).length > 0) {
                                                    parsed = temp;
                                                }
                                            } catch {}
                                        }
                                        // Dynamic fallback mock fields if database json is empty (e.g. for default seeds)
                                        if (!parsed) {
                                            parsed = {
                                                "Project Description": "A high-performance student hackathon management dashboard designed to track team formations, real-time grading, and automatic mentor pairing.",
                                                "Technology Stack": "React, Spring Boot, TailwindCSS, PostgreSQL, WebSockets",
                                                "Deployment URL": "https://alpha-builders.seal.dev",
                                                "Video Demo Link": "https://youtube.com/watch?v=alpha-builders-pitch"
                                            };
                                        }
                                        return (
                                            <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4 space-y-2">
                                                <h4 className="text-xs font-black text-slate-800">Detailed Submission Content</h4>
                                                <div className="space-y-2">
                                                    {Object.entries(parsed).map(([key, val]) => (
                                                        <div key={key} className="flex flex-col gap-1 bg-white p-2.5 rounded border border-slate-200">
                                                            <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">{key}</span>
                                                            {typeof val === 'string' && (val.startsWith('http') || val.startsWith('https')) ? (
                                                                <a href={val} target="_blank" rel="noreferrer" className="text-xs font-bold text-[#0f63c9] break-all">{val} ↗</a>
                                                            ) : (
                                                                <span className="text-xs text-slate-700 leading-relaxed font-semibold">{String(val)}</span>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>

                                {/* Right Column: Scoring Form */}
                                <div className="overflow-y-auto p-4 flex flex-col justify-between h-full bg-slate-50/10 no-scrollbar">
                                    <div className="space-y-4">
                                        {/* Rubric Criteria Rows */}
                                        <div className="space-y-2">
                                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Scoring Rubrics</span>
                                            <div className="bg-white border border-slate-200 rounded-lg p-3 divide-y divide-slate-100 shadow-xs">
                                                {criteriaScores.map((criterion, index) => (
                                                    <div key={criterion.id || index} className="flex items-center justify-between py-2 first:pt-0 last:pb-0">
                                                        <div className="flex flex-col pr-3">
                                                            <span className="text-xs font-bold text-slate-800 cursor-help" title={criterion.description}>
                                                                {criterion.label}
                                                            </span>
                                                            <span className="text-[10px] text-slate-400 mt-0.5">Weight: {criterion.weight}%</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 shrink-0">
                                                            <input 
                                                                ref={(element) => { scoreInputRefs.current[index] = element; }}
                                                                required
                                                                type="number"
                                                                inputMode="decimal"
                                                                step="0.1"
                                                                min="0"
                                                                max={criterion.maxScore || 100}
                                                                tabIndex={index + 1}
                                                                value={criterion.score}
                                                                onFocus={(event) => event.currentTarget.select()}
                                                                onKeyDown={(event) => handleScoreKeyDown(event, index)}
                                                                onChange={(e) => updateCriterionScore(index, { score: e.target.value })}
                                                                disabled={!canGradeSelected}
                                                                className="w-16 px-2 py-1 text-xs border border-slate-200 rounded font-black text-right outline-none focus:border-[#0f63c9]"
                                                            />
                                                            <span className="text-xs text-slate-400">/ {criterion.maxScore || 100}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* General Comments & Feedback */}
                                        <div className="space-y-3">
                                            <div className="space-y-1">
                                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">General Feedback</span>
                                                <label className="flex flex-col bg-white border border-slate-200 p-2.5 rounded-lg shadow-xs">
                                                    <textarea 
                                                        ref={feedbackRef}
                                                        required
                                                        rows={2}
                                                        tabIndex={criteriaScores.length * 2 + 1}
                                                        value={feedback}
                                                        onChange={(e) => setFeedback(e.target.value)}
                                                        disabled={!canGradeSelected}
                                                        placeholder="Enter general comments for the team..."
                                                        className="w-full text-xs outline-none border-0 p-0 focus:ring-0 resize-none font-semibold text-slate-700 placeholder-slate-400"
                                                    />
                                                </label>
                                            </div>

                                            {selectedSub.graded && canGradeSelected && (
                                                <div className="space-y-1">
                                                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Revision Reason</span>
                                                    <label className="flex flex-col bg-white border border-slate-200 p-2.5 rounded-lg shadow-xs">
                                                        <input 
                                                            required
                                                            tabIndex={criteriaScores.length * 2 + 2}
                                                            value={editReason}
                                                            onChange={(e) => setEditReason(e.target.value)}
                                                            placeholder="Why are you revising this score?"
                                                            className="w-full text-xs outline-none border-0 p-0 focus:ring-0 font-semibold text-slate-700 placeholder-slate-400"
                                                        />
                                                    </label>
                                                </div>
                                            )}

                                            {!canGradeSelected && (
                                                <div className="rounded-lg bg-amber-50 border border-amber-200 p-2.5 text-xs font-bold text-amber-800 leading-relaxed">
                                                    {(selectedSub.isPublished || selectedMatrixForPermission?.isPublished)
                                                        ? "🔒 Scoring is locked as event results are published."
                                                        : "You are not assigned as a grading judge for this submission."}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Submit Footer */}
                                    <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-xs shrink-0">
                                        <div>
                                            <span className="text-[9px] font-bold text-slate-400 uppercase">Weighted Score</span>
                                            <p className="text-lg font-black text-slate-900">{finalScore}<small className="text-xs text-slate-400 font-bold">/100</small></p>
                                        </div>
                                        <button 
                                            type="submit"
                                            tabIndex={criteriaScores.length * 2 + 3}
                                            disabled={saving || !canGradeSelected || completedCriteria !== criteriaScores.length}
                                            className="btn-primary bg-[#0f63c9] text-white px-4 py-2 rounded hover:bg-blue-700 font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all text-xs"
                                        >
                                            {saving ? 'Saving...' : selectedSub.graded ? 'Update Scores' : 'Submit Scores'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </form>
                    ) : (
                        <div className="judge-rubric__empty h-full flex flex-col items-center justify-center text-center p-8">
                            <span className="text-4xl text-[#0f63c9]">📝</span>
                            <h2 className="text-lg font-black text-slate-900 mt-4">Select a Submission to Evaluate</h2>
                            <p className="text-xs text-slate-500 mt-2 max-w-sm">The selected team's uploaded file attachments, answers, evaluation rubrics, and grade fields will appear here.</p>
                        </div>
                    )}
                </main>
            </div>
            {showDisqualifyModal && disqualifyingTeam && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
                    <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', width: '100%', maxWidth: '480px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                            <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a' }}>Confirm Team Disqualification</h3>
                            <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>You are about to disqualify team <strong>"{disqualifyingTeam.name}"</strong> from the tournament.</p>
                            <p style={{ fontSize: '12px', color: '#b91c1c', fontWeight: '700', marginTop: '8px' }}>The team will be disqualified immediately. Team members and assigned judges will be notified.</p>
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '13px', fontWeight: '700', color: '#475569' }}>Disqualification Reason:</label>
                            <select 
                                value={disqualifyReasonOption} 
                                onChange={(e) => setDisqualifyReasonOption(e.target.value)}
                                style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '8px 12px', fontSize: '14px', outline: 'none' }}
                            >
                                <option value="Gian lận">Cheating</option>
                                <option value="Đạo văn">Plagiarism</option>
                                <option value="Vi phạm điều khoản">Rules & Policies Violation</option>
                                <option value="Không tham gia các hoạt động bắt buộc">Failure to attend mandatory events</option>
                                <option value="Khác">Other (Enter custom reason below...)</option>
                            </select>
                        </div>

                        {disqualifyReasonOption === 'Khác' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '13px', fontWeight: '700', color: '#475569' }}>Enter custom reason:</label>
                                <textarea 
                                    required
                                    rows="3"
                                    value={disqualifyCustomReason}
                                    onChange={(e) => setDisqualifyCustomReason(e.target.value)}
                                    placeholder="Please describe the reason specifically..."
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
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmDisqualify}
                                style={{ flex: 1, backgroundColor: '#dc2626', color: '#ffffff', border: '1px solid #b91c1c', borderRadius: '8px', padding: '10px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
