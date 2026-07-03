export default function About() {
    return (
        <main className="section-shell">
            <div className="mb-8">
                <h1 className="section-title">Về chúng tôi</h1>
                <p className="section-copy">
                    SEAL Hackathon Management System hỗ trợ tổ chức sự kiện, quản lý đội thi, nhận bài nộp,
                    chấm điểm và công bố bảng xếp hạng cho các mùa giải hackathon.
                </p>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
                <section className="feature-card">
                    <h2 className="text-base font-black uppercase tracking-[0.08em] text-[#071936]">Thí sinh</h2>
                    <p className="mt-3 text-sm leading-7 text-[#5c6d83]">
                        Trải nghiệm nhẹ như trang home, tập trung vào xem sự kiện, tạo đội và theo dõi bài dự thi.
                    </p>
                </section>
                <section className="feature-card">
                    <h2 className="text-base font-black uppercase tracking-[0.08em] text-[#071936]">Ban tổ chức</h2>
                    <p className="mt-3 text-sm leading-7 text-[#5c6d83]">
                        Điều phối sự kiện, người dùng, thông báo và dữ liệu vận hành trong dashboard quản lý.
                    </p>
                </section>
                <section className="feature-card">
                    <h2 className="text-base font-black uppercase tracking-[0.08em] text-[#071936]">Giám khảo & mentor</h2>
                    <p className="mt-3 text-sm leading-7 text-[#5c6d83]">
                        Theo dõi đội thi, hỗ trợ chuyên môn và xử lý tác vụ nội bộ theo đúng vai trò.
                    </p>
                </section>
            </div>
        </main>
    );
}
