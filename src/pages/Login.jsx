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
        <div className="flex min-h-screen items-center justify-center bg-[#f4f8ff] px-4">
            <div className="w-full max-w-md rounded-lg border border-[#d7e6f8] bg-white p-8 shadow-sm">
                <div className="text-center">
                    <h1 className="text-3xl font-black text-[#0f63c9]">SEAL Hackathon</h1>
                    <p className="mt-2 text-sm text-[#5c6d83]">Đăng nhập vào hệ thống</p>
                </div>

                {error && (
                    <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
                        {error}
                    </div>
                )}

                <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
                    <div>
                        <label className="mb-1 block text-sm font-bold text-[#0b1f3f]">Email</label>
                        <input
                            type="email"
                            required
                            className="input-custom"
                            placeholder="example@fpt.edu.vn"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-bold text-[#0b1f3f]">Mật khẩu</label>
                        <input
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

                <p className="mt-6 text-center text-sm text-[#5c6d83]">
                    Chưa có tài khoản?{' '}
                    <Link to="/register" className="font-bold text-[#0f63c9] hover:underline">
                        Đăng ký ngay
                    </Link>
                </p>
            </div>
        </div>
    );
}
