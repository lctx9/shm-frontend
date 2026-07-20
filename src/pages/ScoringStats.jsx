import { useEffect, useMemo, useState } from 'react';
import axiosClient from '../api/axiosClient';

function average(values) {
    const valid = values.filter((value) => typeof value === 'number' && !Number.isNaN(value));
    if (!valid.length) return 0;
    return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}

function groupBy(items, getKey) {
    return items.reduce((map, item) => {
        const key = getKey(item) || 'Chưa phân loại';
        map.set(key, [...(map.get(key) || []), item]);
        return map;
    }, new Map());
}

export default function ScoringStats() {
    const [submissions, setSubmissions] = useState([]);
    const [logs, setLogs] = useState([]);
    const [interRater, setInterRater] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchData = async () => {
        try {
            setLoading(true);
            const [submissionRes, logRes, interRaterRes] = await Promise.allSettled([
                axiosClient.get('/submissions'),
                axiosClient.get('/audit-logs'),
                axiosClient.get('/stats/inter-rater'),
            ]);

            if (submissionRes.status === 'fulfilled') setSubmissions(submissionRes.value.result || []);
            if (logRes.status === 'fulfilled') setLogs(logRes.value.result || []);
            if (interRaterRes.status === 'fulfilled') setInterRater(interRaterRes.value.result || null);
            if (submissionRes.status === 'rejected') throw submissionRes.reason;
            setError('');
        } catch (err) {
            setError(err.message || 'Không thể tải thống kê chấm điểm.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const stats = useMemo(() => {
        const graded = submissions.filter((item) => item.graded);
        const pending = submissions.filter((item) => !item.graded);
        const byTrack = [...groupBy(graded, (item) => item.trackName).entries()].map(([name, rows]) => ({
            name,
            count: rows.length,
            averageScore: average(rows.map((row) => row.score)),
        }));
        const byRound = [...groupBy(graded, (item) => item.roundName).entries()].map(([name, rows]) => ({
            name,
            count: rows.length,
            averageScore: average(rows.map((row) => row.score)),
        }));
        const judgeEdits = [...groupBy(logs, (log) => log.judgeEmail || log.judgeName).entries()].map(([name, rows]) => ({
            name,
            count: rows.length,
            averageDelta: average(rows.map((row) => Math.abs((row.newScore || 0) - (row.oldScore || 0)))),
        }));

        return {
            total: submissions.length,
            graded: graded.length,
            pending: pending.length,
            averageScore: average(graded.map((item) => item.score)),
            byTrack,
            byRound,
            judgeEdits,
        };
    }, [submissions, logs]);

    // Hàm đánh giá mức độ đồng thuận dựa trên độ lệch chuẩn (ASD)
    const getAgreementLabel = (asd) => {
        if (asd === 0) return { text: 'Không có dữ liệu chéo', color: 'text-slate-500' };
        if (asd <= 3.0) return { text: 'Đồng thuận cực cao (Sát điểm)', color: 'text-green-600 font-bold' };
        if (asd <= 6.0) return { text: 'Đồng thuận cao (Nhất quán)', color: 'text-emerald-600' };
        if (asd <= 10.0) return { text: 'Đồng thuận trung bình (Độ lệch vừa)', color: 'text-amber-600' };
        return { text: 'Đồng thuận thấp (Cần đối thoại chéo)', color: 'text-rose-600 font-bold' };
    };

    // Hàm đánh giá xu hướng chấm điểm (Bias)
    const getBiasEvaluation = (bias) => {
        if (bias > 5.0) return { text: 'Chấm quá rộng tay', color: 'bg-orange-50 text-orange-700 border-orange-100' };
        if (bias > 1.5) return { text: 'Chấm hơi lỏng tay', color: 'bg-amber-50 text-amber-700 border-amber-100' };
        if (bias < -5.0) return { text: 'Chấm quá chặt tay', color: 'bg-red-50 text-red-700 border-red-100' };
        if (bias < -1.5) return { text: 'Chấm hơi chặt tay', color: 'bg-rose-50 text-rose-700 border-rose-100' };
        return { text: 'Khách quan (Rất sát trung bình)', color: 'bg-green-50 text-green-700 border-green-100' };
    };

    return (
        <div className="mx-auto max-w-7xl space-y-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0f63c9]">Inter-rater overview</p>
                    <h2 className="text-2xl font-black uppercase tracking-wide text-slate-900">Thống kê chấm điểm & Đồng thuận</h2>
                    <p className="mt-2 text-sm text-slate-600">
                        Theo dõi tiến độ chấm, điểm trung bình, và độ đồng thuận khoa học (Inter-rater Reliability) giữa các Giám khảo.
                    </p>
                </div>
                <button type="button" onClick={fetchData} className="btn-secondary">Làm mới</button>
            </div>

            {error && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}

            {/* Grid 1: Thống kê Tiến độ cơ bản */}
            <section className="grid gap-4 md:grid-cols-4">
                {[
                    ['Tổng bài nộp', stats.total],
                    ['Đã chấm', stats.graded],
                    ['Chờ chấm', stats.pending],
                    ['Điểm trung bình', stats.averageScore.toFixed(1)],
                ].map(([label, value]) => (
                    <article key={label} className="rounded-lg border border-blue-100 bg-white p-5 shadow-sm">
                        <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">{label}</p>
                        <p className="mt-3 text-3xl font-black text-[#0f63c9]">{loading ? '...' : value}</p>
                    </article>
                ))}
            </section>

            {/* Grid 2: Thống kê Độ Đồng thuận Giám khảo (Inter-rater Reliability) */}
            <section className="grid gap-4 md:grid-cols-3">
                <article className="rounded-lg border border-blue-100 bg-white p-5 shadow-sm">
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Độ lệch chuẩn TB (ASD)</p>
                    <p className="mt-3 text-3xl font-black text-[#0f63c9]">
                        {loading ? '...' : (interRater ? interRater.averageStandardDeviation.toFixed(2) : '0.00')}
                    </p>
                    <p className={`mt-2 text-xs font-semibold ${interRater ? getAgreementLabel(interRater.averageStandardDeviation).color : 'text-slate-400'}`}>
                        {interRater ? getAgreementLabel(interRater.averageStandardDeviation).text : 'Chưa có dữ liệu'}
                    </p>
                </article>

                <article className="rounded-lg border border-blue-100 bg-white p-5 shadow-sm">
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Tỷ lệ đồng thuận cao (≤5.0)</p>
                    <p className="mt-3 text-3xl font-black text-[#0f63c9]">
                        {loading ? '...' : (interRater ? `${interRater.exactAgreementRate.toFixed(1)}%` : '0.0%')}
                    </p>
                    <p className="mt-2 text-xs text-slate-500 font-medium">
                        Tỷ lệ bài thi chéo có độ lệch điểm giữa các giám khảo rất thấp.
                    </p>
                </article>

                <article className="rounded-lg border border-blue-100 bg-white p-5 shadow-sm">
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Số bài thi chấm chéo (≥2 Giám khảo)</p>
                    <p className="mt-3 text-3xl font-black text-[#0f63c9]">
                        {loading ? '...' : (interRater ? interRater.multiGradedSubmissionsCount : '0')}
                    </p>
                    <p className="mt-2 text-xs text-slate-500 font-medium">
                        Tổng số bài thi có từ 2 giám khảo chấm điểm trở lên.
                    </p>
                </article>
            </section>

            {/* Chỉ số Bias của từng giám khảo */}
            <section className="rounded-lg border border-blue-100 bg-white shadow-sm">
                <div className="border-b border-blue-100 bg-blue-50 px-6 py-4">
                    <h3 className="font-black uppercase tracking-wide text-slate-900">Mức độ Thiên vị (Bias) của từng Giám khảo</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                        <thead>
                            <tr className="border-b border-blue-50 bg-slate-50 text-xs font-black uppercase tracking-wider text-slate-500">
                                <th className="px-6 py-3">Giám khảo</th>
                                <th className="px-6 py-3">Email</th>
                                <th className="px-6 py-3 text-center">Số bài đã chấm</th>
                                <th className="px-6 py-3 text-center">Độ lệch điểm TB (Bias)</th>
                                <th className="px-6 py-3">Xu hướng chấm</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-blue-50">
                            {interRater && interRater.judgeBiases && interRater.judgeBiases.length ? (
                                interRater.judgeBiases.map((item) => {
                                    const evalData = getBiasEvaluation(item.averageBias);
                                    return (
                                        <tr key={item.judgeEmail} className="hover:bg-slate-50">
                                            <td className="px-6 py-4 font-bold text-slate-900">{item.judgeName}</td>
                                            <td className="px-6 py-4 text-slate-500">{item.judgeEmail}</td>
                                            <td className="px-6 py-4 text-center font-semibold text-slate-700">{item.submissionsGraded}</td>
                                            <td className={`px-6 py-4 text-center font-black ${item.averageBias > 0 ? 'text-green-600' : item.averageBias < 0 ? 'text-rose-600' : 'text-slate-600'}`}>
                                                {item.averageBias > 0 ? `+${item.averageBias.toFixed(2)}` : item.averageBias.toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold ${evalData.color}`}>
                                                    {evalData.text}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="5" className="p-6 text-center text-slate-500">Chưa có đủ dữ liệu chấm chéo của các giám khảo.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            <div className="grid gap-6 lg:grid-cols-2">
                <section className="rounded-lg border border-blue-100 bg-white shadow-sm">
                    <div className="border-b border-blue-100 bg-blue-50 px-6 py-4">
                        <h3 className="font-black uppercase tracking-wide text-slate-900">Điểm theo Track</h3>
                    </div>
                    <div className="divide-y divide-blue-50">
                        {stats.byTrack.length ? stats.byTrack.map((item) => (
                            <div key={item.name} className="grid grid-cols-[1fr_90px_120px] gap-3 px-6 py-4 text-sm">
                                <span className="font-bold text-slate-900">{item.name}</span>
                                <span>{item.count} bài</span>
                                <span className="text-right font-black text-[#0f63c9]">{item.averageScore.toFixed(1)}</span>
                            </div>
                        )) : <div className="p-6 text-sm text-slate-500">Chưa có bài đã chấm.</div>}
                    </div>
                </section>

                <section className="rounded-lg border border-blue-100 bg-white shadow-sm">
                    <div className="border-b border-blue-100 bg-blue-50 px-6 py-4">
                        <h3 className="font-black uppercase tracking-wide text-slate-900">Điểm theo Vòng</h3>
                    </div>
                    <div className="divide-y divide-blue-50">
                        {stats.byRound.length ? stats.byRound.map((item) => (
                            <div key={item.name} className="grid grid-cols-[1fr_90px_120px] gap-3 px-6 py-4 text-sm">
                                <span className="font-bold text-slate-900">{item.name}</span>
                                <span>{item.count} bài</span>
                                <span className="text-right font-black text-[#0f63c9]">{item.averageScore.toFixed(1)}</span>
                            </div>
                        )) : <div className="p-6 text-sm text-slate-500">Chưa có bài đã chấm.</div>}
                    </div>
                </section>
            </div>

            <section className="rounded-lg border border-blue-100 bg-white shadow-sm">
                <div className="border-b border-blue-100 bg-blue-50 px-6 py-4">
                    <h3 className="font-black uppercase tracking-wide text-slate-900">Lịch sử chỉnh sửa điểm theo Judge</h3>
                </div>
                <div className="divide-y divide-blue-50">
                    {stats.judgeEdits.length ? stats.judgeEdits.map((item) => (
                        <div key={item.name} className="grid gap-3 px-6 py-4 text-sm md:grid-cols-[1fr_180px_180px]">
                            <span className="font-bold text-slate-900">{item.name}</span>
                            <span>{item.count} lần sửa</span>
                            <span>Độ lệch TB: {item.averageDelta.toFixed(1)}</span>
                        </div>
                    )) : <div className="p-6 text-sm text-slate-500">Chưa có lịch sử sửa điểm.</div>}
                </div>
            </section>
        </div>
    );
}
