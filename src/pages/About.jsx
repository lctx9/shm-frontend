import heroCourt from '../assets/hero.png';

const mentors = [
    ['Mentor sản phẩm', 'Định hướng problem-solution fit, scope MVP và cách demo thuyết phục.'],
    ['Mentor kỹ thuật', 'Hỗ trợ kiến trúc, API, dữ liệu, AI và triển khai sản phẩm.'],
    ['Ban tổ chức', 'Điều phối lịch thi, quy chế, truyền thông và công bố kết quả.'],
];

export default function About() {
    return (
        <main className="section-shell">
            <section className="grid gap-8 lg:grid-cols-[1fr_0.95fr] lg:items-center">
                <div>
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-[#0f63c9]">Về chúng tôi</p>
                    <h1 className="mt-3 text-4xl font-black uppercase tracking-[0.06em] text-[#071936] sm:text-5xl">
                        SEAL Hackathon
                    </h1>
                    <p className="mt-5 text-sm leading-7 text-[#5c6d83]">
                        SEAL là giải đấu công nghệ dành cho sinh viên muốn thử sức với việc xây dựng sản phẩm thật trong thời gian ngắn.
                        Hệ thống này hỗ trợ ban tổ chức quản lý mùa giải, đội thi, đề bài, bài nộp, chấm điểm và lưu lại thành tích cá nhân.
                    </p>
                </div>
                <div className="overflow-hidden rounded-lg border border-[#d7e6f8] bg-white">
                    <img src={heroCourt} alt="SEAL Hackathon" className="h-80 w-full object-cover" />
                </div>
            </section>

            <section className="mt-12">
                <h2 className="section-title">Mentor và ban tổ chức</h2>
                <div className="mt-6 grid gap-5 md:grid-cols-3">
                    {mentors.map(([title, copy]) => (
                        <article className="feature-card" key={title}>
                            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-lg bg-[#eaf3ff] text-xl font-black text-[#0f63c9]">
                                {title.charAt(0)}
                            </div>
                            <h3 className="text-base font-black uppercase tracking-[0.08em] text-[#071936]">{title}</h3>
                            <p className="mt-3 text-sm leading-7 text-[#5c6d83]">{copy}</p>
                        </article>
                    ))}
                </div>
            </section>

            <section className="mt-12 rounded-lg border border-[#d7e6f8] bg-white p-6">
                <h2 className="text-lg font-black uppercase tracking-[0.08em] text-[#071936]">Tinh thần giải đấu</h2>
                <div className="mt-5 grid gap-5 md:grid-cols-3">
                    {[
                        ['Build thật', 'Tập trung vào prototype có thể chạy và giải quyết một vấn đề rõ ràng.'],
                        ['Học cùng mentor', 'Nhận phản hồi nhanh từ mentor để cải thiện sản phẩm trong từng vòng.'],
                        ['Thành tích rõ ràng', 'Kết quả và chứng nhận cá nhân được lưu lại trong profile để dùng cho portfolio/CV.'],
                    ].map(([title, copy]) => (
                        <div key={title}>
                            <p className="font-black text-[#0b1f3f]">{title}</p>
                            <p className="mt-2 text-sm leading-6 text-[#5c6d83]">{copy}</p>
                        </div>
                    ))}
                </div>
            </section>
        </main>
    );
}
