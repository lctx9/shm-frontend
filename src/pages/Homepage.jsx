import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import heroCourt from '../assets/blue-hero-reference.png';
import { demoWinners, formatDateTime, getCountdownParts, getEventPhase, pickFeaturedEvent } from '../utils/hackathon';

function Stat({ value, label }) {
    return (
        <div className="min-w-20 rounded-lg border border-white/70 bg-white/80 px-4 py-3 text-center shadow-sm">
            <p className="text-2xl font-black text-[#071936]">{String(value).padStart(2, '0')}</p>
            <p className="mt-1 text-xs font-black uppercase tracking-[0.12em] text-[#5c6d83]">{label}</p>
        </div>
    );
}

function EditorialEventTitle({ name }) {
    const words = String(name || '').trim().split(/\s+/);
    const accent = words.pop();
    return <>{words.join(' ')}{words.length > 0 && <br />}<em>{accent}</em></>;
}

export default function Homepage() {
    const [events, setEvents] = useState([]);
    const [rankings, setRankings] = useState([]);

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

    return (
        <main>
            <section className="hero-stage">
                <div className="hero-bg" style={{ backgroundImage: `url(${heroCourt})` }} />
                <div className="hero-overlay" />

                <div className="hero-content animate-fade-up">
                    <p className="hero-eyebrow">Giải đấu nổi bật</p>
                    <h1 className="hero-title"><EditorialEventTitle name={featuredEvent.name} /></h1>
                    <div className="mt-7">
                        <span className={`badge-status-pill ${isEnded ? 'border-amber-300 bg-amber-50 text-amber-700' : ''}`}>
                            {phase.label}
                        </span>
                    </div>

                    <p className="hero-subtitle">
                        {phase.key === 'registration'
                            ? `Đăng ký đến ${formatDateTime(featuredEvent.regEndDate)}. Chọn hạng mục, lập đội và sẵn sàng bước vào vòng thi.`
                            : `Thời gian thi: ${formatDateTime(featuredEvent.eventStartDate)} - ${formatDateTime(featuredEvent.eventEndDate)}.`}
                    </p>

                    {countdown && (
                        <div className="mt-7 flex flex-wrap justify-center gap-3">
                            {countdown.map((item) => <Stat key={item.label} {...item} />)}
                        </div>
                    )}

                    <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                        <Link to={isEnded ? '/leaderboard' : `/my-team?eventId=${featuredEvent.id}`} className="btn-action-main">
                            {isEnded ? 'Xem kết quả' : 'Đăng ký'}
                        </Link>
                        <Link to={`/events/${featuredEvent.id}`} className="btn-secondary">
                            Xem chi tiết giải
                        </Link>
                    </div>
                </div>
            </section>

            {isEnded ? (
                <section className="section-shell">
                    <div className="mb-8">
                        <p className="text-xs font-black uppercase tracking-[0.22em] text-[#0f63c9]">Nhà vô địch</p>
                        <h2 className="section-title">Kết quả chung cuộc</h2>
                    </div>
                    <div className="grid gap-5 md:grid-cols-3">
                        {winners.map((team, index) => (
                            <article key={`${team.teamName}-${index}`} className="feature-card">
                                <p className="text-4xl font-black text-[#0f63c9]">#{team.rank || index + 1}</p>
                                <h3 className="mt-4 text-xl font-black uppercase tracking-[0.06em] text-[#071936]">{team.teamName}</h3>
                                <p className="mt-2 text-sm font-bold text-[#0f63c9]">{team.track || 'Bảng chung'}</p>
                                <p className="mt-4 text-sm leading-6 text-[#5c6d83]">
                                    {(team.members || []).map((member) => member.fullName || member.email).join(', ') || 'Đang cập nhật thành viên'}
                                </p>
                                <p className="mt-5 text-2xl font-black text-[#071936]">{team.score || 0} điểm</p>
                            </article>
                        ))}
                    </div>
                    <div className="mt-7 text-center">
                        <Link to="/leaderboard" className="btn-primary">Xem tất cả kết quả</Link>
                    </div>
                </section>
            ) : (
                <section className="section-shell">
                    <div className="mb-8">
                        <h2 className="section-title">Chuẩn bị trước giờ mở màn</h2>
                        <p className="section-copy">
                            Sinh viên có thể lập đội, chọn hạng mục, tìm đồng đội trong lobby và theo dõi lịch thi ngay trong hệ thống.
                        </p>
                    </div>
                    <div className="grid gap-5 md:grid-cols-3">
                        {[
                            ['Lập đội', 'Tạo team public hoặc private bằng mã PIN 4 số.'],
                            ['Tìm đồng đội', 'Lọc lobby theo hạng mục và gửi yêu cầu tham gia.'],
                            ['Theo dõi đề thi', 'Khi giải bắt đầu, đề, guideline và deadline sẽ hiện trong Đội của tôi.'],
                        ].map(([title, copy]) => (
                            <article className="feature-card" key={title}>
                                <h3 className="text-base font-black uppercase tracking-[0.08em] text-[#071936]">{title}</h3>
                                <p className="mt-3 text-sm leading-7 text-[#5c6d83]">{copy}</p>
                            </article>
                        ))}
                    </div>
                </section>
            )}

            <section className="section-shell pt-0">
                <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                    <div>
                        <h2 className="section-title">Về giải đấu</h2>
                        <p className="section-copy">
                            SEAL Hackathon là sân chơi dành cho sinh viên yêu thích xây dựng sản phẩm công nghệ, nơi đội thi được mentor
                            đồng hành, trình bày trước hội đồng giám khảo và nhận chứng nhận thành tích cá nhân sau mùa giải.
                        </p>
                    </div>
                    <div className="overflow-hidden rounded-lg border border-[#d7e6f8] bg-white">
                        <img src={heroCourt} alt="Không gian tổ chức SEAL Hackathon" className="h-72 w-full object-cover" />
                    </div>
                </div>
            </section>
        </main>
    );
}
