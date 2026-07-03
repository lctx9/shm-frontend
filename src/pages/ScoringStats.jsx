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
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchData = async () => {
        try {
            setLoading(true);
            const [submissionRes, logRes] = await Promise.allSettled([
                axiosClient.get('/submissions'),
                axiosClient.get('/audit-logs'),
            ]);

            if (submissionRes.status === 'fulfilled') setSubmissions(submissionRes.value.result || []);
            if (logRes.status === 'fulfilled') setLogs(logRes.value.result || []);
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

    return (
        <div className="mx-auto max-w-7xl space-y-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0f63c9]">Inter-rater overview</p>
                    <h2 className="text-2xl font-black uppercase tracking-wide text-slate-900">Thống kê chấm điểm</h2>
                    <p className="mt-2 text-sm text-slate-600">
                        Theo dõi tiến độ chấm, điểm trung bình theo track/vòng và lịch sử sửa điểm của giám khảo.
                    </p>
                </div>
                <button type="button" onClick={fetchData} className="btn-secondary">Làm mới</button>
            </div>

            {error && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}

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
