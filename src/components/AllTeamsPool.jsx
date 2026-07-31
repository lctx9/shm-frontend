import { useEffect, useState, useMemo } from 'react';
import axiosClient from '../api/axiosClient';

const currentUserEmail = () => localStorage.getItem('email') || 'anonymous';

// Static mock teams to make the directory look complete
const MOCK_TEAMS = [
    {
        id: 'mock-team-1',
        name: 'Alpha Byte',
        trackName: 'Artificial Intelligence',
        type: 'PUBLIC',
        skillsNeeded: 'Python, TensorFlow, Deep Learning',
        members: [
            { id: 'm1', fullName: 'Aarav Mehta', role: 'LEADER' },
            { id: 'm2', fullName: 'Ishaan Sharma', role: 'MEMBER' },
            { id: 'm3', fullName: 'Ananya Iyer', role: 'MEMBER' }
        ]
    },
    {
        id: 'mock-team-2',
        name: 'AI Avengers',
        trackName: 'Web Application',
        type: 'PRIVATE',
        skillsNeeded: 'React, Node.js, UI/UX Design',
        members: [
            { id: 'm4', fullName: 'Kabir Singh', role: 'LEADER' },
            { id: 'm5', fullName: 'Kiara Advani', role: 'MEMBER' },
            { id: 'm6', fullName: 'Rohan Mehra', role: 'MEMBER' },
            { id: 'm7', fullName: 'Aditi Rao', role: 'MEMBER' }
        ]
    },
    {
        id: 'mock-team-3',
        name: 'DevDynasty',
        trackName: 'Mobile App Development',
        type: 'PUBLIC',
        skillsNeeded: 'Flutter, Firebase, Kotlin',
        members: [
            { id: 'm8', fullName: 'Dev Patel', role: 'LEADER' },
            { id: 'm9', fullName: 'Priya Patel', role: 'MEMBER' },
            { id: 'm10', fullName: 'Rahul Verma', role: 'MEMBER' },
            { id: 'm11', fullName: 'Siddharth Malhotra', role: 'MEMBER' },
            { id: 'm12', fullName: 'Alia Bhatt', role: 'MEMBER' }
        ]
    },
    {
        id: 'mock-team-4',
        name: 'Cyber Sentinels',
        trackName: 'Web Application',
        type: 'PUBLIC',
        skillsNeeded: 'Solidity, Ethereum, Web3.js',
        members: [
            { id: 'm13', fullName: 'Arjun Rampal', role: 'LEADER' },
            { id: 'm14', fullName: 'Shraddha Kapoor', role: 'MEMBER' }
        ]
    },
    {
        id: 'mock-team-5',
        name: 'Hack-o-Holics',
        trackName: 'Artificial Intelligence',
        type: 'PRIVATE',
        skillsNeeded: 'C++, Raspberry Pi, Arduino, Python',
        members: [
            { id: 'm15', fullName: 'Varun Dhawan', role: 'LEADER' },
            { id: 'm16', fullName: 'Kriti Sanon', role: 'MEMBER' },
            { id: 'm17', fullName: 'Tiger Shroff', role: 'MEMBER' }
        ]
    }
];

