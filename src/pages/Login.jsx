import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import Toast from '../components/Toast';
import PasswordInput from '../components/PasswordInput';
import logoFpt from '../assets/fpt.jpg';

const managerRoles = new Set(['ADMIN', 'COORDINATOR', 'STAFF', 'JUDGE', 'MENTOR']);

export default function Login() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const redirect = searchParams.get('redirect') || '/';
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [rememberMe, setRememberMe] = useState(true);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    if (token && managerRoles.has(role)) {
        return <Navigate to="/dashboard" replace />;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await axiosClient.post('/auth/login', formData);
            const { token, role, email, userId } = response.result;

            localStorage.setItem('token', token);
            localStorage.setItem('role', role);
            localStorage.setItem('email', email);
            localStorage.setItem('userId', String(userId));
            localStorage.setItem('user', JSON.stringify({ email, fullName: email }));

            navigate(managerRoles.has(role) ? '/dashboard' : redirect, { replace: true });
        } catch (err) {
            setError(err.message || 'Invalid email or password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleQuickLogin = (email, password) => {
        setFormData({ email, password });
    };

    return (
        <main className="devpost-auth devpost-auth--login">
            <section className="devpost-auth__story">
                <Link to="/" className="flex items-center gap-3 relative z-10 mb-8 lg:mb-0">
                    <img src={logoFpt} alt="FPT Logo" style={{ width: '60px', height: '45px' }} className="object-contain rounded" />
                    <div className="h-10 border-l border-slate-300"></div>
                    <div className="flex flex-col relative -top-[1px]">
                        <span className="text-[32px] font-black leading-none text-slate-900 brand-mark-text">seal.</span>
                        <span className="text-[16px] font-black uppercase leading-none tracking-widest text-[#2c4e66] mt-1">Hackathon</span>
                    </div>
                </Link>
                <div>
                    <p>The student hackathon platform</p>
                    <h1>Build with your team.<br />Grow through rounds.</h1>
                    <span>Manage your team, track deadlines, submit deliverables, and showcase achievements all in one unified environment.</span>
                </div>
                <ul>
                    <li>
                        <strong>01</strong>
                        <span>Find your event</span>
                    </li>
                    <li>
                        <strong>02</strong>
                        <span>Team up with peers</span>
                    </li>
                    <li>
                        <strong>03</strong>
                        <span>Ship working products</span>
                    </li>
                </ul>
            </section>

            <section className="devpost-auth__form-panel" aria-labelledby="login-title">
                <div className="devpost-auth__form-wrap">
                    <p className="devpost-auth__eyebrow">Sign In</p>
                    <h1 id="login-title">Welcome Back</h1>
                    <span className="devpost-auth__copy">Continue your journey with SEAL Hackathon.</span>

                    <Toast error={error} onClose={() => setError('')} />

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="login-email" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                                Email Address
                            </label>
                            <input 
                                id="login-email" 
                                type="email" 
                                required 
                                placeholder="example@fpt.edu.vn" 
                                value={formData.email} 
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                                className="w-full"
                            />
                        </div>
                        
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label htmlFor="login-password" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                                    Password
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setError('Please contact support or your organization coordinator to reset your credentials.')}
                                    className="text-xs font-semibold text-[#0f63c9] hover:underline"
                                >
                                    Forgot password?
                                </button>
                            </div>
                            <PasswordInput
                                id="login-password"
                                required
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                ariaLabel="Login Password"
                            />
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                            <input
                                id="remember-me"
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className="h-4 w-4 rounded border-slate-300 accent-[#0f63c9] cursor-pointer"
                            />
                            <label htmlFor="remember-me" className="text-xs font-semibold text-slate-600 cursor-pointer m-0">
                                Remember me on this device
                            </label>
                        </div>
                        
                        <button 
                            type="submit" 
                            disabled={loading} 
                            className="btn-primary w-full mt-6 py-3.5 text-base font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                    </svg>
                                    <span>Authenticating...</span>
                                </>
                            ) : (
                                <span>Sign In</span>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 border-t border-slate-200 pt-6">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Quick Test Credentials</p>
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => handleQuickLogin('student@fpt.edu.vn', '123456')}
                                className="px-2.5 py-1 text-xs font-bold rounded bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                            >
                                Student
                            </button>
                            <button
                                type="button"
                                onClick={() => handleQuickLogin('leader@fpt.edu.vn', '123456')}
                                className="px-2.5 py-1 text-xs font-bold rounded bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                            >
                                Team Leader
                            </button>
                            <button
                                type="button"
                                onClick={() => handleQuickLogin('coordinator@fpt.edu.vn', '123456')}
                                className="px-2.5 py-1 text-xs font-bold rounded bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                            >
                                Coordinator
                            </button>
                            <button
                                type="button"
                                onClick={() => handleQuickLogin('admin@fpt.edu.vn', '123456')}
                                className="px-2.5 py-1 text-xs font-bold rounded bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                            >
                                Admin
                            </button>
                        </div>
                    </div>

                    <p className="devpost-auth__switch mt-6">
                        New to SEAL Hackathon? <Link to="/register">Create an account</Link>
                    </p>
                </div>
            </section>
        </main>
    );
}
