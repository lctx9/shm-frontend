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
        <main className="apple-container bg-white text-black min-h-screen font-sans antialiased selection:bg-slate-100 pb-20">
            {/* HERO SECTION: Ultra-Large Typography & Spacious Layout */}
            <section className="max-w-[1200px] mx-auto px-6 py-24 sm:py-32 md:py-40 text-left animate-fade-up">
                <div className="space-y-10">
                    {/* Event Status Badge */}
                    {featuredEvent && (
                        <div className="inline-flex items-center gap-2.5 px-3 py-1 rounded-full border border-black/10 bg-slate-50 text-[10px] font-extrabold uppercase tracking-widest text-slate-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            {phase.label}
                        </div>
                    )}

                    <h1 className="text-5xl sm:text-7xl md:text-[84px] font-black tracking-tighter leading-[0.95] text-black apple-heading">
                        {featuredEvent ? (
                            featuredEvent.name.toUpperCase()
                        ) : (
                            "SEAL HACKATHON"
                        )}
                    </h1>

                    <p className="text-base sm:text-lg text-slate-500 font-normal leading-relaxed max-w-3xl apple-body">
                        {featuredEvent ? (
                            <>
                                Hệ thống đang giám sát sự kiện hiện tại. 
                                {phase.key === 'registration'
                                    ? ` Cổng đăng ký và thành lập đội thi đang mở. Thời gian kết thúc nhận đơn: ${formatDateTime(featuredEvent.regEndDate)}.`
                                    : phase.key === 'running'
                                    ? ` Giải đấu đang diễn ra. Các đội thi đang phát triển sản phẩm thực tế từ ngày ${formatDateTime(featuredEvent.eventStartDate)}.`
                                    : ` Sự kiện đã khép lại trọn vẹn vào ngày ${formatDateTime(featuredEvent.eventEndDate)}.`}
                            </>
                        ) : (
                            "Nền tảng quản lý giải đấu Hackathon tối giản, tự động hóa mọi quy trình lập đội thi, nộp bài, cố vấn học thuật và chấm điểm."
                        )}
                    </p>

                    {/* Minimalist Countdown Timer */}
                    {countdown && featuredEvent && (
                        <div className="pt-4 space-y-4">
                            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Launch Timeline</span>
                            <div className="flex flex-wrap gap-12 items-baseline">
                                {countdown.map((item) => (
                                    <div key={item.label} className="text-left">
                                        <p className="text-5xl sm:text-6xl font-extrabold tracking-tighter text-black">
                                            {String(item.value).padStart(2, '0')}
                                            <span className="text-xs font-black uppercase tracking-widest text-slate-400 ml-2">
                                                {item.label[0]}
                                            </span>
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex flex-wrap items-center gap-4 pt-6">
                        <Link to={isEnded ? '/leaderboard' : `/my-team?registerEventId=${featuredEvent?.id}`} className="px-8 py-3.5 rounded bg-black text-white hover:bg-slate-900 font-bold text-xs uppercase tracking-wider transition-colors apple-interactive">
                            {isEnded ? 'Xem bảng vàng' : 'Đăng ký ngay'}
                        </Link>
                        <Link to="/events" className="px-8 py-3.5 rounded border border-slate-200 text-slate-800 hover:bg-slate-50 font-bold text-xs uppercase tracking-wider transition-colors">
                            Xem các giải đấu
                        </Link>
                    </div>
                </div>
            </section>

            {/* KEY STATISTICS: Hairline Grid */}
            <section className="max-w-[1200px] mx-auto px-6 py-20 border-t border-slate-100">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 sm:gap-16">
                    <div className="space-y-3">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Prize Allocation</span>
                        <h3 className="text-5xl font-extrabold tracking-tighter text-black">50M+</h3>
                        <p className="text-xs text-slate-500 leading-relaxed">Tổng giải thưởng bằng tiền mặt và các chương trình hỗ trợ cố vấn phát triển.</p>
                    </div>
                    <div className="space-y-3">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Teams Sandboxed</span>
                        <h3 className="text-5xl font-extrabold tracking-tighter text-black">24+</h3>
                        <p className="text-xs text-slate-500 leading-relaxed">Đội thi ưu tú từ Đại học FPT cùng các trường Đại học công nghệ khu vực.</p>
                    </div>
                    <div className="space-y-3">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Annual Seasons</span>
                        <h3 className="text-5xl font-extrabold tracking-tighter text-black">03</h3>
                        <p className="text-xs text-slate-500 leading-relaxed">Mùa giải tổ chức cố định tại học kỳ Spring, Summer và Fall mỗi năm.</p>
                    </div>
                    <div className="space-y-3">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Assigned Experts</span>
                        <h3 className="text-5xl font-extrabold tracking-tighter text-black">15+</h3>
                        <p className="text-xs text-slate-500 leading-relaxed">Ban giám khảo chấm điểm độc lập và Mentor hướng dẫn chuyên sâu.</p>
                    </div>
                </div>
            </section>

            {/* PARTICIPATION ROADMAP OR WINNERS */}
            {isEnded ? (
                /* Hall of Fame - Minimal List Layout */
                <section className="max-w-[1200px] mx-auto px-6 py-24 border-t border-slate-100">
                    <div className="mb-20">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 font-mono">Archive / Winner Registry</span>
                        <h2 className="text-3xl sm:text-4xl font-extrabold text-black mt-2 tracking-tight">Bảng Vàng Vinh Danh</h2>
                    </div>

                    <div className="grid gap-12 md:grid-cols-3 items-stretch max-w-5xl mx-auto">
                        {winners.map((team, index) => {
                            const config = [
                                { badge: '🥇 Winner (Vô địch)', text: 'text-black font-extrabold' },
                                { badge: '🥈 Runner-up (Á quân 1)', text: 'text-slate-700' },
                                { badge: '🥉 Third Place (Á quân 2)', text: 'text-slate-600' }
                            ][index] || { badge: `Top ${index + 1}`, text: 'text-slate-600' };

                            return (
                                <div key={`${team.teamName}-${index}`} className="border-t border-slate-200/80 pt-6 flex flex-col justify-between space-y-8 apple-interactive">
                                    <div className="space-y-4">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">
                                            {config.badge}
                                        </span>
                                        <h3 className="text-2xl font-black uppercase tracking-tight text-black">{team.teamName}</h3>
                                        <span className="text-xs font-bold text-slate-500 block">{team.track || 'Track Chung'}</span>

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
                /* Roadmap Timeline - Minimal Grid */
                <section className="max-w-[1200px] mx-auto px-6 py-24 border-t border-slate-100">
                    <div className="mb-20">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 font-mono">Operation Roadmap</span>
                        <h2 className="text-3xl sm:text-4xl font-extrabold text-black mt-2 tracking-tight">Quy Trình Thi Đấu</h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-16 max-w-5xl mx-auto">
                        {[
                            { step: "01", title: "Lập Đội Thi Đấu", desc: "Đăng ký tài khoản và thành lập đội thi (2-5 thành viên) trên hệ thống." },
                            { step: "02", title: "Tìm Kiếm Thành Viên", desc: "Sử dụng sảnh đợi Lobby để tuyển dụng hoặc xin gia nhập các nhóm còn chỗ." },
                            { step: "03", title: "Nhận Đề & Mentor", desc: "Đề bài chính thức mở tự động. Hệ thống gán cố vấn kỹ thuật đồng hành cùng nhóm." },
                            { step: "04", title: "Nộp Bài Dự Án", desc: "Trưởng nhóm thực hiện gửi mã nguồn sản phẩm và cập nhật file trước hạn kết thúc." },
                            { step: "05", title: "Chấm Điểm Tiêu Chí", desc: "Ban giám khảo đánh giá độc lập. Nhật ký Audit Log tự động ghi nhận mọi thay đổi." },
                            { step: "06", title: "Nhận Chứng Nhận Số", desc: "Xuất file PDF bằng khen số có chữ ký điện tử trực tiếp từ trang cá nhân." }
                        ].map((item, idx) => (
                            <div key={idx} className="border-t border-slate-200/80 pt-6 space-y-3 apple-interactive">
                                <span className="text-xs font-extrabold text-slate-400 font-mono tracking-widest block">{item.step} // protocol</span>
                                <h3 className="text-base font-extrabold text-black tracking-tight">{item.title}</h3>
                                <p className="text-xs leading-relaxed text-slate-500">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* CYBER FAQs SECTION */}
            <section className="max-w-[800px] mx-auto px-6 py-24 border-t border-slate-100">
                <div className="mb-16">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 font-mono">SUPPORT CHANNELS</span>
                    <h2 className="text-3xl font-extrabold text-black mt-2 tracking-tight">Giải Đáp Thắc Mắc</h2>
                </div>

                <div className="space-y-0 border-t border-slate-200/80">
                    {faqData.map((faq, index) => {
                        const isOpen = activeFaq === index;
                        return (
                            <div key={index} className="border-b border-slate-200/80">
                                <button
                                    type="button"
                                    onClick={() => toggleFaq(index)}
                                    className="w-full py-6 flex items-center justify-between text-left font-bold text-sm sm:text-base text-black hover:text-slate-600 transition-colors"
                                >
                                    <span>{faq.q}</span>
                                    <span className="text-xs text-slate-400 font-mono">
                                        {isOpen ? 'CLOSE' : 'OPEN'}
                                    </span>
                                </button>
                                {isOpen && (
                                    <div className="pb-6 text-xs sm:text-sm leading-relaxed text-slate-500 animate-fade-up font-normal apple-body">
                                        {faq.a}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* PARTNERS BANNER */}
            <section className="max-w-[1200px] mx-auto px-6 py-16 border-t border-slate-100">
                <p className="text-center text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-12">
                    Mạng lưới đối tác của chúng tôi
                </p>
                <div className="flex flex-wrap items-center justify-center gap-x-20 gap-y-8 opacity-40 hover:opacity-60 transition-opacity duration-300">
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
