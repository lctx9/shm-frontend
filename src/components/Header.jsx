import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import NotificationBell from './NotificationBell';

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
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const email = localStorage.getItem('email');
    const [showDropdown, setShowDropdown] = useState(false);
    const [showMobileNav, setShowMobileNav] = useState(false);

    const account = getStoredAccount();

    const displayName = account.fullName || email || 'Tài khoản';
    const avatarUrl = account.avatarUrl || '';
    const isManager = managerRoles.has(role);
    const navClass = ({ isActive }) => (isActive ? 'nav-link-active' : 'nav-link-item');

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('email');
        localStorage.removeItem('user');
        setShowDropdown(false);
        navigate('/', { replace: true });
    };

    return (
        <header className="site-header">
            <div className="site-header-inner">
                <Link to="/" className="flex items-center gap-3" aria-label="SEAL trang chủ">
                    <span className="brand-mark"><span className="brand-mark-text">SEAL</span></span>
                    <span className="hidden sm:block">
                        <strong className="block text-sm font-extrabold tracking-[-0.02em] text-[#071936]">SEAL Hackathon</strong>
                        <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-[#718096]">Build · Compete · Inspire</span>
                    </span>
                </Link>

                <nav className="hidden items-center gap-9 md:flex" aria-label="Điều hướng chính">
                    <NavLink to="/" end className={navClass}>Trang chủ</NavLink>
                    <NavLink to="/events" className={navClass}>Sự kiện</NavLink>
                    <NavLink to="/leaderboard" className={navClass}>Bảng xếp hạng</NavLink>
                    <NavLink to="/about" className={navClass}>Về chúng tôi</NavLink>
                    {token && !isManager && <NavLink to="/my-team" className={navClass}>Đội của tôi</NavLink>}
                </nav>
 
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        className="icon-button md:hidden"
                        onClick={() => setShowMobileNav((current) => !current)}
                        aria-expanded={showMobileNav}
                        aria-controls="mobile-navigation"
                        aria-label="Mở điều hướng"
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
                                className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-[#d7e6f8] bg-[#0f63c9] text-xs font-black text-white hover:opacity-90 transition-all cursor-pointer"
                                aria-label="Mở menu tài khoản"
                            >
                                {avatarUrl ? <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" /> : getInitial(displayName)}
                            </button>
 
                            {showDropdown && (
                                <div className="absolute right-0 mt-2 w-52 rounded-lg border border-[#d7e6f8] bg-white py-2 shadow-lg">
                                    <Link to={isManager ? '/dashboard' : '/profile'} onClick={() => setShowDropdown(false)} className="block px-4 py-2 text-sm font-bold text-[#0b1f3f] hover:bg-[#eaf3ff]">
                                        {isManager ? 'Dashboard' : 'Hồ sơ cá nhân'}
                                    </Link>
                                    {!isManager && (
                                        <Link to="/my-team" onClick={() => setShowDropdown(false)} className="block px-4 py-2 text-sm font-bold text-[#0b1f3f] hover:bg-[#eaf3ff]">
                                            Đội của tôi
                                        </Link>
                                    )}
                                    <button type="button" onClick={handleLogout} className="block w-full px-4 py-2 text-left text-sm font-bold text-red-600 hover:bg-red-50">
                                        Đăng xuất
                                    </button>
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
            {showMobileNav && (
                <nav id="mobile-navigation" className="mobile-navigation" aria-label="Điều hướng di động">
                    <NavLink to="/" end className={navClass} onClick={() => setShowMobileNav(false)}>Trang chủ</NavLink>
                    <NavLink to="/events" className={navClass} onClick={() => setShowMobileNav(false)}>Sự kiện</NavLink>
                    <NavLink to="/leaderboard" className={navClass} onClick={() => setShowMobileNav(false)}>Bảng xếp hạng</NavLink>
                    <NavLink to="/about" className={navClass} onClick={() => setShowMobileNav(false)}>Về chúng tôi</NavLink>
                    {token && !isManager && <NavLink to="/my-team" className={navClass} onClick={() => setShowMobileNav(false)}>Đội của tôi</NavLink>}
                </nav>
            )}
        </header>
    );
}
