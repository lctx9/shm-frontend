import { useEffect, useMemo, useState } from 'react';
import axiosClient from '../api/axiosClient';
import Toast from '../components/Toast';

function matrixLabel(matrix) {
    return `${matrix.roundName} - ${matrix.trackName}`;
}

export default function Submission() {
    const currentEmail = localStorage.getItem('email');
    const [team, setTeam] = useState(null);
    const [matrices, setMatrices] = useState([]);
    const [submission, setSubmission] = useState(null);
    const [formData, setFormData] = useState({ fileUrl: '', matrixId: '' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    useEffect(() => {
        const bootstrap = async () => {
            try {
                setLoading(true);
                const teamRes = await axiosClient.get('/teams/my-team');
                const loadedTeam = teamRes.result;
                setTeam(loadedTeam);

                if (loadedTeam?.eventId) {
                    const matrixRes = await axiosClient.get(`/events/${loadedTeam.eventId}/matrices`);
                    const teamMatrices = (matrixRes.result || []).filter(
                        (matrix) => matrix.trackId == null || String(matrix.trackId) === String(loadedTeam.trackId)
                    );
                    setMatrices(teamMatrices);
                    setFormData((current) => ({
                        ...current,
                        matrixId: teamMatrices[0]?.id || '',
                    }));
                }

                const submissionRes = await axiosClient.get(loadedTeam ? `/submissions/my-submission?teamId=${loadedTeam.id}` : '/submissions/my-submission');
                if (submissionRes.result) {
                    setSubmission(submissionRes.result);
                    setFormData({
                        fileUrl: submissionRes.result.fileUrl || '',
                        matrixId: submissionRes.result.matrixId || '',
                    });
                }
            } catch (err) {
                setMessage({ text: err.message || 'Không thể tải dữ liệu nộp bài.', type: 'error' });
            } finally {
                setLoading(false);
            }
        };

        bootstrap();
    }, []);

    const selectedMatrix = useMemo(
        () => matrices.find((matrix) => String(matrix.id) === String(formData.matrixId)),
        [matrices, formData.matrixId]
    );
    const isLeader = team?.members?.some(
        (member) => member.email === currentEmail && member.role === 'LEADER'
    ) || false;

    const isEventStarted = useMemo(() => {
        if (!team?.eventStartDate) return true;
        return new Date() >= new Date(team.eventStartDate);
    }, [team]);

    const isPreviousRoundEnded = useMemo(() => {
        if (!selectedMatrix || !matrices.length) return true;
        const currentOrder = selectedMatrix.roundOrder;
        if (currentOrder <= 1) return true;

        const prevMatrix = matrices.find(other => {
            if (other.roundOrder !== currentOrder - 1) return false;
            if (selectedMatrix.finalRound) return true;
            return !other.finalRound && String(other.trackId) === String(selectedMatrix.trackId);
        });

        if (!prevMatrix || !prevMatrix.submissionDeadline) return true;
        return new Date() >= new Date(prevMatrix.submissionDeadline);
    }, [selectedMatrix, matrices]);

    const isSubmissionStarted = useMemo(() => {
        if (!selectedMatrix?.submissionStartDate) return true;
        return new Date() >= new Date(selectedMatrix.submissionStartDate);
    }, [selectedMatrix]);

    const isSubmissionEnded = useMemo(() => {
        if (!selectedMatrix?.submissionDeadline) return false;
        return new Date() > new Date(selectedMatrix.submissionDeadline);
    }, [selectedMatrix]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage({ text: '', type: '' });

        if (!isLeader) {
            setMessage({ text: 'Chỉ Team Leader mới có quyền nộp hoặc cập nhật bài.', type: 'error' });
            return;
        }

        if (!team?.id || !formData.matrixId) {
            setMessage({ text: 'Thiếu đội thi hoặc vòng thi hợp lệ từ backend.', type: 'error' });
            return;
        }

        try {
            setSaving(true);
            const payload = {
                teamId: team.id,
                matrixId: Number(formData.matrixId),
                fileUrl: formData.fileUrl,
            };

            const response = submission
                ? await axiosClient.put(`/submissions/${submission.id}`, payload)
                : await axiosClient.post('/submissions', payload);

            setSubmission(response.result);
            setMessage({ text: submission ? 'Cập nhật bài nộp thành công.' : 'Nộp bài thành công.', type: 'success' });
        } catch (err) {
            setMessage({ text: err.message || 'Không thể lưu bài nộp.', type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="rounded-lg bg-white p-8 text-center text-gray-500">Đang tải dữ liệu bài nộp...</div>;
    }

    if (!team) {
        return (
            <div className="mx-auto max-w-3xl rounded-lg border border-amber-200 bg-amber-50 p-6 text-amber-900">
                Bạn cần tạo hoặc tham gia một đội thi trước khi nộp bài.
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-4xl space-y-6">
            {submission?.graded && (
                <section className="rounded-lg border border-green-200 bg-green-50 p-6">
                    <h2 className="text-lg font-black uppercase tracking-wide text-green-900">Kết quả chấm điểm</h2>
                    <div className="mt-4 rounded-lg bg-white p-4">
                        <p className="text-sm font-bold text-slate-600">Điểm số</p>
                        <p className="text-4xl font-black text-green-700">{submission.score}/100</p>
                    </div>
                    <p className="mt-4 text-sm leading-6 text-green-900">{submission.feedback || 'Chưa có nhận xét.'}</p>
                </section>
            )}

            <section className="rounded-lg border border-blue-100 bg-white p-8 shadow-sm">
                <div className="mb-7">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">
                        {team.eventName} - {team.trackName}
                    </p>
                    <h2 className="mt-2 text-2xl font-black uppercase tracking-wide text-slate-900">
                        {submission ? 'Cập nhật bài dự thi' : 'Nộp bài dự thi'}
                    </h2>
                    <p className="mt-2 text-sm text-slate-600">
                        Bài nộp được lưu vào bảng Submission và gắn với Team cùng TrackRoundMatrix đã chọn.
                    </p>
                </div>

                <Toast message={message} onClose={() => setMessage({ text: '', type: '' })} />

                {matrices.length === 0 ? (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
                        Giải đấu của đội chưa có vòng thi cho hạng mục này. Coordinator cần tạo cấu trúc Track/Round trước.
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="mb-1 block text-sm font-bold text-slate-700">Vòng thi</label>
                            <select
                                required
                                className="input-custom"
                                value={formData.matrixId}
                                onChange={(e) => setFormData({ ...formData, matrixId: e.target.value })}
                                disabled={!isLeader}
                            >
                                {matrices.map((matrix) => (
                                    <option key={matrix.id} value={matrix.id}>{matrixLabel(matrix)}</option>
                                ))}
                            </select>
                            {selectedMatrix?.submissionStartDate && (
                                <p className="mt-2 text-xs font-semibold text-slate-500">
                                    Mở nộp: {new Date(selectedMatrix.submissionStartDate).toLocaleString('vi-VN')}
                                </p>
                            )}
                            {selectedMatrix?.submissionDeadline && (
                                <p className="mt-2 text-xs font-semibold text-slate-500">
                                    Deadline: {new Date(selectedMatrix.submissionDeadline).toLocaleString('vi-VN')}
                                </p>
                            )}
                        </div>

                        {!isEventStarted && team?.eventStartDate && (
                            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs font-bold text-amber-800">
                                Giải đấu chưa chính thức bắt đầu. Thời gian bắt đầu: {new Date(team.eventStartDate).toLocaleString('vi-VN')}.
                            </div>
                        )}
                        {isEventStarted && !isPreviousRoundEnded && (
                            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs font-bold text-amber-800">
                                Vui lòng đợi vòng thi trước kết thúc mới được nộp bài cho vòng này.
                            </div>
                        )}
                        {isEventStarted && isPreviousRoundEnded && !isSubmissionStarted && selectedMatrix?.submissionStartDate && (
                            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs font-bold text-amber-800">
                                Cổng nộp bài chưa mở. Vui lòng quay lại sau thời gian mở nộp bài.
                            </div>
                        )}
                        {isSubmissionEnded && (
                            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-800">
                                Đã quá hạn nộp bài của vòng thi này.
                            </div>
                        )}

                        <div>
                            <label className="mb-1 block text-sm font-bold text-slate-700">Link tài liệu dự án</label>
                            <input
                                required
                                type="url"
                                className="input-custom"
                                value={formData.fileUrl}
                                onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
                                placeholder="https://github.com/... hoặc link Drive"
                                disabled={!isLeader || !isEventStarted || !isPreviousRoundEnded || !isSubmissionStarted || isSubmissionEnded}
                            />
                        </div>

                        <button type="submit" disabled={saving || !isLeader || !isEventStarted || !isPreviousRoundEnded || !isSubmissionStarted || isSubmissionEnded} className="btn-primary w-full">
                            {saving ? 'Đang lưu...' : !isLeader ? 'Chỉ leader được nộp bài' : !isEventStarted ? 'Giải đấu chưa bắt đầu' : !isPreviousRoundEnded ? 'Vòng trước chưa kết thúc' : !isSubmissionStarted ? 'Cổng nộp bài chưa mở' : isSubmissionEnded ? 'Đã hết hạn nộp bài' : submission ? 'Cập nhật bài nộp' : 'Gửi bài nộp'}
                        </button>
                    </form>
                )}
            </section>
        </div>
    );
}
