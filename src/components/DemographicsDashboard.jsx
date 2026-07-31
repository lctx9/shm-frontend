import { useEffect, useState, useMemo } from 'react';
import axiosClient from '../api/axiosClient';

export default function DemographicsDashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Filters state
    const [searchQuery, setSearchQuery] = useState('');
    const [minCountFilter, setMinCountFilter] = useState(0);
    const [fptFilter, setFptFilter] = useState('ALL'); // 'ALL', 'FPT', 'NON-FPT'

    const fetchDemographics = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await axiosClient.get('/stats/demographics');
            setStats(response.result || null);
        } catch (err) {
            setError(err.message || 'Failed to load demographics analytics.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDemographics();
    }, []);

    // 1. Process University Stats with Filters
    const filteredUniversities = useMemo(() => {
        if (!stats?.universities) return [];
        return stats.universities.filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCount = item.count >= minCountFilter;
            
            let matchesFpt = true;
            if (fptFilter === 'FPT') {
                matchesFpt = item.name.toLowerCase().includes('fpt');
            } else if (fptFilter === 'NON-FPT') {
                matchesFpt = !item.name.toLowerCase().includes('fpt');
            }

            return matchesSearch && matchesCount && matchesFpt;
        });
    }, [stats, searchQuery, minCountFilter, fptFilter]);

    // Calculate totals for ratio calculations
    const totalStudents = useMemo(() => {
        if (!stats?.universities) return 0;
        return stats.universities.reduce((sum, item) => sum + Number(item.count || 0), 0);
    }, [stats]);

    const totalFptStudents = useMemo(() => {
        if (!stats?.fptStats) return 0;
        const fptRow = stats.fptStats.find(item => item.isfpt === true || item.isfpt === 'true' || item.isFpt === true);
        return fptRow ? Number(fptRow.count || 0) : 0;
    }, [stats]);

    const fptPercentage = totalStudents > 0 ? Math.round((totalFptStudents / totalStudents) * 100) : 0;

    if (loading) {
        return (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500 shadow-xs">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mb-2"></div>
                <p className="text-xs font-bold">Loading Demographics Analytics...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-900 shadow-xs">
                <p className="text-sm font-bold">{error}</p>
                <button onClick={fetchDemographics} className="mt-3 btn-secondary text-xs px-3 py-1 bg-white border-red-300 text-red-700 hover:bg-red-50">Retry</button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header & Controls Panel */}
            <section className="bg-white border border-blue-100 rounded-xl p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h3 className="text-lg font-black text-slate-900">Advanced Participant Demographics</h3>
                        <p className="text-xs text-slate-500 mt-1">Cross-sectional demographics reporting on participating universities, seasons, and student registrations.</p>
                    </div>
                    <button 
                        type="button" 
                        onClick={fetchDemographics}
                        className="btn-secondary self-start sm:self-auto text-xs px-3 py-1.5 font-bold flex items-center gap-1.5"
                    >
                        <span>↻</span> Refresh Stats
                    </button>
                </div>

                <div className="grid gap-3 grid-cols-1 md:grid-cols-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400">Search University</label>
                        <input 
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="e.g. FPT, Hanoi University..."
                            className="w-full input-custom text-xs"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400">Min Student Count</label>
                        <select 
                            value={minCountFilter} 
                            onChange={(e) => setMinCountFilter(Number(e.target.value))}
                            className="w-full input-custom text-xs"
                        >
                            <option value="0">Show All (0+)</option>
                            <option value="1">At least 1 student</option>
                            <option value="3">At least 3 students</option>
                            <option value="5">At least 5 students</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400">Affiliation Filter</label>
                        <select 
                            value={fptFilter} 
                            onChange={(e) => setFptFilter(e.target.value)}
                            className="w-full input-custom text-xs"
                        >
                            <option value="ALL">All Schools</option>
                            <option value="FPT">FPT Affiliated Only</option>
                            <option value="NON-FPT">Non-FPT Only</option>
                        </select>
                    </div>
                </div>
            </section>

            {/* Top Highlights Grid */}
            <div className="grid gap-4 md:grid-cols-3">
                {/* Highlight Card 1: Top University */}
                <article className="bg-white border border-blue-100 p-5 rounded-xl shadow-sm flex flex-col justify-between">
                    <div>
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Dominant University</span>
                        <h4 className="text-xl font-black text-[#0f63c9] mt-2 truncate">
                            {stats?.universities?.[0]?.name || 'N/A'}
                        </h4>
                    </div>
                    <p className="text-xs font-semibold text-slate-500 mt-2">
                        Leading registrations with <strong className="text-slate-900">{stats?.universities?.[0]?.count || 0}</strong> students.
                    </p>
                </article>

                {/* Highlight Card 2: FPT Enrollment Ratio */}
                <article className="bg-white border border-blue-100 p-5 rounded-xl shadow-sm flex flex-col justify-between">
                    <div>
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">FPT Student Ratio</span>
                        <div className="flex items-baseline gap-2 mt-2">
                            <h4 className="text-2xl font-black text-slate-900">{fptPercentage}%</h4>
                            <span className="text-xs text-slate-500 font-bold">({totalFptStudents} / {totalStudents})</span>
                        </div>
                    </div>
                    {/* Visual Progress Line */}
                    <div className="mt-3">
                        <div className="h-2 w-100% bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-600 rounded-full" style={{ width: `${fptPercentage}%` }}></div>
                        </div>
                    </div>
                </article>

                {/* Highlight Card 3: Top Season */}
                <article className="bg-white border border-blue-100 p-5 rounded-xl shadow-sm flex flex-col justify-between">
                    <div>
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Most Active Event Season</span>
                        <h4 className="text-lg font-black text-emerald-700 mt-2 truncate">
                            {stats?.events?.[0]?.name || 'N/A'}
                        </h4>
                    </div>
                    <p className="text-xs font-semibold text-slate-500 mt-2">
                        Engaging <strong className="text-slate-900">{stats?.events?.[0]?.count || 0}</strong> active participant team members.
                    </p>
                </article>
            </div>

            {/* Detail Analysis Grid */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Left: Top Universities chart */}
                <section className="bg-white border border-blue-100 rounded-xl p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <h3 className="font-black text-slate-900 text-sm">University Student Distribution</h3>
                        <span className="text-xs font-bold text-slate-500">
                            Showing {filteredUniversities.length} of {stats?.universities?.length || 0}
                        </span>
                    </div>

                    <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1 no-scrollbar">
                        {filteredUniversities.length > 0 ? (
                            filteredUniversities.map((item, index) => {
                                const ratio = totalStudents > 0 ? Math.round((Number(item.count || 0) / totalStudents) * 100) : 0;
                                return (
                                    <div key={item.name} className="space-y-1">
                                        <div className="flex justify-between text-xs font-bold text-slate-800">
                                            <span className="truncate">{index + 1}. {item.name}</span>
                                            <span>{item.count} students ({ratio}%)</span>
                                        </div>
                                        <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full rounded-full transition-all duration-500 ${
                                                    item.name.toLowerCase().includes('fpt') ? 'bg-[#0f63c9]' : 'bg-slate-400'
                                                }`} 
                                                style={{ width: `${ratio}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <p className="text-xs text-slate-400 italic text-center py-8">No universities match the selected filters.</p>
                        )}
                    </div>
                </section>

                {/* Right: Seasons and Status Distribution */}
                <div className="space-y-6">
                    {/* Season / Event Participation */}
                    <section className="bg-white border border-blue-100 rounded-xl p-6 shadow-sm space-y-4">
                        <h3 className="font-black text-slate-900 text-sm border-b border-slate-100 pb-3">
                            Event/Season Participant Enrollment
                        </h3>
                        <div className="space-y-3">
                            {stats?.events && stats.events.length > 0 ? (
                                stats.events.map((event) => {
                                    // Find teams for this event
                                    const teamRow = stats.eventTeams?.find(t => t.name === event.name);
                                    const teamCount = teamRow ? teamRow.count : 0;
                                    return (
                                        <div key={event.name} className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex justify-between items-center">
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-slate-900 truncate">{event.name}</p>
                                                <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                                                    Teams Formed: <span className="text-[#0f63c9] font-black">{teamCount}</span>
                                                </p>
                                            </div>
                                            <div className="bg-blue-50 border border-blue-100 rounded px-2.5 py-1 text-right shrink-0">
                                                <span className="text-sm font-black text-[#0f63c9]">{event.count}</span>
                                                <span className="text-[9px] text-slate-500 font-bold block">Students</span>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <p className="text-xs text-slate-400 italic text-center py-4">No events data available.</p>
                            )}
                        </div>
                    </section>

                    {/* Roster Verification Status Ratios */}
                    <section className="bg-white border border-blue-100 rounded-xl p-6 shadow-sm">
                        <h3 className="font-black text-slate-900 text-sm border-b border-slate-100 pb-3">
                            Account Verification Status Ratio
                        </h3>
                        <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                            {['APPROVED', 'PENDING', 'REJECTED'].map((status) => {
                                const row = stats?.statusStats?.find(item => item.status === status);
                                const count = row ? Number(row.count) : 0;
                                const colorClass = 
                                    status === 'APPROVED' ? 'text-emerald-700 bg-emerald-50 border-emerald-100' :
                                    status === 'PENDING' ? 'text-amber-700 bg-amber-50 border-amber-100' :
                                    'text-red-700 bg-red-50 border-red-100';
                                return (
                                    <div key={status} className={`border rounded-lg p-3 ${colorClass}`}>
                                        <span className="text-[9px] font-black tracking-wider uppercase block">{status}</span>
                                        <strong className="text-lg font-black block mt-1">{count}</strong>
                                        <span className="text-[9px] font-bold opacity-75">accounts</span>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
