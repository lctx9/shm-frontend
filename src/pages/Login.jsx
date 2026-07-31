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
            setError(err.message || 'Invalid email or password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="devpost-auth devpost-auth--login">
            <section className="devpost-auth__story">
                <Link to="/" className="flex items-center gap-3 relative z-10 mb-8 lg:mb-0">
                    <img src={logoFpt} alt="FPT Logo" style={{ width: '60px', height: '45px' }} className="object-contain" />
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

                    <form onSubmit={handleSubmit}>
                        <label htmlFor="login-email">Email Address</label>
                        <input 
                            id="login-email" 
                            type="email" 
                            required 
                            placeholder="example@fpt.edu.vn" 
                            value={formData.email} 
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                        />
                        
                        <label htmlFor="login-password">Password</label>
                        <PasswordInput
                            id="login-password"
                            required
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            ariaLabel="Login Password"
                        />
                        
                        <button type="submit" disabled={loading} className="mt-4">
                            {loading ? 'Processing...' : 'Sign In'}
                        </button>
                    </form>

                    <p className="devpost-auth__switch">
                        New to SEAL Hackathon? <Link to="/register">Create an account</Link>
                    </p>
                </div>
            </section>
        </main>
    );
}
