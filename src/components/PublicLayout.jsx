import { Navigate, Outlet } from 'react-router-dom';
import Header from './Header';
import logoFpt from '../assets/fpt.jpg';

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
                            <img src={logoFpt} alt="FPT University" className="object-contain rounded" style={{ width: '60px', height: '45px' }} />
                            <span className="h-10 border-l border-slate-300" />
                            <div className="flex items-baseline gap-1.5 relative -top-[1px]">
                                <span className="brand-mark-text font-black text-[32px] tracking-tight text-slate-900 leading-none">seal.</span>
                                <span className="hidden sm:block text-[16px] font-black uppercase tracking-widest text-slate-500 leading-none">Hackathon</span>
                            </div>
                        </div>
                        <p className="text-xs text-slate-400 mt-2 pl-0.5">Where ideas turn into reality.</p>
                    </div>
                    <div className="site-footer-links">
                        <a href="/events">Events</a>
                        <a href="/leaderboard">Leaderboard</a>
                        <a href="/about">About Us</a>
                    </div>
                </div>
                <div className="site-footer-bottom">© {new Date().getFullYear()} SEAL Hackathon Management System</div>
            </footer>
        </div>
    );
}
