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

    // Dropdown states for MLH-style hover menus
    const [activeMenu, setActiveMenu] = useState(null);

    const account = getStoredAccount();
    const displayName = account.fullName || email || 'Account';
    const avatarUrl = account.avatarUrl || '';
    const isManager = managerRoles.has(role);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('email');
        localStorage.removeItem('user');
        setShowDropdown(false);
        navigate('/', { replace: true });
    };

    return (
        <header className="w-full bg-white/95 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50 px-6 py-4 flex items-center justify-between font-sans shadow-sm">
            {/* Left: Isometric SEAL Logo */}
            <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
                <svg className="h-8 w-auto hover:scale-105 transition-transform duration-200" viewBox="0 0 160 45" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Isometric Letter S (Red) */}
                    <g transform="translate(5, 5)">
                        <polygon points="12,4 22,9 12,14 2,9" fill="#ef4444" />
                        <polygon points="2,9 12,14 12,24 2,19" fill="#dc2626" />
                        <polygon points="12,14 22,9 22,19 12,24" fill="#b91c1c" />
                    </g>
                    {/* Isometric Letter E (Blue) */}
                    <g transform="translate(30, 5)">
                        <polygon points="12,4 22,9 12,14 2,9" fill="#3b82f6" />
                        <polygon points="2,9 12,14 12,24 2,19" fill="#2563eb" />
                        <polygon points="12,14 22,9 22,19 12,24" fill="#1d4ed8" />
                    </g>
                    {/* Isometric Letter A (Yellow) */}
                    <g transform="translate(55, 5)">
                        <polygon points="12,4 22,9 12,14 2,9" fill="#f59e0b" />
                        <polygon points="2,9 12,14 12,24 2,19" fill="#d97706" />
                        <polygon points="12,14 22,9 22,19 12,24" fill="#b45309" />
                    </g>
                    {/* Isometric Letter L (Green) */}
                    <g transform="translate(80, 5)">
                        <polygon points="12,4 22,9 12,14 2,9" fill="#10b981" />
                        <polygon points="2,9 12,14 12,24 2,19" fill="#059669" />
                        <polygon points="12,14 22,9 22,19 12,24" fill="#047857" />
                    </g>
                    
                    {/* Logo Text */}
                    <text x="110" y="26" fill="#0f172a" fontFamily="system-ui, sans-serif" fontSize="16" fontWeight="900" letterSpacing="-0.03em">SEAL</text>
                </svg>
            </Link>

            {/* Center: MLH Style Dropdowns & Navigation */}
            <nav className="hidden md:flex items-center gap-7 text-xs font-semibold tracking-wider text-slate-500 uppercase relative">
                {/* Participate Menu */}
                <div 
                    className="relative py-2 cursor-pointer hover:text-slate-900 transition-colors flex items-center gap-1"
                    onMouseEnter={() => setActiveMenu('participate')}
                    onMouseLeave={() => setActiveMenu(null)}
                >
                    <span>Participate</span>
                    <span className="text-[9px] text-slate-400">▼</span>
                    {activeMenu === 'participate' && (
                        <div className="absolute top-full left-0 bg-white border border-slate-100 rounded-md py-2 w-48 shadow-lg normal-case tracking-normal">
                            <Link to="/events" className="block px-4 py-2 hover:bg-slate-50 text-slate-700 font-bold text-xs">Browse events</Link>
                            <Link to="/leaderboard" className="block px-4 py-2 hover:bg-slate-50 text-slate-700 font-bold text-xs">Hall of Fame</Link>
                        </div>
                    )}
                </div>

                {/* Organizers Menu */}
                <div 
                    className="relative py-2 cursor-pointer hover:text-slate-900 transition-colors flex items-center gap-1"
                    onMouseEnter={() => setActiveMenu('organizers')}
                    onMouseLeave={() => setActiveMenu(null)}
                >
                    <span>Organizers</span>
                    <span className="text-[9px] text-slate-400">▼</span>
                    {activeMenu === 'organizers' && (
                        <div className="absolute top-full left-0 bg-white border border-slate-100 rounded-md py-2 w-48 shadow-lg normal-case tracking-normal">
                            <Link to={token && isManager ? '/dashboard' : '/login'} className="block px-4 py-2 hover:bg-slate-50 text-slate-700 font-bold text-xs">Console</Link>
                            <Link to="/about" className="block px-4 py-2 hover:bg-slate-50 text-slate-700 font-bold text-xs">Organizer Guidelines</Link>
                        </div>
                    )}
                </div>

                {/* Community Menu */}
                <div 
                    className="relative py-2 cursor-pointer hover:text-slate-900 transition-colors flex items-center gap-1"
                    onMouseEnter={() => setActiveMenu('community')}
                    onMouseLeave={() => setActiveMenu(null)}
                >
                    <span>Community</span>
                    <span className="text-[9px] text-slate-400">▼</span>
                    {activeMenu === 'community' && (
                        <div className="absolute top-full left-0 bg-white border border-slate-100 rounded-md py-2 w-48 shadow-lg normal-case tracking-normal">
                            <Link to="/leaderboard" className="block px-4 py-2 hover:bg-slate-50 text-slate-700 font-bold text-xs">Leaderboard</Link>
                            <Link to="/about" className="block px-4 py-2 hover:bg-slate-50 text-slate-700 font-bold text-xs">About SEAL</Link>
                        </div>
                    )}
                </div>

                <Link to="/about" className="hover:text-slate-900 transition-colors py-2">About</Link>
                <Link to="/events" className="hover:text-slate-900 transition-colors py-2">DEV</Link>
                <Link to={token ? "/my-team" : "/login"} className="hover:text-slate-900 transition-colors py-2">Attend</Link>
                <Link to="/about" className="hover:text-slate-900 transition-colors py-2">For Businesses</Link>
            </nav>

            {/* Right: User actions & Sign In */}
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    className="md:hidden text-slate-600 hover:text-black text-xl"
                    onClick={() => setShowMobileNav(prev => !prev)}
                >
                    ☰
                </button>

                {token ? (
                    <div className="flex items-center gap-3">
                        <NotificationBell />
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setShowDropdown(prev => !prev)}
                                className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100 hover:bg-slate-200 text-xs font-black text-slate-700 transition-all cursor-pointer"
                            >
                                {avatarUrl ? <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" /> : getInitial(displayName)}
                            </button>

                            {showDropdown && (
                                <div className="absolute right-0 mt-2 w-52 rounded-lg border border-slate-100 bg-white py-2 shadow-lg z-50">
                                    <Link to={isManager ? '/dashboard' : '/profile'} onClick={() => setShowDropdown(false)} className="block px-4 py-2 text-sm font-bold text-[#0b1f3f] hover:bg-slate-50">
                                        {isManager ? 'Dashboard' : 'Profile'}
                                    </Link>
                                    {!isManager && (
                                        <Link to="/my-team" onClick={() => setShowDropdown(false)} className="block px-4 py-2 text-sm font-bold text-[#0b1f3f] hover:bg-slate-50">
                                            My Team
                                        </Link>
                                    )}
                                    <button type="button" onClick={handleLogout} className="block w-full px-4 py-2 text-left text-sm font-bold text-red-600 hover:bg-red-50">
                                        Sign out
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <Link to="/login" className="text-xs font-semibold tracking-wider text-slate-500 hover:text-slate-900 uppercase transition-colors">
                        Sign In
                    </Link>
                )}
            </div>

            {/* Mobile Navigation */}
            {showMobileNav && (
                <div className="absolute top-full left-0 right-0 bg-white border-b border-slate-100 shadow-md py-4 px-6 flex flex-col gap-3 text-xs font-bold uppercase tracking-wider text-slate-600 md:hidden z-45">
                    <Link to="/events" onClick={() => setShowMobileNav(false)}>Browse Events</Link>
                    <Link to="/leaderboard" onClick={() => setShowMobileNav(false)}>Hall of Fame</Link>
                    <Link to="/about" onClick={() => setShowMobileNav(false)}>About Us</Link>
                    {token && !isManager && <Link to="/my-team" onClick={() => setShowMobileNav(false)}>My Team</Link>}
                    {token && isManager && <Link to="/dashboard" onClick={() => setShowMobileNav(false)}>Dashboard</Link>}
                </div>
            )}
        </header>
    );
}
