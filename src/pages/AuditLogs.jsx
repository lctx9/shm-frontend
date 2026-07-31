import { useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient';
import Toast from '../components/Toast';

function actionLabel(log) {
    if (log.oldScore != null || log.newScore != null) {
        return log.oldScore == null ? "Initial score" : "Score updated";
    }
    if (log.reason?.startsWith("TEAM TYPE:")) return "Team type";
    if (log.reason?.startsWith("RESULTS ANNOUNCEMENT")) return "Round results published";
    return "Action";
}

export default function AuditLogs() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const response = await axiosClient.get('/audit-logs');
            setLogs(response.result || []);
            setError('');
        } catch (err) {
            setError(err.message || "Unable to load audit log.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    return (
        <div className="mx-auto max-w-6xl rounded-lg border border-blue-100 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-blue-100 bg-blue-50 px-6 py-4">
                <div>
                    <h2 className="text-xl font-black uppercase tracking-wide text-slate-900">Scoring and disciplinary audit log</h2>
                    <p className="mt-1 text-sm text-slate-600">Track initial scores, score revisions, result publication, and team disqualifications.</p>
                </div>
                <button type="button" onClick={fetchLogs} title="Refresh log" className="btn-secondary h-9 w-9 p-0 inline-flex items-center justify-center text-sm font-bold">↻</button>
            </div>

            <Toast error={error} onClose={() => setError('')} />

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="border-b border-blue-100 bg-white text-xs font-black uppercase tracking-wide text-slate-500">
                    <tr>
                        <th className="px-6 py-4">Time</th>
                        <th className="px-6 py-4">Judge</th>
                        <th className="px-6 py-4">Team</th>
                        <th className="px-6 py-4">Action</th>
                        <th className="px-6 py-4">Old score</th>
                        <th className="px-6 py-4">New score</th>
                        <th className="px-6 py-4">Reason</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-blue-50">
                    {loading ? (
                        <tr><td colSpan="7" className="px-6 py-8 text-center text-slate-500">Loading...</td></tr>
                    ) : logs.length === 0 ? (
                        <tr><td colSpan="7" className="px-6 py-8 text-center text-slate-500">No actions have been recorded yet.</td></tr>
                    ) : logs.map((log) => (
                        <tr key={log.id} className="hover:bg-blue-50/40">
                            <td className="px-6 py-4 text-sm text-slate-600">{log.createdAt ? new Date(log.createdAt).toLocaleString('en-GB') : ''}</td>
                            <td className="px-6 py-4">
                                <p className="font-bold text-slate-900">{log.judgeName}</p>
                                <p className="text-xs text-slate-500">{log.judgeEmail}</p>
                            </td>
                            <td className="px-6 py-4 font-bold text-slate-800">{log.teamName || "Team unknown"}</td>
                            <td className="px-6 py-4">
                                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-700">
                                    {actionLabel(log)}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-amber-700 font-medium">{log.oldScore != null ? log.oldScore : 'N/A'}</td>
                            <td className="px-6 py-4 text-green-700 font-medium">{log.newScore != null ? log.newScore : 'N/A'}</td>
                            <td className="px-6 py-4 text-sm text-slate-600">{log.reason}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
