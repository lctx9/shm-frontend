import { useEffect, useState, useMemo } from 'react';
import axiosClient from '../api/axiosClient';

// Static mock participants with realistic details and emails
const MOCK_PARTICIPANTS = [
    {
        id: 'mock-1',
        fullName: 'Jay Shinde IN',
        email: 'jay.shinde@example.com',
        universityName: 'FPT University',
        status: 'Looking for a team',
        skills: ['Artificial Intelligence (AI)', 'Chatbots', 'Database Design', 'Design Patterns for UI', 'Leadership', 'Node Js', 'Responsive Web Design', 'User Interface (UI)', 'Web Design']
    },
    {
        id: 'mock-2',
        fullName: 'Om Bhirud IN',
        email: 'om.bhirud@example.com',
        universityName: 'FPT University',
        status: 'Looking for a team',
        skills: ['Python', 'Machine Learning', 'Data structures', 'Git', 'Linux']
    },
    {
        id: 'mock-3',
        fullName: 'Vaishnavi Itagi',
        email: 'vaishnavi.itagi@example.com',
        universityName: 'FPT University',
        status: 'Looking for a team',
        skills: ['Java', 'UI Design', 'Web Design']
    },
    {
        id: 'mock-4',
        fullName: 'Swayam Jadhav IN',
        email: 'swayam.jadhav@example.com',
        universityName: 'FPT University',
        status: 'Looking for a team',
        skills: ['AngularJS', 'Artificial Intelligence (AI)', 'Big Data', 'Chatbots', 'Figma', 'Java', 'Node.js', 'Responsive Web Design', 'User Interface (UI)', 'Web Design']
    },
    {
        id: 'mock-5',
        fullName: 'Pranav Landge IN',
        email: 'pranav.landge@example.com',
        universityName: 'FPT University',
        status: 'Looking for a team',
        skills: ['Analytical', 'Artificial Intelligence (AI)', 'Data science', 'Database Design', 'Java', 'Leadership']
    },
    {
        id: 'mock-6',
        fullName: 'Sakshi Kokate IN',
        email: 'sakshi.kokate@example.com',
        universityName: 'FPT University',
        status: 'Looking for a team',
        skills: ['Artificial Intelligence (AI)', 'Node.js', 'Responsive Web Design', 'UI Design', 'User Interface (UI)', 'Web Design']
    },
    {
        id: 'mock-7',
        fullName: 'Rohit Sharma IN',
        email: 'rohit.sharma@example.com',
        universityName: 'FPT University',
        status: 'Looking for a team',
        skills: ['Python', 'SQL', 'Tableau', 'Leadership', 'Data Analysis']
    },
    {
        id: 'mock-8',
        fullName: 'Virat Kohli IN',
        email: 'virat.kohli@example.com',
        universityName: 'FPT University',
        status: 'Looking for a team',
        skills: ['Java', 'Spring Boot', 'Microservices', 'Cloud Computing', 'PostgreSQL']
    },
    {
        id: 'mock-9',
        fullName: 'KL Rahul IN',
        email: 'kl.rahul@example.com',
        universityName: 'FPT University',
        status: 'Looking for a team',
        skills: ['HTML', 'CSS', 'JavaScript', 'Figma', 'Responsive Web Design']
    },
    {
        id: 'mock-10',
        fullName: 'Hardik Pandya IN',
        email: 'hardik.pandya@example.com',
        universityName: 'FPT University',
        status: 'Looking for a team',
        skills: ['Solidity', 'Smart Contracts', 'Rust', 'Go', 'Blockchain']
    },
    {
        id: 'mock-11',
        fullName: 'Jasprit Bumrah IN',
        email: 'jasprit.bumrah@example.com',
        universityName: 'FPT University',
        status: 'Looking for a team',
        skills: ['Docker', 'Kubernetes', 'AWS', 'CI/CD', 'DevOps', 'Linux']
    },
    {
        id: 'mock-12',
        fullName: 'Rishabh Pant IN',
        email: 'rishabh.pant@example.com',
        universityName: 'FPT University',
        status: 'Looking for a team',
        skills: ['Swift', 'iOS App Development', 'Objective-C', 'UI/UX Design']
    }
];

