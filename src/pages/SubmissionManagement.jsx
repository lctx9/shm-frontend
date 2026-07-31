import { useEffect, useMemo, useState } from 'react';
import axiosClient from '../api/axiosClient';
import Toast from '../components/Toast';

export default function SubmissionManagement() {
    const [submissions, setSubmissions] = useState([]);
    const [trackFilter, setTrackFilter] = useState('ALL');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchSubmissions = async () => {
        try {
            setLoading(true);
            const response = await axiosClient.get('/submissions');
            setSubmissions(response.result || []);
            setError('');
        } catch (err) {
            setError(err.message || "Unable to load submission list.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubmissions();
    }, []);

    const tracks = useMemo(() => [...new Set(submissions.map((item) => item.trackName).filter(Boolean))], [submissions]);
    const filteredSubmissions = submissions.filter((item) => {
        const trackMatched = trackFilter === 'ALL' || item.trackName === trackFilter;
        const statusMatched = statusFilter === 'ALL'
            || (statusFilter === 'GRADED' && item.graded)
            || (statusFilter === 'PENDING' && !item.graded);
        return trackMatched && statusMatched;
    });

    return (
        <div className="mx-auto max-w-7xl space-y-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0f63c9]">Submission monitor</p>
                    <h2 className="text-2xl font-black uppercase tracking-wide text-slate-900">Team submissions</h2>
                    <p className="mt-2 text-sm text-slate-600">Track submitted work, grading status and document links for each team.</p>
                </div>
                <button type="button" onClick={fetchSubmissions} title="Refresh submission" className="btn-secondary h-9 w-9 p-0 inline-flex items-center justify-center text-sm font-bold">↻</button>
            </div>

            <section className="grid gap-4 rounded-lg border border-blue-100 bg-white p-4 md:grid-cols-2">
                <div>
                    <label className="mb-1 block text-sm font-bold text-slate-700">Track</label>
                    <select className="input-custom" value={trackFilter} onChange={(e) => setTrackFilter(e.target.value)}>
                        <option value="ALL">All tracks</option>
                        {tracks.map((track) => <option key={track} value={track}>{track}</option>)}
                    </select>
                </div>
                <div>
                    <label className="mb-1 block text-sm font-bold text-slate-700">Status</label>
                    <select className="input-custom" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                        <option value="ALL">All</option>
                        <option value="PENDING">Pending grading</option>
                        <option value="GRADED">Graded</option>
                    </select>
                </div>
            </section>

            <Toast error={error} onClose={() => setError('')} />

            <section className="overflow-hidden rounded-lg border border-blue-100 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="border-b border-blue-100 bg-blue-50 text-xs font-black uppercase tracking-wide text-slate-500">
                        <tr>
                            <th className="px-6 py-4">Team</th>
                            <th className="px-6 py-4">Track / Round</th>
                            <th className="px-6 py-4">Submission</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Score</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-blue-50">
                        {loading ? (
                            <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-500">Loading...</td></tr>
                        ) : filteredSubmissions.length === 0 ? (
                            <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-500">There are no matching submissions.</td></tr>
                        ) : filteredSubmissions.map((submission) => (
                            <tr key={submission.id} className="hover:bg-blue-50/40">
                                <td className="px-6 py-4 font-bold text-slate-900">{submission.teamName || `Team #${submission.teamId}`}</td>
                                <td className="px-6 py-4 text-sm text-slate-600">
                                    <p className="font-bold text-slate-800">{submission.trackName || 'Track'}</p>
                                    <p>{submission.roundName || "Round"}</p>
                                </td>
                                <td className="max-w-md px-6 py-4">
                                    {submission.fileUrl ? (
                                        <a href={submission.fileUrl} target="_blank" rel="noreferrer" className="break-all text-sm font-bold text-[#0f63c9]">
                                            {submission.fileUrl}
                                        </a>
                                    ) : <span className="text-sm text-slate-500">No link yet</span>}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`rounded-full px-3 py-1 text-xs font-black ${submission.graded ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {submission.graded ? "Graded" : "Pending grading"}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right text-xl font-black text-[#0f63c9]">{submission.score ?? '-'}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}
