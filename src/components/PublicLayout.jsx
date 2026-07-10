import { Outlet } from 'react-router-dom';
import Header from './Header';

export default function PublicLayout() {
    return (
        <div className="page-shell">
            <Header />
            <div className="public-content">
                <Outlet />
            </div>
            <footer className="site-footer">
                <div className="site-footer-grid">
                    <div>
                        <div className="flex items-center gap-3">
                            <span className="brand-mark"><span className="brand-mark-text">SEAL</span></span>
                            <div>
                                <p className="font-extrabold text-[#071936]">SEAL Hackathon</p>
                                <p className="text-xs text-[#718096]">Nơi ý tưởng được biến thành sản phẩm.</p>
                            </div>
                        </div>
                    </div>
                    <div className="site-footer-links">
                        <a href="/events">Sự kiện</a>
                        <a href="/leaderboard">Bảng xếp hạng</a>
                        <a href="/about">Về chúng tôi</a>
                    </div>
                </div>
                <div className="site-footer-bottom">© {new Date().getFullYear()} SEAL Hackathon Management System</div>
            </footer>
        </div>
    );
}