export default function ParticipantsPool({ eventId }) {
    const [teams, setTeams] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [myTeam, setMyTeam] = useState(null);
    const [isLeader, setIsLeader] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [skillFilter, setSkillFilter] = useState('ALL');
    const [loading, setLoading] = useState(true);
    const [inviteStatuses, setInviteStatuses] = useState({}); // id -> { text: string, type: 'info'|'success'|'error' }
    const [confirmInviteUser, setConfirmInviteUser] = useState(null);
    const [event, setEvent] = useState(null);

    const isUserRegisteredLooking = localStorage.getItem(`shm_registered_looking_event_${eventId}`) === 'true';

    const isEventStarted = useMemo(() => {
        if (!event?.eventStartDate) return false;
        return new Date() >= new Date(event.eventStartDate);
    }, [event]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [teamsRes, userRes, myTeamRes, eventRes] = await Promise.all([
                axiosClient.get('/teams'),
                axiosClient.get('/users/me').catch(() => ({ result: null })),
                axiosClient.get(`/teams/my-team?eventId=${eventId}`).catch(() => ({ result: [] })),
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

            const myTeamsList = myTeamRes.result || [];
            const activeTeam = myTeamsList[0] || null;
            setMyTeam(activeTeam);

            if (activeTeam && userProfile) {
                const isLdr = activeTeam.members?.some(
                    m => m.email === userProfile.email && m.role === 'LEADER'
                ) || false;
                setIsLeader(isLdr);
            }
        } catch (err) {
            console.error("Error loading participants data:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [eventId]);

    // Extract participants from actual teams
    const teamParticipants = useMemo(() => {
        const list = [];
        const seenUserIds = new Set();

        teams.forEach(team => {
            (team.members || []).forEach(member => {
                if (member.userId && !seenUserIds.has(member.userId)) {
                    seenUserIds.add(member.userId);
                    list.push({
                        id: `member-${member.id}`,
                        fullName: member.fullName,
                        email: member.email,
                        universityName: member.universityName || 'FPT University',
                        status: 'Joined a team',
                        teamName: team.name,
                        skills: ['React', 'Node.js', 'Javascript', 'UI Design', 'Database Design'] // default skills
                    });
                }
            });
        });
        return list;
    }, [teams]);

    // Combine current user, mock participants, and team participants
    const allParticipants = useMemo(() => {
        const list = [...MOCK_PARTICIPANTS];

        // Add current user if looking and not in a team
        const isUserInAnyTeam = teamParticipants.some(
            p => currentUser && (p.fullName === currentUser.fullName || p.email === currentUser.email)
        );

        if (isUserRegisteredLooking && currentUser && !isUserInAnyTeam) {
            list.unshift({
                id: `user-${currentUser.id}`,
                fullName: `${currentUser.fullName} (You)`,
                email: currentUser.email,
                universityName: currentUser.universityName || 'FPT University',
                status: 'Looking for a team',
                skills: ['React', 'Javascript', 'HTML', 'CSS', 'Figma', 'UI Design']
            });
        }

        list.push(...teamParticipants);
        return list;
    }, [currentUser, isUserRegisteredLooking, teamParticipants]);

    // Gather all unique skills for filter dropdown
    const allUniqueSkills = useMemo(() => {
        const skills = new Set();
        allParticipants.forEach(p => {
            (p.skills || []).forEach(s => skills.add(s));
        });
        return Array.from(skills).sort();
    }, [allParticipants]);

    // Filter participants
    const filteredParticipants = useMemo(() => {
        return allParticipants.filter(p => {
            const matchesSearch = p.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.universityName.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesStatus = statusFilter === 'ALL' ||
                (statusFilter === 'LOOKING' && p.status === 'Looking for a team') ||
                (statusFilter === 'JOINED' && p.status === 'Joined a team');

            const matchesSkill = skillFilter === 'ALL' ||
                (p.skills || []).includes(skillFilter);

            return matchesSearch && matchesStatus && matchesSkill;
        });
    }, [allParticipants, searchQuery, statusFilter, skillFilter]);

    const getInitials = (name) => {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    };

    const getAvatarBg = (id) => {
        const colors = [
            'bg-emerald-600 text-white',
            'bg-indigo-600 text-white',
            'bg-amber-600 text-white',
            'bg-rose-600 text-white',
            'bg-teal-600 text-white',
            'bg-sky-600 text-white'
        ];
        let hash = 0;
        for (let i = 0; i < id.length; i++) {
            hash = id.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };

    const triggerInviteConfirmation = (participant) => {
        setConfirmInviteUser(participant);
    };

    const handleConfirmInvite = () => {
        if (!confirmInviteUser) return;
        const participantToInvite = confirmInviteUser;
        setConfirmInviteUser(null);
        executeInvite(participantToInvite);
    };

    const executeInvite = async (participant) => {
        if (!myTeam || !isLeader) return;
        
        setInviteStatuses(prev => ({ 
            ...prev, 
            [participant.id]: { text: 'Inviting...', type: 'info' } 
        }));

        try {
            // Check if it's a simulated mock participant
            if (participant.id.startsWith('mock-')) {
                await new Promise(resolve => setTimeout(resolve, 800));
                setInviteStatuses(prev => ({ 
                    ...prev, 
                    [participant.id]: { text: 'Invited ✓', type: 'success' } 
                }));
                return;
            }

            // Real participant backend API call
            await axiosClient.post(`/teams/${myTeam.id}/invite`, { email: participant.email });
            setInviteStatuses(prev => ({ 
                ...prev, 
                [participant.id]: { text: 'Invited ✓', type: 'success' } 
            }));
        } catch (err) {
            setInviteStatuses(prev => ({ 
                ...prev, 
                [participant.id]: { text: err.message || 'Failed', type: 'error' } 
            }));
        }
    };

    if (loading) {
        return <div className="text-center py-12 text-[#5c6d83] font-bold">Loading participants pool...</div>;
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-[#071936]">Participants pool</h1>
                    <p className="text-xs text-slate-500 font-medium mt-1">Connect with hackers and form the ultimate hackathon crew</p>
                </div>
                {myTeam && (
                    <div className="rounded-xl border border-blue-100 bg-blue-50/50 px-4 py-2.5 text-xs text-blue-900 font-semibold shadow-xs">
                        {isLeader ? (
                            <p>You are managing team <strong>{myTeam.name}</strong> as Leader. You can invite candidates.</p>
                        ) : (
                            <p>You are a member of team <strong>{myTeam.name}</strong>.</p>
                        )}
                    </div>
                )}
            </div>

            {/* Filters Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                    type="text"
                    className="input-custom bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm"
                    placeholder="Search participants"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                
                <select
                    className="input-custom bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                >
                    <option value="ALL">All statuses</option>
                    <option value="LOOKING">Looking for a team</option>
                    <option value="JOINED">Joined a team</option>
                </select>

                <select
                    className="input-custom bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm"
                    value={skillFilter}
                    onChange={(e) => setSkillFilter(e.target.value)}
                >
                    <option value="ALL">Select skills</option>
                    {allUniqueSkills.map(skill => (
                        <option key={skill} value={skill}>{skill}</option>
                    ))}
                </select>
            </div>

            {/* Participants Pool Table */}
            <div className="overflow-x-auto bg-white border border-slate-200 rounded-lg shadow-sm">
                <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                    <thead className="bg-slate-50 text-[11px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4">Participant name</th>
                            <th className="px-6 py-4">Team status</th>
                            <th className="px-6 py-4">Skills</th>
                            {isLeader && !isEventStarted && <th className="px-6 py-4 text-right">Action</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredParticipants.map(participant => {
                            const isSelf = currentUser && (participant.email === currentUser.email);
                            const inviteStatus = inviteStatuses[participant.id];
                            
                            return (
                                <tr key={participant.id} className="hover:bg-slate-50/50 transition-colors">
                                    {/* Name and School */}
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${getAvatarBg(participant.id)}`}>
                                                {getInitials(participant.fullName)}
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-900 leading-tight">{participant.fullName}</p>
                                                <p className="text-xs text-slate-500 font-semibold mt-0.5">{participant.universityName}</p>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Team Status */}
                                    <td className="px-6 py-4">
                                        {participant.status === 'Looking for a team' ? (
                                            <span className="inline-flex items-center rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-black text-amber-700">
                                                Looking for a team
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-black text-emerald-700" title={participant.teamName}>
                                                Joined a team
                                            </span>
                                        )}
                                    </td>

                                    {/* Skills */}
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-1.5 max-w-[400px]">
                                            {(participant.skills || []).map(skill => (
                                                <span 
                                                    key={skill} 
                                                    className="inline-flex items-center rounded bg-blue-50 border border-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700"
                                                >
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    </td>

                                    {/* Actions (Invite button for leaders) */}
                                    {isLeader && !isEventStarted && (
                                        <td className="px-6 py-4 text-right shrink-0">
                                            {isSelf ? (
                                                <span className="text-xs text-slate-400 italic font-semibold">You</span>
                                            ) : participant.status === 'Looking for a team' ? (
                                                inviteStatus ? (
                                                    <span className={`inline-flex items-center text-xs font-extrabold px-3 py-1.5 rounded-lg border ${
                                                        inviteStatus.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                        inviteStatus.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' :
                                                        'bg-blue-50 text-blue-700 border-blue-200 animate-pulse'
                                                    }`}>
                                                        {inviteStatus.text}
                                                    </span>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => triggerInviteConfirmation(participant)}
                                                        className="bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-600 hover:border-emerald-700 py-1.5 px-4 rounded-xl text-xs font-black shrink-0 cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-sm hover:shadow-md"
                                                    >
                                                        Invite
                                                    </button>
                                                )
                                            ) : (
                                                <span className="text-xs text-slate-400 italic font-semibold">In a Team</span>
                                            )}
                                        </td>
                                    )}
                                </tr>
                            );
                        })}
                        {filteredParticipants.length === 0 && (
                            <tr>
                                <td colSpan={isLeader && !isEventStarted ? 4 : 3} className="text-center py-10 text-slate-400 font-semibold italic">
                                    No participants matching filters.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Invitation Confirmation Modal */}
            {confirmInviteUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl border border-slate-200">
                        <h3 className="text-lg font-black uppercase tracking-[0.08em] text-[#071936]">Confirm Invitation</h3>
                        <p className="mt-4 text-sm leading-relaxed text-[#5c6d83]">
                            Are you sure you want to invite <strong>{confirmInviteUser.fullName}</strong> to join your team <strong>{myTeam?.name}</strong>? An invitation will be sent to their email.
                        </p>
                        <div className="mt-6 flex gap-3">
                            <button 
                                type="button" 
                                onClick={() => setConfirmInviteUser(null)} 
                                className="btn-secondary flex-1 cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button 
                                type="button" 
                                onClick={handleConfirmInvite} 
                                className="btn-primary flex-1 bg-emerald-600 hover:bg-emerald-700 border-emerald-600 hover:border-emerald-700 cursor-pointer text-white"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
