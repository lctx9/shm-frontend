import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import heroIllustration from '../assets/hero_illustration.jpg';
import logoFpt from '../assets/fpt.jpg';
import logoFptSoftware from '../assets/fpt_software.jpg';
import logoVpBank from '../assets/VPBank_logo.svg.webp';
import logoTechcombank from '../assets/Techcombank_logo.png';
import logo197 from '../assets/197.png';
import { formatDateTime, getCountdownParts, getEventPhase, pickFeaturedEvent } from '../utils/hackathon';

function Stat({ value, label }) {
    return (
        <div className="flex flex-col items-center justify-center min-w-20 bg-white border border-slate-200 px-4 py-3 rounded shadow-sm">
            <p className="text-2xl font-black text-slate-900 animate-none">
                {String(value).padStart(2, '0')}
            </p>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mt-0.5">{label}</p>
        </div>
    );
}

export default function Homepage() {
    const [events, setEvents] = useState([]);
    const [rankings, setRankings] = useState([]);
    const [activeFaq, setActiveFaq] = useState(null);

    useEffect(() => {
        Promise.allSettled([axiosClient.get('/events'), axiosClient.get('/leaderboard')]).then(([eventRes, rankRes]) => {
            if (eventRes.status === 'fulfilled') setEvents(eventRes.value.result || []);
            if (rankRes.status === 'fulfilled') setRankings(rankRes.value.result || []);
        });
    }, []);

    const featuredEvent = useMemo(() => pickFeaturedEvent(events), [events]);
    const phase = getEventPhase(featuredEvent);
    const countdown = getCountdownParts(phase.key === 'registration' ? featuredEvent.regEndDate : featuredEvent.eventStartDate);
    const winners = rankings.slice(0, 3);
    const isEnded = phase.key === 'ended';

    // English phase status mapping
    const phaseLabelEn = useMemo(() => {
        switch (phase.key) {
            case 'registration':
                return 'Registration Open';
            case 'running':
                return 'Event Ongoing';
            case 'upcoming':
                return 'Upcoming';
            case 'ended':
                return 'Event Ended';
            default:
                return phase.label;
        }
    }, [phase]);

    const faqData = [
        {
            q: "Can students from external universities participate in SEAL Hackathons?",
            a: "Yes! SEAL hackathons are open to students from partner universities. A team can consist entirely of FPT University students, a mix of FPT and external students, or 100% students from partner institutions."
        },
        {
            q: "Who has the authority to submit and update team projects?",
            a: "Only the Team Leader has the permission to create and edit submissions. The leader can upload updates or replace files/links multiple times before the round deadline."
        },
        {
            q: "How is grading done and transparency ensured?",
            a: "Judges score submissions independently using a public rubric set by the coordinator. To prevent fraud and ensure maximum transparency, the system logs every score change in the Audit Log (who changed it, team, old/new score, and reason)."
        },
        {
            q: "How can I contact and work with my team's mentor?",
            a: "Once the organizers assign mentors, team members can chat directly with them in real-time under the 'Chat' section to ask for technical guidance and advice."
        },
        {
            q: "How do winning teams receive their certificates?",
            a: "Winning teams (1st, 2nd, 3rd place) can visit their Profile page and download their digital certificate directly from the system as a high-quality PDF."
        }
    ];

    const toggleFaq = (index) => {
        setActiveFaq(activeFaq === index ? null : index);
    };

    return (
        <main className="bg-white text-slate-800 min-h-screen">
            {/* Hero Section */}
            <section className="bg-[#f8fafc] py-24 md:py-32 border-b border-slate-200">
                <div className="max-w-[1220px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    {/* Left: Text Content */}
                    <div className="flex flex-col items-start text-left">
                        <h1 className="mt-2 text-5xl sm:text-6xl md:text-[68px] font-black tracking-tight text-slate-900 leading-[1.05]">
                            The all-in-one <br />
                            platform to run <br />
                            <span className="text-[#2c4e66]">{featuredEvent.name}</span>
                        </h1>
                        
                        <div className="mt-4">
                            <span className={`inline-block px-3 py-1 rounded text-xs font-extrabold tracking-wider border uppercase ${
                                isEnded 
                                    ? 'border-amber-300 bg-amber-50 text-amber-700' 
                                    : 'border-blue-300 bg-blue-50 text-blue-700'
                            }`}>
                                {phaseLabelEn}
                            </span>
                        </div>

                        <p className="mt-6 text-lg sm:text-xl text-slate-700 leading-relaxed max-w-xl">
                            {phase.key === 'registration'
                                ? `Registration is open until ${formatDateTime(featuredEvent.regEndDate)}. Select a track, form your team, and prepare to bring your tech ideas to life.`
                                : phase.key === 'running'
                                ? `The event is currently running from ${formatDateTime(featuredEvent.eventStartDate)} to ${formatDateTime(featuredEvent.eventEndDate)}. Teams are actively finalizing their submissions.`
                                : `The event concluded on ${formatDateTime(featuredEvent.eventEndDate)}. Thank you to all participants, mentors, and judges who made this season a success.`}
                        </p>

                        {countdown && (
                            <div className="mt-8 flex gap-3">
                                {countdown.map((item) => (
                                    <Stat 
                                        key={item.label} 
                                        value={item.value} 
                                        label={item.label} 
                                    />
                                ))}
                            </div>
                        )}

                        <div className="mt-10 flex flex-wrap gap-4 animate-none">
                            <Link to={isEnded ? '/leaderboard' : `/my-team?registerEventId=${featuredEvent.id}`} className="btn-primary">
                                {isEnded ? 'View Leaderboard' : 'Book a Demo / Join Now'}
                            </Link>
                            <Link to={`/events/${featuredEvent.id}`} className="btn-secondary">
                                View Details
                            </Link>
                        </div>
                    </div>

                    {/* Right: Graphic Illustration */}
                    <div className="relative w-full aspect-[4/3] flex items-center justify-center lg:justify-end">
                        <img 
                            src={heroIllustration} 
                            alt="Hackathon Collaboration Illustration" 
                            className="relative z-10 w-full max-w-[580px] h-auto object-contain" 
                        />
                    </div>
                </div>
            </section>

            {/* Key Statistics Section */}
            <section className="py-24 px-6 max-w-[1220px] mx-auto border-b border-slate-100">
                <div className="text-center mb-16">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-[#2c4e66]">About SEAL Hackathon</p>
                    <h2 className="text-3xl font-black mt-2 text-slate-900 animate-none">SEAL by the Numbers</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-none">
                    {[
                        {
                            num: "50M+ VND",
                            label: "Total Prize Pool",
                            desc: "Cash prizes, academic scholarships, and elite startup mentoring packages.",
                            icon: (
                                <svg className="w-8 h-8 text-[#2c4e66]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            )
                        },
                        {
                            num: "24+ Teams",
                            label: "Participating Teams",
                            desc: "Young talents from FPT University and partner universities across the region.",
                            icon: (
                                <svg className="w-8 h-8 text-[#2c4e66]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            )
                        },
                        {
                            num: "3 Seasons",
                            label: "Seasons Yearly",
                            desc: "Regular annual tournaments held during Spring, Summer, and Fall semesters.",
                            icon: (
                                <svg className="w-8 h-8 text-[#2c4e66]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            )
                        },
                        {
                            num: "15+ Experts",
                            label: "Judges & Mentors",
                            desc: "Experienced professors, university staff, and technical leads from top industries.",
                            icon: (
                                <svg className="w-8 h-8 text-[#2c4e66]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            )
                        }
                    ].map((stat, i) => (
                        <div key={i} className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-all duration-300">
                            <div className="w-12 h-12 bg-slate-50 border border-slate-200 rounded flex items-center justify-center mb-4">
                                {stat.icon}
                            </div>
                            <h3 className="text-2xl font-black text-slate-900">{stat.num}</h3>
                            <p className="text-sm font-bold text-[#2c4e66] mt-1">{stat.label}</p>
                            <p className="text-xs text-slate-500 mt-2 leading-relaxed">{stat.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Main Interactive Content depending on Event State */}
            {isEnded ? (
                /* Hall of Fame */
                <section className="py-24 px-6 bg-[#f8fafc]/30 border-b border-slate-200">
                    <div className="max-w-[1220px] mx-auto">
                        <div className="text-center mb-16">
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#2c4e66]">Winners List</p>
                            <h2 className="text-3xl font-black mt-2 text-slate-900">Hall of Fame</h2>
                            <p className="text-sm text-slate-500 mt-2">Celebrating the top-performing teams who conquered the final jury evaluation.</p>
                        </div>
                        
                        <div className="grid gap-8 md:grid-cols-3 items-stretch max-w-5xl mx-auto">
                            {winners.map((team, index) => {
                                const rankColors = [
                                    { border: 'border-amber-400', bg: 'bg-gradient-to-b from-amber-50/20 to-white', text: 'text-amber-700', badge: '🥇 Champion' },
                                    { border: 'border-slate-300', bg: 'bg-gradient-to-b from-slate-50/20 to-white', text: 'text-slate-700', badge: '🥈 1st Runner-Up' },
                                    { border: 'border-orange-300', bg: 'bg-gradient-to-b from-orange-50/20 to-white', text: 'text-orange-700', badge: '🥉 2nd Runner-Up' }
                                ][index] || { border: 'border-slate-200', bg: 'bg-white', text: 'text-slate-700', badge: `Top ${index + 1}` };

                                return (
                                    <article key={`${team.teamName}-${index}`} className={`border-2 ${rankColors.border} ${rankColors.bg} rounded-xl p-8 flex flex-col justify-between shadow-sm relative overflow-hidden transition-all duration-300 hover:shadow-md`}>
                                        {index === 0 && (
                                            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-400 text-white font-black text-[9px] flex items-center justify-center transform rotate-45 translate-x-8 -translate-y-8 uppercase tracking-widest">
                                                Champion
                                            </div>
                                        )}
                                        <div>
                                            <span className={`inline-block px-3 py-1 rounded text-xs font-black uppercase ${rankColors.text} bg-white border border-current mb-4`}>
                                                {rankColors.badge}
                                            </span>
                                            <h3 className="text-2xl font-black uppercase tracking-tight text-slate-900 mt-2">{team.teamName}</h3>
                                            <p className="text-xs font-bold text-[#2c4e66] mt-1">{team.track || 'General Track'}</p>
                                            
                                            <div className="mt-6 border-t border-dashed border-slate-200 pt-4">
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Members:</p>
                                                <p className="mt-1 text-sm font-semibold leading-relaxed text-slate-600">
                                                    {(team.members || []).map((m) => m.fullName || m.email).join(', ') || 'Updating members...'}
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <div className="mt-8 border-t border-slate-100 pt-4 flex items-baseline justify-between">
                                            <span className="text-xs font-bold text-slate-400">Total Score:</span>
                                            <span className="text-3xl font-black text-slate-900">{team.score || 0} <span className="text-xs font-bold text-slate-500">pts</span></span>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                        <div className="mt-12 text-center">
                            <Link to="/leaderboard" className="btn-primary">
                                View Full Leaderboard
                            </Link>
                        </div>
                    </div>
                </section>
            ) : (
                /* Roadmap Timeline */
                <section className="py-24 px-6 bg-[#f8fafc]/50 border-b border-slate-200">
                    <div className="max-w-[1220px] mx-auto">
                        <div className="text-center mb-16">
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#2c4e66]">Process & Flow</p>
                            <h2 className="text-3xl font-black mt-2 text-slate-900">The Hackathon Journey</h2>
                            <p className="text-sm text-slate-500 mt-2">A streamlined, fully digitalized, and highly transparent competition model.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
                            {[
                                {
                                    step: "01",
                                    title: "Form Your Team",
                                    desc: "Register individually and team up (2-5 members). Choose your competition track, and set the team visibility to Public or Private with a secure PIN."
                                },
                                {
                                    step: "02",
                                    title: "Find Teammates",
                                    desc: "Browse the public lobby to invite individual builders to join your squad or apply to join active open projects."
                                },
                                {
                                    step: "03",
                                    title: "Receive Prompts & Mentoring",
                                    desc: "Official problem statements and criteria are unlocked when the hackathon begins. Each team is paired with 1-2 dedicated mentors."
                                },
                                {
                                    step: "04",
                                    title: "Develop & Submit",
                                    desc: "Collaborate together to build your product and submit your project. The Team Leader can update files and links until the round deadline."
                                },
                                {
                                    step: "05",
                                    title: "Transparent Grading",
                                    desc: "Judges score submissions independently using public rubrics. The Audit Log tracks every grading modification for complete transparency."
                                },
                                {
                                    step: "06",
                                    title: "Acquire Digital Badges",
                                    desc: "Monitor leaderboard updates in real-time. Top teams can download officially certified PDF credentials directly from their profile page."
                                }
                            ].map((step, idx) => (
                                <div key={idx} className="relative bg-white border border-slate-200 rounded-lg p-6 hover:border-slate-950 transition-all duration-300 group">
                                    <div className="absolute top-4 right-4 text-4xl font-black text-slate-200/50 group-hover:text-slate-955/10 transition-colors">
                                        {step.step}
                                    </div>
                                    <h3 className="text-lg font-black text-slate-900 mb-3 pr-8">{step.title}</h3>
                                    <p className="text-xs leading-relaxed text-slate-500">{step.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Interactive FAQ Section */}
            <section className="py-24 px-6 max-w-[800px] mx-auto">
                <div className="text-center mb-12">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-[#2c4e66]">Clear Your Doubts</p>
                    <h2 className="text-3xl font-black mt-2 text-slate-900">Frequently Asked Questions</h2>
                </div>

                <div className="space-y-4">
                    {faqData.map((faq, index) => {
                        const isOpen = activeFaq === index;
                        return (
                            <div key={index} className="bg-white border border-slate-200 rounded overflow-hidden transition-all duration-200">
                                <button
                                    type="button"
                                    onClick={() => toggleFaq(index)}
                                    className="w-full px-6 py-5 flex items-center justify-between text-left font-bold text-sm sm:text-base text-slate-900 hover:bg-slate-50 transition-colors"
                                >
                                    <span>{faq.q}</span>
                                    <span className={`text-xl font-semibold transition-transform duration-200 ${isOpen ? 'rotate-45 text-[#2c4e66]' : 'text-neutral-400'}`}>
                                        ＋
                                    </span>
                                </button>
                                {isOpen && (
                                    <div className="px-6 pb-5 text-xs sm:text-sm leading-relaxed text-slate-500 border-t border-slate-100 pt-3">
                                        {faq.a}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* Sponsors & Partners Banner */}
            <section className="py-16 px-6 bg-slate-50 border-t border-slate-200">
                <div className="max-w-[1220px] mx-auto">
                    <p className="text-center text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-8">
                        Coordinated & Supported By
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 opacity-60">
                        {[
                            { name: "FPT University", logo: logoFpt },
                            { name: "FPT Software", logo: logoFptSoftware },
                            { name: "VPBank", logo: logoVpBank },
                            { name: "Techcombank", logo: logoTechcombank },
                            { name: "197", logo: logo197 }
                        ].map((partner, i) => (
                            partner.logo ? (
                                <img 
                                    key={i} 
                                    src={partner.logo} 
                                    alt={partner.name} 
                                    className="h-10 w-auto object-contain hover:scale-105 transition-all cursor-default" 
                                />
                            ) : (
                                <span key={i} className="text-sm sm:text-base font-black tracking-widest text-slate-500 hover:text-slate-900 hover:scale-105 transition-all cursor-default animate-none">
                                    {partner.name.toUpperCase()}
                                </span>
                            )
                        ))}
                    </div>
                </div>
            </section>
        </main>
    );
}
