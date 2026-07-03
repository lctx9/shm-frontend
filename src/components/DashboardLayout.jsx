import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';

export default function DashboardLayout() {
    const navigate = useNavigate();
    const location = useLocation();

    const role = localStorage.getItem('role');
    const email = localStorage.getItem('email');
    const isLoggedIn = !!role; // Kiểm tra xem đã đăng nhập chưa

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('email');
        navigate('/dashboard');
    };

    const isActive = (path) => location.pathname === path ? 'bg-indigo-700 text-white' : 'text-indigo-100 hover:bg-indigo-600';

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar bên trái */}
            <div className="w-64 bg-indigo-800 flex flex-col shadow-lg">
                <div className="flex items-center justify-center h-16 bg-indigo-900">
                    <h1 className="text-xl font-bold text-white uppercase tracking-wider">SEAL Hackathon</h1>
                </div>

                <div className="flex-1 overflow-y-auto py-4 flex flex-col justify-between">
                    <nav className="space-y-1 px-2">
                        {/* Các menu PUBLIC (Ai cũng thấy) */}
                        <Link to="/dashboard" className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${isActive('/dashboard')}`}>
                            📊 Tổng quan
                        </Link>
                        <Link to="/dashboard/leaderboard" className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${isActive('/dashboard/leaderboard')}`}>
                            🏆 Bảng xếp hạng
                        </Link>

                        {/* Menu dành riêng cho COORDINATOR / ADMIN */}
                        {(role === 'COORDINATOR' || role === 'ADMIN') && (
                            <>
                                <Link to="/dashboard/events" className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${isActive('/dashboard/events')}`}>
                                    ⚙️ Quản lý Giải đấu
                                </Link>
                                <Link to="/dashboard/users" className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${isActive('/dashboard/users')}`}>
                                    👥 Quản lý Tài khoản (Duyệt)
                                </Link>
                            </>
                        )}

                        {/* Menu dành riêng cho LEADER / MEMBER */}
                        {(role === 'LEADER' || role === 'MEMBER') && (
                            <>
                                <Link to="/dashboard/teams" className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${isActive('/dashboard/teams')}`}>
                                    🔍 Khám phá đội thi
                                </Link>
                                <Link to="/dashboard/my-team" className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${isActive('/dashboard/my-team')}`}>
                                    🛡️ Đội thi của tôi
                                </Link>
                                <Link to="/dashboard/submissions" className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${isActive('/dashboard/submissions')}`}>
                                    📤 Nộp bài dự thi
                                </Link>
                            </>
                        )}

                        {/* Menu dành riêng cho JUDGE */}
                        {role === 'JUDGE' && (
                            <Link to="/dashboard/grading" className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${isActive('/dashboard/grading')}`}>
                                ⚖️ Chấm bài thi
                            </Link>
                        )}
                    </nav>

                    {/* Menu Profile chỉ hiện khi đã đăng nhập */}
                    {isLoggedIn && (
                        <div className="px-2 mt-auto border-t border-indigo-700 pt-4">
                            <Link to="/dashboard/profile" className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${isActive('/dashboard/profile')}`}>
                                👤 Profile & Mật khẩu
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            {/* Khu vực nội dung chính bên phải */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="flex items-center justify-between px-6 py-4 bg-white border-b shadow-sm">
                    <h2 className="text-xl font-semibold text-gray-800 capitalize">
                        {location.pathname.split('/').pop().replace('-', ' ') || 'Tổng quan'}
                    </h2>

                    {/* KHU VỰC NAVBAR THAY ĐỔI THEO TRẠNG THÁI LOGIN */}
                    <div className="flex items-center space-x-4">
                        {isLoggedIn ? (
                            <>
                                <span className="text-sm font-medium text-gray-600">Xin chào, {email}</span>
                                <button onClick={handleLogout} className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-md hover:bg-red-600 transition-colors">
                                    Đăng xuất
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-md hover:bg-indigo-100 transition-colors">
                                    Đăng nhập
                                </Link>
                                <Link to="/register" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors">
                                    Đăng ký
                                </Link>
                            </>
                        )}
                    </div>
                </header>

                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}