export default function AllTeamsPool({ eventId, onTeamJoined }) {
    const [teams, setTeams] = useState([]);
    const [event, setEvent] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [trackFilter, setTrackFilter] = useState('ALL');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [requiredSkillFilter, setRequiredSkillFilter] = useState('ALL');
    const [loading, setLoading] = useState(true);
    
    // Modal states
    const [confirmJoinTeam, setConfirmJoinTeam] = useState(null); // team object
    const [passwordJoinTeam, setPasswordJoinTeam] = useState(null); // team object
    const [joinPassword, setJoinPassword] = useState('');
    const [joinError, setJoinError] = useState('');
    const [joinStatuses, setJoinStatuses] = useState({}); // teamId -> { text: string, type: 'info'|'success'|'error' }

    const isEventStarted = useMemo(() => {
        if (!event?.eventStartDate) return false;
        return new Date() >= new Date(event.eventStartDate);
    }, [event]);

    const isRegistrationEnded = useMemo(() => {
        if (!event?.regEndDate) return false;
        return new Date() > new Date(event.regEndDate);
    }, [event]);

    // Combine mock teams and database teams
    const allTeams = useMemo(() => {
        // Map database teams event properties
        return [...MOCK_TEAMS, ...teams];
    }, [teams]);

    // Check if user is currently in a team for this event
    const userTeam = useMemo(() => {
        if (!currentUser) return null;
        return allTeams.find(t => t.members?.some(m => m.userId === currentUser.id || m.email === currentUser.email));
    }, [allTeams, currentUser]);

    const isManager = useMemo(() => {
        if (!currentUser) return false;
        return ['ADMIN', 'COORDINATOR', 'STAFF', 'JUDGE', 'MENTOR'].includes(currentUser.role);
    }, [currentUser]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [teamsRes, userRes, eventRes] = await Promise.all([
                axiosClient.get('/teams'),
                axiosClient.get('/users/me').catch(() => ({ result: null })),
                axiosClient.get(`/events/${eventId}`).catch(() => ({ result: null }))
            ]);

            // Filter teams by eventId
            const eventTeams = (teamsRes.result || []).filter(
                t => String(t.eventId) === String(eventId)
            );
            setTeams(eventTeams);

            let userProfile = null;
            if (userRes && userRes.data && userRes.data.result) {
                userProfile = userRes.data.result;
            } else if (userRes && userRes.result) {
                userProfile = userRes.result;
            }
            setCurrentUser(userProfile);

            const eventObj = eventRes?.result || null;
            setEvent(eventObj);
        } catch (err) {
            console.error("Error loading teams pool:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [eventId]);

    // Extract all unique track names for filtering
    const tracksList = useMemo(() => {
        const tracks = new Set();
        allTeams.forEach(t => {
            if (t.trackName) tracks.add(t.trackName);
        });
        return Array.from(tracks).sort();
    }, [allTeams]);

    // Extract all unique desired skills for filtering
    const requiredSkillsList = useMemo(() => {
        const skills = new Set();
        allTeams.forEach(t => {
            if (t.skillsNeeded) {
                t.skillsNeeded.split(',').map(s => s.trim()).filter(Boolean).forEach(s => skills.add(s));
            }
        });
        return Array.from(skills).sort();
    }, [allTeams]);

    // Filter teams based on search, track, status, and desired skills
    const filteredTeams = useMemo(() => {
        return allTeams.filter(t => {
            const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (t.trackName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (t.skillsNeeded || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                t.members?.some(m => m.fullName.toLowerCase().includes(searchQuery.toLowerCase()));

            const matchesTrack = trackFilter === 'ALL' || t.trackName === trackFilter;

            const isFull = (t.members?.length || 0) >= 5;
            const matchesStatus = statusFilter === 'ALL' ||
                (statusFilter === 'RECRUITING' && !isFull) ||
                (statusFilter === 'FULL' && isFull);

            const matchesRequiredSkill = requiredSkillFilter === 'ALL' ||
                (t.skillsNeeded || '').split(',').map(s => s.trim().toLowerCase()).includes(requiredSkillFilter.toLowerCase());

            return matchesSearch && matchesTrack && matchesStatus && matchesRequiredSkill;
        });
    }, [allTeams, searchQuery, trackFilter, statusFilter, requiredSkillFilter]);

    const handleJoinRequest = (team) => {
        if (team.id.toString().startsWith('mock-')) {
            // For mock teams, simulate action
            setConfirmJoinTeam(team);
        } else if (team.type === 'PRIVATE') {
            setPasswordJoinTeam(team);
            setJoinPassword('');
            setJoinError('');
        } else {
            setConfirmJoinTeam(team);
        }
    };

    const submitJoinRequest = async () => {
        if (!confirmJoinTeam) return;
        const targetTeam = confirmJoinTeam;
        setConfirmJoinTeam(null);

        setJoinStatuses(prev => ({
            ...prev,
            [targetTeam.id]: { text: 'Submitting...', type: 'info' }
        }));

        try {
            if (targetTeam.id.toString().startsWith('mock-')) {
                await new Promise(resolve => setTimeout(resolve, 800));
                const key = `shm_join_req_${currentUserEmail()}_${targetTeam.id}`;
                localStorage.setItem(key, 'true');
                setJoinStatuses(prev => ({
                    ...prev,
                    [targetTeam.id]: { text: 'Requested ✓', type: 'success' }
                }));
                return;
            }

            await axiosClient.post(`/teams/${targetTeam.id}/join-request`);
            const key = `shm_join_req_${currentUserEmail()}_${targetTeam.id}`;
            localStorage.setItem(key, 'true');
            setJoinStatuses(prev => ({
                ...prev,
                [targetTeam.id]: { text: 'Requested ✓', type: 'success' }
            }));
        } catch (err) {
            setJoinStatuses(prev => ({
                ...prev,
                [targetTeam.id]: { text: err.message || 'Request failed', type: 'error' }
            }));
        }
    };

    const submitPrivateJoin = async () => {
        if (!passwordJoinTeam) return;
        if (!/^\d{4}$/.test(joinPassword)) {
            setJoinError('PIN must be exactly 4 digits.');
            return;
        }
        const targetTeam = passwordJoinTeam;

        setJoinStatuses(prev => ({
            ...prev,
            [targetTeam.id]: { text: 'Joining...', type: 'info' }
        }));

        try {
            await axiosClient.post(`/teams/${targetTeam.id}/join-private`, { password: joinPassword });
            setPasswordJoinTeam(null);
            setJoinPassword('');
            setJoinError('');
            setJoinStatuses(prev => ({
                ...prev,
                [targetTeam.id]: { text: 'Joined ✓', type: 'success' }
            }));
            fetchData();
            if (onTeamJoined) onTeamJoined(true);
        } catch (err) {
            setJoinError(err.message || 'Incorrect PIN or failed to join');
            setJoinStatuses(prev => ({
                ...prev,
                [targetTeam.id]: { text: 'Failed', type: 'error' }
            }));
        }
    };

    if (loading) {
        return <div className="text-center py-12 text-[#5c6d83] font-bold">Loading teams list...</div>;
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-[#071936]">Teams Directory</h1>
                    <p className="text-xs text-slate-500 font-medium mt-1">Browse participating teams, view members, and request to join open spots.</p>
                </div>
                {userTeam && (
                    <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 px-4 py-2.5 text-xs text-emerald-900 font-semibold shadow-xs">
                        You are already a member of team <strong>{userTeam.name}</strong>.
                    </div>
                )}
            </div>

            {/* Filters Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <input
                    type="text"
                    className="input-custom bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm"
                    placeholder="Search by team, track or skills"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                
                <select
                    className="input-custom bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm"
                    value={trackFilter}
                    onChange={(e) => setTrackFilter(e.target.value)}
                >
                    <option value="ALL">All tracks</option>
                    {tracksList.map(track => (
                        <option key={track} value={track}>{track}</option>
                    ))}
                </select>

                <select
                    className="input-custom bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                >
                    <option value="ALL">All statuses</option>
                    <option value="RECRUITING">Recruiting</option>
                    <option value="FULL">Full</option>
                </select>

                <select
                    className="input-custom bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm"
                    value={requiredSkillFilter}
                    onChange={(e) => setRequiredSkillFilter(e.target.value)}
                >
                    <option value="ALL">Skills Needed</option>
                    {requiredSkillsList.map(skill => (
                        <option key={skill} value={skill}>{skill}</option>
                    ))}
                </select>
            </div>

            {/* Teams List Table */}
            <div className="overflow-x-auto bg-white border border-slate-200 rounded-lg shadow-sm">
                <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                    <thead className="bg-slate-50 text-[11px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 border-b border-slate-200">Team Details</th>
                            <th className="px-6 py-4 border-b border-slate-200">Members</th>
                            <th className="px-6 py-4 border-b border-slate-200">Capacity</th>
                            <th className="px-6 py-4 border-b border-slate-200">Status</th>
                            {!isManager && !userTeam && !isEventStarted && !isRegistrationEnded && (
                                <th className="px-6 py-4 border-b border-slate-200 text-right">Action</th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredTeams.map(team => {
                            const isFull = (team.members?.length || 0) >= 5;
                            const isPrivate = team.type === 'PRIVATE';
                            // Key scoped per user so different users don't share state
                            const hasRequested = !isPrivate && localStorage.getItem(`shm_join_req_${currentUserEmail()}_${team.id}`) === 'true';
                            const joinStatus = joinStatuses[team.id];

                            return (
                                <tr key={team.id} className="hover:bg-slate-50/50 transition-colors">
                                    {/* Team Details */}
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="font-black text-slate-900 leading-tight flex items-center gap-1.5">
                                                {team.name}
                                                {isPrivate && (
                                                    <span className="text-[10px] bg-slate-100 border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded-sm font-bold uppercase tracking-wider">
                                                        Private 🔒
                                                    </span>
                                                )}
                                            </p>
                                            <p className="text-xs text-slate-500 font-semibold mt-1">
                                                Track: {team.trackName || 'General'}
                                            </p>
                                            {team.skillsNeeded && (
                                                <div className="flex flex-wrap gap-1 mt-1.5 max-w-[280px]">
                                                    {team.skillsNeeded.split(',').map(s => s.trim()).filter(Boolean).map(skill => (
                                                        <span key={skill} className="inline-flex items-center rounded bg-amber-50 border border-amber-150 px-2 py-0.5 text-[10px] font-black text-amber-700">
                                                            {skill}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </td>

                                    {/* Members List */}
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-1 max-w-[280px]">
                                            {(team.members || []).map((m, idx) => (
                                                <span 
                                                    key={m.id || idx}
                                                    className="inline-flex items-center rounded-sm bg-slate-50 border border-slate-200 text-slate-700 px-2 py-0.5 text-xs font-semibold"
                                                >
                                                    {m.fullName}
                                                    {m.role === 'LEADER' && ' 👑'}
                                                </span>
                                            ))}
                                        </div>
                                    </td>

                                    {/* Capacity */}
                                    <td className="px-6 py-4 font-black text-slate-700">
                                        {team.members?.length || 0} / 5
                                    </td>

                                    {/* Status Badge */}
                                    <td className="px-6 py-4">
                                        {isFull ? (
                                            <span className="inline-flex items-center rounded-full bg-slate-50 border border-slate-200 px-3 py-1 text-xs font-black text-slate-500">
                                                Full
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-black text-blue-700">
                                                Recruiting
                                            </span>
                                        )}
                                    </td>

                                    {/* Action Column */}
                                    {!isManager && !userTeam && !isEventStarted && !isRegistrationEnded && (
                                        <td className="px-6 py-4 text-right shrink-0">
                                            {isFull ? (
                                                <span className="text-xs text-slate-400 italic font-semibold">Locked</span>
                                            ) : joinStatus ? (
                                                <span className={`inline-flex items-center text-xs font-extrabold px-3 py-1.5 rounded-lg border ${
                                                    joinStatus.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                    joinStatus.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' :
                                                    'bg-blue-50 text-blue-700 border-blue-200 animate-pulse'
                                                }`}>
                                                    {joinStatus.text}
                                                </span>
                                            ) : hasRequested ? (
                                                <span className="inline-flex items-center text-xs font-extrabold px-3 py-1.5 rounded-lg border bg-emerald-50 text-emerald-700 border-emerald-200">
                                                    Requested ✓
                                                </span>
                                            ) : (
                                            <button
                                                type="button"
                                                onClick={() => handleJoinRequest(team)}
                                                className={isPrivate 
                                                    ? "bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-600 hover:border-indigo-700 py-1.5 px-4 rounded-xl text-xs font-black shrink-0 cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-sm hover:shadow-md inline-flex items-center gap-1.5"
                                                    : "bg-blue-600 hover:bg-blue-700 text-white border border-blue-600 hover:border-blue-700 py-1.5 px-4 rounded-xl text-xs font-black shrink-0 cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-sm hover:shadow-md inline-flex items-center gap-1.5"
                                                }
                                            >
                                                {isPrivate ? (
                                                    <>
                                                        <span>Join with PIN</span>
                                                        <span className="text-[10px]">🔒</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span>Request to Join</span>
                                                        <span className="text-[10px]">✉️</span>
                                                    </>
                                                )}
                                            </button>
                                            )}
                                        </td>
                                    )}
                                </tr>
                            );
                        })}
                        {filteredTeams.length === 0 && (
                            <tr>
                                <td colSpan={(!isManager && !userTeam && !isEventStarted && !isRegistrationEnded) ? 5 : 4} className="text-center py-10 text-slate-400 font-semibold italic">
                                    No teams found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Public Join Request Confirmation Modal */}
            {confirmJoinTeam && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl border border-slate-200">
                        <h3 className="text-lg font-black uppercase tracking-[0.08em] text-[#071936]">Request to Join</h3>
                        <p className="mt-4 text-sm leading-relaxed text-[#5c6d83]">
                            Are you sure you want to request to join team <strong>{confirmJoinTeam.name}</strong>? The team leader will receive a notification to approve your request.
                        </p>
                        <div className="mt-6 flex gap-3">
                            <button 
                                type="button" 
                                onClick={() => setConfirmJoinTeam(null)} 
                                className="btn-secondary flex-1 cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button 
                                type="button" 
                                onClick={submitJoinRequest} 
                                className="btn-primary flex-1 bg-blue-600 hover:bg-blue-700 border-blue-600 hover:border-blue-700 cursor-pointer text-white"
                            >
                                Send Request
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Private Join Password Entry Modal */}
            {passwordJoinTeam && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl border border-slate-200">
                        <h3 className="text-lg font-black uppercase tracking-[0.08em] text-[#071936]">Join Private Team</h3>
                        <p className="mt-3 text-sm leading-relaxed text-[#5c6d83]">
                            Team <strong>{passwordJoinTeam.name}</strong> is private. Please enter the 4-digit PIN to join the team immediately.
                        </p>
                        
                        <div className="mt-4">
                            <label className="block text-sm font-bold text-[#0b1f3f] mb-1">
                                4-digit PIN <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                inputMode="numeric"
                                maxLength={4}
                                className="input-custom w-full tracking-widest text-center text-xl font-bold"
                                placeholder="· · · ·"
                                value={joinPassword}
                                onChange={(e) => {
                                    setJoinPassword(e.target.value.replace(/\D/g, ''));
                                    setJoinError('');
                                }}
                            />
                            {joinError && (
                                <p className="mt-2 text-xs font-semibold text-red-600">
                                    {joinError}
                                </p>
                            )}
                        </div>

                        <div className="mt-6 flex gap-3">
                            <button 
                                type="button" 
                                onClick={() => {
                                    setPasswordJoinTeam(null);
                                    setJoinPassword('');
                                    setJoinError('');
                                }} 
                                className="btn-secondary flex-1 cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button 
                                type="button" 
                                onClick={submitPrivateJoin} 
                                className="btn-primary flex-1 bg-blue-600 hover:bg-blue-700 border-blue-600 hover:border-blue-700 cursor-pointer text-white"
                            >
                                Join Team
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
