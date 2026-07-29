import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import heroCourt from '../assets/1.jpg';
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

    const faqData = [
        {
            q: "Sinh viên trường ngoài có được tham gia SEAL Hackathon không?",
            a: "Hoàn toàn được. Các giải đấu SEAL mở rộng cửa cho mọi đội thi liên trường, sinh viên tự do hoặc hỗn hợp từ các trường đại học đối tác khác."
        },
        {
            q: "Ai có quyền nộp và cập nhật bài dự thi của đội?",
            a: "Quyền nộp và cập nhật các tệp tin bài thi, link sản phẩm thuộc về duy nhất Trưởng nhóm (Team Leader) để đảm bảo tính nhất quán của dữ liệu."
        },
        {
            q: "Cách thức chấm điểm và đảm bảo tính minh bạch như thế nào?",
            a: "Mọi thành viên chấm điểm độc lập dựa trên thang tiêu chí rõ ràng. Bất cứ điều chỉnh điểm số nào từ ban giám khảo đều bắt buộc phải nhập lý do và được lưu vết tự động trong nhật ký Audit Log hệ thống."
        },
        {
            q: "Tôi có thể liên hệ và trao đổi với Mentor hỗ trợ ở đâu?",
            a: "Kênh trò chuyện thời gian thực sẽ tự động kích hoạt kết nối đội thi với Mentor ngay sau khi ban tổ chức gán cố vấn học thuật cho hạng mục thi."
        },
        {
            q: "Các đội đạt giải làm thế nào để nhận chứng nhận/bằng khen?",
            a: "Tất cả các thành viên của đội đạt giải đều có quyền xuất tệp Chứng nhận số (Digital Certificate PDF) có mã xác thực trực tiếp tại trang Hồ sơ cá nhân."
        }
    ];

    const toggleFaq = (index) => {
        setActiveFaq(activeFaq === index ? null : index);
    };

    return (
        <main className="mlh-grid-container relative min-h-screen text-slate-900 overflow-hidden font-sans pb-20">
            {/* MLH Grid Background */}
            <div className="mlh-grid-overlay" />

            {/* HERO SECTION: 2-Column Responsive Layout */}
            <section className="max-w-[1240px] mx-auto px-6 py-12 md:py-24 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                
                {/* Left Column: Bold Blue Typography, Monospace Subtitle, Yellow CTA Button, Isometric SVG */}
                <div className="lg:col-span-7 flex flex-col justify-center space-y-9 text-left">
                    {/* Live Event Indicator */}
                    {featuredEvent && (
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-blue-50 border border-blue-200/40 text-[10px] font-black uppercase tracking-widest text-[#1854C4] w-fit">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                            {phase.label}
                        </div>
                    )}

                    <h1 className="text-[#1854C4] text-5xl sm:text-6xl md:text-[68px] font-black leading-[1.05] tracking-tight">
                        The World's<br />
                        Largest Developer<br />
                        Community
                    </h1>

                    <p className="text-slate-600 font-mono tracking-wide text-xs sm:text-sm leading-relaxed max-w-xl">
                        Hackathons, fellowships, and DEV's online community. 
                        5 million software creators learn, build, and share together.
                    </p>

                    {/* Countdown indicator */}
                    {countdown && featuredEvent && (
                        <div className="flex items-center gap-6 font-mono text-slate-500 text-xs py-2 border-y border-slate-100 w-fit">
                            <span className="font-bold uppercase tracking-wider text-slate-400">Launch Clock:</span>
                            <div className="flex gap-4">
                                {countdown.map((c) => (
                                    <span key={c.label}>
                                        <strong className="text-black font-extrabold">{String(c.value).padStart(2, '0')}</strong>{c.label[0]}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    <div>
                        <Link 
                            to={isEnded ? '/leaderboard' : `/my-team?registerEventId=${featuredEvent?.id}`} 
                            className="inline-flex items-center justify-between bg-[#f1a81f] text-black font-extrabold text-xs uppercase tracking-wider px-6 py-4 rounded-sm w-[220px] hover:bg-[#d89218] transition-colors shadow-[0_4px_12px_rgba(241,168,31,0.2)]"
                        >
                            <span>Attend an Event</span>
                            <span className="text-sm font-light">→</span>
                        </Link>
                    </div>

                    {/* Left Bottom: Isometric 3D MLH SVG Illustration */}
                    <div className="pt-6">
                        <svg className="w-[360px] h-[220px] hover:scale-102 transition-transform duration-500" viewBox="0 0 360 220" fill="none" xmlns="http://www.w3.org/2000/svg">
                            {/* --- RED BLOCK (Letter M) --- */}
                            <g transform="translate(10, 110)">
                                {/* Pillar 1 */}
                                <polygon points="30,20 45,28 45,78 30,70" fill="#dc2626" />
                                <polygon points="45,28 60,20 60,70 45,78" fill="#991b1b" />
                                <polygon points="45,20 60,28 45,36 30,28" fill="#ef4444" />
                                {/* Diagonal connecting 1 */}
                                <polygon points="60,40 75,48 75,70 60,62" fill="#dc2626" />
                                <polygon points="75,48 90,40 90,62 75,70" fill="#991b1b" />
                                <polygon points="75,40 90,48 75,56 60,48" fill="#ef4444" />
                                {/* Diagonal connecting 2 */}
                                <polygon points="90,40 105,48 105,70 90,62" fill="#dc2626" />
                                <polygon points="105,48 120,40 120,62 105,70" fill="#991b1b" />
                                <polygon points="105,40 120,48 105,56 90,48" fill="#ef4444" />
                                {/* Pillar 2 */}
                                <polygon points="120,20 135,28 135,78 120,70" fill="#dc2626" />
                                <polygon points="135,28 150,20 150,70 135,78" fill="#991b1b" />
                                <polygon points="135,20 150,28 135,36 120,28" fill="#ef4444" />
                                {/* Little climbing figure */}
                                <circle cx="35" cy="12" r="3" fill="#000000" />
                                <line x1="35" y1="15" x2="35" y2="22" stroke="#000000" strokeWidth="2" />
                                <line x1="35" y1="18" x2="30" y2="15" stroke="#000000" strokeWidth="1.5" />
                                <line x1="35" y1="18" x2="40" y2="15" stroke="#000000" strokeWidth="1.5" />
                            </g>

                            {/* --- BLUE BLOCK (Letter L) --- */}
                            <g transform="translate(145, 80)">
                                {/* Vertical Pillar */}
                                <polygon points="20,10 35,18 35,68 20,60" fill="#2563eb" />
                                <polygon points="35,18 50,10 50,60 35,68" fill="#1e40af" />
                                <polygon points="35,10 50,18 35,26 20,18" fill="#3b82f6" />
                                {/* Bottom Base extending to front-right */}
                                <polygon points="35,68 50,60 50,75 35,83" fill="#2563eb" />
                                <polygon points="50,60 65,68 65,75 50,83" fill="#1e40af" />
                                <polygon points="50,68 65,60 50,52 35,60" fill="#3b82f6" />
                                {/* Little sitting figure */}
                                <circle cx="35" cy="-2" r="3" fill="#000000" />
                                <line x1="35" y1="1" x2="35" y2="8" stroke="#000000" strokeWidth="2" />
                            </g>

                            {/* --- YELLOW BLOCK (Letter H) --- */}
                            <g transform="translate(200, 50)">
                                {/* Pillar 1 */}
                                <polygon points="20,10 35,18 35,98 20,90" fill="#d97706" />
                                <polygon points="35,18 50,10 50,90 35,98" fill="#92400e" />
                                <polygon points="35,10 50,18 35,26 20,18" fill="#fbbf24" />
                                {/* Crossbar */}
                                <polygon points="50,40 65,48 65,60 50,52" fill="#d97706" />
                                <polygon points="65,48 80,40 80,52 65,60" fill="#92400e" />
                                <polygon points="65,40 80,48 65,56 50,48" fill="#fbbf24" />
                                {/* Pillar 2 */}
                                <polygon points="80,10 95,18 95,98 80,90" fill="#d97706" />
                                <polygon points="95,18 110,10 110,90 95,98" fill="#92400e" />
                                <polygon points="95,10 110,18 95,26 80,18" fill="#fbbf24" />
                                {/* Ladder Lines */}
                                <line x1="83" y1="35" x2="83" y2="85" stroke="#4b5563" strokeWidth="1.5" />
                                <line x1="88" y1="38" x2="88" y2="88" stroke="#4b5563" strokeWidth="1.5" />
                                <line x1="83" y1="45" x2="88" y2="48" stroke="#4b5563" strokeWidth="1.5" />
                                <line x1="83" y1="55" x2="88" y2="58" stroke="#4b5563" strokeWidth="1.5" />
                                <line x1="83" y1="65" x2="88" y2="68" stroke="#4b5563" strokeWidth="1.5" />
                                <line x1="83" y1="75" x2="88" y2="78" stroke="#4b5563" strokeWidth="1.5" />
                                {/* Little climbing figure */}
                                <circle cx="85" cy="50" r="3" fill="#000000" />
                                <line x1="85" y1="53" x2="82" y2="60" stroke="#000000" strokeWidth="2" />
                            </g>
                        </svg>
                    </div>
                </div>

                {/* Right Column: Big rounded vertical photo card */}
                <div className="lg:col-span-5 flex justify-center animate-fade-up" style={{ animationDelay: '150ms' }}>
                    <div className="w-full max-w-[420px] aspect-[4/5] sm:aspect-[3/4] rounded-[24px] sm:rounded-[32px] overflow-hidden shadow-2xl bg-slate-100 border-4 border-white relative group">
                        <img 
                            src={heroCourt} 
                            alt="MLH Hackathon Event Floor" 
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                        />
                    </div>
                </div>
            </section>

            {/* KEY NUMBERS: Flat Minimal Layout */}
            <section className="max-w-[1240px] mx-auto px-6 py-20 relative z-10 border-t border-slate-100">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12 text-left">
                    <div className="space-y-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">Telemetry // 01</span>
                        <h3 className="text-4xl font-extrabold text-[#1854C4]">50 Tr+</h3>
                        <p className="text-xs text-slate-500">Tổng giải thưởng bằng tiền mặt & học bổng hỗ trợ phát triển.</p>
                    </div>
                    <div className="space-y-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">Telemetry // 02</span>
                        <h3 className="text-4xl font-extrabold text-[#1854C4]">24+ Teams</h3>
                        <p className="text-xs text-slate-500">Đội thi lập trình sáng tạo từ mạng lưới Đại học đối tác liên kết.</p>
                    </div>
                    <div className="space-y-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">Telemetry // 03</span>
                        <h3 className="text-4xl font-extrabold text-[#1854C4]">03 Seasons</h3>
                        <p className="text-xs text-slate-500">Chu kỳ tổ chức thường niên tại Spring, Summer và Fall học kỳ.</p>
                    </div>
                    <div className="space-y-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">Telemetry // 04</span>
                        <h3 className="text-4xl font-extrabold text-[#1854C4]">15+ Experts</h3>
                        <p className="text-xs text-slate-500">Hội đồng cố vấn Mentor và ban giám khảo độc lập chấm điểm.</p>
                    </div>
                </div>
            </section>

            {/* EVENT PROCESS OR WINNERS CORNER */}
            {isEnded ? (
                /* Hall of Fame */
                <section className="max-w-[1240px] mx-auto px-6 py-20 relative z-10 border-t border-slate-100">
                    <div className="text-left mb-16">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 font-mono">Archive // Leaderboard</span>
                        <h2 className="text-3xl font-extrabold text-black mt-2">Bảng Vàng Vinh Danh</h2>
                    </div>

                    <div className="grid gap-8 md:grid-cols-3 items-stretch max-w-5xl mx-auto">
                        {winners.map((team, index) => {
                            const config = [
                                { badge: '🥇 Winner (Vô địch)', text: 'text-black font-extrabold' },
                                { badge: '🥈 Runner-up (Á quân 1)', text: 'text-slate-700' },
                                { badge: '🥉 Third Place (Á quân 2)', text: 'text-slate-600' }
                            ][index] || { badge: `Top ${index + 1}`, text: 'text-slate-600' };

                            return (
                                <div key={`${team.teamName}-${index}`} className="border border-slate-100 bg-white rounded-2xl p-8 flex flex-col justify-between space-y-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                                    <div className="space-y-4">
                                        <span className="inline-block px-3 py-1 rounded bg-slate-50 border border-slate-200 text-[10px] font-black uppercase text-slate-600 tracking-wider">
                                            {config.badge}
                                        </span>
                                        <h3 className="text-2xl font-black uppercase tracking-tight text-black">{team.teamName}</h3>
                                        <span className="text-xs font-bold text-[#1854C4] block">{team.track || 'Track Chung'}</span>

                                        <div className="border-t border-dashed border-slate-100 pt-4 space-y-1">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Thành viên:</span>
                                            <p className="text-xs text-slate-500 leading-relaxed">
                                                {(team.members || []).map(m => m.fullName || m.email).join(', ') || 'N/A'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-baseline justify-between border-t border-slate-100 pt-4">
                                        <span className="text-[9px] font-black text-slate-400 uppercase">Tích lũy</span>
                                        <span className="text-2xl font-extrabold text-black">{team.score || 0} PTS</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            ) : (
                /* Protocol Steps (Roadmap) */
                <section className="max-w-[1240px] mx-auto px-6 py-20 relative z-10 border-t border-slate-100">
                    <div className="text-left mb-16">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 font-mono">Operation Guidelines</span>
                        <h2 className="text-3xl font-extrabold text-black mt-2">Quy Trình Thi Đấu</h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 max-w-5xl mx-auto">
                        {[
                            { step: "01", title: "Lập Đội Thi Đấu", desc: "Đăng ký tài khoản và thành lập đội thi (2-5 thành viên) trên hệ thống." },
                            { step: "02", title: "Tuyển Mộ Nhân Lực", desc: "Sử dụng sảnh đợi Lobby để gửi lời mời tuyển dụng hoặc xin gia nhập các nhóm còn chỗ." },
                            { step: "03", title: "Kích Hoạt Đề & Mentor", desc: "Đề bài chính thức mở tự động. Hệ thống gán cố vấn kỹ thuật đồng hành cùng nhóm." },
                            { step: "04", title: "Nộp Bài Sandbox", desc: "Trưởng nhóm thực hiện tải tệp tin và đường dẫn dự án lên hệ thống trước hạn kết thúc." },
                            { step: "05", title: "Đánh Giá Minh Bạch", desc: "Ban giám khảo chấm điểm độc lập. Nhật ký Audit Log tự động ghi nhận mọi sự điều chỉnh." },
                            { step: "06", title: "Cấp Chứng Nhận Số", desc: "Hồ sơ cá nhân tự động phát hành Bằng khen PDF trực tiếp có chữ ký số xác thực." }
                        ].map((item, idx) => (
                            <div key={idx} className="border-t border-slate-200/80 pt-6 space-y-2 hover:border-[#1854C4] transition-colors duration-300">
                                <span className="text-[10px] font-bold text-slate-400 font-mono tracking-widest block">{item.step} // protocol</span>
                                <h3 className="text-base font-extrabold text-black tracking-tight">{item.title}</h3>
                                <p className="text-xs leading-relaxed text-slate-500">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* FAQs Accordion */}
            <section className="max-w-[800px] mx-auto px-6 py-20 relative z-10 border-t border-slate-100">
                <div className="text-left mb-12">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 font-mono">FAQ DATABASE</span>
                    <h2 className="text-3xl font-extrabold text-black mt-2">Hỗ Trợ Kỹ Thuật</h2>
                </div>

                <div className="space-y-0 border-t border-slate-200/85">
                    {faqData.map((faq, index) => {
                        const isOpen = activeFaq === index;
                        return (
                            <div key={index} className="border-b border-slate-200/85">
                                <button
                                    type="button"
                                    onClick={() => toggleFaq(index)}
                                    className="w-full py-6 flex items-center justify-between text-left font-bold text-sm sm:text-base text-black hover:text-[#1854C4] transition-colors"
                                >
                                    <span>{faq.q}</span>
                                    <span className="text-xs text-slate-400 font-mono font-bold">
                                        {isOpen ? 'CLOSE' : 'OPEN'}
                                    </span>
                                </button>
                                {isOpen && (
                                    <div className="pb-6 text-xs sm:text-sm leading-relaxed text-slate-500 animate-fade-up font-normal font-sans">
                                        {faq.a}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* PARTNERS BANNER */}
            <section className="max-w-[1240px] mx-auto px-6 py-16 border-t border-slate-100 relative z-10">
                <p className="text-center text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-12 font-mono">
                    Mạng lưới đối tác liên kết
                </p>
                <div className="flex flex-wrap items-center justify-center gap-x-20 gap-y-8 opacity-50 hover:opacity-75 transition-opacity duration-300">
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
                                className="h-8 w-auto object-contain filter grayscale" 
                            />
                        ) : (
                            <span key={i} className="text-xs sm:text-sm font-mono font-black tracking-widest text-slate-400 cursor-default">
                                {partner.name.toUpperCase()}
                            </span>
                        )
                    ))}
                </div>
            </section>
        </main>
    );
}
