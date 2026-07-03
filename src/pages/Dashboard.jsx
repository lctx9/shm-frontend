import { useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient';

const roleCopy = {
    ADMIN: 'Quản trị hệ thống',
    COORDINATOR: 'Điều phối sự kiện',
    JUDGE: 'Giám khảo',
    MENTOR: 'Mentor hướng dẫn đội thi',
};

export default function Dashboard() {
    const role = localStorage.getItem('role');
    const [stats, setStats] = useState({
        activeEvents: 0,
        totalTeams: 0,
        pendingSubmissions: 0,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchDashboardStats = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await axiosClient.get('/stats');
            if (response.result) {
                setStats({
                    activeEvents: response.result.activeEvents || 0,
                    totalTeams: response.result.totalTeams || 0,
                    pendingSubmissions: response.result.pendingSubmissions || 0,
                });
            }
        } catch (err) {
            setError('Không thể tải dữ liệu thống kê. Vui lòng kiểm tra backend hoặc quyền truy cập.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardStats();
    }, []);

    const cards = [
        { label: 'Sự kiện đang hoạt động', value: stats.activeEvents, helper: 'Event đang mở hoặc đang diễn ra' },
        { label: 'Đội thi', value: stats.totalTeams, helper: 'Tổng số đội đã đăng ký' },
        { label: 'Bài chờ chấm', value: stats.pendingSubmissions, helper: 'Submission chưa có điểm' },
    ];

    return (
        <div className="mx-auto max-w-7xl space-y-6">
            <section className="rounded-lg border border-blue-100 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0f63c9]">SEAL Hackathon</p>
                        <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900">Bảng điều khiển</h1>
                        <p className="mt-2 text-sm text-slate-600">
                            Bạn đang đăng nhập với vai trò <span className="font-bold text-[#0f63c9]">{roleCopy[role] || role || 'Khách'}</span>.
                        </p>
                    </div>
                    <button type="button" onClick={fetchDashboardStats} disabled={loading} className="btn-secondary">
                        {loading ? 'Đang tải...' : 'Làm mới'}
                    </button>
                </div>
            </section>

            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                    {error}
                </div>
            )}

            <section className="grid gap-4 md:grid-cols-3">
                {cards.map((card) => (
                    <article key={card.label} className="rounded-lg border border-blue-100 bg-white p-6 shadow-sm">
                        <p className="text-sm font-bold text-slate-600">{card.label}</p>
                        <p className="mt-3 text-4xl font-black text-slate-900">
                            {loading ? <span className="animate-pulse">...</span> : card.value}
                        </p>
                        <p className="mt-3 text-sm text-slate-500">{card.helper}</p>
                    </article>
                ))}
            </section>

            <section className="rounded-lg border border-blue-100 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-black text-slate-900">Gợi ý kiểm thử nhanh</h2>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <div className="rounded-lg bg-blue-50 p-4 text-sm text-slate-700">
                        Coordinator: tạo/cấu hình event, duyệt thí sinh, phân công mentor/judge, kiểm tra submission.
                    </div>
                    <div className="rounded-lg bg-blue-50 p-4 text-sm text-slate-700">
                        Mentor: vào Đội thi để xem đội được phân công, mở chi tiết, xem bài nộp và trao đổi với đội.
                    </div>
                    <div className="rounded-lg bg-blue-50 p-4 text-sm text-slate-700">
                        Judge: vào Chấm bài, chọn submission, nhập điểm theo rubric nhiều cột và lưu nhận xét.
                    </div>
                    <div className="rounded-lg bg-blue-50 p-4 text-sm text-slate-700">
                        User/Leader: đăng ký, tạo đội, nộp bài, chat với mentor và theo dõi trạng thái.
                    </div>
                </div>
            </section>
        </div>
    );
}
