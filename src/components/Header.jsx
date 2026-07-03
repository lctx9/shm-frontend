import { useMemo, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';

const managerRoles = new Set(['ADMIN', 'COORDINATOR', 'JUDGE', 'MENTOR']);

function getInitial(email) {
    return (email || 'U').trim().charAt(0).toUpperCase();
}

export default function Header() {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const email = localStorage.getItem('email');
    const [showDropdown, setShowDropdown] = useState(false);

    const account = useMemo(() => {
        try {
            return JSON.parse(localStorage.getItem('user')) || {};
        } catch {
            return {};
        }
    }, [token]);

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
                <Link to="/" className="brand-mark" aria-label="SEAL trang chủ">
                    <span className="brand-mark-text">SEAL</span>
                </Link>

                <nav className="hidden items-center gap-9 md:flex" aria-label="Điều hướng chính">
                    <NavLink to="/" end className={navClass}>Trang chủ</NavLink>
                    <NavLink to="/events" className={navClass}>Sự kiện</NavLink>
                    <NavLink to="/leaderboard" className={navClass}>Bảng xếp hạng</NavLink>
                    <NavLink to="/about" className={navClass}>Về chúng tôi</NavLink>
                    {token && !isManager && <NavLink to="/my-team" className={navClass}>Đội của tôi</NavLink>}
                </nav>

                <div className="flex items-center gap-2">
                    {token ? (
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setShowDropdown((current) => !current)}
                                className="flex items-center gap-2 rounded-full border border-[#d7e6f8] bg-white px-2 py-1.5 text-sm font-bold text-[#0b1f3f] transition hover:bg-[#eaf3ff]"
                                aria-label="Mở menu tài khoản"
                            >
                                <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-[#0f63c9] text-xs font-black text-white">
                                    {avatarUrl ? <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" /> : getInitial(displayName)}
                                </span>
                                <span className="hidden max-w-36 truncate sm:inline">{displayName}</span>
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
                    ) : (
                        <>
                            <Link to="/login" className="btn-secondary">Đăng nhập</Link>
                            <Link to="/register" className="btn-primary">Đăng ký</Link>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}
