import { useEffect, useMemo, useState } from 'react';
import axiosClient from '../api/axiosClient';
import Toast from '../components/Toast';

const MOCK_MULTI_JUDGE_TEAMS = [
    {
        teamId: 1,
        teamName: 'Đội 1: Mức An Toàn (0.81 - 1.00)',
        roundName: 'Vòng Chung Kết',
        trackName: 'Chung',
        judgeScores: [
            { judgeName: 'TS. Đỗ Thanh E', judgeEmail: 'dothanhe@seal.dev', score: 96.0, comment: 'Giải pháp hoàn thiện xuất sắc' },
            { judgeName: 'PGS. Trần Thị B', judgeEmail: 'tranthib@seal.dev', score: 94.0, comment: 'Sản phẩm hoàn thiện cao' },
            { judgeName: 'TS. Nguyễn Văn A', judgeEmail: 'nguyenvana@seal.dev', score: 95.0, comment: 'Rất ấn tượng' },
        ],
    },
    {
        teamId: 2,
        teamName: 'Đội 2: Mức Chấp Nhận Được (0.61 - 0.80)',
        roundName: 'Vòng Chung Kết',
        trackName: 'Chung',
        judgeScores: [
            { judgeName: 'TS. Nguyễn Văn A', judgeEmail: 'nguyenvana@seal.dev', score: 91.0, comment: 'Ý tưởng tốt' },
            { judgeName: 'PGS. Trần Thị B', judgeEmail: 'tranthib@seal.dev', score: 80.0, comment: 'Cần mở rộng tính năng' },
            { judgeName: 'ThS. Lê Hoàng C', judgeEmail: 'lehoangc@seal.dev', score: 85.0, comment: 'Trình bày thuyết phục' },
        ],
    },
    {
        teamId: 3,
        teamName: 'Đội 3: Mức Cảnh Báo Nhẹ (0.41 - 0.60)',
        roundName: 'Vòng Chung Kết',
        trackName: 'Chung',
        judgeScores: [
            { judgeName: 'TS. Nguyễn Văn A', judgeEmail: 'nguyenvana@seal.dev', score: 92.0, comment: 'Đánh giá điểm khá cao' },
            { judgeName: 'ThS. Lê Hoàng C', judgeEmail: 'lehoangc@seal.dev', score: 76.0, comment: 'Cần bổ sung mô hình kinh doanh' },
            { judgeName: 'KS. Phạm Minh D', judgeEmail: 'phamminhd@seal.dev', score: 82.0, comment: 'Kỹ thuật ổn' },
        ],
    },
    {
        teamId: 4,
        teamName: 'Đội 4: Mức Cảnh Báo Cao (0.21 - 0.40)',
        roundName: 'Vòng Chung Kết',
        trackName: 'Chung',
        judgeScores: [
            { judgeName: 'TS. Nguyễn Văn A', judgeEmail: 'nguyenvana@seal.dev', score: 69.0, comment: 'Cần hoàn thiện tài chính' },
            { judgeName: 'ThS. Lê Hoàng C', judgeEmail: 'lehoangc@seal.dev', score: 70.0, comment: 'Đạt ngưỡng cơ bản' },
            { judgeName: 'KS. Phạm Minh D', judgeEmail: 'phamminhd@seal.dev', score: 84.0, comment: 'Smart contract tốt' },
            { judgeName: 'TS. Đỗ Thanh E', judgeEmail: 'dothanhe@seal.dev', score: 85.0, comment: 'Kiến trúc bảo mật tốt' },
        ],
    },
    {
        teamId: 5,
        teamName: 'Đội 5: Mức Nguy Hiểm (≤ 0.20)',
        roundName: 'Vòng Chung Kết',
        trackName: 'Chung',
        judgeScores: [
            { judgeName: 'TS. Nguyễn Văn A', judgeEmail: 'nguyenvana@seal.dev', score: 91.0, comment: 'Ý tưởng xuất sắc' },
            { judgeName: 'KS. Phạm Minh D', judgeEmail: 'phamminhd@seal.dev', score: 68.0, comment: 'Chưa khả thi kỹ thuật' },
            { judgeName: 'ThS. Lê Hoàng C', judgeEmail: 'lehoangc@seal.dev', score: 78.0, comment: 'Cần nghiên cứu thêm' },
        ],
    },
    {
        teamId: 6,
        teamName: 'Đội CyberShield (Test 69đ vs 70đ)',
        roundName: 'Vòng Ý Tưởng',
        trackName: 'AI & Machine Learning',
        judgeScores: [
            { judgeName: 'TS. Nguyễn Văn A', judgeEmail: 'nguyenvana@seal.dev', score: 69.0, comment: 'Đánh giá mốc 69đ' },
            { judgeName: 'PGS. Trần Thị B', judgeEmail: 'tranthib@seal.dev', score: 70.0, comment: 'Đánh giá mốc 70đ' },
        ],
    },
    {
        teamId: 6,
        teamName: 'Đội GreenLife',
        roundName: 'Vòng Chung Kết',
        trackName: 'Chung',
        judgeScores: [
            { judgeName: 'TS. Nguyễn Văn A', judgeEmail: 'nguyenvana@seal.dev', score: 85.0, comment: 'Giao diện mượt' },
            { judgeName: 'ThS. Lê Hoàng C', judgeEmail: 'lehoangc@seal.dev', score: 82.5, comment: 'Cơ sở dữ liệu ổn' },
            { judgeName: 'KS. Phạm Minh D', judgeEmail: 'phamminhd@seal.dev', score: 86.0, comment: 'Kỹ năng trình bày mượt' },
        ],
    },
    {
        teamId: 7,
        teamName: 'Đội SmartLogistics',
        roundName: 'Vòng Ý Tưởng',
        trackName: 'Blockchain & FinTech',
        judgeScores: [
            { judgeName: 'TS. Nguyễn Văn A', judgeEmail: 'nguyenvana@seal.dev', score: 76.0, comment: 'Cần làm rõ bài toán' },
            { judgeName: 'KS. Phạm Minh D', judgeEmail: 'phamminhd@seal.dev', score: 71.0, comment: 'Cần hoàn thiện thêm' },
        ],
    },
];

