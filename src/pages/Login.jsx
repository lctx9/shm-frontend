import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';

const managerRoles = new Set(['ADMIN', 'COORDINATOR', 'STAFF', 'JUDGE', 'MENTOR']);

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
        <main className="devpost-auth devpost-auth--login">
            <section className="devpost-auth__story">
                <Link to="/" className="devpost-auth__wordmark"><span>SEAL</span><strong>SEAL Hackathon</strong></Link>
                <div><p>Nền tảng hackathon dành cho sinh viên</p><h1>Xây dựng cùng đội.<br />Trưởng thành qua từng vòng thi.</h1><span>Quản lý đội, theo dõi deadline, nộp sản phẩm và lưu giữ thành tích của bạn tại một nơi.</span></div>
                <ul><li><strong>01</strong>Tìm sự kiện phù hợp</li><li><strong>02</strong>Lập đội cùng cộng đồng</li><li><strong>03</strong>Biến ý tưởng thành sản phẩm</li></ul>
            </section>

            <section className="devpost-auth__form-panel" aria-labelledby="login-title">
                <div className="devpost-auth__form-wrap">
                    <Link to="/" className="devpost-auth__back">← Về trang chủ</Link>
                    <p className="devpost-auth__eyebrow">Đăng nhập</p>
                    <h1 id="login-title">Chào mừng trở lại</h1>
                    <span className="devpost-auth__copy">Tiếp tục hành trình của bạn cùng SEAL Hackathon.</span>

                    {error && <div className="form-alert" role="alert">{error}</div>}

                    <form onSubmit={handleSubmit}>
                        <label htmlFor="login-email">Email</label>
                        <input id="login-email" type="email" required placeholder="example@fpt.edu.vn" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                        <label htmlFor="login-password">Mật khẩu</label>
                        <input id="login-password" type="password" required placeholder="••••••••" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                        <button type="submit" disabled={loading}>{loading ? 'Đang xử lý...' : 'Đăng nhập'}</button>
                    </form>

                    <p className="devpost-auth__switch">Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link></p>
                </div>
            </section>
        </main>
    );
}
