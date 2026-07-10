import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';

export default function Register() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [sendingOtp, setSendingOtp] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [error, setError] = useState('');
    const [studentCardPreview, setStudentCardPreview] = useState('');

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        studentId: '',
        isFptStudent: true,
        universityName: 'Đại học FPT',
        studentCardUrl: '',
        otp: '',
    });

    const handleStudentCardUpload = (event) => {
        const file = event.target.files?.[0];
        if (!file) {
            setFormData((current) => ({ ...current, studentCardUrl: '' }));
            setStudentCardPreview('');
            return;
        }

        if (!file.type.startsWith('image/')) {
            setError('Vui lòng upload file ảnh thẻ sinh viên.');
            event.target.value = '';
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            setError('Ảnh thẻ sinh viên không được vượt quá 2MB.');
            event.target.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            const dataUrl = reader.result || '';
            setFormData((current) => ({ ...current, studentCardUrl: dataUrl }));
            setStudentCardPreview(dataUrl);
            setError('');
        };
        reader.onerror = () => setError('Không thể đọc file ảnh. Vui lòng thử lại.');
        reader.readAsDataURL(file);
    };

    const handleSendOtp = async () => {
        setError('');
        if (!formData.email) {
            setError('Vui lòng nhập email trước khi gửi mã OTP.');
            return;
        }

        setSendingOtp(true);
        try {
            const response = await axiosClient.post('/auth/send-otp', { email: formData.email });
            setOtpSent(true);
            alert(response.result || 'Đã gửi mã OTP đến email của bạn.');
        } catch (err) {
            setError(err.message || 'Không thể gửi mã OTP. Vui lòng kiểm tra cấu hình email.');
        } finally {
            setSendingOtp(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Mật khẩu xác nhận không khớp.');
            return;
        }

        if (!formData.otp.trim()) {
            setError('Vui lòng nhập mã OTP đã gửi qua email.');
            return;
        }

        if (!formData.studentCardUrl) {
            setError('Vui lòng upload thẻ sinh viên để Coordinator xác thực.');
            return;
        }

        setLoading(true);
        try {
            const response = await axiosClient.post('/auth/register', {
                fullName: formData.fullName,
                email: formData.email,
                password: formData.password,
                studentId: formData.studentId,
                isFptStudent: formData.isFptStudent,
                universityName: formData.isFptStudent ? 'Đại học FPT' : formData.universityName,
                studentCardUrl: formData.studentCardUrl,
                otp: formData.otp,
            });

            alert(response.result || 'Đăng ký thành công. Vui lòng chờ Coordinator phê duyệt.');
            navigate('/login');
        } catch (err) {
            setError(err.message || 'Có lỗi xảy ra khi đăng ký.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="auth-page">
            <section className="auth-card auth-card-wide" aria-labelledby="register-title">
                <div className="auth-brand">
                    <Link to="/" className="auth-logo" aria-label="Về trang chủ SEAL">SEAL</Link>
                    <h1 id="register-title" className="auth-title">Tạo tài khoản thí sinh</h1>
                    <p className="auth-copy">Một bước nữa để bạn tham gia và chinh phục SEAL Hackathon.</p>
                </div>

                {error && <div className="form-alert" role="alert">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-grid">
                        <div className="form-span-full">
                            <label htmlFor="register-name" className="form-label">Họ và tên</label>
                            <input
                                id="register-name"
                                required
                                type="text"
                                className="input-custom"
                                value={formData.fullName}
                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                            />
                        </div>

                        <div className="form-span-full">
                            <label htmlFor="register-email" className="form-label">Email</label>
                            <div className="mt-1 grid gap-2 sm:grid-cols-[1fr_auto]">
                                <input
                                    required
                                    id="register-email"
                                    type="email"
                                    className="input-custom"
                                    value={formData.email}
                                    onChange={(e) => {
                                        setFormData({ ...formData, email: e.target.value });
                                        setOtpSent(false);
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={handleSendOtp}
                                    disabled={sendingOtp}
                                    className="btn-secondary whitespace-nowrap disabled:opacity-50"
                                >
                                    {sendingOtp ? 'Đang gửi...' : otpSent ? 'Gửi lại OTP' : 'Gửi mã OTP'}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="register-otp" className="form-label">Mã OTP email</label>
                            <input
                                id="register-otp"
                                required
                                type="text"
                                inputMode="numeric"
                                maxLength="6"
                                placeholder="Nhập 6 số"
                                className="input-custom"
                                value={formData.otp}
                                onChange={(e) => setFormData({ ...formData, otp: e.target.value.replace(/\D/g, '') })}
                            />
                        </div>

                        <div>
                            <label htmlFor="register-student-id" className="form-label">Mã số sinh viên</label>
                            <input
                                id="register-student-id"
                                required
                                type="text"
                                className="input-custom"
                                value={formData.studentId}
                                onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                            />
                        </div>

                        <div>
                            <label htmlFor="register-password" className="form-label">Mật khẩu</label>
                            <input
                                id="register-password"
                                required
                                type="password"
                                className="input-custom"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            />
                        </div>

                        <div>
                            <label htmlFor="register-confirm-password" className="form-label">Xác nhận mật khẩu</label>
                            <input
                                id="register-confirm-password"
                                required
                                type="password"
                                className="input-custom"
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            />
                        </div>

                        <div className="form-span-full flex items-center gap-3 rounded-xl border border-[#d7e6f8] bg-[#f7fbff] p-4">
                            <input
                                type="checkbox"
                                id="isFpt"
                                className="h-5 w-5 rounded accent-[#0f63c9]"
                                checked={formData.isFptStudent}
                                onChange={(e) => setFormData({ ...formData, isFptStudent: e.target.checked })}
                            />
                            <label htmlFor="isFpt" className="text-sm font-semibold text-[#0b1f3f]">Tôi là sinh viên Đại học FPT</label>
                        </div>

                        {!formData.isFptStudent && (
                            <div className="form-span-full">
                                <label htmlFor="register-university" className="form-label">Tên trường đại học</label>
                                <input
                                    id="register-university"
                                    required
                                    type="text"
                                    className="input-custom"
                                    value={formData.universityName}
                                    onChange={(e) => setFormData({ ...formData, universityName: e.target.value })}
                                />
                            </div>
                        )}

                        <div className="form-span-full">
                            <label htmlFor="register-card" className="form-label">Upload thẻ sinh viên</label>
                            <input
                                id="register-card"
                                required
                                type="file"
                                accept="image/*"
                                className="input-custom h-auto cursor-pointer py-3 text-sm"
                                onChange={handleStudentCardUpload}
                            />
                            <p className="form-helper">Ảnh cần thấy rõ tên, MSSV và logo trường. Dung lượng tối đa 2MB.</p>
                            {studentCardPreview && (
                                <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                                    <img src={studentCardPreview} alt="Xem trước thẻ sinh viên" className="max-h-56 w-full object-contain" />
                                </div>
                            )}
                        </div>
                    </div>

                    <button type="submit" disabled={loading} className="btn-primary mt-6 w-full disabled:opacity-50">
                        {loading ? 'Đang xử lý...' : 'Đăng ký tài khoản'}
                    </button>
                </form>

                <p className="auth-footer">
                    Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
                </p>
            </section>
        </main>
    );
}
