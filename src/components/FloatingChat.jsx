import { useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient';
import TeamChat from '../pages/TeamChat';

export default function FloatingChat() {
    const [isOpen, setIsOpen] = useState(false);
    const [teams, setTeams] = useState([]);
    const [activeTeamId, setActiveTeamId] = useState('');
    const [unread, setUnread] = useState(false);

    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const isManager = ['ADMIN', 'COORDINATOR', 'STAFF', 'JUDGE', 'MENTOR'].includes(role);

    useEffect(() => {
        const fetchTeams = async () => {
            if (!token || isManager) return;
            try {
                const res = await axiosClient.get('/teams/my-team');
                const list = res.result || [];
                setTeams(list);
                if (list.length > 0) {
                    setActiveTeamId(list[0].id);
                }
            } catch (err) {
                console.error("Error fetching teams for floating chat:", err);
            }
        };
        fetchTeams();
    }, [token, isManager]);

    useEffect(() => {
        const handleChatRead = () => {
            setUnread(false);
        };
        window.addEventListener('chatRead', handleChatRead);
        return () => window.removeEventListener('chatRead', handleChatRead);
    }, []);

    if (!token || isManager || teams.length === 0) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50 font-sans">
            {/* Chat Panel Popup */}
            <div 
                className={`absolute bottom-20 right-0 w-[380px] bg-white rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.16)] border border-slate-100 overflow-hidden flex flex-col transition-all duration-300 origin-bottom-right ${
                    isOpen 
                        ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto' 
                        : 'opacity-0 scale-95 translate-y-4 pointer-events-none'
                }`}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-[#1f3747] to-[#2c4e66] px-5 py-4 flex items-center justify-between text-white">
                    <div className="flex items-center gap-2">
                        <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="font-black text-sm uppercase tracking-wider">Team Chatbox</span>
                    </div>
                    <button 
                        onClick={() => setIsOpen(false)}
                        className="text-white hover:text-slate-200 text-sm font-bold p-1 cursor-pointer transition-colors"
                        aria-label="Close Chat"
                    >
                        ✕
                    </button>
                </div>

                {/* Team Switcher for multi-team users */}
                {teams.length > 1 && (
                    <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-100 flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Chọn kênh chat:</span>
                        <select 
                            value={activeTeamId} 
                            onChange={(e) => setActiveTeamId(e.target.value)}
                            className="text-xs font-bold bg-white border border-slate-200 rounded-lg px-2 py-1 outline-none text-[#0b1f3f] shadow-sm focus:border-blue-500 cursor-pointer"
                        >
                            {teams.map(t => (
                                <option key={t.id} value={t.id}>
                                    {t.name} ({t.eventName})
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Chat Frame */}
                <div className="bg-white overflow-hidden" style={{ height: '400px' }}>
                    {isOpen && activeTeamId && (
                        <TeamChat embedded={true} teamId={activeTeamId} />
                    )}
                </div>
            </div>

            {/* Floating Toggle Button */}
            <button
                onClick={() => {
                    setIsOpen(!isOpen);
                    setUnread(false);
                }}
                className={`flex h-14 w-14 items-center justify-center rounded-full text-white shadow-[0_8px_30px_rgba(31,55,71,0.3)] transition-all duration-300 hover:scale-110 cursor-pointer active:scale-95 ${
                    isOpen 
                        ? 'bg-[#1f3747] hover:bg-[#152530] rotate-90' 
                        : 'bg-gradient-to-tr from-[#1f3747] to-[#2c4e66] hover:from-[#2c4e66] hover:to-[#386280]'
                }`}
                aria-label="Toggle Team Chatbox"
            >
                {isOpen ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                ) : (
                    <div className="relative">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a.75.75 0 01-1.074-.765 6.002 6.002 0 011.085-3.897C4.122 14.825 3 13.538 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                        </svg>
                        {unread && (
                            <span className="absolute -top-1.5 -right-1.5 flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                            </span>
                        )}
                    </div>
                )}
            </button>
        </div>
    );
}
