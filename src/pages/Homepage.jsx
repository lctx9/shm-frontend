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

function Stat({ value, label }) {
    return (
        <div className="min-w-24 rounded-2xl border border-white/40 bg-white/40 backdrop-blur-md px-5 py-4 text-center shadow-[0_8px_30px_rgba(31,38,135,0.02)] transition-all duration-300 hover:shadow-[0_8px_30px_rgba(36,104,238,0.08)] hover:scale-105 border-t-white/60 border-l-white/60">
            <p className="text-3xl font-black bg-gradient-to-r from-[var(--shield-blue)] to-indigo-600 bg-clip-text text-transparent">
                {String(value).padStart(2, '0')}
            </p>
            <p className="mt-1 text-[10px] font-black uppercase tracking-[0.16em] text-[var(--shield-copy)]">{label}</p>
        </div>
    );
}

function EditorialEventTitle({ name }) {
    const words = String(name || '').trim().split(/\s+/);
    const accent = words.pop();
    return <>{words.join(' ')}{words.length > 0 && <br />}<span className="bg-gradient-to-r from-[var(--shield-blue)] to-indigo-600 bg-clip-text text-transparent italic pr-2">{accent}</span></>;
}

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
            a: "Hoàn toàn được! Các giải đấu SEAL mở rộng cửa cho sinh viên từ nhiều trường đối tác. Đội thi có thể gồm toàn bộ sinh viên Đại học FPT, hỗn hợp sinh viên FPT và sinh viên ngoài trường, hoặc 100% sinh viên đến từ các trường đại học đối tác cùng tham gia tranh tài."
        },
        {
            q: "Ai có quyền nộp và cập nhật bài dự thi của đội?",
            a: "Chỉ duy nhất Team Leader (Trưởng nhóm) mới có quyền tạo và chỉnh sửa bài nộp (Submissions). Trưởng nhóm có thể tải lên bài làm mới hoặc thay thế file/link dự án nhiều lần trước hạn chót (Deadline) của từng vòng đấu."
        },
        {
            q: "Cách thức chấm điểm và đảm bảo tính minh bạch như thế nào?",
            a: "Giám khảo (Judge) sẽ chấm điểm độc lập dựa trên khung tiêu chí (Rubric) công khai do Coordinator thiết lập. Để chống gian lận và đảm bảo tính minh bạch tối đa, hệ thống tích hợp Audit Log tự động lưu vết mọi thao tác chỉnh sửa điểm số: ai sửa, sửa điểm của đội nào, điểm cũ/mới và lý do thay đổi cụ thể."
        },
        {
            q: "Tôi có thể liên hệ và trao đổi với Mentor hỗ trợ ở đâu?",
            a: "Sau khi ban tổ chức phân công Mentor cho từng đội/hạng mục thi, các thành viên đội thi có thể truy cập trực tiếp vào mục 'Trò chuyện' (Chat) để trao đổi thông tin, nhận tư vấn học thuật và định hướng kỹ thuật theo thời gian thực từ Mentor."
        },
        {
            q: "Các đội đạt giải làm thế nào để nhận chứng nhận/bằng khen?",
            a: "Các đội thi xuất sắc đạt giải Nhất, Nhì, Ba của giải đấu có thể truy cập vào Hồ sơ cá nhân (Profile), nhấp chọn thông tin giải thưởng đã nhận để xuất file PDF bằng khen số (Digital Certificate) trực tiếp từ hệ thống."
        }
    ];

    const toggleFaq = (index) => {
        setActiveFaq(activeFaq === index ? null : index);
    };

    return (
        <main className="bg-transparent text-[var(--shield-ink)] min-h-screen">
            {/* Hero Section with Aurora Floating Backdrop */}
            <section className="hero-stage aurora-container relative overflow-hidden min-h-[720px] flex items-center py-12">
                {/* Aurora Mesh Gradient Spheres */}
                <div className="aurora-bg">
                    <div className="aurora-sphere aurora-sphere--1" />
                    <div className="aurora-sphere aurora-sphere--2" />
                    <div className="aurora-sphere aurora-sphere--3" />
                </div>

                <div className="hero-bg absolute inset-0 z-0 bg-center bg-cover opacity-[0.04] mix-blend-overlay" style={{ backgroundImage: `url(${heroCourt})` }} />
                <div className="hero-overlay absolute inset-0 z-10 pointer-events-none bg-gradient-to-b from-transparent to-[var(--shield-canvas)]" />

                <div className="hero-content relative z-20 w-full max-w-[960px] mx-auto px-5 text-center animate-fade-up">
                    <div className="glass-panel rounded-[32px] p-8 sm:p-12 md:p-16 border-t-white/80 border-l-white/80 shadow-[0_32px_64px_rgba(0,0,0,0.03)]">
                        <p className="inline-flex items-center gap-3 px-5 py-2 rounded-full text-xs sm:text-sm font-black uppercase tracking-wider text-[var(--shield-blue)] bg-white/85 border border-blue-200/40 backdrop-blur-md transition-all duration-300 hover:scale-105 shadow-sm">
                            <span className="pulsing-live-dot shrink-0" />
                            Giải đấu nổi bật
                        </p>
                        
                        <h1 className="hero-title mt-6 text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-[var(--shield-ink)] leading-tight">
                            <EditorialEventTitle name={featuredEvent.name} />
                        </h1>
                        
                        <div className="mt-6 flex justify-center">
                            <span className={`inline-block px-4 py-1.5 rounded-full text-xs font-extrabold tracking-widest border uppercase shadow-sm ${
                                isEnded 
                                    ? 'border-amber-300 bg-amber-50 text-amber-700' 
                                    : 'border-[var(--shield-line)] bg-[var(--shield-blue-soft)]/50 text-[var(--shield-blue)]'
                            }`}>
                                {phase.label}
                            </span>
                        </div>

                        <p className="hero-subtitle mt-6 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed text-[var(--shield-copy)] font-semibold">
                            {phase.key === 'registration'
                                ? `Cổng đăng ký đang mở đến ngày ${formatDateTime(featuredEvent.regEndDate)}. Hãy nhanh chóng chọn hạng mục, lập đội thi và sẵn sàng bước vào thử thách lập trình.`
                                : phase.key === 'running'
                                ? `Giải đấu đang diễn ra từ ${formatDateTime(featuredEvent.eventStartDate)} đến ${formatDateTime(featuredEvent.eventEndDate)}. Các đội thi đang tích cực hoàn thiện sản phẩm.`
                                : `Giải đấu đã khép lại trọn vẹn từ ${formatDateTime(featuredEvent.eventEndDate)}. Cảm ơn toàn bộ thí sinh, mentor và ban giám khảo đã tạo nên một mùa giải SEAL bùng nổ.`}
                        </p>

                        {countdown && (
                            <div className="mt-8 flex flex-wrap justify-center gap-4">
                                {countdown.map((item) => <Stat key={item.label} {...item} />)}
                            </div>
                        )}

                        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                            <Link to={isEnded ? '/leaderboard' : `/my-team?registerEventId=${featuredEvent.id}`} className="px-8 py-3.5 rounded-xl font-bold text-white bg-[var(--shield-blue)] hover:bg-[var(--shield-blue-dark)] shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
                                {isEnded ? 'Xem bảng xếp hạng' : 'Đăng ký tham gia ngay'}
                            </Link>
                            <Link to={`/events/${featuredEvent.id}`} className="px-8 py-3.5 rounded-xl font-bold text-[var(--shield-blue)] bg-white/60 border border-[var(--shield-line)] shadow-sm hover:bg-[var(--shield-blue-soft)] hover:-translate-y-0.5 transition-all duration-200">
                                Xem chi tiết giải đấu
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Key Statistics Section: Asymmetric Bento Grid */}
            <section className="py-20 px-5 max-w-[1180px] mx-auto">
                <div className="text-center mb-16 animate-fade-up">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--shield-blue)]">Về SEAL Hackathon</p>
                    <h2 className="text-3xl sm:text-4xl font-black mt-2 text-[var(--shield-ink)]">Những con số ấn tượng</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-up">
                    {/* Bento Box 1: Tổng giải thưởng (Spans 2 columns on desktop) */}
                    <div className="glass-card rounded-[24px] p-8 md:col-span-2 flex flex-col sm:flex-row items-center gap-8 bg-gradient-to-br from-white/60 to-blue-50/20 border-t-white border-l-white">
                        <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center shrink-0">
                            <svg className="w-10 h-10 text-[var(--shield-blue)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div className="text-center sm:text-left">
                            <span className="text-xs font-extrabold tracking-widest text-[var(--shield-blue)] uppercase">Tổng giải thưởng</span>
                            <h3 className="text-4xl font-black text-[var(--shield-ink)] mt-2">50 Tr+ VNĐ</h3>
                            <p className="text-sm text-[var(--shield-copy)] mt-3 leading-relaxed">Bao gồm tiền mặt, các gói học bổng công nghệ và các chương trình hỗ trợ cố vấn phát triển sản phẩm giá trị cao từ đối tác liên kết doanh nghiệp.</p>
                        </div>
                    </div>

                    {/* Bento Box 2: Đội thi tham gia */}
                    <div className="glass-card rounded-[24px] p-8 flex flex-col justify-between border-t-white border-l-white">
                        <div>
                            <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center mb-6">
                                <svg className="w-8 h-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <span className="text-xs font-extrabold tracking-widest text-indigo-600 uppercase">Quy mô sự kiện</span>
                            <h3 className="text-3xl font-black text-[var(--shield-ink)] mt-2">24+ Đội thi</h3>
                        </div>
                        <p className="text-xs text-[var(--shield-copy)] mt-4 leading-relaxed">Thu hút hàng trăm tài năng trẻ từ Đại học FPT cùng các trường Đại học lớn khu vực cùng tranh tài.</p>
                    </div>

                    {/* Bento Box 3: Số mùa giải */}
                    <div className="glass-card rounded-[24px] p-8 flex flex-col justify-between border-t-white border-l-white">
                        <div>
                            <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-6">
                                <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <span className="text-xs font-extrabold tracking-widest text-emerald-600 uppercase">Tần suất tổ chức</span>
                            <h3 className="text-3xl font-black text-[var(--shield-ink)] mt-2">03 Mùa</h3>
                        </div>
                        <p className="text-xs text-[var(--shield-copy)] mt-4 leading-relaxed">Tổ chức đều đặn 3 mùa mỗi năm: Spring, Summer và Fall đồng hành cùng hành trình sinh viên.</p>
                    </div>

                    {/* Bento Box 4: Giám khảo & Mentor (Spans 2 columns on desktop) */}
                    <div className="glass-card rounded-[24px] p-8 md:col-span-2 flex flex-col sm:flex-row items-center gap-8 bg-gradient-to-br from-white/60 to-emerald-50/10 border-t-white border-l-white">
                        <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center shrink-0">
                            <svg className="w-10 h-10 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                        </div>
                        <div className="text-center sm:text-left">
                            <span className="text-xs font-extrabold tracking-widest text-emerald-600 uppercase">Hội đồng cố vấn</span>
                            <h3 className="text-4xl font-black text-[var(--shield-ink)] mt-2">15+ Mentor & Giám khảo</h3>
                            <p className="text-sm text-[var(--shield-copy)] mt-3 leading-relaxed">Đội ngũ giảng viên kỳ cựu từ trường Đại học và các chuyên gia, kỹ sư trưởng giàu kinh nghiệm thực chiến từ doanh nghiệp.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Timeline Roadmap or Hall of Fame */}
            {isEnded ? (
                /* Hall of Fame (Bảng Vàng Danh Vọng) */
                <section className="py-20 px-5 bg-white/40 border-y border-[var(--shield-line)] backdrop-blur-md">
                    <div className="max-w-[1180px] mx-auto">
                        <div className="text-center mb-16">
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-600">Nhà vô địch</p>
                            <h2 className="text-3xl sm:text-4xl font-black mt-2 text-[var(--shield-ink)]">Bảng vàng vinh danh</h2>
                            <p className="text-sm text-[var(--shield-copy)] mt-3">Những đội thi xuất sắc nhất đã chứng minh năng lực sáng tạo vượt trội trước hội đồng giám khảo.</p>
                        </div>
                        
                        <div className="grid gap-8 md:grid-cols-3 items-stretch max-w-5xl mx-auto">
                            {winners.map((team, index) => {
                                const rankColors = [
                                    { border: 'border-amber-400', bg: 'bg-gradient-to-br from-amber-50/30 to-white/90', text: 'text-amber-700', badge: '🥇 Vô địch' },
                                    { border: 'border-slate-350', bg: 'bg-gradient-to-br from-slate-50/30 to-white/90', text: 'text-slate-700', badge: '🥈 Á quân 1' },
                                    { border: 'border-orange-350', bg: 'bg-gradient-to-br from-orange-50/30 to-white/90', text: 'text-orange-700', badge: '🥉 Á quân 2' }
                                ][index] || { border: 'border-white/50', bg: 'bg-white/50', text: 'text-[var(--shield-blue)]', badge: `Top ${index + 1}` };

                                return (
                                    <article key={`${team.teamName}-${index}`} className={`glass-card border-2 ${rankColors.border} ${rankColors.bg} rounded-[24px] p-8 flex flex-col justify-between shadow-md relative overflow-hidden`}>
                                        {index === 0 && (
                                            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-400 text-white font-black text-[10px] flex items-center justify-center transform rotate-45 translate-x-8 -translate-y-8">
                                                CHAMPION
                                            </div>
                                        )}
                                        <div>
                                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-black uppercase ${rankColors.text} bg-white/80 border border-current mb-4 shadow-sm`}>
                                                {rankColors.badge}
                                            </span>
                                            <h3 className="text-2xl font-black uppercase tracking-tight text-[var(--shield-ink)] mt-2">{team.teamName}</h3>
                                            <p className="text-xs font-extrabold text-[var(--shield-blue)] mt-1">{team.track || 'Chuyên mục chung'}</p>
                                            
                                            <div className="mt-6 border-t border-dashed border-[var(--shield-line)] pt-4">
                                                <p className="text-[10px] font-black text-[var(--shield-copy)] uppercase tracking-wider">Thành viên:</p>
                                                <p className="mt-1 text-sm font-semibold leading-relaxed text-[var(--shield-copy)]">
                                                    {(team.members || []).map((m) => m.fullName || m.email).join(', ') || 'Đang cập nhật thành viên'}
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <div className="mt-8 border-t border-[var(--shield-line)] pt-4 flex items-baseline justify-between">
                                            <span className="text-xs font-bold text-[var(--shield-copy)]">Điểm số tích lũy:</span>
                                            <span className="text-3xl font-black text-[var(--shield-ink)]">{team.score || 0} <span className="text-xs font-bold text-[var(--shield-copy)]">điểm</span></span>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                        <div className="mt-12 text-center">
                            <Link to="/leaderboard" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white bg-[var(--shield-blue)] hover:bg-[var(--shield-blue-dark)] transition-colors shadow-sm">
                                Xem tất cả kết quả và hồ sơ thí sinh
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </Link>
                        </div>
                    </div>
                </section>
            ) : (
                /* Roadmap Timeline (Hành trình chinh phục SEAL) styled as Glass Bento cards */
                <section className="py-20 px-5 bg-white/40 border-y border-[var(--shield-line)] backdrop-blur-md">
                    <div className="max-w-[1180px] mx-auto">
                        <div className="text-center mb-16">
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--shield-blue)]">Quy trình tham gia</p>
                            <h2 className="text-3xl sm:text-4xl font-black mt-2 text-[var(--shield-ink)]">Hành trình từ Ý tưởng đến Bằng khen</h2>
                            <p className="text-sm text-[var(--shield-copy)] mt-3">Toàn bộ hoạt động thi đấu được vận hành tinh gọn, số hóa toàn diện và minh bạch.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                            {[
                                {
                                    step: "01",
                                    title: "Lập đội thi đấu",
                                    desc: "Đăng ký cá nhân và tạo đội (2-5 thành viên). Lựa chọn hạng mục (Track) phù hợp và cài đặt chế độ Phòng đấu Công khai/Riêng tư."
                                },
                                {
                                    step: "02",
                                    title: "Tìm kiếm đồng đội",
                                    desc: "Sử dụng sảnh chờ (Lobby) để mời các thành viên còn trống hoặc gửi yêu cầu gia nhập các nhóm đang tuyển người tài."
                                },
                                {
                                    step: "03",
                                    title: "Nhận đề & Mentor",
                                    desc: "Đề thi và quy chế thi chính thức sẽ tự động mở khi giải đấu khai mạc. Ban tổ chức sẽ gán Mentor hỗ trợ sát cánh cùng đội."
                                },
                                {
                                    step: "04",
                                    title: "Lập trình & Nộp bài",
                                    desc: "Tập trung giải quyết thử thách và nộp bài trên hệ thống. Trưởng nhóm có quyền thay thế và cập nhật sản phẩm liên tục."
                                },
                                {
                                    step: "05",
                                    title: "Đánh giá minh bạch",
                                    desc: "Ban giám khảo cho điểm theo tiêu chí. Lịch sử chấm điểm (Audit Log) ghi nhận tức thời mọi lượt cập nhật để chống gian lận."
                                },
                                {
                                    step: "06",
                                    title: "Vinh danh giải thưởng",
                                    desc: "Theo dõi bảng xếp hạng real-time. Các đội đạt giải có thể tải về Chứng nhận số (Certificate PDF) trực tiếp từ Hồ sơ cá nhân."
                                }
                            ].map((step, idx) => (
                                <div key={idx} className="glass-card relative rounded-[24px] p-8 hover:scale-[1.03] group border-t-white border-l-white bg-white/50">
                                    <div className="absolute top-6 right-6 text-5xl font-black text-blue-500/10 group-hover:text-blue-500/20 transition-colors font-mono">
                                        {step.step}
                                    </div>
                                    <h3 className="text-lg font-black text-[var(--shield-ink)] mb-3 pr-8 group-hover:text-[var(--shield-blue)] transition-colors">{step.title}</h3>
                                    <p className="text-xs leading-relaxed text-[var(--shield-copy)]">{step.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Interactive FAQ Section with Premium Glass cards */}
            <section className="py-20 px-5 max-w-[800px] mx-auto">
                <div className="text-center mb-12">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--shield-blue)]">Giải đáp thắc mắc</p>
                    <h2 className="text-3xl font-black mt-2 text-[var(--shield-ink)]">Câu hỏi thường gặp</h2>
                </div>

                <div className="space-y-4">
                    {faqData.map((faq, index) => {
                        const isOpen = activeFaq === index;
                        return (
                            <div key={index} className={`glass-card rounded-[20px] overflow-hidden border border-white/50 shadow-[0_4px_24px_rgba(0,0,0,0.01)] transition-all duration-300 ${isOpen ? 'bg-white/80 border-blue-200/60' : 'bg-white/40'}`}>
                                <button
                                    type="button"
                                    onClick={() => toggleFaq(index)}
                                    className="w-full px-6 py-5 flex items-center justify-between text-left font-bold text-sm sm:text-base text-[var(--shield-ink)] hover:text-[var(--shield-blue)] transition-colors"
                                >
                                    <span>{faq.q}</span>
                                    <span className={`text-xl font-semibold transition-transform duration-300 ${isOpen ? 'rotate-45 text-[var(--shield-blue)]' : 'text-gray-400'}`}>
                                        ＋
                                    </span>
                                </button>
                                {isOpen && (
                                    <div className="px-6 pb-5 text-xs sm:text-sm leading-relaxed text-[var(--shield-copy)] border-t border-[var(--shield-line)]/50 pt-4 animate-fade-down font-medium">
                                        {faq.a}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* Sponsors & Partners Banner */}
            <section className="py-16 px-5 bg-white/30 border-t border-[var(--shield-line)] backdrop-blur-md">
                <div className="max-w-[1180px] mx-auto">
                    <p className="text-center text-[10px] font-black uppercase tracking-[0.25em] text-[var(--shield-copy)] mb-10">
                        Đồng hành & Đối tác liên kết
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-x-16 gap-y-8 opacity-75">
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
                                    className="h-10 w-auto object-contain hover:scale-105 transition-all duration-200 cursor-default filter grayscale hover:grayscale-0" 
                                />
                            ) : (
                                <span key={i} className="text-sm sm:text-base font-black tracking-widest text-[var(--shield-copy)] hover:text-[var(--shield-blue)] hover:scale-105 transition-all cursor-default">
                                    {partner.name.toUpperCase()}
                                </span>
                            )
                        ))}
                    </div>
                </div>
            </section>
        </main>
    );
}