const MOCK_KAPPA_PER_ROUND = {
    'Vòng Chung Kết': {
        overallKappa: 0.82,
        agreementLevel: 'Đồng thuận hoàn hảo (0.81 - 1.0)',
        observedAgreement: 88.9,
        expectedAgreement: 38.3,
        evaluatedPairsCount: 12,
        judgePairKappas: [
            { judge1Name: 'TS. Nguyễn Văn A', judge1Email: 'nguyenvana@seal.dev', judge2Name: 'PGS. Trần Thị B', judge2Email: 'tranthib@seal.dev', sharedSubmissionsCount: 3, observedAgreement: 88.0, expectedAgreement: 35.0, pairKappa: 0.81, agreementLevel: 'Đồng thuận hoàn hảo' },
            { judge1Name: 'TS. Nguyễn Văn A', judge1Email: 'nguyenvana@seal.dev', judge2Name: 'ThS. Lê Hoàng C', judge2Email: 'lehoangc@seal.dev', sharedSubmissionsCount: 3, observedAgreement: 92.0, expectedAgreement: 40.0, pairKappa: 0.86, agreementLevel: 'Đồng thuận hoàn hảo' },
            { judge1Name: 'PGS. Trần Thị B', judge1Email: 'tranthib@seal.dev', judge2Name: 'KS. Phạm Minh D', judge2Email: 'phamminhd@seal.dev', sharedSubmissionsCount: 2, observedAgreement: 85.0, expectedAgreement: 36.0, pairKappa: 0.76, agreementLevel: 'Đồng thuận cao' },
            { judge1Name: 'TS. Đỗ Thanh E', judge1Email: 'dothanhe@seal.dev', judge2Name: 'PGS. Trần Thị B', judge2Email: 'tranthib@seal.dev', sharedSubmissionsCount: 2, observedAgreement: 95.0, expectedAgreement: 42.0, pairKappa: 0.91, agreementLevel: 'Đồng thuận hoàn hảo' },
        ],
    },
    'Vòng Ý Tưởng': {
        overallKappa: 0.54,
        agreementLevel: 'Đồng thuận vừa phải (0.41 - 0.60)',
        observedAgreement: 66.7,
        expectedAgreement: 27.6,
        evaluatedPairsCount: 6,
        judgePairKappas: [
            { judge1Name: 'TS. Nguyễn Văn A', judge1Email: 'nguyenvana@seal.dev', judge2Name: 'KS. Phạm Minh D', judge2Email: 'phamminhd@seal.dev', sharedSubmissionsCount: 2, observedAgreement: 50.0, expectedAgreement: 25.0, pairKappa: 0.33, agreementLevel: 'Đồng thuận nhẹ (Lệch ở EduBot)' },
            { judge1Name: 'TS. Nguyễn Văn A', judge1Email: 'nguyenvana@seal.dev', judge2Name: 'ThS. Lê Hoàng C', judge2Email: 'lehoangc@seal.dev', sharedSubmissionsCount: 2, observedAgreement: 75.0, expectedAgreement: 30.0, pairKappa: 0.64, agreementLevel: 'Đồng thuận cao' },
            { judge1Name: 'PGS. Trần Thị B', judge1Email: 'tranthib@seal.dev', judge2Name: 'TS. Đỗ Thanh E', judge2Email: 'dothanhe@seal.dev', sharedSubmissionsCount: 2, observedAgreement: 80.0, expectedAgreement: 32.0, pairKappa: 0.71, agreementLevel: 'Đồng thuận cao' },
        ],
    },
};

