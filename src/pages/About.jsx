import { Link } from 'react-router-dom';
import aboutIllustration from '../assets/about_illustration.jpg';

export default function About() {
    return (
        <main className="bg-[#f8fafc] min-h-screen text-slate-800 py-16 md:py-24">
            <div className="max-w-[1220px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                {/* Left: Text Content */}
                <div className="flex flex-col items-start text-left max-w-xl animate-none">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-[#2c4e66] mb-3">About</p>
                    <h1 className="text-5xl sm:text-6xl font-black tracking-tight text-[#1f3747] leading-[1.1] mb-8">
                        Finding new solutions <br />
                        to old problems
                    </h1>
                    
                    <div className="space-y-6 text-[#415b6d] text-base sm:text-lg leading-relaxed">
                        <p>
                            At SEAL Hackathon, we bring people with big ideas together to build exciting projects and create new solutions using the power of technology.
                        </p>
                        <p>
                            From ideas to prototypes, we've worked hand-in-hand with dozens of student cohorts, helping them to bring their tech dreams to life in the most efficient, collaborative way.
                        </p>
                        <p>
                            With all the moving parts behind running a hackathon (clunky spreadsheets, lost submissions, and fragmented communication), organizing a hackathon can be a major administrative challenge.
                        </p>
                        <p className="font-bold text-[#1f3747]">
                            No more complicated data. No more manual, tedious and repetitive tasks. No more cumbersome processes.
                        </p>
                        <p className="font-black text-xl text-[#2c4e66]">
                            One event. One platform.
                        </p>
                    </div>

                    <div className="mt-10 flex flex-wrap gap-4">
                        <Link to="/events" className="btn-primary">
                            Explore Events
                        </Link>
                        <Link to="/leaderboard" className="btn-secondary">
                            Explore Standings
                        </Link>
                    </div>
                </div>

                {/* Right: Illustration */}
                <div className="relative w-full aspect-[4/3] flex items-center justify-center lg:justify-end animate-none">
                    <img 
                        src={aboutIllustration} 
                        alt="SEAL Hackathon Mission Illustration" 
                        className="relative z-10 w-full max-w-[580px] h-auto object-contain" 
                    />
                </div>
            </div>
        </main>
    );
}
