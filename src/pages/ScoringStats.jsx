import { useEffect, useMemo, useState } from 'react';
import axiosClient from '../api/axiosClient';
import Toast from '../components/Toast';

const MOCK_MULTI_JUDGE_TEAMS = [
    {
        teamId: 1,
        teamName: "Team 1: Safe Level (0.81 - 1.00)",
        roundName: "Final Round",
        trackName: 'Chung',
        judgeScores: [
            { judgeName: "Dr. Do Thanh E", judgeEmail: 'dothanhe@seal.dev', score: 96.0, comment: "Excellent complete solution, fully meeting system requirements" },
            { judgeName: "Associate Professor. Tran Thi B", judgeEmail: 'tranthib@seal.dev', score: 94.0, comment: "Highly finished product, smooth optimized interface" },
            { judgeName: "Dr. Nguyen Van A", judgeEmail: 'nguyenvana@seal.dev', score: 95.0, comment: "Very impressed with the presentation and live demo" },
        ],
    },
    {
        teamId: 2,
        teamName: "Team 2: Acceptable Level (0.61 - 0.80)",
        roundName: "Final Round",
        trackName: 'Chung',
        judgeScores: [
            { judgeName: "Dr. Nguyen Van A", judgeEmail: 'nguyenvana@seal.dev', score: 91.0, comment: "Good ideas, feasible technical solutions" },
            { judgeName: "Associate Professor. Tran Thi B", judgeEmail: 'tranthib@seal.dev', score: 80.0, comment: "Needs feature expansion and security upgrades" },
            { judgeName: "MSc. Le Hoang C", judgeEmail: 'lehoangc@seal.dev', score: 85.0, comment: "Present convincingly, respond well to criticism" },
        ],
    },
    {
        teamId: 3,
        teamName: "Team 3: Mild Warning Level (0.41 - 0.60)",
        roundName: "Final Round",
        trackName: 'Chung',
        judgeScores: [
            { judgeName: "Dr. Nguyen Van A", judgeEmail: 'nguyenvana@seal.dev', score: 92.0, comment: "High score rating for software architecture" },
            { judgeName: "MSc. Le Hoang C", judgeEmail: 'lehoangc@seal.dev', score: 76.0, comment: "Need to supplement financial model and operating plan" },
            { judgeName: "KS. Pham Minh D", judgeEmail: 'phamminhd@seal.dev', score: 82.0, comment: "Technically good but UX needs more refinement" },
        ],
    },
    {
        teamId: 4,
        teamName: "Team 4: High Alert Level (0.21 - 0.40)",
        roundName: "Final Round",
        trackName: 'Chung',
        judgeScores: [
            { judgeName: "Dr. Nguyen Van A", judgeEmail: 'nguyenvana@seal.dev', score: 69.0, comment: "Need to complete revenue plan" },
            { judgeName: "MSc. Le Hoang C", judgeEmail: 'lehoangc@seal.dev', score: 70.0, comment: "Reporting meets basic level" },
            { judgeName: "KS. Pham Minh D", judgeEmail: 'phamminhd@seal.dev', score: 84.0, comment: "Smart contract with good programming" },
            { judgeName: "Dr. Do Thanh E", judgeEmail: 'dothanhe@seal.dev', score: 85.0, comment: "Optimal security architecture" },
        ],
    },
    {
        teamId: 5,
        teamName: "Team 5: Danger Level (≤ 0.20)",
        roundName: "Final Round",
        trackName: 'Chung',
        judgeScores: [
            { judgeName: "Dr. Nguyen Van A", judgeEmail: 'nguyenvana@seal.dev', score: 91.0, comment: "Excellent breakthrough idea" },
            { judgeName: "KS. Pham Minh D", judgeEmail: 'phamminhd@seal.dev', score: 68.0, comment: "Technical feasibility has not been proven" },
            { judgeName: "MSc. Le Hoang C", judgeEmail: 'lehoangc@seal.dev', score: 78.0, comment: "Need to research more market data" },
        ],
    },
    {
        teamId: 6,
        teamName: "CyberShield Team (Test 69v vs 70v)",
        roundName: "Idea Circle",
        trackName: 'AI & Machine Learning',
        judgeScores: [
            { judgeName: "Dr. Nguyen Van A", judgeEmail: 'nguyenvana@seal.dev', score: 69.0, comment: "Evaluation score: 69.0 points" },
            { judgeName: "Associate Professor. Tran Thi B", judgeEmail: 'tranthib@seal.dev', score: 70.0, comment: "Evaluation score: 70.0 points" },
        ],
    },
    {
        teamId: 7,
        teamName: "GreenLife team",
        roundName: "Final Round",
        trackName: 'Chung',
        judgeScores: [
            { judgeName: "Dr. Nguyen Van A", judgeEmail: 'nguyenvana@seal.dev', score: 85.0, comment: "Smooth interface" },
            { judgeName: "MSc. Le Hoang C", judgeEmail: 'lehoangc@seal.dev', score: 82.5, comment: "Stable database" },
            { judgeName: "KS. Pham Minh D", judgeEmail: 'phamminhd@seal.dev', score: 86.0, comment: "Confident presentation skills" },
        ],
    },
    {
        teamId: 8,
        teamName: "SmartLogistics team",
        roundName: "Idea Circle",
        trackName: 'Blockchain & FinTech',
        judgeScores: [
            { judgeName: "Dr. Nguyen Van A", judgeEmail: 'nguyenvana@seal.dev', score: 76.0, comment: "Supply chain solutions need to be clarified" },
            { judgeName: "KS. Pham Minh D", judgeEmail: 'phamminhd@seal.dev', score: 71.0, comment: "MVP needs to be completed" },
        ],
    },
];