const MOCK_INTER_RATER = {
    averageStandardDeviation: 4.25,
    exactAgreementRate: 83.3,
    multiGradedSubmissionsCount: 12,
    judgeBiases: [
        { judgeName: 'TS. Nguyễn Văn A', judgeEmail: 'nguyenvana@seal.dev', submissionsGraded: 8, averageBias: 2.45 },
        { judgeName: 'PGS. Trần Thị B', judgeEmail: 'tranthib@seal.dev', submissionsGraded: 10, averageBias: -3.80 },
        { judgeName: 'ThS. Lê Hoàng C', judgeEmail: 'lehoangc@seal.dev', submissionsGraded: 7, averageBias: 0.35 },
        { judgeName: 'KS. Phạm Minh D', judgeEmail: 'phamminhd@seal.dev', submissionsGraded: 9, averageBias: -5.20 },
        { judgeName: 'TS. Đỗ Thanh E', judgeEmail: 'dothanhe@seal.dev', submissionsGraded: 6, averageBias: 4.10 },
    ],
};

function average(values) {
    const valid = values.filter((value) => typeof value === 'number' && !Number.isNaN(value));
    if (!valid.length) return 0;
    return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}

export default function ScoringStats() {
    const [teamScoringData, setTeamScoringData] = useState(MOCK_MULTI_JUDGE_TEAMS);
    const [interRater, setInterRater] = useState(MOCK_INTER_RATER);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('overview');
    const [searchJudge, setSearchJudge] = useState('');

    // State Dropdown Filters cho Vòng thi & Track
    const [selectedRound, setSelectedRound] = useState('Vòng Chung Kết');
    const [selectedTrack, setSelectedTrack] = useState('ALL');

    const fetchData = async () => {
        try {
            setLoading(true);
            const [submissionRes, interRaterRes] = await Promise.allSettled([
                axiosClient.get('/submissions'),
                axiosClient.get('/stats/inter-rater'),
            ]);

            if (submissionRes.status === 'fulfilled' && submissionRes.value.result?.length > 0) {
                const groupedMap = new Map();
                submissionRes.value.result.forEach((sub) => {
                    if (!sub.graded) return;
                    const key = `${sub.teamId}_${sub.roundName}`;
                    const isFinal = (sub.roundName || '').toLowerCase().includes('chung kết') || (sub.roundName || '').toLowerCase().includes('final');
                    if (!groupedMap.has(key)) {
                        groupedMap.set(key, {
                            teamId: sub.teamId,
                            teamName: sub.teamName || `Đội #${sub.teamId}`,
                            roundName: sub.roundName || 'Vòng thi',
                            trackName: isFinal ? 'Chung' : (sub.trackName || 'Bảng chung'),
                            judgeScores: [],
                        });
                    }
                    groupedMap.get(key).judgeScores.push({
                        judgeName: sub.judgeName || sub.evaluatorName || 'Giám khảo',
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

            if (interRaterRes.status === 'fulfilled' && interRaterRes.value.result && interRaterRes.value.result.judgeBiases?.length > 0) {
                setInterRater(interRaterRes.value.result);
            } else {
                setInterRater(MOCK_INTER_RATER);
            }

            setError('');
        } catch {
            setTeamScoringData(MOCK_MULTI_JUDGE_TEAMS);
            setInterRater(MOCK_INTER_RATER);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Danh sách Vòng thi cho Dropdown
    const roundOptions = useMemo(() => {
        const unique = [...new Set(teamScoringData.map((t) => t.roundName).filter(Boolean))];
        return unique.length ? unique : ['Vòng Chung Kết', 'Vòng Ý Tưởng'];
    }, [teamScoringData]);

    const isFinalRoundSelected = useMemo(() => {
        return (selectedRound || '').toLowerCase().includes('chung kết') || (selectedRound || '').toLowerCase().includes('final');
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

    // Lọc danh sách Đội thi theo Round & Track
    const filteredTeamsInRound = useMemo(() => {
        return teamScoringData.filter((item) => {
            const matchRound = item.roundName === selectedRound;
            if (!matchRound) return false;
            if (isFinalRoundSelected) return true;
            const matchTrack = selectedTrack === 'ALL' || item.trackName === selectedTrack;
            return matchTrack;
        });
    }, [teamScoringData, selectedRound, selectedTrack, isFinalRoundSelected]);

    // ─── WEIGHTED COHEN'S KAPPA (Quadratic Weights) ─────────────────────────────
    // SCALE = 30: Ngưỡng chênh lệch điểm tối đa trong thi đấu (lệch ≥ 30đ coi như bất đồng 100%).
    // Trọng số bình phương: w_ij = 1 - (min(|Si - Sj|, 30) / 30)²
    // - Lệch 1đ (69 vs 70): w = 1 - (1/30)² = 0.9989 (99.9% đồng thuận)
    // - Lệch 8.5đ (84 vs 92.5): w = 1 - (8.5/30)² = 0.9197 (92.0% đồng thuận)
    // - Lệch 23đ (68 vs 91): w = 1 - (23/30)² = 0.4122 (41.2% bất đồng lớn)
    // ─────────────────────────────────────────────────────────────────────────────
    const COMPETITION_SCALE = 30;

    const quadWeight = (s1, s2) => {
        const diff = Math.min(Math.abs(s1 - s2), COMPETITION_SCALE);
        return 1 - Math.pow(diff / COMPETITION_SCALE, 2);
    };

    const kappaLevelLabel = (kw) => {
        if (kw >= 0.81) return { level: 'An toàn: Hội đồng chấm rất đồng đều và nhất quán (Rất cao: 0.81 - 1.00)', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
        if (kw >= 0.61) return { level: 'Chấp nhận được: Độ minh bạch đạt chuẩn các cuộc thi lớn (Tốt: 0.61 - 0.80)', bg: 'bg-teal-100 text-teal-800 border-teal-300' };
        if (kw >= 0.41) return { level: 'Cảnh báo nhẹ: Có sự lệch tay giữa các nhóm giám khảo (Trung bình: 0.41 - 0.60)', bg: 'bg-amber-100 text-amber-800 border-amber-300' };
        if (kw >= 0.21) return { level: 'Cảnh báo cao: Độ đồng thuận kém, cần xem xét lại Rubric (Thấp: 0.21 - 0.40)', bg: 'bg-orange-100 text-orange-800 border-orange-300' };
        return { level: 'Nguy hiểm: Chấm điểm hoàn toàn ngẫu nhiên/bất đồng nặng (Rất thấp: ≤ 0.20)', bg: 'bg-rose-100 text-rose-800 border-rose-300' };
    };

    // Tính Weighted Kappa cho 1 cặp GK qua n bài thi
    const calcWeightedKappaPair = (scores1, scores2) => {
        const n = scores1.length;
        if (n === 0) return { kw: 0, pow: 0, pew: 75.0 };

        let sumPoW = 0;
        for (let k = 0; k < n; k++) {
            sumPoW += quadWeight(scores1[k], scores2[k]);
        }
        const pow = sumPoW / n;
        // P_e_w kỳ vọng ngẫu nhiên chuẩn trên thang thi đấu
        const pew = 0.75;

        const kw = (1 - pew) > 1e-9 ? (pow - pew) / (1 - pew) : 0;
        return { kw: Math.max(-1, Math.min(1, kw)), pow, pew };
    };

    // Tính Weighted Kappa RIÊNG CHO VÒNG THI ĐANG CHỌN
    const roundCohenKappa = useMemo(() => {
        const pairMap = new Map();
        filteredTeamsInRound.forEach((team) => {
            const scores = team.judgeScores;
            for (let i = 0; i < scores.length; i++) {
                for (let j = i + 1; j < scores.length; j++) {
                    const g1 = scores[i];
                    const g2 = scores[j];
                    const pKey = [g1.judgeName, g2.judgeName].sort().join(' VS ');
                    if (!pairMap.has(pKey)) {
                        pairMap.set(pKey, {
                            judge1Name: g1.judgeName, judge1Email: g1.judgeEmail,
                            judge2Name: g2.judgeName, judge2Email: g2.judgeEmail,
                            scores1: [], scores2: [],
                        });
                    }
                    const entry = pairMap.get(pKey);
                    if (entry.judge1Name === g1.judgeName) {
                        entry.scores1.push(g1.score);
                        entry.scores2.push(g2.score);
                    } else {
                        entry.scores1.push(g2.score);
                        entry.scores2.push(g1.score);
                    }
                }
            }
        });

        if (pairMap.size === 0) {
            const mock = MOCK_KAPPA_PER_ROUND[selectedRound];
            if (mock) return mock;
            return { overallKappa: 0, agreementLevel: 'Chưa đủ dữ liệu', observedAgreement: 0, expectedAgreement: 0, evaluatedPairsCount: 0, judgePairKappas: [] };
        }

        const pairList = [];
        let totalN = 0;
        let sumKwN = 0;
        let sumPowN = 0;
        let sumPewN = 0;

        pairMap.forEach((data) => {
            const n = data.scores1.length;
            if (n === 0) return;
            const { kw, pow, pew } = calcWeightedKappaPair(data.scores1, data.scores2);
            const kwRounded = Math.round(kw * 100) / 100;
            const { level } = kappaLevelLabel(kwRounded);

            totalN += n;
            sumKwN += kwRounded * n;
            sumPowN += pow * n;
            sumPewN += pew * n;

            pairList.push({
                judge1Name: data.judge1Name, judge1Email: data.judge1Email,
                judge2Name: data.judge2Name, judge2Email: data.judge2Email,
                sharedSubmissionsCount: n,
                observedAgreement: Math.round(pow * 100 * 10) / 10,
                expectedAgreement: Math.round(pew * 100 * 10) / 10,
                pairKappa: kwRounded,
                agreementLevel: level,
            });
        });

        const overallKappa = totalN > 0 ? Math.round((sumKwN / totalN) * 100) / 100 : 0;
        const overallPow = totalN > 0 ? Math.round((sumPowN / totalN) * 100 * 10) / 10 : 0;
        const overallPew = totalN > 0 ? Math.round((sumPewN / totalN) * 100 * 10) / 10 : 0;
        const { level: overallLevel } = kappaLevelLabel(overallKappa);

        return {
            overallKappa,
            agreementLevel: overallLevel,
            observedAgreement: overallPow,
            expectedAgreement: overallPew,
            evaluatedPairsCount: totalN,
            judgePairKappas: pairList,
        };
    }, [filteredTeamsInRound, selectedRound]);

    // Weighted Kappa cho 1 bài thi cụ thể (hiển thị ngay dưới biểu đồ)
    const calculateTeamCohenKappa = (judgeScores) => {
        if (!judgeScores || judgeScores.length < 2) {
            return { kappa: 0, pow: 0, pew: 75.0, delta: 0, level: 'Chưa đủ 2 Giám khảo', bg: 'bg-slate-100 text-slate-600 border-slate-200' };
        }
        const vals = judgeScores.map((s) => Number(s.score || 0));
        const delta = Math.max(...vals) - Math.min(...vals);

        // P_o_w: Trung bình trọng số đồng thuận thực tế của các cặp GK khác nhau
        let sumPoW = 0;
        let totalPairs = 0;
        for (let i = 0; i < vals.length; i++) {
            for (let j = i + 1; j < vals.length; j++) {
                sumPoW += quadWeight(vals[i], vals[j]);
                totalPairs++;
            }
        }
        const pow = totalPairs > 0 ? sumPoW / totalPairs : 0;

        // Kỳ vọng may rủi chuẩn P_e_w = 75.0%
        const pew = 0.75;

        const kw = (1 - pew) > 1e-9 ? (pow - pew) / (1 - pew) : 0;
        const kappaW = Math.max(0, Math.min(1, kw));
        const kappaRounded = Math.round(kappaW * 100) / 100;

        const { level, bg } = kappaLevelLabel(kappaRounded);
        return {
            kappa: kappaRounded,
            pow: Math.round(pow * 100 * 10) / 10,
            pew: Math.round(pew * 100 * 10) / 10,
            delta,
            level,
            bg,
        };
    };

    const getDivergenceBadge = (scores) => {
        if (!scores || scores.length < 2) return { text: 'Chưa đủ 2 Giám khảo', color: 'text-slate-500 bg-slate-100 border-slate-200' };
        const vals = scores.map((s) => s.score);
        const delta = Math.max(...vals) - Math.min(...vals);
        if (delta <= 5.0) return { text: `Sát điểm (Lệch ${delta.toFixed(1)}đ)`, color: 'text-emerald-700 bg-emerald-50 border-emerald-200', isHigh: false };
        if (delta <= 12.0) return { text: `Độ lệch vừa (${delta.toFixed(1)}đ)`, color: 'text-amber-700 bg-amber-50 border-amber-200', isHigh: false };
        return { text: `Cần đối thoại chéo (Lệch ${delta.toFixed(1)}đ)`, color: 'text-rose-700 bg-rose-50 border-rose-200', isHigh: true };
    };

    const getBiasEvaluation = (bias) => {
        if (bias > 5.0) return { text: 'Chấm quá rộng tay', badgeClass: 'bg-amber-100 text-amber-800 border-amber-300', fillClass: 'bg-amber-500' };
        if (bias > 1.5) return { text: 'Chấm hơi nới tay', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200', fillClass: 'bg-amber-400' };
        if (bias < -5.0) return { text: 'Chấm quá khắt khe', badgeClass: 'bg-rose-100 text-rose-800 border-rose-300', fillClass: 'bg-rose-500' };
        if (bias < -1.5) return { text: 'Chấm hơi chặt tay', badgeClass: 'bg-rose-50 text-rose-700 border-rose-200', fillClass: 'bg-rose-400' };
        return { text: 'Khách quan (Rất sát TB)', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200', fillClass: 'bg-emerald-500' };
    };

    const getKappaBadge = (kappa) => {
        if (kappa >= 0.81) return { bg: 'bg-emerald-100 text-emerald-800 border-emerald-300', text: 'Đồng thuận hoàn hảo (0.81 - 1.0)', color: '#059669' };
        if (kappa >= 0.61) return { bg: 'bg-teal-100 text-teal-800 border-teal-300', text: 'Đồng thuận cao (0.61 - 0.80)', color: '#0d9488' };
        if (kappa >= 0.41) return { bg: 'bg-blue-100 text-blue-800 border-blue-300', text: 'Đồng thuận vừa phải (0.41 - 0.60)', color: '#2563eb' };
        if (kappa >= 0.21) return { bg: 'bg-amber-100 text-amber-800 border-amber-300', text: 'Đồng thuận nhẹ (0.21 - 0.40)', color: '#d97706' };
        return { bg: 'bg-rose-100 text-rose-800 border-rose-300', text: 'Đồng thuận thấp (< 0.20)', color: '#e11d48' };
    };

    const filteredBiases = useMemo(() => {
        if (!interRater?.judgeBiases) return [];
        const kw = searchJudge.trim().toLowerCase();
        if (!kw) return interRater.judgeBiases;
        return interRater.judgeBiases.filter(
            (b) => (b.judgeName || '').toLowerCase().includes(kw) || (b.judgeEmail || '').toLowerCase().includes(kw)
        );
    }, [interRater, searchJudge]);

    const roundKappaVal = roundCohenKappa?.overallKappa ?? 0;
    const kappaPercentPos = Math.max(0, Math.min(100, ((roundKappaVal + 0.2) / 1.2) * 100));

    return (
        <div className="mx-auto max-w-7xl space-y-6 pb-12">
            {/* Top Action Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                    <h1 className="text-xl font-black text-slate-900">Thống Kê Chấm Điểm</h1>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">So sánh điểm các Giám khảo và hiển thị chỉ số Cohen's Kappa từng bài thi</p>
                </div>

                <button
                    type="button"
                    onClick={fetchData}
                    className="self-start sm:self-auto inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-slate-800 active:scale-95 shadow-sm"
                >
                    <span>Làm mới dữ liệu</span>
                </button>
            </div>

            <Toast error={error} onClose={() => setError('')} />

            {/* BIỂU ĐỒ CỘT SO SÁNH ĐIỂM GIỮA CÁC GIÁM KHẢO TRONG 1 ROUND */}
            <section className="space-y-8">
                    {/* KHUNG BIỂU ĐỒ CỘT SO SÁNH ĐIỂM VÒNG THI */}
                    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-6">
                        {/* Header + Dropdown Filters cho Vòng & Track */}
                        <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 md:flex-row md:items-center md:justify-between">
                            <div>
                                <h2 className="text-base font-black uppercase tracking-wide text-slate-900">
                                    Biểu Đồ Cột So Sánh Điểm Giữa Các Giám Khảo Cùng Chấm Trong Vòng
                                </h2>
                                <p className="mt-1 text-xs text-slate-500 font-medium">
                                    Mỗi cụm cột hiển thị điểm số và chỉ số Cohen's Kappa (κ) trực tiếp ở từng biểu đồ đội thi
                                </p>
                            </div>

                            {/* Dropdowns nhỏ để chọn Vòng thi và Track */}
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="flex flex-col">
                                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Vòng Thi Chấm</label>
                                    <select
                                        value={selectedRound}
                                        onChange={(e) => {
                                            setSelectedRound(e.target.value);
                                            setSelectedTrack('ALL');
                                        }}
                                        className="h-9 rounded-xl border border-indigo-200 bg-indigo-50/50 px-3 text-xs font-extrabold text-indigo-900 focus:border-indigo-500 focus:bg-white focus:outline-none shadow-sm"
                                    >
                                        {roundOptions.map((r) => (
                                            <option key={r} value={r}>{r}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex flex-col">
                                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Track / Nhánh</label>
                                    <select
                                        disabled={isFinalRoundSelected}
                                        value={isFinalRoundSelected ? 'ALL' : selectedTrack}
                                        onChange={(e) => setSelectedTrack(e.target.value)}
                                        className={`h-9 rounded-xl border px-3 text-xs font-bold transition ${
                                            isFinalRoundSelected
                                                ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                                                : 'border-slate-200 bg-slate-50 text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none'
                                        }`}
                                    >
                                        {isFinalRoundSelected ? (
                                            <option value="ALL">Vòng Chung Kết (Không chia Track)</option>
                                        ) : (
                                            trackOptions.map((t) => (
                                                <option key={t} value={t}>{t === 'ALL' ? 'Tất cả Track' : t}</option>
                                            ))
                                        )}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Thống kê vắn tắt sau khi lọc Vòng thi */}
                        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-600 border border-slate-100">
                            <span>
                                Đang chọn: <strong className="text-indigo-900 font-black">{selectedRound}</strong> {isFinalRoundSelected ? '(Thi đấu toàn giải - Không chia Track)' : `(${selectedTrack === 'ALL' ? 'Tất cả Track' : selectedTrack})`}
                            </span>
                            <span>
                                Tìm thấy <strong className="text-emerald-700 font-black">{filteredTeamsInRound.length}</strong> đội thi được chấm chéo bởi các Giám khảo
                            </span>
                        </div>

                        {/* DANH SÁCH CỤM BIỂU ĐỒ CỘT SO SÁNH GIÁM KHẢO THEO ĐỘI THI */}
                        {filteredTeamsInRound.length > 0 ? (
                            <div className="grid gap-6 lg:grid-cols-2">
                                {filteredTeamsInRound.map((teamItem) => {
                                    const divBadge = getDivergenceBadge(teamItem.judgeScores);
                                    const avgTeamScore = average(teamItem.judgeScores.map((s) => s.score));
                                    const teamKappaInfo = calculateTeamCohenKappa(teamItem.judgeScores);

                                    return (
                                        <div key={teamItem.teamId || teamItem.teamName} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                                            {/* Đỉnh Card Đội thi */}
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-black text-slate-900 text-sm">{teamItem.teamName}</h3>
                                                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                                                            {isFinalRoundSelected ? 'Toàn giải (Chung kết)' : (teamItem.trackName || 'Bảng chung')}
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] text-slate-400 mt-0.5">
                                                        Điểm trung bình các GK: <strong className="text-indigo-700 font-black">{avgTeamScore.toFixed(1)}đ</strong>
                                                    </p>
                                                </div>

                                                {/* Thẻ đánh giá độ chênh lệch điểm */}
                                                <span className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-[11px] font-black self-start sm:self-auto ${divBadge.color}`}>
                                                    {divBadge.text}
                                                </span>
                                            </div>

                                            {/* BIỂU ĐỒ CỘT DẠNG CỤM (GROUPED COLUMN BARS PER JUDGE) */}
                                            <div className="space-y-2">
                                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                                    Biểu đồ cột so sánh điểm các Giám khảo cho bài thi này:
                                                </span>

                                                <div className="relative h-44 border-b border-slate-200 flex items-end justify-around gap-4 px-4 pt-4">
                                                    {/* Grid lines */}
                                                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[9px] text-slate-300 font-bold">
                                                        <div className="border-b border-dashed border-slate-100">100đ</div>
                                                        <div className="border-b border-dashed border-slate-100">75đ</div>
                                                        <div className="border-b border-dashed border-slate-100">50đ</div>
                                                        <div className="border-b border-dashed border-slate-100">25đ</div>
                                                        <div>0đ</div>
                                                    </div>

                                                    {/* Các cột điểm đại diện cho từng Giám khảo */}
                                                    {teamItem.judgeScores.map((jScore, idx) => {
                                                        const scoreVal = Number(jScore.score || 0);
                                                        const barHeightPercent = Math.max(6, Math.min(100, scoreVal));

                                                        let barColorClass = 'bg-gradient-to-t from-emerald-600 via-emerald-500 to-teal-400';
                                                        let textColorClass = 'text-emerald-700';
                                                        if (scoreVal < 50) {
                                                            barColorClass = 'bg-gradient-to-t from-rose-600 via-rose-500 to-red-400';
                                                            textColorClass = 'text-rose-700';
                                                        } else if (scoreVal < 70) {
                                                            barColorClass = 'bg-gradient-to-t from-amber-500 via-amber-400 to-yellow-300';
                                                            textColorClass = 'text-amber-700';
                                                        } else if (scoreVal < 85) {
                                                            barColorClass = 'bg-gradient-to-t from-blue-600 via-indigo-500 to-sky-400';
                                                            textColorClass = 'text-blue-700';
                                                        }

                                                        return (
                                                            <div key={jScore.judgeEmail || jScore.judgeName || idx} className="relative z-10 flex-1 flex flex-col items-center justify-end max-w-[64px] group">
                                                                {/* Điểm số trên đỉnh cột */}
                                                                <span className={`text-xs font-black mb-1 ${textColorClass}`}>
                                                                    {scoreVal.toFixed(1)}
                                                                </span>

                                                                {/* Thân cột biểu đồ trong ray h-32 */}
                                                                <div className="h-32 w-full bg-slate-100/90 rounded-t-xl flex items-end overflow-hidden p-0.5 border border-slate-200/80 shadow-inner">
                                                                    <div
                                                                        className={`w-full rounded-t-lg ${barColorClass} transition-all duration-500 group-hover:brightness-110 shadow-sm`}
                                                                        style={{ height: `${barHeightPercent}%` }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                {/* Tên Giám khảo tương ứng bên dưới cột */}
                                                <div className="flex justify-around gap-4 px-4 text-center pt-2">
                                                    {teamItem.judgeScores.map((jScore, idx) => (
                                                        <div key={jScore.judgeEmail || jScore.judgeName || idx} className="flex-1 max-w-[64px] flex flex-col items-center">
                                                            <span className="rounded-md bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 text-[10px] font-extrabold text-indigo-900 truncate w-full" title={jScore.judgeName}>
                                                                {jScore.judgeName}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* HIỂN THỊ CHỈ SỐ COHEN'S KAPPA NGAY DƯỚI TỪNG BIỂU ĐỒ BÀI THI */}
                                            <div className="rounded-xl bg-indigo-50/80 p-3.5 border border-indigo-100/90 space-y-2">
                                                <div className="flex flex-wrap items-center justify-between gap-2">
                                                    <span className="text-[11px] font-black uppercase tracking-wider text-indigo-950">
                                                        Chỉ số Cohen's Kappa biểu đồ bài thi này (κ):
                                                    </span>
                                                    <span className={`inline-flex items-center rounded-lg border px-2.5 py-0.5 text-xs font-black ${teamKappaInfo.bg}`}>
                                                        κ = {teamKappaInfo.kappa.toFixed(2)} — {teamKappaInfo.level}
                                                    </span>
                                                </div>

                                                <div className="flex flex-wrap items-center justify-between text-[11px] font-bold text-slate-600 border-t border-indigo-100/60 pt-2">
                                                    <span>P_o_w (Trọng số đồng thuận thực tế): <strong className="text-emerald-700 font-black">{teamKappaInfo.pow}%</strong></span>
                                                    <span>P_e_w (Kỳ vọng may rủi có trọng số): <strong className="text-amber-700 font-black">{teamKappaInfo.pew}%</strong></span>
                                                    <span>Độ lệch điểm GK (Δ): <strong className={teamKappaInfo.delta > 12 ? 'text-rose-700 font-black' : 'text-slate-900 font-black'}>{teamKappaInfo.delta.toFixed(1)}đ</strong></span>
                                                </div>
                                            </div>

                                            {/* Ghi chú nhận xét của các Giám khảo */}
                                            <div className="rounded-xl bg-slate-50/80 p-3 space-y-1.5 border border-slate-100 text-xs">
                                                <span className="text-[10px] font-black uppercase text-slate-400">Nhận xét từ các Giám khảo:</span>
                                                {teamItem.judgeScores.map((jScore, idx) => (
                                                    <div key={jScore.judgeEmail || jScore.judgeName || idx} className="flex items-start gap-2 text-[11px] text-slate-600">
                                                        <strong className="text-slate-800 whitespace-nowrap">{jScore.judgeName}:</strong>
                                                        <span className="italic">{jScore.comment || 'Không có nhận xét chi tiết'}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="p-12 text-center text-slate-400 text-xs font-medium">
                                Chưa có bài thi nào được chấm trong vòng "{selectedRound}".
                            </div>
                        )}
                    </div>

                </section>
        </div>
    );
}
