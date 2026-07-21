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
        <div className="min-w-24 rounded-2xl border border-white/60 bg-white/70 backdrop-blur-md px-5 py-4 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:scale-105">
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
            {/* Hero Section */}
            <section className="hero-stage relative overflow-hidden min-h-[680px] flex items-center">
                <div className="hero-bg absolute inset-0 z-0 bg-center bg-cover opacity-85 transform scale-105 transition-all duration-500" style={{ backgroundImage: `url(${heroCourt})` }} />
                <div className="hero-overlay absolute inset-0 z-10 pointer-events-none" />

                <div className="hero-content relative z-20 w-full max-w-[1180px] mx-auto px-5 py-16 text-center animate-fade-up">
                    <p className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider text-[var(--shield-blue)] bg-[var(--shield-blue-soft)] border border-[var(--shield-line)]">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
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

                    <p className="hero-subtitle mt-6 max-w-2xl mx-auto text-base sm:text-lg leading-relaxed text-[var(--shield-copy)] font-medium">
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
                        <Link to={isEnded ? '/leaderboard' : `/my-team?eventId=${featuredEvent.id}`} className="px-8 py-3.5 rounded-xl font-bold text-[var(--shield-blue)] bg-white border border-[var(--shield-blue)] hover:bg-[var(--shield-blue-soft)] shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
                            {isEnded ? 'Xem bảng xếp hạng' : 'Đăng ký tham gia ngay'}
                        </Link>
                        <Link to={`/events/${featuredEvent.id}`} className="px-8 py-3.5 rounded-xl font-bold text-[var(--shield-blue)] bg-white border border-[var(--shield-line)] shadow-sm hover:bg-[var(--shield-blue-soft)] transition-all duration-200">
                            Xem chi tiết giải đấu
                        </Link>
                    </div>
                </div>
            </section>

            {/* Key Statistics Section */}
            <section className="py-16 px-5 max-w-[1180px] mx-auto">
                <div className="text-center mb-12">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--shield-blue)]">Về SEAL Hackathon</p>
                    <h2 className="text-3xl font-black mt-2 text-[var(--shield-ink)]">Những con số ấn tượng</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        {
                            num: "50 Tr+",
                            label: "Tổng giải thưởng",
                            desc: "Tiền mặt, học bổng và các gói cố vấn khởi nghiệp giá trị.",
                            icon: (
                                <svg className="w-8 h-8 text-[var(--shield-blue)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            )
                        },
                        {
                            num: "24+",
                            label: "Đội thi tham gia",
                            desc: "Hội tụ các tài năng trẻ từ Đại học FPT và các trường đại học đối tác.",
                            icon: (
                                <svg className="w-8 h-8 text-[var(--shield-blue)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            )
                        },
                        {
                            num: "03 Mùa",
                            label: "Giải đấu mỗi năm",
                            desc: "Tổ chức thường niên theo chu kỳ học thuật: Spring, Summer và Fall.",
                            icon: (
                                <svg className="w-8 h-8 text-[var(--shield-blue)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            )
                        },
                        {
                            num: "15+",
                            label: "Giám khảo & Mentor",
                            desc: "Giảng viên kỳ cựu và các kỹ sư, chuyên gia công nghệ đến từ doanh nghiệp.",
                            icon: (
                                <svg className="w-8 h-8 text-[var(--shield-blue)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            )
                        }
                    ].map((stat, i) => (
                        <div key={i} className="bg-white border border-[var(--shield-line)] rounded-2xl p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                            <div className="w-12 h-12 bg-[var(--shield-blue-soft)] rounded-xl flex items-center justify-center mb-4">
                                {stat.icon}
                            </div>
                            <h3 className="text-2xl font-black text-[var(--shield-ink)]">{stat.num}</h3>
                            <p className="text-sm font-bold text-[var(--shield-blue)] mt-1">{stat.label}</p>
                            <p className="text-xs text-[var(--shield-copy)] mt-2 leading-relaxed">{stat.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Main Interactive Content depending on Event State */}
            {isEnded ? (
                /* Hall of Fame (Bảng Vàng Danh Vọng) */
                <section className="py-16 px-5 bg-white border-y border-[var(--shield-line)]">
                    <div className="max-w-[1180px] mx-auto">
                        <div className="text-center mb-12">
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-600">Nhà vô địch</p>
                            <h2 className="text-3xl font-black mt-2 text-[var(--shield-ink)]">Bảng vàng vinh danh</h2>
                            <p className="text-sm text-[var(--shield-copy)] mt-2">Dưới đây là các đội thi xuất sắc nhất đã chinh phục hội đồng giám khảo tại sự kiện vừa qua.</p>
                        </div>
                        
                        <div className="grid gap-8 md:grid-cols-3 items-stretch max-w-5xl mx-auto">
                            {winners.map((team, index) => {
                                const rankColors = [
                                    { border: 'border-amber-400', bg: 'bg-gradient-to-b from-amber-50/50 to-white', text: 'text-amber-600', badge: '🥇 Vô địch' },
                                    { border: 'border-slate-300', bg: 'bg-gradient-to-b from-slate-50/50 to-white', text: 'text-slate-600', badge: '🥈 Á quân 1' },
                                    { border: 'border-orange-300', bg: 'bg-gradient-to-b from-orange-50/50 to-white', text: 'text-orange-600', badge: '🥉 Á quân 2' }
                                ][index] || { border: 'border-[var(--shield-line)]', bg: 'bg-white', text: 'text-[var(--shield-blue)]', badge: `Top ${index + 1}` };

                                return (
                                    <article key={`${team.teamName}-${index}`} className={`border-2 ${rankColors.border} ${rankColors.bg} rounded-3xl p-8 flex flex-col justify-between shadow-sm relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1`}>
                                        {index === 0 && (
                                            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-400 text-white font-black text-xs flex items-center justify-center transform rotate-45 translate-x-8 -translate-y-8">
                                                CHAMPION
                                            </div>
                                        )}
                                        <div>
                                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-black uppercase ${rankColors.text} bg-white border border-current mb-4`}>
                                                {rankColors.badge}
                                            </span>
                                            <h3 className="text-2xl font-black uppercase tracking-tight text-[var(--shield-ink)] mt-2">{team.teamName}</h3>
                                            <p className="text-xs font-bold text-[var(--shield-blue)] mt-1">{team.track || 'Chuyên mục chung'}</p>
                                            
                                            <div className="mt-6 border-t border-dashed border-[var(--shield-line)] pt-4">
                                                <p className="text-xs font-bold text-[var(--shield-copy)] uppercase tracking-wider">Thành viên:</p>
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
                        <div className="mt-10 text-center">
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
                /* Roadmap Timeline (Hành trình chinh phục SEAL) */
                <section className="py-16 px-5 bg-white border-y border-[var(--shield-line)]">
                    <div className="max-w-[1180px] mx-auto">
                        <div className="text-center mb-12">
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--shield-blue)]">Quy trình tham gia</p>
                            <h2 className="text-3xl font-black mt-2 text-[var(--shield-ink)]">Hành trình từ Ý tưởng đến Bằng khen</h2>
                            <p className="text-sm text-[var(--shield-copy)] mt-2">Toàn bộ hoạt động thi đấu được triển khai tinh gọn, số hóa hoàn toàn và minh bạch.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
                            {[
                                {
                                    step: "01",
                                    title: "Lập đội thi đấu",
                                    desc: "Đăng ký cá nhân và thành lập đội thi (2-5 thành viên). Chọn Track thi phù hợp, thiết lập chế độ Public hoặc Private bảo mật bằng mã PIN."
                                },
                                {
                                    step: "02",
                                    title: "Tìm kiếm đồng đội",
                                    desc: "Lọc lobby phòng chờ để gửi lời mời tham gia các nhóm còn thiếu người hoặc gửi yêu cầu tham gia các nhóm công khai."
                                },
                                {
                                    step: "03",
                                    title: "Nhận đề & Mentor",
                                    desc: "Đề thi chính thức cùng quy chế sẽ tự động kích hoạt khi giải đấu bắt đầu. Mỗi nhóm thi được ban tổ chức phân công 1-2 Mentor cố vấn."
                                },
                                {
                                    step: "04",
                                    title: "Lập trình & Nộp bài",
                                    desc: "Làm việc nhóm và nộp bài dự thi trực tuyến. Trưởng nhóm có toàn quyền cập nhật/thay thế file nộp bài cho đến sát giờ deadline."
                                },
                                {
                                    step: "05",
                                    title: "Đánh giá minh bạch",
                                    desc: "Ban giám khảo chấm điểm dựa theo các tiêu chí (Rubric) cụ thể. Nhật ký Audit Log tự động ghi nhận mọi sự điều chỉnh điểm số."
                                },
                                {
                                    step: "06",
                                    title: "Vinh danh giải thưởng",
                                    desc: "Theo dõi bảng xếp hạng trực tiếp. Các đội thi đạt giải Nhất, Nhì, Ba được quyền xuất bằng khen số PDF từ trang hồ sơ cá nhân."
                                }
                            ].map((step, idx) => (
                                <div key={idx} className="relative bg-[var(--shield-blue-soft)] border border-[var(--shield-line)] rounded-2xl p-6 hover:bg-white hover:border-[var(--shield-blue)] transition-all duration-300 group">
                                    <div className="absolute top-4 right-4 text-4xl font-black text-[var(--shield-blue)]/20 group-hover:text-[var(--shield-blue)]/30 transition-colors">
                                        {step.step}
                                    </div>
                                    <h3 className="text-lg font-black text-[var(--shield-ink)] mb-3 pr-8">{step.title}</h3>
                                    <p className="text-xs leading-relaxed text-[var(--shield-copy)]">{step.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Interactive FAQ Section */}
            <section className="py-16 px-5 max-w-[800px] mx-auto">
                <div className="text-center mb-10">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--shield-blue)]">Giải đáp thắc mắc</p>
                    <h2 className="text-3xl font-black mt-2 text-[var(--shield-ink)]">Câu hỏi thường gặp</h2>
                </div>

                <div className="space-y-4">
                    {faqData.map((faq, index) => {
                        const isOpen = activeFaq === index;
                        return (
                            <div key={index} className="bg-white border border-[var(--shield-line)] rounded-2xl overflow-hidden transition-all duration-200">
                                <button
                                    type="button"
                                    onClick={() => toggleFaq(index)}
                                    className="w-full px-6 py-5 flex items-center justify-between text-left font-bold text-sm sm:text-base text-[var(--shield-ink)] hover:bg-[var(--shield-blue-soft)] transition-colors"
                                >
                                    <span>{faq.q}</span>
                                    <span className={`text-xl font-semibold transition-transform duration-200 ${isOpen ? 'rotate-45 text-[var(--shield-blue)]' : 'text-gray-400'}`}>
                                        ＋
                                    </span>
                                </button>
                                {isOpen && (
                                    <div className="px-6 pb-5 text-xs sm:text-sm leading-relaxed text-[var(--shield-copy)] border-t border-[var(--shield-line)]/50 pt-3 animate-fade-down">
                                        {faq.a}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* Sponsors & Partners Banner */}
            <section className="py-12 px-5 bg-white/50 border-t border-[var(--shield-line)]">
                <div className="max-w-[1180px] mx-auto">
                    <p className="text-center text-[10px] font-black uppercase tracking-[0.25em] text-[var(--shield-copy)] mb-8">
                        Đồng hành & Đối tác liên kết
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 opacity-60">
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
                                    className="h-10 w-auto object-contain hover:scale-105 transition-all cursor-default" 
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

