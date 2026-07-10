import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';

const managerRoles = new Set(['ADMIN', 'COORDINATOR', 'JUDGE', 'MENTOR']);

export default function Login() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await axiosClient.post('/auth/login', formData);
            const { token, role, email } = response.result;

            localStorage.setItem('token', token);
            localStorage.setItem('role', role);
            localStorage.setItem('email', email);
            localStorage.setItem('user', JSON.stringify({ email, fullName: email }));

            navigate(managerRoles.has(role) ? '/dashboard' : '/my-team', { replace: true });
        } catch (err) {
            setError(err.message || 'Sai tài khoản hoặc mật khẩu.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="auth-page">
            <section className="auth-card" aria-labelledby="login-title">
                <div className="auth-brand">
                    <Link to="/" className="auth-logo" aria-label="Về trang chủ SEAL">SEAL</Link>
                    <h1 id="login-title" className="auth-title">Chào mừng trở lại</h1>
                    <p className="auth-copy">Đăng nhập để tiếp tục hành trình cùng SEAL Hackathon.</p>
                </div>

                {error && (
                    <div className="form-alert" role="alert">
                        {error}
                    </div>
                )}

                <form className="space-y-5" onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="login-email" className="form-label">Email</label>
                        <input
                            id="login-email"
                            type="email"
                            required
                            className="input-custom"
                            placeholder="example@fpt.edu.vn"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                    <div>
                        <label htmlFor="login-password" className="form-label">Mật khẩu</label>
                        <input
                            id="login-password"
                            type="password"
                            required
                            className="input-custom"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                    </div>

                    <button type="submit" disabled={loading} className="btn-primary w-full">
                        {loading ? 'Đang xử lý...' : 'Đăng nhập'}
                    </button>
                </form>

                <p className="auth-footer">
                    Chưa có tài khoản?{' '}
                    <Link to="/register" className="font-bold text-[#0f63c9] hover:underline">
                        Đăng ký ngay
                    </Link>
                </p>
            </section>
        </main>
    );
}
