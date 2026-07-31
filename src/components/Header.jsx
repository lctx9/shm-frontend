import { useState } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import NotificationBell from './NotificationBell';
import logoFpt from '../assets/fpt.jpg';

const managerRoles = new Set(['ADMIN', 'COORDINATOR', 'STAFF', 'JUDGE', 'MENTOR']);

function getInitial(email) {
    return (email || 'U').trim().charAt(0).toUpperCase();
}

function getStoredAccount() {
    try {
        return JSON.parse(localStorage.getItem('user')) || {};
    } catch {
        return {};
    }
}

export default function Header() {
    const navigate = useNavigate();
    const location = useLocation();
    const pathname = location.pathname;
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const email = localStorage.getItem('email');
    const [showDropdown, setShowDropdown] = useState(false);
    const [showMobileNav, setShowMobileNav] = useState(false);

    const account = getStoredAccount();

    const displayName = account.fullName || email || 'Tài khoản';
    const avatarUrl = account.avatarUrl || '';
    const isManager = managerRoles.has(role);
    const navClass = ({ isActive }) => (isActive ? 'nav-link-active font-bold text-[#0f63c9]' : 'nav-link-item');

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('email');
        localStorage.removeItem('user');
        setShowDropdown(false);
        navigate('/', { replace: true });
    };

    const isPastelPage = pathname === '/' || pathname === '/events' || pathname === '/leaderboard' || pathname === '/about';
    const headerStyle = {
        backgroundColor: isPastelPage ? '#f8fafc' : 'rgba(255, 255, 255, 0.95)',
        borderBottomColor: isPastelPage ? 'transparent' : 'var(--app-border)',
        backdropFilter: isPastelPage ? 'none' : 'blur(16px)'
    };

    return (
        <header className="site-header" style={headerStyle}>
            <div className="site-header-inner">
                <div className="flex items-center gap-[24px]">
                    <Link to="/" className="flex items-center gap-3 shrink-0" aria-label="SEAL Home">
                        <img src={logoFpt} alt="FPT University" className="object-contain rounded" style={{ width: '60px', height: '45px' }} />
                        <span className="h-10 border-l border-slate-300" />
                        <div className="flex items-baseline gap-1.5 relative -top-[1px]">
                            <span className="brand-mark-text font-black text-[32px] tracking-tight text-slate-900 leading-none">seal.</span>
                            <span className="hidden sm:block text-[16px] font-black uppercase tracking-widest text-slate-500 leading-none">Hackathon</span>
                        </div>
                    </Link>

                    {/* Navigation Menu for All Roles */}
                    <nav className="hidden items-center gap-6 md:flex relative top-[1px] text-sm font-semibold" aria-label="Main Navigation">
                        <NavLink to="/events" className={navClass}>Sự kiện</NavLink>
                        <NavLink to="/leaderboard" className={navClass}>Bảng xếp hạng</NavLink>
                        <NavLink to="/about" className={navClass}>Giới thiệu</NavLink>

                        {/* Role specific navigation tabs */}
                        {token && role === 'STUDENT' && (
                            <>
                                <NavLink to="/my-team" className={navClass}>Đội của tôi</NavLink>
                                <NavLink to="/submissions" className={navClass}>Bài nộp</NavLink>
                            </>
                        )}

                        {token && (role === 'COORDINATOR' || role === 'STAFF') && (
                            <>
                                <NavLink to="/dashboard" end className={navClass}>Tổng quan</NavLink>
                                <NavLink to="/dashboard/events" className={navClass}>Quản lý sự kiện</NavLink>
                                <NavLink to="/dashboard/scoring-config" className={navClass}>Cấu hình điểm</NavLink>
                                <NavLink to="/dashboard/submissions" className={navClass}>Bài nộp</NavLink>
                                <NavLink to="/dashboard/audit-logs" className={navClass}>Audit điểm</NavLink>
                            </>
                        )}

                        {token && role === 'JUDGE' && (
                            <>
                                <NavLink to="/dashboard" end className={navClass}>Tổng quan</NavLink>
                                <NavLink to="/dashboard/grading" className={navClass}>Chấm bài</NavLink>
                                <NavLink to="/dashboard/scoring-stats" className={navClass}>Thống kê điểm</NavLink>
                            </>
                        )}

                        {token && role === 'MENTOR' && (
                            <>
                                <NavLink to="/dashboard" end className={navClass}>Tổng quan</NavLink>
                                <NavLink to="/dashboard/teams" className={navClass}>Đội phụ trách</NavLink>
                                <NavLink to="/dashboard/chat" className={navClass}>Kênh Chat</NavLink>
                            </>
                        )}

                        {token && role === 'ADMIN' && (
                            <>
                                <NavLink to="/dashboard" end className={navClass}>Tổng quan</NavLink>
                                <NavLink to="/dashboard/users" className={navClass}>Tài khoản</NavLink>
                                <NavLink to="/dashboard/student-approval" className={navClass}>Duyệt SV</NavLink>
                                <NavLink to="/dashboard/staff" className={navClass}>Quản lý Staff</NavLink>
                                <NavLink to="/dashboard/events" className={navClass}>Sự kiện</NavLink>
                                <NavLink to="/dashboard/monitoring" className={navClass}>Giám sát</NavLink>
                            </>
                        )}
                    </nav>
                </div>
 
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        className="icon-button md:hidden"
                        onClick={() => setShowMobileNav((current) => !current)}
                        aria-expanded={showMobileNav}
                        aria-controls="mobile-navigation"
                        aria-label="Open Navigation"
                    >
                        <span aria-hidden="true" className="text-xl leading-none">☰</span>
                    </button>
                    {token ? (
                        <>
                        <NotificationBell />
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setShowDropdown((current) => !current)}
                                className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-[#d7e6f8] bg-[#0f63c9] text-xs font-black text-white hover:opacity-90 transition-all cursor-pointer shadow-sm"
                                aria-label="Open User Menu"
                            >
                                {avatarUrl ? <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" /> : getInitial(displayName)}
                            </button>
 
                            {showDropdown && (
                                <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white py-2 shadow-xl z-50">
                                    <div className="border-b border-slate-100 px-4 py-2.5">
                                        <p className="text-xs font-extrabold text-slate-900 truncate">{displayName}</p>
                                        <p className="text-[11px] text-slate-500 truncate">{email}</p>
                                        <span className="mt-1.5 inline-block rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-black uppercase text-[#0f63c9]">
                                            {role || 'USER'}
                                        </span>
                                    </div>

                                    {isManager && (
                                        <Link to="/dashboard" onClick={() => setShowDropdown(false)} className="block px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">
                                            📊 Dashboard Quản trị
                                        </Link>
                                    )}

                                    <Link to="/profile" onClick={() => setShowDropdown(false)} className="block px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">
                                        👤 Hồ sơ cá nhân
                                    </Link>

                                    {role === 'STUDENT' && (
                                        <Link to="/my-team" onClick={() => setShowDropdown(false)} className="block px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">
                                            👥 Đội của tôi
                                        </Link>
                                    )}

                                    <div className="mt-1 border-t border-slate-100 pt-1">
                                        <button type="button" onClick={handleLogout} className="block w-full px-4 py-2 text-left text-xs font-bold text-red-600 hover:bg-red-50">
                                            🚪 Đăng xuất
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="btn-secondary">Đăng nhập</Link>
                            <Link to="/register" className="btn-primary">Đăng ký</Link>
                        </>
                    )}
                </div>
            </div>
            {/* Mobile Navigation */}
            {showMobileNav && (
                <nav id="mobile-navigation" className="mobile-navigation bg-white p-4 space-y-2 border-b border-slate-200" aria-label="Mobile Navigation">
                    <NavLink to="/events" className={navClass} onClick={() => setShowMobileNav(false)}>Sự kiện</NavLink>
                    <NavLink to="/leaderboard" className={navClass} onClick={() => setShowMobileNav(false)}>Bảng xếp hạng</NavLink>
                    <NavLink to="/about" className={navClass} onClick={() => setShowMobileNav(false)}>Giới thiệu</NavLink>
                    {token && role === 'STUDENT' && <NavLink to="/my-team" className={navClass} onClick={() => setShowMobileNav(false)}>Đội của tôi</NavLink>}
                    {token && isManager && <NavLink to="/dashboard" className={navClass} onClick={() => setShowMobileNav(false)}>Dashboard Quản trị</NavLink>}
                </nav>
            )}
        </header>
    );
}
