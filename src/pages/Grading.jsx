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

    const [showDisqualifyModal, setShowDisqualifyModal] = useState(false);
    const [disqualifyReasonOption, setDisqualifyReasonOption] = useState('Gian lận');
    const [disqualifyCustomReason, setDisqualifyCustomReason] = useState('');
    const [disqualifyingTeam, setDisqualifyingTeam] = useState(null);

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
            await axiosClient.post(`/teams/${disqualifyingTeam.id}/propose-disqualify`, { reason: finalReason });
            alert(`Đã gửi đề xuất loại đội "${disqualifyingTeam.name}" lên Coordinator duyệt.`);
            setShowDisqualifyModal(false);
            setDisqualifyingTeam(null);
            setDisqualifyCustomReason('');
            setSelectedSub(null);
            fetchData();
        } catch (err) {
            alert(err.message || 'Không thể gửi đề xuất loại đội thi.');
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

    // Silent background refresh — keeps disqualification statuses in sync across all judges
    const fetchDataQuiet = async () => {
        try {
            const [submissionRes, eventRes] = await Promise.all([
                axiosClient.get('/submissions'),
                axiosClient.get('/events').catch(() => ({ result: [] })),
            ]);
            setSubmissions(submissionRes.result || []);
            setEvents(eventRes.result || []);
        } catch {
            // Silently ignore background poll failures
        }
    };

    useEffect(() => {
        fetchData();
        // Poll every 15 seconds so PENDING dim is reflected for all judges in real-time
        const pollId = window.setInterval(() => fetchDataQuiet(), 15000);
        return () => window.clearInterval(pollId);
    }, []);


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
                            const isPendingDisqualify = submission.disqualificationStatus === 'PENDING';
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
                                    style={isPendingDisqualify ? { opacity: 0.45, filter: 'grayscale(80%)', cursor: 'not-allowed' } : {}}
                                >
                                    <div>
                                        <strong>{submission.teamName || `Đội #${submission.teamId}`}</strong>
                                        <span>{matrix?.eventName || 'Sự kiện'} · {submission.trackName || 'Bảng chung'}</span>
                                        {isPendingDisqualify && <span style={{ color: '#b91c1c', fontSize: '10px', fontWeight: 'bold', marginLeft: '6px', backgroundColor: '#fee2e2', padding: '2px 6px', borderRadius: '4px' }}>Chờ duyệt loại</span>}
                                    </div>
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
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    <a href={selectedSub.fileUrl} target="_blank" rel="noreferrer">Mở bài nộp ↗</a>
                                    {canGrade && selectedSub.disqualificationStatus !== 'PENDING' && (
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

                            {selectedSub.disqualificationStatus === 'PENDING' && (
                                <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fef3c7', color: '#92400e', padding: '12px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', marginBottom: '16px' }}>
                                    ⚠️ Đội thi này đang có đề xuất loại giải đấu chờ Coordinator duyệt.
                                    <span style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginTop: '4px', opacity: 0.85 }}>
                                        Lý do đề xuất: "{selectedSub.disqualificationReason}" (bởi {selectedSub.disqualifierEmail || 'Giám khảo'})
                                    </span>
                                </div>
                            )}
                            {selectedSub.disqualificationStatus === 'REJECTED' && (
                                <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fee2e2', color: '#991b1b', padding: '12px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', marginBottom: '16px' }}>
                                    ❌ Đề xuất loại đội thi đã bị Coordinator từ chối.
                                    <span style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginTop: '4px', opacity: 0.85 }}>
                                        Lý do từ chối: "{selectedSub.rejectionReason}"
                                    </span>
                                </div>
                            )}

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
            {showDisqualifyModal && disqualifyingTeam && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
                    <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', width: '100%', maxWidth: '480px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                            <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a' }}>Đề xuất loại đội thi</h3>
                            <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>Bạn đang đề xuất loại đội <strong>"{disqualifyingTeam.name}"</strong> khỏi giải đấu.</p>
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
                                Gửi đề xuất
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
