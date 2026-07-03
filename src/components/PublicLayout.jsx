import { Outlet } from 'react-router-dom';
import Header from './Header';

export default function PublicLayout() {
    return (
        <div className="page-shell">
            <Header />
            <Outlet />
            <footer className="border-t border-[#d7e6f8] bg-white px-5 py-7 text-center text-xs font-semibold text-[#5c6d83]">
                © {new Date().getFullYear()} SEAL Hackathon Management System
            </footer>
        </div>
    );
}
