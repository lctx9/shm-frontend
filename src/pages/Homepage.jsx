import { Link } from 'react-router-dom';
import heroCourt from '../assets/blue-hero-reference.png';

const features = [
    {
        title: 'Quản lý sự kiện',
        copy: 'Theo dõi mùa giải, hạng mục, vòng thi và lịch nộp bài trong một giao diện rõ ràng.',
        icon: 'M8 21h8m-4-4v4m6-17v5a6 6 0 0 1-12 0V4h12ZM5 7H3v2a4 4 0 0 0 4 4m12-6h2v2a4 4 0 0 1-4 4',
    },
    {
        title: 'Đội thi & thành viên',
        copy: 'Thí sinh tạo đội, tham gia đội, quản lý thành viên và chuẩn bị bài dự thi thuận tiện.',
        icon: 'M16 11a4 4 0 1 0-8 0m8 0a4 4 0 1 1-8 0m8 0v1a4 4 0 0 1-8 0v-1m12 9a8 8 0 0 0-16 0m20 0a6.5 6.5 0 0 0-4.5-6.2',
    },
    {
        title: 'Nộp bài & xếp hạng',
        copy: 'Bài nộp, điểm số và bảng xếp hạng được cập nhật để mọi đội dễ theo dõi tiến độ.',
        icon: 'M9 12.75 11.25 15 15 9.75M7 3.75h10A2.25 2.25 0 0 1 19.25 6v12A2.25 2.25 0 0 1 17 20.25H7A2.25 2.25 0 0 1 4.75 18V6A2.25 2.25 0 0 1 7 3.75Z',
    },
];

function Icon({ path }) {
    return (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d={path} />
        </svg>
    );
}

export default function Homepage() {
    return (
        <main>
            <section className="hero-stage">
                <div className="hero-bg" style={{ backgroundImage: `url(${heroCourt})` }} />
                <div className="hero-overlay" />

                <div className="hero-content animate-fade-up">
                    <p className="hero-eyebrow">Giải đấu Hackathon SEAL 2026</p>
                    <h1 className="hero-title">
                        SEAL
                        <br />
                        CHAMPIONS
                    </h1>
                    <div className="mt-9">
                        <span className="badge-status-pill">
                            <Icon path="M8 21h8m-4-4v4m6-17v5a6 6 0 0 1-12 0V4h12Z" />
                            Nền tảng đang mở
                        </span>
                    </div>
                    <p className="hero-subtitle">
                        Tổ chức mùa giải, quản lý đội thi, nhận bài nộp và công bố kết quả với giao diện sáng,
                        rõ ràng và nhất quán cho thí sinh.
                    </p>
                    <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                        <Link to="/events" className="btn-action-main">
                            <Icon path="M12 5v14m7-7H5" />
                            Xem sự kiện
                        </Link>
                        <Link to="/leaderboard" className="btn-secondary">
                            Xem bảng xếp hạng
                        </Link>
                    </div>
                </div>
            </section>

            <section className="section-shell">
                <div className="mb-8">
                    <h2 className="section-title">Vận hành mùa giải gọn hơn</h2>
                    <p className="section-copy">
                        SEAL kết nối ban tổ chức, giám khảo, mentor và đội thi, nhưng giữ trải nghiệm thí sinh
                        giống trang home: nhẹ, rõ, dễ thao tác.
                    </p>
                </div>

                <div className="grid gap-5 md:grid-cols-3">
                    {features.map((feature) => (
                        <article className="feature-card" key={feature.title}>
                            <span className="feature-icon">
                                <Icon path={feature.icon} />
                            </span>
                            <h3 className="text-base font-black uppercase tracking-[0.08em] text-[#071936]">
                                {feature.title}
                            </h3>
                            <p className="mt-3 text-sm leading-7 text-[#5c6d83]">
                                {feature.copy}
                            </p>
                        </article>
                    ))}
                </div>
            </section>

            <section className="section-shell pt-0">
                <div className="flex flex-col items-start justify-between gap-5 rounded-lg border border-[#d7e6f8] bg-white px-6 py-7 shadow-sm sm:flex-row sm:items-center">
                    <div>
                        <h2 className="text-lg font-black uppercase tracking-[0.08em] text-[#071936]">
                            Theo dõi bảng xếp hạng công khai
                        </h2>
                        <p className="mt-2 text-sm text-[#5c6d83]">
                            Người xem có thể cập nhật kết quả mà không cần đăng nhập.
                        </p>
                    </div>
                    <Link to="/leaderboard" className="btn-primary">
                        Mở bảng xếp hạng
                    </Link>
                </div>
            </section>
        </main>
    );
}
