import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import logoFpt from '../assets/fpt.jpg';
import logoFptSoftware from '../assets/fpt_software.jpg';
import logoVpBank from '../assets/VPBank_logo.svg.webp';
import logoTechcombank from '../assets/Techcombank_logo.png';
import logo197 from '../assets/197.png';
import { demoWinners, formatDateTime, getCountdownParts, getEventPhase, pickFeaturedEvent } from '../utils/hackathon';

export default function Homepage() {
    const [events, setEvents] = useState([]);
    const [rankings, setRankings] = useState([]);
    const [activeFaq, setActiveFaq] = useState(null);
    const [terminalLogs, setTerminalLogs] = useState([]);
    const [terminalInput, setTerminalInput] = useState('');

    useEffect(() => {
        Promise.allSettled([axiosClient.get('/events'), axiosClient.get('/leaderboard')]).then(([eventRes, rankRes]) => {
            if (eventRes.status === 'fulfilled') setEvents(eventRes.value.result || []);
            if (rankRes.status === 'fulfilled') setRankings(rankRes.value.result || []);
        });
    }, []);

    const featuredEvent = useMemo(() => pickFeaturedEvent(events), [events]);
    const phase = getEventPhase(featuredEvent);
    const countdown = getCountdownParts(phase.key === 'registration' ? featuredEvent.regEndDate : featuredEvent.eventStartDate);
    const winners = rankings.length ? rankings.slice(0, 3) : demoWinners;
    const isEnded = phase.key === 'ended';

    // Simulate Terminal Boot-up sequence
    useEffect(() => {
        if (!featuredEvent) return;

        const cmd = `seal init --event-id=${featuredEvent.id || 'featured'} --mode=live`;
        let charIndex = 0;
        setTerminalLogs([]);
        setTerminalInput('');

        // 1. Simulate command typing
        const typingInterval = setInterval(() => {
            if (charIndex < cmd.length) {
                setTerminalInput(prev => prev + cmd.charAt(charIndex));
                charIndex++;
            } else {
                clearInterval(typingInterval);
                // 2. Start printing logs after typing finishes
                startPrintingLogs();
            }
        }, 40);

        return () => clearInterval(typingInterval);

        function startPrintingLogs() {
            const logs = [
                `[SYSTEM] Connecting to SEAL core database... SUCCESS`,
                `[API] Fetching active event: "${featuredEvent.name}"`,
                `[INFO] Phase detected: [${phase.label.toUpperCase()}]`,
                `[MONITOR] Active teams in sandbox: 24+`,
                `[AUDIT] Security log status: SECURE`,
                `[SYSTEM] Anti-gravity compiler initialized. Version 2.0.0`,
                `[SUCCESS] System ready. Commits monitoring active...`
            ];

            let logIndex = 0;
            const logInterval = setInterval(() => {
                if (logIndex < logs.length) {
                    setTerminalLogs(prev => [...prev, logs[logIndex]]);
                    logIndex++;
                } else {
                    clearInterval(logInterval);
                }
            }, 300);
        }
    }, [featuredEvent]);

    const faqData = [
        {
            q: "SYS_INFO // Sinh viên trường ngoài có được tham gia SEAL Hackathon không?",
            a: "Hệ thống mở cổng đăng ký tự do cho sinh viên liên trường. Bạn có thể xây dựng đội hỗn hợp (Sinh viên FPT & trường ngoài) hoặc đội 100% sinh viên trường đối tác để cùng thi đấu."
        },
        {
            q: "SYS_INFO // Ai có quyền nộp và cập nhật bài dự thi của đội?",
            a: "Chỉ Team Leader (Trưởng nhóm) mới được cấp quyền nộp bài (Submit) và sửa đổi tệp tin sản phẩm trước thời hạn kết thúc vòng đấu (Deadline)."
        },
        {
            q: "SYS_INFO // Cách thức chấm điểm và đảm bảo tính minh bạch như thế nào?",
            a: "Điểm số được cập nhật độc lập bởi Giám khảo qua bảng Rubric quy chuẩn. Mọi thay đổi về điểm, lý do sửa đổi đều được ghi vết thời gian thực vào bảng Audit Log để bảo vệ tính công bằng."
        },
        {
            q: "SYS_INFO // Tôi có thể liên hệ và trao đổi với Mentor hỗ trợ ở đâu?",
            a: "Khi giải đấu bắt đầu, kênh Chat phân chia theo đội đấu sẽ tự động kết nối các thành viên với Mentor cố vấn trực tiếp trên hệ thống."
        },
        {
            q: "SYS_INFO // Các đội đạt giải làm thế nào để nhận chứng nhận/bằng khen?",
            a: "Các chứng nhận số (Digital Certificate PDF) kèm chữ ký số ban tổ chức có thể tải xuống trực tiếp thông qua Hồ sơ cá nhân (Profile) của từng thành viên đạt giải."
        }
    ];

    const toggleFaq = (index) => {
        setActiveFaq(activeFaq === index ? null : index);
    };

    return (
        <main className="cyber-container cyber-grid-overlay cyber-scanlines relative min-h-screen text-slate-200 overflow-hidden py-10 px-4 sm:px-6 md:px-8">
            {/* Ambient Spotlights */}
            <div className="cyber-spotlight cyber-spotlight--cyan" />
            <div className="cyber-spotlight cyber-spotlight--magenta" />

            {/* HERO SECTION: Cyber Dashboard & Terminal */}
            <section className="max-w-[1240px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-center py-12 md:py-20 relative z-10 border-b border-slate-900/60 pb-20">
                
                {/* Left Side: Cyber Title & Countdown */}
                <div className="lg:col-span-7 space-y-8 animate-fade-up">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded border border-cyan-500/30 bg-cyan-950/20 text-xs font-black tracking-widest text-cyan-400 uppercase">
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                        Live Connection
                    </div>

                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.1] text-white">
                        DECODE THE<br />
                        <span className="bg-gradient-to-r from-cyan-400 via-indigo-400 to-pink-500 bg-clip-text text-transparent cyber-glow-cyan">
                            FUTURE WITH SEAL
                        </span>
                    </h1>

                    <p className="text-sm sm:text-base text-slate-400 font-medium leading-relaxed max-w-2xl">
                        {featuredEvent ? (
                            <>
                                Đang trực quan hóa giải đấu: <strong className="text-white">{featuredEvent.name}</strong>. 
                                {phase.key === 'registration'
                                    ? ` Cổng đăng ký hệ thống đang mở đến ngày ${formatDateTime(featuredEvent.regEndDate)}. Hãy lập đội và tải lên mã nguồn dự thi của bạn.`
                                    : phase.key === 'running'
                                    ? ` Giải đấu đang diễn ra. Các đội thi đang phát triển sản phẩm trong môi trường ảo từ ${formatDateTime(featuredEvent.eventStartDate)}.`
                                    : ` Sự kiện đã khép lại thành công tốt đẹp vào lúc ${formatDateTime(featuredEvent.eventEndDate)}.`}
                            </>
                        ) : (
                            "Hệ thống quản lý Hackathon tự động hóa toàn diện. Nơi chuyển đổi ý tưởng công nghệ thành sản phẩm thực chiến."
                        )}
                    </p>

                    {/* LED Countdown Box */}
                    {countdown && featuredEvent && (
                        <div className="space-y-3">
                            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Time remaining to launch</span>
                            <div className="flex flex-wrap gap-4 items-center">
                                {countdown.map((item) => (
                                    <div key={item.label} className="border border-slate-800 bg-[#070b19]/80 rounded-xl p-4 min-w-20 text-center shadow-lg relative overflow-hidden group">
                                        <div className="absolute top-0 left-0 right-0 h-[2px] bg-cyan-500/50" />
                                        <p className="text-3xl font-mono font-black text-cyan-400 cyber-glow-cyan leading-none">
                                            {String(item.value).padStart(2, '0')}
                                        </p>
                                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 block mt-2">{item.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex flex-wrap items-center gap-4 pt-4">
                        <Link to={isEnded ? '/leaderboard' : `/my-team?registerEventId=${featuredEvent?.id}`} className="px-8 py-3.5 rounded border border-cyan-500 bg-cyan-950/20 text-cyan-400 hover:bg-cyan-500 hover:text-black font-extrabold text-sm uppercase tracking-wider transition-all duration-300 shadow-[0_0_20px_rgba(6,182,212,0.15)] hover:shadow-[0_0_30px_rgba(6,182,212,0.4)]">
                            {isEnded ? 'Xem Bảng Xếp Hạng' : 'Đăng ký tham gia'}
                        </Link>
                        <Link to="/events" className="px-8 py-3.5 rounded border border-slate-700 bg-slate-900/40 text-slate-300 hover:bg-slate-800 font-extrabold text-sm uppercase tracking-wider transition-all duration-200">
                            Xem tất cả sự kiện
                        </Link>
                    </div>
                </div>

                {/* Right Side: Animated Mock Cyber Terminal */}
                <div className="lg:col-span-5 animate-fade-up" style={{ animationDelay: '150ms' }}>
                    <div className="border border-slate-800 bg-[#030712]/90 rounded-2xl overflow-hidden shadow-2xl relative">
                        {/* Terminal Header */}
                        <div className="bg-slate-950/90 border-b border-slate-800/80 px-4 py-3.5 flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                                <span className="w-3 h-3 rounded-full bg-red-500/70" />
                                <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
                                <span className="w-3 h-3 rounded-full bg-green-500/70" />
                            </div>
                            <span className="text-[10px] font-mono font-bold tracking-widest text-slate-500 uppercase">seal-terminal v2.0</span>
                            <div className="w-10" />
                        </div>
                        {/* Terminal Window */}
                        <div className="p-6 font-mono text-xs sm:text-sm h-[320px] overflow-y-auto space-y-2.5 text-cyan-400 scrollbar-thin">
                            <div>
                                <span className="text-pink-500">guest@seal-network:~$</span>
                                <span className="text-white ml-2">{terminalInput}</span>
                                <span className="cyber-cursor" />
                            </div>
                            {terminalLogs.map((log, index) => {
                                let color = 'text-cyan-400';
                                if (log.includes('[SYSTEM]')) color = 'text-purple-400';
                                if (log.includes('[SUCCESS]')) color = 'text-emerald-400';
                                if (log.includes('[API]')) color = 'text-yellow-400';
                                return (
                                    <div key={index} className={`${color} leading-relaxed`}>
                                        {log}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </section>

            {/* KEY NUMBERS: Cyber Bento Grid */}
            <section className="max-w-[1240px] mx-auto py-20 relative z-10 border-b border-slate-900/60">
                <div className="text-center mb-16 animate-fade-up">
                    <span className="text-[10px] font-black uppercase tracking-[0.25em] bg-gradient-to-r from-cyan-400 to-indigo-500 bg-clip-text text-transparent">System Telemetry</span>
                    <h2 className="text-3xl font-black tracking-tight text-white mt-2">Bảng Số Liệu Hackathon</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 animate-fade-up" style={{ animationDelay: '100ms' }}>
                    {/* Grid Card 1: Prize Pool (Spans 8 columns on desktop) */}
                    <div className="cyber-card md:col-span-8 rounded-2xl p-8 flex flex-col sm:flex-row items-center gap-8 bg-slate-950/40">
                        <div className="w-16 h-16 rounded-xl border border-cyan-500/20 bg-cyan-950/20 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
                            <svg className="w-8 h-8 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div className="text-center sm:text-left space-y-2">
                            <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400">Total Prize Pool Allocation</span>
                            <h3 className="text-4xl font-black text-white cyber-glow-cyan">50.000.000+ VNĐ</h3>
                            <p className="text-sm text-slate-400 leading-relaxed max-w-xl">Hệ thống giải thưởng minh bạch bao gồm tiền mặt, các gói học bổng lập trình chuyên sâu, cùng cơ hội tuyển dụng đặc cách từ mạng lưới doanh nghiệp đối tác SEAL.</p>
                        </div>
                    </div>

                    {/* Grid Card 2: Teams Count (Spans 4 columns) */}
                    <div className="cyber-card md:col-span-4 rounded-2xl p-8 flex flex-col justify-between">
                        <div className="w-12 h-12 rounded-lg border border-purple-500/20 bg-purple-950/20 flex items-center justify-center shadow-[0_0_15px_rgba(147,51,234,0.1)]">
                            <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <div className="mt-8 space-y-1">
                            <span className="text-[10px] font-black uppercase tracking-wider text-purple-400">Registered Teams</span>
                            <h3 className="text-3xl font-black text-white">24+ Đội Thi</h3>
                            <p className="text-[11px] text-slate-400 mt-2">Mạng lưới tài năng trẻ hội tụ từ nhiều trường đại học công nghệ hàng đầu toàn quốc.</p>
                        </div>
                    </div>

                    {/* Grid Card 3: Seasons (Spans 4 columns) */}
                    <div className="cyber-card md:col-span-4 rounded-2xl p-8 flex flex-col justify-between">
                        <div className="w-12 h-12 rounded-lg border border-emerald-500/20 bg-emerald-950/20 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                            <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <div className="mt-8 space-y-1">
                            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">Frequency cycle</span>
                            <h3 className="text-3xl font-black text-white">03 Mùa / Năm</h3>
                            <p className="text-[11px] text-slate-400 mt-2">Khởi động liên tục qua các học kỳ chính khóa: Spring, Summer và Fall.</p>
                        </div>
                    </div>

                    {/* Grid Card 4: Mentors (Spans 8 columns) */}
                    <div className="cyber-card md:col-span-8 rounded-2xl p-8 flex flex-col sm:flex-row items-center gap-8 bg-slate-950/40">
                        <div className="w-16 h-16 rounded-xl border border-pink-500/20 bg-pink-950/20 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(236,72,153,0.1)]">
                            <svg className="w-8 h-8 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                        </div>
                        <div className="text-center sm:text-left space-y-2">
                            <span className="text-[10px] font-black uppercase tracking-wider text-pink-400">Experts Panel</span>
                            <h3 className="text-4xl font-black text-white cyber-glow-magenta">15+ Mentor & Giám Khảo</h3>
                            <p className="text-sm text-slate-400 leading-relaxed max-w-xl">Hội đồng ban giám khảo độc lập và đội ngũ chuyên gia hướng dẫn kỹ thuật cao cấp, đảm bảo sự công bằng và hỗ trợ tối đa cho sản phẩm đội thi.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* PROCESS OR WINNERS CORNER */}
            {isEnded ? (
                /* Hall of Fame - Cyber Winner Layout */
                <section className="max-w-[1240px] mx-auto py-20 relative z-10 border-b border-slate-900/60">
                    <div className="text-center mb-16 animate-fade-up">
                        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-500">Hall Of Fame</span>
                        <h2 className="text-3xl font-black text-white mt-2">Bảng Vàng Vinh Danh</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch max-w-5xl mx-auto animate-fade-up">
                        {winners.map((team, index) => {
                            const config = [
                                { border: 'border-amber-500/50 bg-[#0d0a02]/40', glow: 'cyber-glow-cyan', badge: '🥇 Winner (Vô địch)', color: 'text-amber-400' },
                                { border: 'border-slate-500/40 bg-[#04060e]/40', glow: 'text-slate-100', badge: '🥈 Runner-up (Á quân 1)', color: 'text-slate-300' },
                                { border: 'border-orange-500/40 bg-[#090502]/40', glow: 'text-orange-400', badge: '🥉 Third Place (Á quân 2)', color: 'text-orange-400' }
                            ][index] || { border: 'border-slate-800/80 bg-[#05070f]/40', glow: 'text-cyan-400', badge: `Top ${index + 1}`, color: 'text-cyan-400' };

                            return (
                                <div key={`${team.teamName}-${index}`} className={`cyber-card border ${config.border} rounded-2xl p-8 flex flex-col justify-between relative`}>
                                    <div>
                                        <span className={`inline-block px-3 py-1 rounded-sm border border-current text-[10px] font-black uppercase ${config.color} mb-6`}>
                                            {config.badge}
                                        </span>
                                        <h3 className="text-2xl font-mono font-black text-white tracking-tight uppercase">{team.teamName}</h3>
                                        <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest block mt-1">{team.track || 'Track Chung'}</span>

                                        <div className="mt-8 border-t border-slate-800/60 pt-4 space-y-2">
                                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">Crew members:</span>
                                            <p className="text-xs text-slate-300 font-semibold leading-relaxed">
                                                {(team.members || []).map(m => m.fullName || m.email).join(', ') || 'N/A'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-8 border-t border-slate-800/60 pt-4 flex items-center justify-between">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase">Score Matrix:</span>
                                        <span className="text-2xl font-mono font-black text-white">{team.score || 0} PTS</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            ) : (
                /* Cyber Participate Steps (Roadmap) */
                <section className="max-w-[1240px] mx-auto py-20 relative z-10 border-b border-slate-900/60">
                    <div className="text-center mb-16 animate-fade-up">
                        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-cyan-400">Operation Protocol</span>
                        <h2 className="text-3xl font-black text-white mt-2">Quy Trình Thi Đấu</h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto animate-fade-up">
                        {[
                            { step: "PROTOCOL_01", title: "Lập Đội Thi Đấu", desc: "Khởi tạo tài khoản, thành lập đội (2-5 thành viên) và lựa chọn chuyên mục công nghệ dự thi." },
                            { step: "PROTOCOL_02", title: "Tuyển Mộ Thành Viên", desc: "Mở rộng sảnh đợi để tìm kiếm nhân lực thiết kế/lập trình còn trống cho đội của bạn." },
                            { step: "PROTOCOL_03", title: "Kích Hoạt Đề & Mentor", desc: "Đề bài và hệ thống chatbot tương tác với Mentor được kích hoạt tức thời khi giải đấu nổ ra." },
                            { step: "PROTOCOL_04", title: "Nộp Bài Sandbox", desc: "Trưởng nhóm thực hiện tải tệp tin và đường dẫn dự án lên hệ thống lưu trữ dự thi." },
                            { step: "PROTOCOL_05", title: "Đánh Giá Tiêu Chí", desc: "Thang điểm được ghi vết tức thời vào sổ cái giám sát, minh bạch 100% lịch sử sửa điểm." },
                            { step: "PROTOCOL_06", title: "Cấp Chứng Nhận Số", desc: "Hệ thống kiểm tra kết quả xếp hạng và tự động phát hành Bằng khen PDF trực tiếp tại Profile." }
                        ].map((item, idx) => (
                            <div key={idx} className="cyber-card rounded-xl p-8 relative group bg-[#070b19]/30">
                                <div className="absolute top-6 right-6 text-2xl font-mono font-black text-slate-800/30 group-hover:text-cyan-500/20 transition-all duration-300">
                                    {item.step}
                                </div>
                                <h3 className="text-base font-black text-white mb-3 tracking-wide group-hover:text-cyan-400 transition-colors">{item.title}</h3>
                                <p className="text-[11px] leading-relaxed text-slate-400">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* CYBER FAQs SECTION */}
            <section className="max-w-[800px] mx-auto py-20 relative z-10 border-b border-slate-900/60">
                <div className="text-center mb-12 animate-fade-up">
                    <span className="text-[10px] font-black uppercase tracking-[0.25em] text-pink-500">Secure FAQ Channels</span>
                    <h2 className="text-3xl font-black text-white mt-2">Hỗ Trợ Kỹ Thuật</h2>
                </div>

                <div className="space-y-4 animate-fade-up">
                    {faqData.map((faq, index) => {
                        const isOpen = activeFaq === index;
                        return (
                            <div key={index} className={`border rounded-lg overflow-hidden transition-all duration-300 ${isOpen ? 'border-cyan-500 bg-slate-950/80 shadow-[0_0_15px_rgba(6,182,212,0.1)]' : 'border-slate-800 bg-[#070b19]/40'}`}>
                                <button
                                    type="button"
                                    onClick={() => toggleFaq(index)}
                                    className="w-full px-6 py-5 flex items-center justify-between text-left font-mono font-bold text-xs sm:text-sm text-slate-200 hover:text-cyan-400 transition-colors"
                                >
                                    <span>{faq.q}</span>
                                    <span className={`text-sm transition-transform duration-300 ${isOpen ? 'rotate-45 text-cyan-400' : 'text-slate-500'}`}>
                                        {isOpen ? '✕' : '＋'}
                                    </span>
                                </button>
                                {isOpen && (
                                    <div className="px-6 pb-5 text-[11px] sm:text-xs leading-relaxed text-slate-400 border-t border-slate-900 pt-4 animate-fade-down font-sans">
                                        {faq.a}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* PARTNERS BANNER */}
            <section className="max-w-[1240px] mx-auto py-16 relative z-10">
                <p className="text-center text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 mb-10">
                    MẠNG LƯỚI ĐỐI TÁC CỦA CHÚNG TÔI
                </p>
                <div className="flex flex-wrap items-center justify-center gap-x-16 gap-y-8 opacity-50 hover:opacity-75 transition-opacity duration-300">
                    {[
                        { name: "Đại học FPT", logo: logoFpt },
                        { name: "FPT Software", logo: logoFptSoftware },
                        { name: "VPBank", logo: logoVpBank },
                        { name: "Techcombank", logo: logoTechcombank },
                        { name: "197", logo: logo197 }
                    ].map((partner, i) => (
                        partner.logo ? (
                            <img 
                                key={i} 
                                src={partner.logo} 
                                alt={partner.name} 
                                className="h-10 w-auto object-contain hover:scale-105 transition-transform duration-200 cursor-default filter grayscale invert brightness-200" 
                            />
                        ) : (
                            <span key={i} className="text-sm sm:text-base font-mono font-black tracking-widest text-slate-400 hover:text-cyan-400 transition-colors cursor-default">
                                {partner.name.toUpperCase()}
                            </span>
                        )
                    ))}
                </div>
            </section>
        </main>
    );
}
