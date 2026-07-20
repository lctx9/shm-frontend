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
    const [cohenKappa, setCohenKappa] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchData = async () => {
        try {
            setLoading(true);
            const [submissionRes, logRes, interRaterRes, cohenKappaRes] = await Promise.allSettled([
                axiosClient.get('/submissions'),
                axiosClient.get('/audit-logs'),
                axiosClient.get('/stats/inter-rater'),
                axiosClient.get('/stats/cohen-kappa'),
            ]);

            if (submissionRes.status === 'fulfilled') setSubmissions(submissionRes.value.result || []);
            if (logRes.status === 'fulfilled') setLogs(logRes.value.result || []);
            if (interRaterRes.status === 'fulfilled') setInterRater(interRaterRes.value.result || null);
            if (cohenKappaRes.status === 'fulfilled') setCohenKappa(cohenKappaRes.value.result || null);
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

    // Hàm phân loại mức độ Cohen's Kappa (kappa)
    const getKappaBadge = (kappa) => {
        if (kappa >= 0.61) return { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', text: 'Đồng thuận cao / Rất tốt' };
        if (kappa >= 0.41) return { bg: 'bg-blue-50 text-blue-700 border-blue-200', text: 'Đồng thuận vừa phải' };
        if (kappa >= 0.21) return { bg: 'bg-amber-50 text-amber-700 border-amber-200', text: 'Đồng thuận trung bình nhẹ' };
        return { bg: 'bg-rose-50 text-rose-700 border-rose-200', text: 'Đồng thuận thấp / Cần đối thoại' };
    };

    return (
        <div className="mx-auto max-w-7xl space-y-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0f63c9]">Inter-rater overview</p>
                    <h2 className="text-2xl font-black uppercase tracking-wide text-slate-900">Thống kê chấm điểm & Đồng thuận</h2>
                    <p className="mt-2 text-sm text-slate-600">
                        Theo dõi tiến độ chấm, điểm trung bình, độ đồng thuận khoa học (Inter-rater Reliability) và chỉ số Cohen's Kappa ($\kappa$).
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
                    ['Điểm trung bình', (stats.averageScore ?? 0).toFixed(1)],
                ].map(([label, value]) => (
                    <article key={label} className="rounded-lg border border-blue-100 bg-white p-5 shadow-sm">
                        <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">{label}</p>
                        <p className="mt-3 text-3xl font-black text-[#0f63c9]">{loading ? '...' : value}</p>
                    </article>
                ))}
            </section>

            {/* Section: Phân Tích Chỉ Số Cohen's Kappa (kappa = (Po - Pe) / (1 - Pe)) */}
            <section className="rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50/40 via-white to-blue-50/30 p-6 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-100 pb-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-lg">📊</span>
                            <h3 className="text-base font-black uppercase tracking-wide text-indigo-950">Chỉ Số Cohen's Kappa ($\kappa$)</h3>
                        </div>
                        <p className="mt-1 text-xs text-slate-500 font-medium">
                            Đo lường độ đồng thuận thực tế ($P_o$) loại trừ sự đồng thuận kỳ vọng ngẫu nhiên ($P_e$) giữa các giám khảo: $\kappa = \frac{P_o - P_e}{1 - P_e}$.
                        </p>
                    </div>
                    {cohenKappa && (
                        <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-black self-start sm:self-auto ${getKappaBadge(cohenKappa.overallKappa ?? 0).bg}`}>
                            {cohenKappa.agreementLevel || 'Chưa đủ dữ liệu'}
                        </span>
                    )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                    <article className="rounded-lg border border-indigo-100 bg-white p-4 shadow-sm">
                        <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Hệ số Cohen's Kappa ($\kappa$)</p>
                        <p className="mt-2 text-3xl font-black text-indigo-700">
                            {loading ? '...' : (cohenKappa ? (cohenKappa.overallKappa ?? 0).toFixed(2) : '0.00')}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-500 font-medium">Toàn hệ thống (4 Tiers)</p>
                    </article>

                    <article className="rounded-lg border border-indigo-100 bg-white p-4 shadow-sm">
                        <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Đồng thuận thực tế ($P_o$)</p>
                        <p className="mt-2 text-3xl font-black text-emerald-600">
                            {loading ? '...' : (cohenKappa ? `${(cohenKappa.observedAgreement ?? 0).toFixed(1)}%` : '0.0%')}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-500 font-medium">Tỷ lệ đồng hạng giữa các GK</p>
                    </article>

                    <article className="rounded-lg border border-indigo-100 bg-white p-4 shadow-sm">
                        <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Kỳ vọng ngẫu nhiên ($P_e$)</p>
                        <p className="mt-2 text-3xl font-black text-amber-600">
                            {loading ? '...' : (cohenKappa ? `${(cohenKappa.expectedAgreement ?? 0).toFixed(1)}%` : '0.0%')}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-500 font-medium">Tỷ lệ trùng hợp ngẫu nhiên</p>
                    </article>

                    <article className="rounded-lg border border-indigo-100 bg-white p-4 shadow-sm">
                        <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Số lượt chấm chéo cặp</p>
                        <p className="mt-2 text-3xl font-black text-blue-600">
                            {loading ? '...' : (cohenKappa ? (cohenKappa.evaluatedPairsCount ?? 0) : '0')}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-500 font-medium">Tổng cặp bài được co-graded</p>
                    </article>
                </div>

                {/* Bảng Ma trận Đồng thuận cặp Giám khảo */}
                <div className="rounded-lg border border-indigo-100 bg-white overflow-hidden shadow-sm">
                    <div className="border-b border-indigo-100 bg-indigo-50/50 px-5 py-3 flex items-center justify-between">
                        <h4 className="text-xs font-black uppercase tracking-wider text-indigo-900">Ma trận Đồng thuận Cặp Giám Khảo (Judge-Pair Agreement Matrix)</h4>
                        <span className="text-[10px] font-extrabold text-indigo-600 uppercase">Chi tiết $\kappa$ từng cặp</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="border-b border-indigo-50 bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-400">
                                    <th className="px-5 py-3">Cặp Giám Khảo Chấm Chung</th>
                                    <th className="px-5 py-3 text-center">Số bài chấm chung</th>
                                    <th className="px-5 py-3 text-center">Thực tế $P_o$</th>
                                    <th className="px-5 py-3 text-center">May rủi $P_e$</th>
                                    <th className="px-5 py-3 text-center">Hệ số $\kappa$</th>
                                    <th className="px-5 py-3">Đánh giá độ nhất quán</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                                {cohenKappa && cohenKappa.judgePairKappas && cohenKappa.judgePairKappas.length > 0 ? (
                                    cohenKappa.judgePairKappas.map((pair, idx) => {
                                        const badge = getKappaBadge(pair.pairKappa ?? 0);
                                        return (
                                            <tr key={(pair.judge1Email || 'j1') + '_' + (pair.judge2Email || 'j2') + '_' + idx} className="hover:bg-slate-50/60">
                                                <td className="px-5 py-3.5">
                                                    <div className="font-bold text-slate-900">{pair.judge1Name || 'GK 1'} <span className="text-slate-400 font-normal">vs</span> {pair.judge2Name || 'GK 2'}</div>
                                                    <div className="text-[10px] text-slate-400 font-normal mt-0.5">{pair.judge1Email || ''} | {pair.judge2Email || ''}</div>
                                                </td>
                                                <td className="px-5 py-3.5 text-center font-extrabold text-slate-800">{pair.sharedSubmissionsCount ?? 0} bài</td>
                                                <td className="px-5 py-3.5 text-center text-emerald-600 font-black">{(pair.observedAgreement ?? 0).toFixed(1)}%</td>
                                                <td className="px-5 py-3.5 text-center text-amber-600 font-bold">{(pair.expectedAgreement ?? 0).toFixed(1)}%</td>
                                                <td className="px-5 py-3.5 text-center text-sm font-black text-indigo-700">{(pair.pairKappa ?? 0).toFixed(2)}</td>
                                                <td className="px-5 py-3.5">
                                                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-black ${badge.bg}`}>
                                                        {pair.agreementLevel || 'Chưa rõ'}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="p-5 text-center text-slate-400 font-medium">
                                            Chưa có dữ liệu bài nộp được chấm bởi từ 2 giám khảo trở lên để tính Cohen's Kappa.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* Grid 2: Thống kê Độ Đồng thuận Giám khảo (Inter-rater Reliability) */}
            <section className="grid gap-4 md:grid-cols-3">
                <article className="rounded-lg border border-blue-100 bg-white p-5 shadow-sm">
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Độ lệch chuẩn TB (ASD)</p>
                    <p className="mt-3 text-3xl font-black text-[#0f63c9]">
                        {loading ? '...' : (interRater ? (interRater.averageStandardDeviation ?? 0).toFixed(2) : '0.00')}
                    </p>
                    <p className={`mt-2 text-xs font-semibold ${interRater ? getAgreementLabel(interRater.averageStandardDeviation ?? 0).color : 'text-slate-400'}`}>
                        {interRater ? getAgreementLabel(interRater.averageStandardDeviation ?? 0).text : 'Chưa có dữ liệu'}
                    </p>
                </article>

                <article className="rounded-lg border border-blue-100 bg-white p-5 shadow-sm">
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Tỷ lệ đồng thuận cao (≤5.0)</p>
                    <p className="mt-3 text-3xl font-black text-[#0f63c9]">
                        {loading ? '...' : (interRater ? `${(interRater.exactAgreementRate ?? 0).toFixed(1)}%` : '0.0%')}
                    </p>
                    <p className="mt-2 text-xs text-slate-500 font-medium">
                        Tỷ lệ bài thi chéo có độ lệch điểm giữa các giám khảo rất thấp.
                    </p>
                </article>

                <article className="rounded-lg border border-blue-100 bg-white p-5 shadow-sm">
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Số bài thi chấm chéo (≥2 Giám khảo)</p>
                    <p className="mt-3 text-3xl font-black text-[#0f63c9]">
                        {loading ? '...' : (interRater ? (interRater.multiGradedSubmissionsCount ?? 0) : '0')}
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
                                    const biasVal = item.averageBias ?? 0;
                                    const evalData = getBiasEvaluation(biasVal);
                                    return (
                                        <tr key={item.judgeEmail || item.judgeName} className="hover:bg-slate-50">
                                            <td className="px-6 py-4 font-bold text-slate-900">{item.judgeName || 'Giám khảo'}</td>
                                            <td className="px-6 py-4 text-slate-500">{item.judgeEmail || '—'}</td>
                                            <td className="px-6 py-4 text-center font-semibold text-slate-700">{item.submissionsGraded ?? 0}</td>
                                            <td className={`px-6 py-4 text-center font-black ${biasVal > 0 ? 'text-green-600' : biasVal < 0 ? 'text-rose-600' : 'text-slate-600'}`}>
                                                {biasVal > 0 ? `+${biasVal.toFixed(2)}` : biasVal.toFixed(2)}
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
                                <span className="text-right font-black text-[#0f63c9]">{(item.averageScore ?? 0).toFixed(1)}</span>
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
                                <span className="text-right font-black text-[#0f63c9]">{(item.averageScore ?? 0).toFixed(1)}</span>
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
                            <span>Độ lệch TB: {(item.averageDelta ?? 0).toFixed(1)}</span>
                        </div>
                    )) : <div className="p-6 text-sm text-slate-500">Chưa có lịch sử sửa điểm.</div>}
                </div>
            </section>
        </div>
    );
}
