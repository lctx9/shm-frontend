import React from 'react';
import { Link } from 'react-router-dom';

export default function Homepage() {
    return (
        <div className="min-h-screen bg-[#F1F5F9] antialiased selection:bg-[#1E5BB8]/10 selection:text-[#1E5BB8]">

            {/* Thanh điều hướng trên cùng */}
            <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200/80">
                <div className="max-w-[1200px] mx-auto flex items-center justify-between px-6 py-4">
                    <h1 className="text-base font-extrabold text-[#1E293B] uppercase tracking-wider">
                        SEAL Hackathon
                    </h1>
                    <div className="flex items-center gap-3">
                        <Link
                            to="/login"
                            className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-[#1E5BB8] transition-colors duration-200"
                        >
                            Đăng nhập
                        </Link>
                        <Link
                            to="/register"
                            className="inline-flex items-center justify-center rounded-lg bg-[#1E5BB8] text-white px-4 py-2 text-xs font-bold hover:bg-[#164384] active:scale-[0.98] transition-all duration-200 ease-in-out"
                        >
                            Đăng ký ngay
                        </Link>
                    </div>
                </div>
            </header>

            {/* Khối Hero giới thiệu chính */}
            <section className="px-4 py-8 sm:py-14">
                <div className="max-w-[1100px] mx-auto bg-white rounded-[32px] shadow-xl border border-slate-100 overflow-hidden transition-all duration-500 ease-out transform opacity-0 translate-y-4 animate-[fadeInUp_0.6s_ease-out_forwards]">
                    <div className="grid grid-cols-1 lg:grid-cols-2">

                        {/* Nội dung văn bản */}
                        <div className="p-8 sm:p-12 md:p-14 flex flex-col justify-center">
                            <span className="inline-flex items-center w-fit px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#1E5BB8]/10 text-[#1E5BB8] uppercase tracking-wide mb-4">
                                Nền tảng quản lý Hackathon
                            </span>
                            <h2 className="text-3xl sm:text-4xl font-bold text-[#1E293B] tracking-tight mb-4 leading-tight">
                                Tổ chức và tham gia Hackathon<br className="hidden sm:block" /> chưa bao giờ dễ dàng hơn
                            </h2>
                            <p className="text-sm text-slate-600 leading-relaxed mb-8">
                                SEAL giúp Ban tổ chức quản lý toàn bộ vòng thi, đội thi và giám khảo,
                                trong khi thí sinh có thể đăng ký đội, nộp bài và theo dõi kết quả
                                mọi lúc mọi nơi.
                            </p>
                            <div className="flex flex-wrap items-center gap-3">
                                <Link
                                    to="/register"
                                    className="inline-flex items-center justify-center rounded-lg bg-[#1E5BB8] text-white px-5 py-2.5 text-sm font-semibold hover:bg-[#164384] active:scale-[0.99] transition-all duration-200 ease-in-out"
                                >
                                    Bắt đầu ngay
                                </Link>
                                <Link
                                    to="/login"
                                    className="inline-flex items-center justify-center rounded-lg bg-slate-50 text-slate-700 border border-slate-200 px-5 py-2.5 text-sm font-semibold hover:bg-slate-100 active:scale-[0.99] transition-all duration-200 ease-in-out"
                                >
                                    Tôi đã có tài khoản
                                </Link>
                            </div>
                        </div>

                        {/* Hình ảnh minh họa */}
                        <div
                            className="hidden lg:block relative bg-no-repeat bg-cover bg-center"
                            style={{ backgroundImage: "url('/a.png')" }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-l from-black/5 to-transparent pointer-events-none"></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Khối thông tin / tính năng nổi bật */}
            <section className="px-4 pb-14">
                <div className="max-w-[1100px] mx-auto">
                    <div className="mb-8">
                        <h3 className="text-2xl font-bold text-[#1E293B] tracking-tight mb-2">
                            Mọi thứ bạn cần cho một mùa giải
                        </h3>
                        <p className="text-[13px] text-slate-600">
                            Từ khâu tổ chức đến khâu chấm giải, SEAL đồng hành cùng cả Ban tổ chức lẫn thí sinh.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                        <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm transition-all duration-300 ease-out hover:scale-[1.02] hover:border-[#1E5BB8]/30 group">
                            <span className="inline-flex p-2.5 bg-[#1E5BB8]/10 rounded-xl text-[#1E5BB8] mb-4">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.504-1.125-1.125-1.125h-2.25a1.125 1.125 0 00-1.125 1.125v3.375m9 0M16.5 13.5v-2.25a2.25 2.25 0 00-2.25-2.25h-4.5A2.25 2.25 0 007.5 11.25v2.25m9-6V5.25A2.25 2.25 0 0014.25 3h-4.5A2.25 2.25 0 007.5 5.25v2.25" />
                                </svg>
                            </span>
                            <h4 className="text-sm font-bold text-slate-800 mb-2 group-hover:text-[#1E5BB8] transition-colors duration-200">
                                Quản lý Giải đấu
                            </h4>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Thiết lập vòng thi, hạng mục và phân công giám khảo chỉ trong vài bước.
                            </p>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm transition-all duration-300 ease-out hover:scale-[1.02] hover:border-[#1E5BB8]/30 group">
                            <span className="inline-flex p-2.5 bg-[#1E5BB8]/10 rounded-xl text-[#1E5BB8] mb-4">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                                </svg>
                            </span>
                            <h4 className="text-sm font-bold text-slate-800 mb-2 group-hover:text-[#1E5BB8] transition-colors duration-200">
                                Đội thi &amp; Thành viên
                            </h4>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Tạo đội, mời thành viên và theo dõi tiến độ chuẩn bị của cả nhóm.
                            </p>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm transition-all duration-300 ease-out hover:scale-[1.02] hover:border-[#1E5BB8]/30 group">
                            <span className="inline-flex p-2.5 bg-[#1E5BB8]/10 rounded-xl text-[#1E5BB8] mb-4">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.03 0 1.9.693 2.166 1.636m-5.8 0A2.229 2.229 0 0010.5 4.5v.75m7.416-1.414A2.23 2.23 0 0118.75 4.5v.75m0 12.75a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9a2.25 2.25 0 012.25-2.25h9a2.25 2.25 0 012.25 2.25v9z" />
                                </svg>
                            </span>
                            <h4 className="text-sm font-bold text-slate-800 mb-2 group-hover:text-[#1E5BB8] transition-colors duration-200">
                                Nộp bài &amp; Chấm điểm
                            </h4>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Nộp bài dự thi trực tuyến, giám khảo chấm điểm minh bạch theo tiêu chí rõ ràng.
                            </p>
                        </div>

                    </div>
                </div>
            </section>

            {/* Bảng xếp hạng công khai - lối tắt nhanh */}
            <section className="px-4 pb-16">
                <div className="max-w-[1100px] mx-auto bg-white rounded-[32px] shadow-xl border border-slate-100 p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div>
                        <h3 className="text-lg font-bold text-[#1E293B] tracking-tight mb-1">
                            Xem bảng xếp hạng ngay, không cần đăng nhập
                        </h3>
                        <p className="text-[13px] text-slate-600">
                            Theo dõi thành tích các đội thi đang tranh tài trong mùa giải hiện tại.
                        </p>
                    </div>
                    <Link
                        to="/dashboard/leaderboard"
                        className="shrink-0 inline-flex items-center justify-center rounded-lg bg-[#1E5BB8]/10 text-[#1E5BB8] px-5 py-2.5 text-sm font-bold hover:bg-[#1E5BB8]/20 active:scale-[0.99] transition-all duration-200 ease-in-out"
                    >
                        Xem bảng xếp hạng →
                    </Link>
                </div>
            </section>

            {/* Chân trang */}
            <footer className="px-4 pb-10">
                <p className="text-center text-xs text-slate-500">
                    © {new Date().getFullYear()} SEAL Hackathon Management System.
                </p>
            </footer>
        </div>
    );
}