function average(values) {
    const valid = values.filter((v) => typeof v === 'number' && !Number.isNaN(v));
    if (!valid.length) return 0;
    return valid.reduce((sum, v) => sum + v, 0) / valid.length;
}

export default function ScoringStats() {
    const [teamScoringData, setTeamScoringData] = useState(MOCK_MULTI_JUDGE_TEAMS);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [searchKeyword, setSearchKeyword] = useState('');

    // Filters for Round and Track
    const [selectedRound, setSelectedRound] = useState("Final Round");
    const [selectedTrack, setSelectedTrack] = useState('ALL');

    const fetchData = async () => {
        try {
            setLoading(true);
            const submissionRes = await axiosClient.get('/submissions').catch(() => null);

            if (submissionRes?.result?.length > 0) {
                const groupedMap = new Map();
                submissionRes.result.forEach((sub) => {
                    if (!sub.graded) return;
                    const key = `${sub.teamId}_${sub.roundName}`;
                    const isFinal = (sub.roundName || '').toLowerCase().includes("final") || (sub.roundName || '').toLowerCase().includes('final');
                    if (!groupedMap.has(key)) {
                        groupedMap.set(key, {
                            teamId: sub.teamId,
                            teamName: sub.teamName || `Team #${sub.teamId}`,
                            roundName: sub.roundName || "Competition round",
                            trackName: isFinal ? 'Chung' : (sub.trackName || "General table"),
                            judgeScores: [],
                        });
                    }
                    groupedMap.get(key).judgeScores.push({
                        judgeName: sub.judgeName || sub.evaluatorName || "Judge",
                        judgeEmail: sub.judgeEmail || '',
                        score: sub.score || 0,
                        comment: sub.comment || sub.feedback || '',
                    });
                });

                const parsedTeams = [...groupedMap.values()];
                if (parsedTeams.length > 0) {
                    setTeamScoringData(parsedTeams);
                } else {
                    setTeamScoringData(MOCK_MULTI_JUDGE_TEAMS);
                }
            } else {
                setTeamScoringData(MOCK_MULTI_JUDGE_TEAMS);
            }
            setError('');
        } catch {
            setTeamScoringData(MOCK_MULTI_JUDGE_TEAMS);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const roundOptions = useMemo(() => {
        const unique = [...new Set(teamScoringData.map((t) => t.roundName).filter(Boolean))];
        return unique.length ? unique : ["Final Round", "Idea Circle"];
    }, [teamScoringData]);

    const isFinalRoundSelected = useMemo(() => {
        return (selectedRound || '').toLowerCase().includes("final") || (selectedRound || '').toLowerCase().includes('final');
    }, [selectedRound]);

    const trackOptions = useMemo(() => {
        if (isFinalRoundSelected) return [];
        const uniqueTracks = [...new Set(
            teamScoringData
                .filter((t) => t.roundName === selectedRound && t.trackName && t.trackName !== 'Chung')
                .map((t) => t.trackName)
        )];
        return ['ALL', ...uniqueTracks];
    }, [teamScoringData, selectedRound, isFinalRoundSelected]);

    useEffect(() => {
        if (roundOptions.length && !roundOptions.includes(selectedRound)) {
            setSelectedRound(roundOptions[0]);
        }
    }, [roundOptions, selectedRound]);

    const filteredTeamsInRound = useMemo(() => {
        return teamScoringData.filter((item) => {
            const matchRound = item.roundName === selectedRound;
            if (!matchRound) return false;
            if (!isFinalRoundSelected && selectedTrack !== 'ALL' && item.trackName !== selectedTrack) {
                return false;
            }
            if (searchKeyword.trim()) {
                const kw = searchKeyword.trim().toLowerCase();
                return (item.teamName || '').toLowerCase().includes(kw);
            }
            return true;
        });
    }, [teamScoringData, selectedRound, selectedTrack, isFinalRoundSelected, searchKeyword]);

    // ─── WEIGHTED COHEN'S KAPPA (Quadratic Weights) ─────────────────────────────
    // COMPETITION_SCALE = 30 points (Max difference threshold in competition)
    // Formula: w_ij = 1 - (min(|Si - Sj|, 30) / 30)²
    const COMPETITION_SCALE = 30;

    const quadWeight = (s1, s2) => {
        const diff = Math.min(Math.abs(s1 - s2), COMPETITION_SCALE);
        return 1 - Math.pow(diff / COMPETITION_SCALE, 2);
    };

    // Standard Landis & Koch (1977) Kappa Classification
    const kappaLevelLabel = (kw) => {
        if (kw >= 0.81) {
            return {
                level: "Strong agreement: the judging panel scored consistently",
                short: "Safe (0.81 - 1.00)",
                color: 'emerald',
                bg: 'bg-emerald-500/10 text-emerald-700 border-emerald-300/80',
                badgeBg: 'bg-emerald-600 text-white',
                barColor: 'bg-emerald-500',
            };
        }
        if (kw >= 0.61) {
            return {
                level: "Acceptable: Transparency meets the standards of major competitions",
                short: "Acceptable (0.61 - 0.80)",
                color: 'teal',
                bg: 'bg-teal-500/10 text-teal-700 border-teal-300/80',
                badgeBg: 'bg-teal-600 text-white',
                barColor: 'bg-teal-500',
            };
        }
        if (kw >= 0.41) {
            return {
                level: "Moderate agreement: review the scoring differences between judges",
                short: "Mild warning (0.41 - 0.60)",
                color: 'amber',
                bg: 'bg-amber-500/10 text-amber-800 border-amber-300/80',
                badgeBg: 'bg-amber-500 text-white',
                barColor: 'bg-amber-500',
            };
        }
        if (kw >= 0.21) {
            return {
                level: "Low agreement: review the rubric and score distribution",
                short: "High alert (0.21 - 0.40)",
                color: 'orange',
                bg: 'bg-orange-500/10 text-orange-800 border-orange-300/80',
                badgeBg: 'bg-orange-500 text-white',
                barColor: 'bg-orange-500',
            };
        }
        return {
            level: "Danger: Completely random grading/severe disagreement",
            short: "Dangerous (≤ 0.20)",
            color: 'rose',
            bg: 'bg-rose-500/10 text-rose-800 border-rose-300/80',
            badgeBg: 'bg-rose-600 text-white',
            barColor: 'bg-rose-500',
        };
    };

    const calculateTeamCohenKappa = (judgeScores) => {
        if (!judgeScores || judgeScores.length < 2) {
            return {
                kappa: 0,
                pow: 0,
                pew: 75.0,
                delta: 0,
                level: "Not enough 2 judges",
                short: "Missing data",
                bg: 'bg-slate-100 text-slate-600 border-slate-200',
                badgeBg: 'bg-slate-500 text-white',
                barColor: 'bg-slate-400',
            };
        }
        const vals = judgeScores.map((s) => Number(s.score || 0));
        const delta = Math.max(...vals) - Math.min(...vals);

        let sumPoW = 0;
        let totalPairs = 0;
        for (let i = 0; i < vals.length; i++) {
            for (let j = i + 1; j < vals.length; j++) {
                sumPoW += quadWeight(vals[i], vals[j]);
                totalPairs++;
            }
        }
        const pow = totalPairs > 0 ? sumPoW / totalPairs : 0;
        const pew = 0.75; // Standard theoretical expected chance agreement

        const kw = (1 - pew) > 1e-9 ? (pow - pew) / (1 - pew) : 0;
        const kappaW = Math.max(0, Math.min(1, kw));
        const kappaRounded = Math.round(kappaW * 100) / 100;

        const info = kappaLevelLabel(kappaRounded);
        return {
            kappa: kappaRounded,
            pow: Math.round(pow * 100 * 10) / 10,
            pew: Math.round(pew * 100 * 10) / 10,
            delta,
            ...info,
        };
    };

    const getDivergenceBadge = (scores) => {
        if (!scores || scores.length < 2) {
            return { text: "Not enough 2 judges", color: 'bg-slate-100 text-slate-600 border-slate-200' };
        }
        const vals = scores.map((s) => Number(s.score || 0));
        const delta = Math.max(...vals) - Math.min(...vals);
        if (delta <= 5.0) {
            return { text: `Scores aligned (${delta.toFixed(1)} pts spread)`, color: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
        }
        if (delta <= 12.0) {
            return { text: `Medium deviation (${delta.toFixed(1)}D)`, color: 'bg-amber-50 text-amber-800 border-amber-200' };
        }
        return { text: `Review required (${delta.toFixed(1)} pts spread)`, color: 'bg-rose-50 text-rose-800 border-rose-200' };
    };

    return (
        <div className="mx-auto max-w-7xl space-y-6 pb-16 font-sans">
            {/* Glassmorphic Top Action Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-white/80 p-5 shadow-sm border border-slate-200/80 backdrop-blur-xl">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-500/20">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-lg font-black text-slate-900 tracking-tight">Scoring Statistics & Judge Comparison</h1>
                            <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-indigo-800">
                                Weighted Kappa Engine
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                            Visualize the score difference and measure the Weighted Cohen's Kappa consensus index for each team
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={fetchData}
                        disabled={loading}
                        className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-extrabold text-white transition hover:bg-slate-800 active:scale-95 shadow-md shadow-slate-900/10 disabled:opacity-50"
                    >
                        <svg className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span>{loading ? "Updating..." : "Refresh data"}</span>
                    </button>
                </div>
            </div>

            <Toast error={error} onClose={() => setError('')} />

            {/* Bento Grid Filter Control Panel */}
            <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80 space-y-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-2">
                        <svg className="h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                        </svg>
                        <h2 className="text-xs font-black uppercase tracking-wider text-slate-800">
                            Round and track filters
                        </h2>
                    </div>

                    {/* Filter Controls */}
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Round Filter */}
                        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                            <span className="text-[10px] font-black uppercase text-slate-400 pl-2">Competition Round:</span>
                            <select
                                value={selectedRound}
                                onChange={(e) => {
                                    setSelectedRound(e.target.value);
                                    setSelectedTrack('ALL');
                                }}
                                className="h-8 rounded-lg border-0 bg-white px-3 text-xs font-extrabold text-indigo-900 shadow-sm focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                            >
                                {roundOptions.map((r) => (
                                    <option key={r} value={r}>{r}</option>
                                ))}
                            </select>
                        </div>

                        {/* Track Filter */}
                        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                            <span className="text-[10px] font-black uppercase text-slate-400 pl-2">Track:</span>
                            <select
                                disabled={isFinalRoundSelected}
                                value={isFinalRoundSelected ? 'ALL' : selectedTrack}
                                onChange={(e) => setSelectedTrack(e.target.value)}
                                className={`h-8 rounded-lg border-0 px-3 text-xs font-bold transition shadow-sm ${
                                    isFinalRoundSelected
                                        ? 'bg-slate-200/70 text-slate-400 cursor-not-allowed'
                                        : 'bg-white text-slate-800 cursor-pointer focus:ring-2 focus:ring-indigo-500'
                                }`}
                            >
                                {isFinalRoundSelected ? (
                                    <option value="ALL">Final Round (No track division)</option>
                                ) : (
                                    trackOptions.map((t) => (
                                        <option key={t} value={t}>{t === 'ALL' ? "All Tracks" : t}</option>
                                    ))
                                )}
                            </select>
                        </div>

                        {/* Search Filter */}
                        <div className="relative flex items-center">
                            <svg className="absolute left-3 h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search for teams..."
                                value={searchKeyword}
                                onChange={(e) => setSearchKeyword(e.target.value)}
                                className="h-9 w-44 sm:w-56 rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs font-medium focus:bg-white focus:border-indigo-500 focus:outline-none transition shadow-sm"
                            />
                        </div>
                    </div>
                </div>

                {/* Filter Results Summary */}
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-medium text-slate-600">
                    <div className="flex items-center gap-2">
                        <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                        <span>Currently viewing: <strong className="text-slate-900 font-extrabold">{selectedRound}</strong> {isFinalRoundSelected ? "(all tracks)" : `— ${selectedTrack === 'ALL' ? "All Tracks" : selectedTrack}`}</span>
                    </div>
                    <span className="rounded-lg bg-indigo-50 px-2.5 py-1 text-[11px] font-extrabold text-indigo-900 border border-indigo-100">
                        {filteredTeamsInRound.length} teams found
                    </span>
                </div>
            </div>

            {/* Bento Grid Layout for Team Score Cards */}
            {filteredTeamsInRound.length > 0 ? (
                <div className="grid gap-6 lg:grid-cols-2">
                    {filteredTeamsInRound.map((teamItem) => {
                        const divBadge = getDivergenceBadge(teamItem.judgeScores);
                        const avgTeamScore = average(teamItem.judgeScores.map((s) => s.score));
                        const teamKappaInfo = calculateTeamCohenKappa(teamItem.judgeScores);

                        return (
                            <div
                                key={teamItem.teamId || teamItem.teamName}
                                className="group relative rounded-2xl bg-white p-6 shadow-sm border border-slate-200/80 transition-all duration-300 hover:shadow-md hover:border-slate-300 space-y-5 flex flex-col justify-between"
                            >
                                <div className="space-y-4">
                                    {/* Card Header */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-black text-slate-900 text-base tracking-tight">{teamItem.teamName}</h3>
                                                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-extrabold text-slate-600 uppercase tracking-wider">
                                                    {isFinalRoundSelected ? "Finals" : (teamItem.trackName || "General table")}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500 font-medium">
                                                Average judge score: <strong className="text-indigo-700 font-extrabold font-mono text-sm">{avgTeamScore.toFixed(1)} pts</strong>
                                            </p>
                                        </div>

                                        {/* Divergence Pill */}
                                        <span className={`inline-flex items-center rounded-xl border px-3 py-1 text-xs font-extrabold self-start sm:self-auto shadow-2xs ${divBadge.color}`}>
                                            {divBadge.text}
                                        </span>
                                    </div>

                                    {/* Grouped Bar Chart Visualizer */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                                            <span>Judge score comparison:</span>
                                            <span className="text-slate-500 font-mono">100 point scale</span>
                                        </div>

                                        <div className="relative h-48 rounded-xl bg-slate-50/70 p-4 border border-slate-100 flex flex-col justify-between">
                                            {/* Grid Lines */}
                                            <div className="absolute inset-x-4 inset-y-4 flex flex-col justify-between pointer-events-none text-[9px] font-bold text-slate-300 font-mono">
                                                <div className="border-b border-dashed border-slate-200/80 pb-0.5">100 pts</div>
                                                <div className="border-b border-dashed border-slate-200/80 pb-0.5">75 pts</div>
                                                <div className="border-b border-dashed border-slate-200/80 pb-0.5">50 pts</div>
                                                <div className="border-b border-dashed border-slate-200/80 pb-0.5">25 pts</div>
                                                <div>0 pts</div>
                                            </div>

                                            {/* Column Bars Container */}
                                            <div className="relative z-10 h-full flex items-end justify-around gap-4 pt-4 px-2">
                                                {teamItem.judgeScores.map((jScore, idx) => {
                                                    const scoreVal = Number(jScore.score || 0);
                                                    const barHeightPercent = Math.max(8, Math.min(100, scoreVal));

                                                    let barGradient = 'from-emerald-600 via-emerald-500 to-teal-400';
                                                    let textColor = 'text-emerald-700';
                                                    if (scoreVal < 50) {
                                                        barGradient = 'from-rose-600 via-rose-500 to-red-400';
                                                        textColor = 'text-rose-700';
                                                    } else if (scoreVal < 70) {
                                                        barGradient = 'from-amber-500 via-amber-400 to-yellow-300';
                                                        textColor = 'text-amber-700';
                                                    } else if (scoreVal < 85) {
                                                        barGradient = 'from-indigo-600 via-indigo-500 to-blue-400';
                                                        textColor = 'text-indigo-700';
                                                    }

                                                    return (
                                                        <div key={jScore.judgeEmail || jScore.judgeName || idx} className="group/bar relative flex-1 flex flex-col items-center justify-end max-w-[72px]">
                                                            {/* Score Label above Bar */}
                                                            <span className={`text-xs font-black font-mono mb-1.5 transition-transform group-hover/bar:scale-110 ${textColor}`}>
                                                                {scoreVal.toFixed(1)}
                                                            </span>

                                                            {/* Bar Track & Fill */}
                                                            <div className="h-32 w-full bg-white/80 rounded-t-xl flex items-end overflow-hidden p-1 border border-slate-200/80 shadow-2xs">
                                                                <div
                                                                    className={`w-full rounded-t-lg bg-gradient-to-t ${barGradient} transition-all duration-700 group-hover/bar:brightness-110 shadow-sm`}
                                                                    style={{ height: `${barHeightPercent}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Judge Name Pills */}
                                        <div className="flex justify-around gap-4 px-4 text-center">
                                            {teamItem.judgeScores.map((jScore, idx) => (
                                                <div key={jScore.judgeEmail || jScore.judgeName || idx} className="flex-1 max-w-[72px] flex flex-col items-center">
                                                    <span className="rounded-lg bg-slate-100 border border-slate-200/80 px-2 py-1 text-[10px] font-extrabold text-slate-800 truncate w-full shadow-2xs" title={jScore.judgeName}>
                                                        {jScore.judgeName}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Weighted Cohen's Kappa Analytical Bento Box */}
                                    <div className={`rounded-xl p-4 border transition-all duration-300 space-y-3 ${teamKappaInfo.bg}`}>
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                            <div className="flex items-center gap-1.5">
                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <span className="text-xs font-black uppercase tracking-wider">
                                                    Cohen's Kappa index (κ_w):
                                                </span>
                                            </div>
                                            <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-black ${teamKappaInfo.badgeBg} shadow-2xs`}>
                                                κ = {teamKappaInfo.kappa.toFixed(2)}
                                            </span>
                                        </div>

                                        <p className="text-xs font-bold leading-relaxed">
                                            {teamKappaInfo.level}
                                        </p>

                                        {/* Landis-Koch Meter Bar */}
                                        <div className="space-y-1">
                                            <div className="relative h-2.5 w-full rounded-full bg-slate-200 overflow-hidden flex">
                                                <div className="h-full w-[20%] bg-rose-500" title="Dangerous (≤0.20)" />
                                                <div className="h-full w-[20%] bg-orange-400" title="High alert (0.21-0.40)" />
                                                <div className="h-full w-[20%] bg-amber-400" title="Mild warning (0.41-0.60)" />
                                                <div className="h-full w-[20%] bg-teal-500" title="Acceptable (0.61-0.80)" />
                                                <div className="h-full w-[20%] bg-emerald-600" title="Safe (0.81-1.00)" />
                                                <div
                                                    className="absolute top-0 bottom-0 w-1.5 bg-slate-900 border-x border-white shadow-sm transition-all duration-700"
                                                    style={{ left: `${Math.max(0, Math.min(100, teamKappaInfo.kappa * 100))}%` }}
                                                />
                                            </div>
                                        </div>

                                        {/* Formula Breakdown Stats */}
                                        <div className="grid grid-cols-3 gap-2 border-t border-slate-200/60 pt-2.5 text-[11px] font-medium text-slate-700">
                                            <div>
                                                <span className="block text-[10px] uppercase text-slate-500 font-bold">Actual (P_o_w)</span>
                                                <strong className="font-mono font-black text-slate-900">{teamKappaInfo.pow}%</strong>
                                            </div>
                                            <div>
                                                <span className="block text-[10px] uppercase text-slate-500 font-bold">Expectation (P_e_w)</span>
                                                <strong className="font-mono font-black text-slate-900">{teamKappaInfo.pew}%</strong>
                                            </div>
                                            <div>
                                                <span className="block text-[10px] uppercase text-slate-500 font-bold">Deviation (Δ)</span>
                                                <strong className={`font-mono font-black ${teamKappaInfo.delta > 12 ? 'text-rose-700' : 'text-slate-900'}`}>{teamKappaInfo.delta.toFixed(1)} pts</strong>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Judge Feedback Accordion Box */}
                                <div className="rounded-xl bg-slate-50/80 p-3.5 space-y-2 border border-slate-100 text-xs mt-2">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                        Detailed comments from the Judges:
                                    </span>
                                    <div className="space-y-1.5">
                                        {teamItem.judgeScores.map((jScore, idx) => (
                                            <div key={jScore.judgeEmail || jScore.judgeName || idx} className="flex items-start gap-2 text-xs text-slate-700">
                                                <span className="rounded-md bg-white border border-slate-200 px-1.5 py-0.5 text-[10px] font-extrabold text-slate-800 whitespace-nowrap">
                                                    {jScore.judgeName}
                                                </span>
                                                <p className="italic text-slate-600 leading-relaxed font-normal">
                                                    "{jScore.comment || "There are no detailed comments"}"
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center shadow-sm space-y-3">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <p className="text-sm font-extrabold text-slate-800">No matching teams found</p>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                        Try adjusting your search keywords or selecting another Round / Track in the filter above.
                    </p>
                </div>
            )}
        </div>
    );
}
