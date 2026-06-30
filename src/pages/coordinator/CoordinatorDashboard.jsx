import React, { useState, useEffect, useCallback } from 'react';
import {
    ClipboardList,
    Trophy,
    BarChart2,
    History,
    BookOpen,
    ShieldCheck,
    LogOut,
    Menu,
    X,
    Search,
    Sparkles,
    Plus,
    RotateCw,
    ZoomIn,
    AlertTriangle,
    Trash2,
    Settings,
    ShieldAlert,
    Check,
    CheckCircle,
    HelpCircle,
    FileText,
    User,
    GraduationCap,
    Calendar,
    Users,
    Eye,
    RefreshCw,
    Wifi,
    WifiOff
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:8080/api/coordinator';

export default function App() {
    const [activeTab, setActiveTab] = useState('queue');
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [backendAlive, setBackendAlive] = useState(false);
    const [loading, setLoading] = useState(false);

    // Core Dynamic States retrieved from Backend
    const [queueCandidates, setQueueCandidates] = useState([]);
    const [approvalHistory, setApprovalHistory] = useState([]);
    const [tournaments, setTournaments] = useState([]);
    const [teamScores, setTeamScores] = useState([]);
    const [auditLogs, setAuditLogs] = useState([]);

    // Filters and Searching states
    const [queueFilter, setQueueFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedScoreTourney, setSelectedScoreTourney] = useState('1');

    // Rules text states
    const [ruleTitle, setRuleTitle] = useState("Quy chế Đấu trường SEAL Hackathon");
    const [ruleContent, setRuleContent] = useState("");

    // Modals state
    const [selectedCandidate, setSelectedCandidate] = useState(null);
    const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
    const [isRejectReasonModalOpen, setIsRejectReasonModalOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState('Mã số sinh viên không trùng khớp với thông tin trên thẻ');
    const [customRejectReason, setCustomRejectReason] = useState('');
    const [isCreateTournamentModalOpen, setIsCreateTournamentModalOpen] = useState(false);

    // New Tournament Input States
    const [newTourneyName, setNewTourneyName] = useState('');
    const [newTourneyTeams, setNewTourneyTeams] = useState('16');
    const [newTourneyJudges, setNewTourneyJudges] = useState('');
    const [newTourneyDesc, setNewTourneyDesc] = useState('');

    // Zoom / Rotate image utilities
    const [rotation, setRotation] = useState(0);
    const [zoom, setZoom] = useState(1);

    // Toast System State
    const [toasts, setToasts] = useState([]);

    const showToast = useCallback((message, type = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 4500);
    }, []);

    // Kiểm tra xem Backend Spring Boot có đang hoạt động (Online) hay không
    const checkBackendHealth = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/health`, { method: 'GET' });
            if (res.ok) {
                setBackendAlive(true);
            } else {
                setBackendAlive(false);
            }
        } catch (e) {
            setBackendAlive(false);
        }
    }, []);

    // 1. Lấy danh sách hồ sơ thí sinh đang chờ duyệt
    const fetchQueue = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/candidates/pending`);
            if (res.ok) {
                const data = await res.json();
                setQueueCandidates(data);
            } else {
                showToast("❌ Không thể tải danh sách hàng đợi từ Backend", "error");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    // 2. Lấy lịch sử phê duyệt của riêng Coordinator
    const fetchHistory = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/candidates/history`);
            if (res.ok) {
                const data = await res.json();
                setApprovalHistory(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    // 3. Lấy danh sách toàn bộ giải đấu
    const fetchTournaments = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/tournaments`);
            if (res.ok) {
                const data = await res.json();
                setTournaments(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    // 4. Lấy bảng điểm của các đội thuộc giải đấu được chọn
    const fetchScoreboard = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/scores?tournamentId=${selectedScoreTourney}`);
            if (res.ok) {
                const data = await res.json();
                setTeamScores(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [selectedScoreTourney]);

    // 5. Lấy nội dung quy chế hiện hành của cuộc thi
    const fetchRules = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/rules`);
            if (res.ok) {
                const data = await res.json();
                setRuleTitle(data.title);
                setRuleContent(data.content);
            }
        } catch (e) {
            console.error(e);
        }
    }, []);

    // 6. Lấy lịch sử Audit Log hệ thống
    const fetchAuditLogs = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/audit-logs`);
            if (res.ok) {
                const data = await res.json();
                setAuditLogs(data);
            }
        } catch (e) {
            console.error(e);
        }
    }, []);

    // Đồng bộ chạy kiểm thử kết nối tự động mỗi 10 giây
    useEffect(() => {
        checkBackendHealth();
        const interval = setInterval(checkBackendHealth, 10000);
        return () => clearInterval(interval);
    }, [checkBackendHealth]);

    // Tải dữ liệu tương ứng khi người dùng click đổi Tab
    useEffect(() => {
        if (backendAlive) {
            if (activeTab === 'queue') {
                fetchQueue();
            } else if (activeTab === 'history') {
                fetchHistory();
            } else if (activeTab === 'tournaments') {
                fetchTournaments();
            } else if (activeTab === 'scoreboard') {
                fetchScoreboard();
            } else if (activeTab === 'rules') {
                fetchRules();
            } else if (activeTab === 'audit') {
                fetchAuditLogs();
            }
        } else {
            showToast("🔌 Đang mất kết nối tới Backend Spring Boot!", "error");
        }
    }, [activeTab, backendAlive, fetchQueue, fetchHistory, fetchTournaments, fetchScoreboard, fetchRules, fetchAuditLogs, showToast]);

    const handleOpenVerifyModal = (candidate) => {
        setSelectedCandidate(candidate);
        setRotation(0);
        setZoom(1);
        setIsVerifyModalOpen(true);
    };

    // DUYỆT TÀI KHOẢN (POST API)
    const handleApproveCandidate = async (candidateId) => {
        try {
            const res = await fetch(`${API_BASE_URL}/candidates/${candidateId}/approve`, {
                method: 'POST'
            });
            if (res.ok) {
                showToast("🎉 Đã duyệt tài khoản và tự động bắn mail kích hoạt cho thí sinh!", "success");
                setIsVerifyModalOpen(false);
                fetchQueue(); // Reload danh sách hàng chờ
            } else {
                const errMsg = await res.text();
                showToast(`❌ Thất bại: ${errMsg}`, "error");
            }
        } catch (e) {
            showToast("❌ Lỗi kết nối đến Backend khi duyệt!", "error");
        }
    };

    // TỪ CHỐI TÀI KHOẢN (POST API KÈM LÝ DO)
    const handleSubmitRejection = async (e) => {
        e.preventDefault();
        if (!selectedCandidate) return;

        const finalReason = rejectReason === 'other' ? customRejectReason : rejectReason;
        if (!finalReason.trim()) {
            showToast("❌ Vui lòng điền lý do từ chối cụ thể", "error");
            return;
        }

        try {
            const res = await fetch(`${API_BASE_URL}/candidates/${selectedCandidate.id}/reject`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: finalReason })
            });
            if (res.ok) {
                showToast(`❌ Đã từ chối và tự động gửi mail báo lỗi chi tiết về mail thí sinh!`, "error");
                setIsRejectReasonModalOpen(false);
                setIsVerifyModalOpen(false);
                setCustomRejectReason('');
                fetchQueue(); // Reload
            } else {
                showToast("❌ Gặp lỗi khi gửi phản hồi lên server", "error");
            }
        } catch (err) {
            showToast("❌ Lỗi kết nối gửi quyết định từ chối!", "error");
        }
    };

    // TẠO GIẢI ĐẤU MỚI (POST API)
    const handleCreateTournament = async (e) => {
        e.preventDefault();
        if (!newTourneyName.trim()) return;

        const payload = {
            name: newTourneyName,
            maxTeams: parseInt(newTourneyTeams) || 16,
            judges: newTourneyJudges,
            desc: newTourneyDesc
        };

        try {
            const res = await fetch(`${API_BASE_URL}/tournaments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                showToast(`🏆 Khởi tạo thành công đấu trường "${newTourneyName}"!`, "success");
                setIsCreateTournamentModalOpen(false);
                setNewTourneyName('');
                setNewTourneyTeams('16');
                setNewTourneyJudges('');
                setNewTourneyDesc('');
                fetchTournaments();
            } else {
                showToast("❌ Không thể khởi tạo giải đấu mới", "error");
            }
        } catch (err) {
            showToast("❌ Lỗi kết nối tạo giải đấu!", "error");
        }
    };

    // SỬA ĐỔI QUY CHẾ (POST API)
    const handleSaveRules = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/rules`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: ruleTitle, content: ruleContent })
            });
            if (res.ok) {
                showToast("💾 Đã lưu và xuất bản quy chế mới cho toàn hệ thống!", "success");
                fetchRules();
            } else {
                showToast("❌ Gặp sự cố khi xuất bản quy chế", "error");
            }
        } catch (err) {
            showToast("❌ Lỗi kết nối lưu quy chế!", "error");
        }
    };

    // ĐÁNH DẤU CẢNH BÁO AN NINH / GIAN LẬN ĐỘI CHƠI (POST API)
    const handleFlagTeamScore = async (teamId, statusType) => {
        try {
            const res = await fetch(`${API_BASE_URL}/scores/${teamId}/flag`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ warningStatus: statusType })
            });
            if (res.ok) {
                showToast("🛡️ Đã đồng bộ trạng thái an toàn của đội thi lên Database!", "success");
                fetchScoreboard();
            } else {
                showToast("❌ Không thể cập nhật trạng thái an ninh đội chơi", "error");
            }
        } catch (e) {
            showToast("❌ Lỗi kết nối xử lý cảnh báo!", "error");
        }
    };

    // DỌN SẠCH LOG TẠM THỜI (DELETE API)
    const handleClearLogs = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/audit-logs`, { method: 'DELETE' });
            if (res.ok) {
                showToast("🗑️ Đã dọn sạch nhật ký an toàn tạm thời trên DB.", "info");
                fetchAuditLogs();
            }
        } catch (e) {
            showToast("❌ Lỗi kết nối dọn sạch logs!", "error");
        }
    };

    // Lọc hiển thị Frontend
    const filteredQueue = queueCandidates.filter(c => {
        const matchesFilter = queueFilter === 'all'
            || (queueFilter === 'fpt' && c.studentType === 'FPT')
            || (queueFilter === 'external' && c.studentType === 'EXTERNAL');
        const matchesSearch = c.fullName.toLowerCase().includes(searchQuery.toLowerCase())
            || (c.studentId && c.studentId.toLowerCase().includes(searchQuery.toLowerCase()))
            || c.universityName.toLowerCase().includes(searchQuery.toLowerCase())
            || c.email.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-800 font-sans">

            {/* Dynamic Toast Alerts Container */}
            <div className="fixed top-5 right-5 z-50 space-y-3 pointer-events-none">
                {toasts.map(t => (
                    <div
                        key={t.id}
                        className={`flex items-center space-x-3 text-white px-5 py-3.5 rounded-xl shadow-2xl pointer-events-auto transform transition-all duration-300 border border-white/10 ${
                            t.type === 'error' ? 'bg-rose-600' : t.type === 'info' ? 'bg-blue-600' : 'bg-slate-900'
                        }`}
                    >
                        {t.type === 'error' ? <AlertTriangle className="w-5 h-5" /> : t.type === 'info' ? <HelpCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                        <span className="text-xs font-semibold">{t.message}</span>
                    </div>
                ))}
            </div>

            {/* SIDEBAR NAVIGATION */}
            <aside className={`bg-[#0f172a] text-slate-300 flex flex-col transition-all duration-300 ease-in-out z-30 relative shrink-0 ${sidebarOpen ? 'w-64' : 'w-20'}`}>

                {/* Brand Logo Header */}
                <div className="h-20 flex items-center justify-between px-6 border-b border-slate-800/80">
                    <div className="flex items-center space-x-3 overflow-hidden">
                        <div className="w-9 h-9 rounded-lg bg-[#0056aa] flex items-center justify-center text-white font-bold text-lg shadow-lg shrink-0">
                            C
                        </div>
                        {sidebarOpen && (
                            <span className="font-bold text-lg tracking-wider text-white transition-opacity duration-300">
                SEAL <span className="text-[#0056aa]">COORD</span>
              </span>
                        )}
                    </div>
                    <button onClick={() => setSidebarOpen(!sidebarOpen)} className="hidden md:block text-slate-400 hover:text-white transition-colors">
                        <Menu className="w-5 h-5" />
                    </button>
                </div>

                {/* Profile details */}
                <div className="px-6 py-6 border-b border-slate-800/50 overflow-hidden shrink-0">
                    <div className="flex items-center space-x-3">
                        <img
                            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop"
                            alt="Profile"
                            className="w-10 h-10 rounded-full border-2 border-[#0056aa] object-cover shrink-0"
                        />
                        {sidebarOpen && (
                            <div className="min-w-0 transition-opacity duration-300">
                                <h4 className="font-semibold text-white text-sm truncate">Phạm Hoàng Sơn</h4>
                                <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-semibold mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                  Coordinator Active
                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Nav Links */}
                <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                    {sidebarOpen && (
                        <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            Bàn làm việc
                        </div>
                    )}

                    <button
                        onClick={() => setActiveTab('queue')}
                        className={`w-full flex items-center space-x-3 px-3 py-3 rounded-xl transition-all duration-200 font-medium text-xs ${
                            activeTab === 'queue'
                                ? 'bg-[#0056aa]/20 text-white border-l-4 border-[#0056aa]'
                                : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                        }`}
                    >
                        <ClipboardList className="w-5 h-5 text-slate-440 shrink-0" />
                        {sidebarOpen && <span className="truncate">Hàng Đợi Xét Duyệt</span>}
                        {sidebarOpen && queueCandidates.length > 0 && (
                            <span className="ml-auto bg-[#0056aa] text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                {queueCandidates.length}
              </span>
                        )}
                    </button>

                    <button
                        onClick={() => setActiveTab('tournaments')}
                        className={`w-full flex items-center space-x-3 px-3 py-3 rounded-xl transition-all duration-200 font-medium text-xs ${
                            activeTab === 'tournaments'
                                ? 'bg-[#0056aa]/20 text-white border-l-4 border-[#0056aa]'
                                : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                        }`}
                    >
                        <Trophy className="w-5 h-5 text-slate-440 shrink-0" />
                        {sidebarOpen && <span className="truncate">Quản Lý Giải Đấu</span>}
                    </button>

                    <button
                        onClick={() => setActiveTab('scoreboard')}
                        className={`w-full flex items-center space-x-3 px-3 py-3 rounded-xl transition-all duration-200 font-medium text-xs ${
                            activeTab === 'scoreboard'
                                ? 'bg-[#0056aa]/20 text-white border-l-4 border-[#0056aa]'
                                : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                        }`}
                    >
                        <BarChart2 className="w-5 h-5 text-slate-440 shrink-0" />
                        {sidebarOpen && <span className="truncate">Điểm Số & Giám Khảo</span>}
                    </button>

                    <button
                        onClick={() => setActiveTab('history')}
                        className={`w-full flex items-center space-x-3 px-3 py-3 rounded-xl transition-all duration-200 font-medium text-xs ${
                            activeTab === 'history'
                                ? 'bg-[#0056aa]/20 text-white border-l-4 border-[#0056aa]'
                                : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                        }`}
                    >
                        <History className="w-5 h-5 text-slate-440 shrink-0" />
                        {sidebarOpen && <span className="truncate">Lịch Sử Phê Duyệt</span>}
                    </button>

                    <div className="pt-4 pb-2">
                        {sidebarOpen && (
                            <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                Hệ thống
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => setActiveTab('rules')}
                        className={`w-full flex items-center space-x-3 px-3 py-3 rounded-xl transition-all duration-200 font-medium text-xs ${
                            activeTab === 'rules'
                                ? 'bg-[#0056aa]/20 text-white border-l-4 border-[#0056aa]'
                                : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                        }`}
                    >
                        <BookOpen className="w-5 h-5 text-slate-440 shrink-0" />
                        {sidebarOpen && <span className="truncate">Quy Chế Cuộc Thi</span>}
                    </button>

                    <button
                        onClick={() => setActiveTab('audit')}
                        className={`w-full flex items-center space-x-3 px-3 py-3 rounded-xl transition-all duration-200 font-medium text-xs ${
                            activeTab === 'audit'
                                ? 'bg-[#0056aa]/20 text-white border-l-4 border-[#0056aa]'
                                : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                        }`}
                    >
                        <ShieldAlert className="w-5 h-5 text-slate-440 shrink-0" />
                        {sidebarOpen && <span className="truncate">Audit Log Giải Đấu</span>}
                    </button>
                </nav>

                <div className="p-4 border-t border-slate-800 text-center shrink-0">
          <span className="text-[10px] text-slate-500 block font-mono">
            SEAL Workstation v1.3 - API Mode
          </span>
                </div>
            </aside>

            {/* MAIN WORKSPACE WRAPPER */}
            <main className="flex-1 flex flex-col overflow-y-auto">

                {/* TOP NAVBAR HEADER */}
                <header className="bg-white border-b border-slate-200 h-20 py-4 flex items-center justify-between px-6 md:px-8 shrink-0 gap-4">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="md:hidden text-slate-500 hover:text-[#0056aa] p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                        <div>
                            <h2 className="font-bold text-base md:text-lg text-slate-800 flex items-center gap-2">
                                {activeTab === 'queue' && "Kiểm Duyệt Thí Sinh Đăng Ký"}
                                {activeTab === 'tournaments' && "Quản Lý Đấu Trường & Đăng Ký"}
                                {activeTab === 'scoreboard' && "Kiểm Tra Bảng Điểm & Đánh Giá Giám Khảo"}
                                {activeTab === 'history' && "Lịch Sử Phê Duyệt Của Tôi"}
                                {activeTab === 'rules' && "Thiết Lập Điều Lệ Cuộc Thi"}
                                {activeTab === 'audit' && "Nhật Ký Bảo Mật Giải Đấu"}
                                {loading && <RefreshCw className="w-4 h-4 animate-spin text-[#0056aa]" />}
                            </h2>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                        {/* CONNECTION INDICATOR (EXTREMELY CRITICAL UX) */}
                        <div className={`border rounded-xl px-3 py-1.5 hidden lg:flex items-center space-x-2 text-[11px] font-bold ${
                            backendAlive ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700 animate-pulse'
                        }`}>
                            {backendAlive ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                            <span>{backendAlive ? "CONNECTED BACKEND (8080)" : "BACKEND OFFLINE"}</span>
                        </div>

                        <div className="h-8 w-[1px] bg-slate-200 hidden md:block"></div>

                        <div className="text-right hidden sm:block">
                            <span className="block font-semibold text-xs text-slate-700 font-sans">Phạm Hoàng Sơn</span>
                            <span className="block text-[10px] text-slate-400 font-medium">Bàn Kiểm Duyệt số 2</span>
                        </div>
                    </div>
                </header>

                {/* WORKSPACE CONTAINER AREA */}
                <div className="p-6 md:p-8 flex-1 space-y-6">

                    {/* STATS OVERVIEW CARDS */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm relative overflow-hidden group">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hàng chờ hiện tại</span>
                                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                    <ClipboardList className="w-4 h-4" />
                                </div>
                            </div>
                            <h3 className="text-xl font-bold text-slate-800">{queueCandidates.length}</h3>
                            <p className="text-[10px] text-slate-400 mt-1.5">Hồ sơ cần duyệt trong hệ thống</p>
                        </div>

                        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm relative overflow-hidden group">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hồ sơ của tôi đã xử lý</span>
                                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                    <CheckCircle className="w-4 h-4" />
                                </div>
                            </div>
                            <h3 className="text-xl font-bold text-slate-800">{approvalHistory.length}</h3>
                            <p className="text-[10px] text-emerald-600 font-semibold mt-1.5 flex items-center gap-1">
                                <Sparkles className="w-3 h-3 animate-pulse" /> Đã cập nhật từ DB
                            </p>
                        </div>

                        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm relative overflow-hidden group">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tổng giải đấu</span>
                                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                                    <Trophy className="w-4 h-4" />
                                </div>
                            </div>
                            <h3 className="text-xl font-bold text-slate-800">{tournaments.length}</h3>
                            <p className="text-[10px] text-purple-600 font-semibold mt-1.5">
                                Các đấu trường đã kích hoạt
                            </p>
                        </div>

                        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm relative overflow-hidden group">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tổng sự kiện bảo mật</span>
                                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                                    <ShieldAlert className="w-4 h-4" />
                                </div>
                            </div>
                            <h3 className="text-xl font-bold text-slate-800">{auditLogs.length}</h3>
                            <p className="text-[10px] text-slate-400 mt-1.5">Sự kiện đã ghi nhật ký</p>
                        </div>
                    </div>

                    {/* TAB CONTENT: QUEUE OF CANDIDATES */}
                    {activeTab === 'queue' && (
                        <div className="space-y-6">

                            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-lg">
                                    <button
                                        onClick={() => setQueueFilter('all')}
                                        className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${queueFilter === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                                    >
                                        Tất cả chờ duyệt
                                    </button>
                                    <button
                                        onClick={() => setQueueFilter('fpt')}
                                        className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${queueFilter === 'fpt' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                                    >
                                        Sinh viên FPT
                                    </button>
                                    <button
                                        onClick={() => setQueueFilter('external')}
                                        className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${queueFilter === 'external' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                                    >
                                        Trường Ngoài
                                    </button>
                                </div>

                                <div className="relative w-full md:w-80">
                                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Tìm theo Tên, MSSV, Email..."
                                        className="pl-9 pr-4 py-2 w-full text-xs bg-slate-50 focus:bg-white border border-slate-200 focus:border-[#0056aa] rounded-lg outline-none transition-all"
                                    />
                                </div>
                            </div>

                            {/* Candidates list table */}
                            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                            <th className="py-4 px-6">Thí sinh & Email</th>
                                            <th className="py-4 px-6">Trường Đại học</th>
                                            <th className="py-4 px-6">MSSV</th>
                                            <th className="py-4 px-6">Trạng thái minh chứng</th>
                                            <th className="py-4 px-6 text-center">Hành động kiểm duyệt</th>
                                        </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
                                        {filteredQueue.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="py-12 text-center text-slate-400">
                                                    <ClipboardList className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                                                    <span>Không có hồ sơ nào chờ kiểm duyệt.</span>
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredQueue.map(c => (
                                                <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="py-4 px-6">
                                                        <div className="flex items-center space-x-3">
                                                            <div className="w-8 h-8 rounded-full bg-[#0056aa]/10 text-[#0056aa] flex items-center justify-center font-bold text-[10px] shrink-0">
                                                                {c.fullName.split(' ').pop().substring(0, 2).toUpperCase()}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <span className="block font-semibold text-slate-800 truncate">{c.fullName}</span>
                                                                <span className="block text-[10px] text-slate-400 font-mono truncate">{c.email}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <div className="font-semibold text-slate-700">{c.universityName}</div>
                                                        {c.studentType === 'FPT' ? (
                                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-orange-50 text-orange-700 border border-orange-100 mt-1">
                                  FPT University
                                </span>
                                                        ) : (
                                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-100 mt-1">
                                  Trường Ngoài
                                </span>
                                                        )}
                                                    </td>
                                                    <td className="py-4 px-6 font-mono font-bold text-slate-500">{c.studentId || "N/A"}</td>
                                                    <td className="py-4 px-6">
                              <span className="inline-flex items-center text-[10px] text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5 animate-pulse"></span>
                                Chờ xem minh chứng
                              </span>
                                                    </td>
                                                    <td className="py-4 px-6 text-center">
                                                        <button
                                                            onClick={() => handleOpenVerifyModal(c)}
                                                            className="px-3.5 py-1.5 bg-[#0056aa] hover:bg-[#004488] text-white font-bold text-[10px] rounded shadow-sm transition-all inline-flex items-center gap-1.5"
                                                        >
                                                            <Eye className="w-3.5 h-3.5" /> Mở Hồ Sơ Xác Minh
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB CONTENT: TOURNAMENTS */}
                    {}
                    {activeTab === 'tournaments' && (
                        <div className="space-y-6">
                            <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div>
                                    <h3 className="font-bold text-slate-800 text-sm">Quản Lý Giải Đấu & Sân Chơi (Đồng bộ Backend)</h3>
                                    <p className="text-[11px] text-slate-400 mt-0.5">Khởi tạo đấu trường, theo dõi số lượng đội thi đăng ký, quản lý danh sách ban giám khảo phân công.</p>
                                </div>
                                <button
                                    onClick={() => setIsCreateTournamentModalOpen(true)}
                                    className="px-4 py-2 bg-[#0056aa] hover:bg-[#004488] text-white font-bold text-xs rounded-lg shadow-sm transition-all flex items-center gap-2 self-stretch sm:self-auto justify-center"
                                >
                                    <Plus className="w-4 h-4" /> Tạo Giải Đấu Mới
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {tournaments.map(t => (
                                    <div key={t.id} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-start gap-2">
                                                <h4 className="font-bold text-slate-800 text-xs truncate max-w-[150px]" title={t.name}>{t.name}</h4>
                                                <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Đang diễn ra
                        </span>
                                            </div>
                                            <p className="text-[10px] text-slate-400 leading-relaxed min-h-[30px]">{t.desc}</p>

                                            <div className="border-t border-slate-100 pt-3 space-y-2 text-[10px]">
                                                <div className="flex justify-between">
                                                    <span className="text-slate-400">Giới hạn đội thi:</span>
                                                    <strong className="text-slate-700">0 / {t.maxTeams} Đội</strong>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-slate-400">Hội đồng Giám khảo:</span>
                                                    <strong className="text-[#0056aa] truncate max-w-[150px]">{t.judges}</strong>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-4 pt-3 border-t border-slate-100 flex gap-2">
                                            <button
                                                onClick={() => showToast('📋 Đang chuẩn bị xuất báo cáo tiến độ giải đấu...', 'info')}
                                                className="flex-1 py-1.5 bg-slate-50 hover:bg-slate-100 rounded text-[10px] font-semibold text-slate-600 transition-colors"
                                            >
                                                Thống kê giải
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* TAB CONTENT: SCOREBOARD */}
                    {}
                    {activeTab === 'scoreboard' && (
                        <div className="space-y-6">
                            <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div>
                                    <h3 className="font-bold text-slate-800 text-sm">Bảng Điểm & Quản Lý Đánh Giá Của Giám Khảo</h3>
                                    <p className="text-[11px] text-slate-400 mt-0.5">Giám sát điểm số từ các Hội đồng và xử lý trường hợp gian lận.</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-slate-400 font-bold">Giải đấu:</span>
                                    <select
                                        value={selectedScoreTourney}
                                        onChange={(e) => setSelectedScoreTourney(e.target.value)}
                                        className="px-3 py-1.5 bg-slate-50 border border-slate-200 text-xs font-semibold rounded-lg outline-none"
                                    >
                                        <option value="1">SEAL Hackathon 2026</option>
                                        <option value="2">AI Challenger Arena</option>
                                    </select>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                            <th className="py-4 px-6">Tên Đội & Thành viên</th>
                                            <th className="py-4 px-6 text-center">Điểm Trung Bình</th>
                                            <th className="py-4 px-6 text-center">Trạng thái An ninh</th>
                                            <th className="py-4 px-6 text-center">Hành động của Coord</th>
                                        </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
                                        {teamScores.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="py-12 text-center text-slate-400">
                                                    Không tìm thấy dữ liệu điểm số từ Backend.
                                                </td>
                                            </tr>
                                        ) : (
                                            teamScores.map(t => (
                                                <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="py-4 px-6">
                                                        <span className="block font-bold text-slate-800 text-xs">{t.teamName}</span>
                                                        <span className="block text-[10px] text-slate-400 mt-1">Trưởng nhóm: {t.leaderName}</span>
                                                    </td>
                                                    <td className="py-4 px-6 text-xs font-bold text-[#0056aa] text-center">{t.averageScore} đ</td>
                                                    <td className="py-4 px-6 text-center">
                                                        {t.warningStatus === 'NONE' && (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                  An toàn
                                </span>
                                                        )}
                                                        {t.warningStatus === 'WARNING' && (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-100 animate-pulse">
                                  Nghi vấn
                                </span>
                                                        )}
                                                        {t.warningStatus === 'DISQUALIFIED' && (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-100">
                                  Truất quyền thi
                                </span>
                                                        )}
                                                    </td>
                                                    <td className="py-4 px-6 text-center">
                                                        <div className="flex gap-1.5 justify-center">
                                                            <button
                                                                onClick={() => handleFlagTeamScore(t.id, 'WARNING')}
                                                                className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded text-[10px] font-semibold"
                                                            >
                                                                Cảnh báo
                                                            </button>
                                                            <button
                                                                onClick={() => handleFlagTeamScore(t.id, 'DISQUALIFIED')}
                                                                className="px-2.5 py-1 bg-rose-500 hover:bg-rose-600 text-white rounded text-[10px] font-bold"
                                                            >
                                                                Khóa
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB CONTENT: HISTORY */}
                    {}
                    {activeTab === 'history' && (
                        <div className="space-y-6">
                            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
                                <h3 className="font-bold text-slate-800 text-sm">Lịch Sử Phê Duyệt Hệ Thống</h3>
                                <p className="text-[11px] text-slate-400 mt-0.5">Lịch sử được tải thời gian thực từ Database server.</p>
                            </div>

                            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                            <th className="py-4 px-6">Thí sinh</th>
                                            <th className="py-4 px-6">Trường học</th>
                                            <th className="py-4 px-6">MSSV</th>
                                            <th className="py-4 px-6">Quyết định</th>
                                            <th className="py-4 px-6">Lý do (nếu bị từ chối)</th>
                                        </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
                                        {approvalHistory.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="py-12 text-center text-slate-400">
                                                    Chưa có lịch sử duyệt nào được lưu trữ.
                                                </td>
                                            </tr>
                                        ) : (
                                            approvalHistory.map(h => (
                                                <tr key={h.id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="py-4 px-6 font-semibold text-slate-800">{h.fullName}</td>
                                                    <td className="py-4 px-6 text-slate-500">{h.universityName}</td>
                                                    <td className="py-4 px-6 font-mono font-semibold text-slate-500">{h.studentId || "N/A"}</td>
                                                    <td className="py-4 px-6">
                                                        {h.status === 'ACTIVE' ? (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                  Đã duyệt
                                </span>
                                                        ) : (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-100">
                                  Từ chối
                                </span>
                                                        )}
                                                    </td>
                                                    <td className="py-4 px-6 text-rose-500 font-medium">{h.rejectReason || "-"}</td>
                                                </tr>
                                            ))
                                        )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB CONTENT: RULES */}
                    {}
                    {activeTab === 'rules' && (
                        <div className="space-y-6">
                            <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm col-span-2 space-y-4">
                                <h3 className="font-bold text-slate-800 text-sm">Trình Biên Soạn Quy Chế - Lưu Database</h3>

                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Tiêu đề quy chế</label>
                                    <input
                                        type="text"
                                        value={ruleTitle}
                                        onChange={(e) => setRuleTitle(e.target.value)}
                                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Nội dung luật đấu trường</label>
                                    <textarea
                                        rows={10}
                                        value={ruleContent}
                                        onChange={(e) => setRuleContent(e.target.value)}
                                        className="w-full p-4 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg outline-none resize-none"
                                    />
                                </div>

                                <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                                    <button
                                        onClick={handleSaveRules}
                                        className="px-4 py-2 bg-[#0056aa] text-xs font-bold text-white rounded-lg hover:bg-[#004488]"
                                    >
                                        Lưu & Đồng Bộ Xuống Backend
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB CONTENT: AUDIT LOG */}
                    {}
                    {activeTab === 'audit' && (
                        <div className="space-y-6">
                            <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div>
                                    <h3 className="font-bold text-slate-800 text-sm">Contest Audit Log - Ghi nhận thời gian thực</h3>
                                    <p className="text-[11px] text-slate-400 mt-0.5">Các thao tác duyệt, báo cáo nghi vấn gian lận từ Backend.</p>
                                </div>
                                <button
                                    onClick={handleClearLogs}
                                    className="px-3.5 py-2 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg text-xs font-bold transition-all"
                                >
                                    Dọn sạch Log
                                </button>
                            </div>

                            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                            <th className="py-4 px-6">Mốc Thời Gian</th>
                                            <th className="py-4 px-6">Người Thao Tác (Actor)</th>
                                            <th className="py-4 px-6">Hành Vi / Sự Kiện (Event Action)</th>
                                            <th className="py-4 px-6">Đối Tượng</th>
                                        </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
                                        {auditLogs.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="py-12 text-center text-slate-400">
                                                    Không có vết lịch sử audit nào được ghi nhận.
                                                </td>
                                            </tr>
                                        ) : (
                                            auditLogs.map(log => (
                                                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="py-4 px-6 font-mono text-slate-400">{log.timestamp}</td>
                                                    <td className="py-4 px-6 font-semibold text-slate-700">{log.actor}</td>
                                                    <td className="py-4 px-6 text-slate-800 font-semibold">{log.action}</td>
                                                    <td className="py-4 px-6 text-slate-500 font-medium">{log.target}</td>
                                                </tr>
                                            ))
                                        )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </main>

            {/* CANDIDATE DETAIL & VERIFICATION DRAWER (MODAL) */}
            {}
            {isVerifyModalOpen && selectedCandidate && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden">

                        <div className="bg-[#0f172a] text-white px-6 py-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="w-5 h-5 text-[#0056aa]" />
                                <h3 className="font-bold text-sm">Xác Minh Minh Chứng Thí Sinh Real-Time</h3>
                            </div>
                            <button onClick={() => setIsVerifyModalOpen(false)} className="text-slate-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <h4 className="font-bold text-xs text-slate-800 border-b border-slate-100 pb-2 uppercase tracking-wider">Thông Tin Đăng Ký</h4>
                                <div className="space-y-3 text-xs">
                                    <div>
                                        <span className="block text-slate-400 font-medium mb-0.5">Họ và Tên:</span>
                                        <span className="text-slate-800 font-bold text-sm">{selectedCandidate.fullName}</span>
                                    </div>
                                    <div>
                                        <span className="block text-slate-400 font-medium mb-0.5">Email hệ thống:</span>
                                        <span className="text-slate-800 font-semibold font-mono">{selectedCandidate.email}</span>
                                    </div>
                                    <div>
                                        <span className="block text-slate-400 font-medium mb-0.5">Trường học:</span>
                                        <span className="text-slate-800 font-semibold">{selectedCandidate.universityName}</span>
                                    </div>
                                    <div>
                                        <span className="block text-slate-400 font-medium mb-0.5">Mã số sinh viên:</span>
                                        <span className="inline-block text-[#0056aa] font-bold font-mono text-sm bg-blue-50 px-2.5 py-0.5 rounded border border-blue-100">
                      {selectedCandidate.studentId || "N/A"}
                    </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col items-center justify-center bg-slate-50 rounded-xl p-4 border border-slate-200">
                                <span className="text-[10px] font-bold text-slate-400 mb-3 self-start uppercase tracking-wider">Ảnh chụp minh chứng:</span>

                                <div
                                    style={{ transform: `rotate(${rotation}deg) scale(${zoom})`, transition: 'transform 0.3s' }}
                                    className="w-full bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-4 text-white shadow-md relative overflow-hidden aspect-[1.58/1] flex flex-col justify-between"
                                >
                                    <div className="flex justify-between items-start">
                                        <span className="text-[9px] uppercase font-bold tracking-widest text-[#0056aa]">Student ID Card</span>
                                        <GraduationCap className="w-5 h-5 text-[#0056aa]" />
                                    </div>

                                    <div className="flex space-x-3 items-center">
                                        <div className="w-12 h-14 bg-slate-700 rounded border border-slate-600 flex items-center justify-center shrink-0">
                                            <User className="w-6 h-6 text-slate-500" />
                                        </div>
                                        <div className="flex-1 space-y-1 min-w-0">
                                            <span className="block font-bold text-xs uppercase tracking-wide truncate">{selectedCandidate.fullName}</span>
                                            <span className="block text-[8px] text-slate-300 truncate">{selectedCandidate.universityName}</span>
                                            <span className="inline-block text-[9px] font-mono font-bold text-[#0056aa] bg-white px-1.5 py-0.5 rounded">
                        {selectedCandidate.studentId || "PENDING"}
                      </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 flex gap-1.5 w-full shrink-0">
                                    <button onClick={() => setZoom(prev => Math.min(prev + 0.2, 1.6))} className="flex-1 py-1 bg-slate-200 hover:bg-slate-300 rounded text-[10px] font-bold text-slate-700 transition-colors">Phóng to</button>
                                    <button onClick={() => setRotation(prev => prev + 90)} className="flex-1 py-1 bg-slate-200 hover:bg-slate-300 rounded text-[10px] font-bold text-slate-700 transition-colors">Xoay 90°</button>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
                            <button
                                onClick={() => setIsRejectReasonModalOpen(true)}
                                className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-lg transition-all"
                            >
                                Từ chối hồ sơ
                            </button>
                            <button
                                onClick={() => handleApproveCandidate(selectedCandidate.id)}
                                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-lg shadow-sm transition-all"
                            >
                                Phê duyệt & Kích hoạt
                            </button>
                        </div>

                    </div>
                </div>
            )}

            {/* REJECTION REASON MODAL */}
            {}
            {isRejectReasonModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
                        <div className="bg-rose-600 text-white px-6 py-4 flex items-center justify-between">
                            <h3 className="font-bold text-sm">Chọn lý do gửi Mail từ chối</h3>
                            <button onClick={() => setIsRejectReasonModalOpen(false)} className="text-white/85 hover:text-white"><X className="w-5 h-5" /></button>
                        </div>

                        <form onSubmit={handleSubmitRejection} className="p-6 space-y-4">
                            <div className="space-y-2">
                                <label className="flex items-center space-x-3 p-2.5 bg-slate-50 hover:bg-slate-100 rounded-lg cursor-pointer border border-slate-100 transition-colors">
                                    <input
                                        type="radio"
                                        name="reject-reason"
                                        value="Mã số sinh viên không trùng khớp với thông tin trên thẻ"
                                        checked={rejectReason === "Mã số sinh viên không trùng khớp với thông tin trên thẻ"}
                                        onChange={(e) => setRejectReason(e.target.value)}
                                        className="text-[#0056aa]"
                                    />
                                    <span className="text-xs text-slate-700 font-semibold">Sai Mã số sinh viên (MSSV)</span>
                                </label>

                                <label className="flex items-center space-x-3 p-2.5 bg-slate-50 hover:bg-slate-100 rounded-lg cursor-pointer border border-slate-100 transition-colors">
                                    <input
                                        type="radio"
                                        name="reject-reason"
                                        value="Ảnh chụp minh chứng thẻ sinh viên mờ, không thể nhận diện"
                                        checked={rejectReason === "Ảnh chụp minh chứng thẻ sinh viên mờ, không thể nhận diện"}
                                        onChange={(e) => setRejectReason(e.target.value)}
                                        className="text-[#0056aa]"
                                    />
                                    <span className="text-xs text-slate-700 font-semibold">Ảnh thẻ mờ / Không rõ nét</span>
                                </label>

                                <label className="flex items-center space-x-3 p-2.5 bg-slate-50 hover:bg-slate-100 rounded-lg cursor-pointer border border-slate-100 transition-colors">
                                    <input
                                        type="radio"
                                        name="reject-reason"
                                        value="other"
                                        checked={rejectReason === "other"}
                                        onChange={(e) => setRejectReason(e.target.value)}
                                        className="text-[#0056aa]"
                                    />
                                    <span className="text-xs text-slate-700 font-semibold">Lý do khác...</span>
                                </label>
                            </div>

                            {rejectReason === 'other' && (
                                <textarea
                                    value={customRejectReason}
                                    onChange={(e) => setCustomRejectReason(e.target.value)}
                                    placeholder="Nhập lý do chi tiết..."
                                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-[#0056aa] outline-none h-20 resize-none"
                                    required
                                />
                            )}

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                                <button type="button" onClick={() => setIsRejectReasonModalOpen(false)} className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-lg">Quay lại</button>
                                <button type="submit" className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg shadow-md">Gửi Mail từ chối</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* CREATE TOURNAMENT MODAL */}
            {isCreateTournamentModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">

                        <div className="bg-[#0f172a] text-white px-6 py-4 flex items-center justify-between">
                            <h3 className="font-bold text-sm">Khởi Tạo Giải Đấu Mới Xuống Backend</h3>
                            <button onClick={() => setIsCreateTournamentModalOpen(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
                        </div>

                        <form onSubmit={handleCreateTournament} className="p-6 space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Tên Giải Đấu</label>
                                <input
                                    type="text"
                                    value={newTourneyName}
                                    onChange={(e) => setNewTourneyName(e.target.value)}
                                    required
                                    placeholder="Ví dụ: SEAL WebDev Championship 2026"
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Quy mô tối đa</label>
                                <input
                                    type="number"
                                    value={newTourneyTeams}
                                    onChange={(e) => setNewTourneyTeams(e.target.value)}
                                    required
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Hội đồng Giám khảo (Cách nhau bằng dấu phẩy)</label>
                                <input
                                    type="text"
                                    value={newTourneyJudges}
                                    onChange={(e) => setNewTourneyJudges(e.target.value)}
                                    required
                                    placeholder="Ví dụ: Nguyễn Văn Tám, Lê Thị Hoa"
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Mô tả ngắn gọn</label>
                                <textarea
                                    rows={3}
                                    value={newTourneyDesc}
                                    onChange={(e) => setNewTourneyDesc(e.target.value)}
                                    required
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none resize-none"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                                <button type="button" onClick={() => setIsCreateTournamentModalOpen(false)} className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-lg">Quay lại</button>
                                <button type="submit" className="px-4 py-2.5 bg-[#0056aa] text-white font-bold text-xs rounded-lg shadow-md hover:bg-[#004488]">Khởi tạo & Lưu DB</button>
                            </div>
                        </form>

                    </div>
                </div>
            )}

        </div>
    );
}