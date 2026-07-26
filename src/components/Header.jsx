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

    const displayName = account.fullName || email || 'Account';
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

    const isPastelPage = pathname === '/' || pathname === '/events' || pathname === '/leaderboard' || pathname === '/about';
    const headerStyle = {
        backgroundColor: isPastelPage ? '#f8fafc' : 'rgba(255, 255, 255, 0.95)',
        borderBottomColor: isPastelPage ? 'transparent' : 'var(--app-border)',
        backdropFilter: isPastelPage ? 'none' : 'blur(16px)'
    };

    return (
        <header className="site-header" style={headerStyle}>
            <div className="site-header-inner">
                <div className="flex items-center gap-[29px]">
                    <Link to="/" className="flex items-center gap-3" aria-label="SEAL Home">
                        <img src={logoFpt} alt="FPT University" className="object-contain rounded" style={{ width: '60px', height: '45px' }} />
                        <span className="h-10 border-l border-slate-300" />
                        <div className="flex items-baseline gap-1.5 relative -top-[1px]">
                            <span className="brand-mark-text font-black text-[32px] tracking-tight text-slate-900 leading-none">seal.</span>
                            <span className="hidden sm:block text-[16px] font-black uppercase tracking-widest text-slate-500 leading-none">Hackathon</span>
                        </div>
                    </Link>

                    <nav className="hidden items-center gap-8 md:flex relative top-[1px]" aria-label="Main Navigation">
                        <NavLink to="/events" className={navClass}>Events</NavLink>
                        <NavLink to="/leaderboard" className={navClass}>Leaderboard</NavLink>
                        <NavLink to="/about" className={navClass}>About Us</NavLink>
                        {token && !isManager && <NavLink to="/my-team" className={navClass}>My Team</NavLink>}
                    </nav>
                </div>
 
                <div className="flex items-center gap-2">
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
                                className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-[#d7e6f8] bg-[#0f63c9] text-xs font-black text-white hover:opacity-90 transition-all cursor-pointer"
                                aria-label="Open User Menu"
                            >
                                {avatarUrl ? <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" /> : getInitial(displayName)}
                            </button>
 
                            {showDropdown && (
                                <div className="absolute right-0 mt-2 w-52 rounded-lg border border-[#d7e6f8] bg-white py-2 shadow-lg">
                                    <Link to={isManager ? '/dashboard' : '/profile'} onClick={() => setShowDropdown(false)} className="block px-4 py-2 text-sm font-bold text-[#0b1f3f] hover:bg-[#eaf3ff]">
                                        {isManager ? 'Dashboard' : 'My Profile'}
                                    </Link>
                                    {!isManager && (
                                        <Link to="/my-team" onClick={() => setShowDropdown(false)} className="block px-4 py-2 text-sm font-bold text-[#0b1f3f] hover:bg-[#eaf3ff]">
                                            My Team
                                        </Link>
                                    )}
                                    <button type="button" onClick={handleLogout} className="block w-full px-4 py-2 text-left text-sm font-bold text-red-600 hover:bg-red-50">
                                        Sign Out
                                    </button>
                                </div>
                            )}
                        </div>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="btn-secondary">Sign In</Link>
                            <Link to="/register" className="btn-primary">Sign Up</Link>
                        </>
                    )}
                </div>
            </div>
            {showMobileNav && (
                <nav id="mobile-navigation" className="mobile-navigation" aria-label="Mobile Navigation">
                    <NavLink to="/" end className={navClass} onClick={() => setShowMobileNav(false)}>Home</NavLink>
                    <NavLink to="/events" className={navClass} onClick={() => setShowMobileNav(false)}>Events</NavLink>
                    <NavLink to="/leaderboard" className={navClass} onClick={() => setShowMobileNav(false)}>Leaderboard</NavLink>
                    <NavLink to="/about" className={navClass} onClick={() => setShowMobileNav(false)}>About Us</NavLink>
                    {token && !isManager && <NavLink to="/my-team" className={navClass} onClick={() => setShowMobileNav(false)}>My Team</NavLink>}
                </nav>
            )}
        </header>
    );
}
