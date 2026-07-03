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
        <div className="flex min-h-screen items-center justify-center bg-slate-100 py-10">
            <div className="w-full max-w-xl space-y-6 rounded-xl border border-slate-200 bg-white p-8 shadow-lg">
                <div className="text-center">
                    <h1 className="text-3xl font-extrabold text-indigo-600">Đăng Ký SEAL Hackathon</h1>
                    <p className="mt-2 text-sm text-gray-500">Tạo tài khoản thí sinh để tham gia giải đấu</p>
                </div>

                {error && <div className="rounded-lg bg-red-100 p-3 text-sm text-red-600">{error}</div>}

                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700">Họ và tên</label>
                            <input
                                required
                                type="text"
                                className="mt-1 w-full rounded-lg border bg-slate-50 px-4 py-2 focus:border-indigo-500 focus:ring-indigo-500"
                                value={formData.fullName}
                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                            />
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700">Email</label>
                            <div className="mt-1 grid gap-2 sm:grid-cols-[1fr_auto]">
                                <input
                                    required
                                    type="email"
                                    className="w-full rounded-lg border bg-slate-50 px-4 py-2"
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
                                    className="rounded-lg border border-indigo-200 bg-white px-4 py-2 text-sm font-bold text-indigo-700 hover:bg-indigo-50 disabled:opacity-50"
                                >
                                    {sendingOtp ? 'Đang gửi...' : otpSent ? 'Gửi lại OTP' : 'Gửi mã OTP'}
                                </button>
                            </div>
                        </div>

                        <div className="col-span-2 sm:col-span-1">
                            <label className="block text-sm font-medium text-gray-700">Mã OTP email</label>
                            <input
                                required
                                type="text"
                                inputMode="numeric"
                                maxLength="6"
                                placeholder="Nhập 6 số"
                                className="mt-1 w-full rounded-lg border bg-slate-50 px-4 py-2"
                                value={formData.otp}
                                onChange={(e) => setFormData({ ...formData, otp: e.target.value.replace(/\D/g, '') })}
                            />
                        </div>

                        <div className="col-span-2 sm:col-span-1">
                            <label className="block text-sm font-medium text-gray-700">Mã số sinh viên</label>
                            <input
                                required
                                type="text"
                                className="mt-1 w-full rounded-lg border bg-slate-50 px-4 py-2"
                                value={formData.studentId}
                                onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                            />
                        </div>

                        <div className="col-span-2 sm:col-span-1">
                            <label className="block text-sm font-medium text-gray-700">Mật khẩu</label>
                            <input
                                required
                                type="password"
                                className="mt-1 w-full rounded-lg border bg-slate-50 px-4 py-2"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            />
                        </div>

                        <div className="col-span-2 sm:col-span-1">
                            <label className="block text-sm font-medium text-gray-700">Xác nhận mật khẩu</label>
                            <input
                                required
                                type="password"
                                className="mt-1 w-full rounded-lg border bg-slate-50 px-4 py-2"
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            />
                        </div>

                        <div className="col-span-2 mt-2 flex items-center space-x-3">
                            <input
                                type="checkbox"
                                id="isFpt"
                                className="h-5 w-5 rounded text-indigo-600"
                                checked={formData.isFptStudent}
                                onChange={(e) => setFormData({ ...formData, isFptStudent: e.target.checked })}
                            />
                            <label htmlFor="isFpt" className="font-medium text-gray-700">Tôi là sinh viên Đại học FPT</label>
                        </div>

                        {!formData.isFptStudent && (
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700">Tên trường đại học</label>
                                <input
                                    required
                                    type="text"
                                    className="mt-1 w-full rounded-lg border bg-slate-50 px-4 py-2"
                                    value={formData.universityName}
                                    onChange={(e) => setFormData({ ...formData, universityName: e.target.value })}
                                />
                            </div>
                        )}

                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700">Upload thẻ sinh viên</label>
                            <input
                                required
                                type="file"
                                accept="image/*"
                                className="mt-1 w-full rounded-lg border bg-slate-50 px-4 py-2 text-sm"
                                onChange={handleStudentCardUpload}
                            />
                            <p className="mt-1 text-xs text-gray-500">Ảnh cần thấy rõ tên, MSSV và logo trường. Dung lượng tối đa 2MB.</p>
                            {studentCardPreview && (
                                <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                                    <img src={studentCardPreview} alt="Xem trước thẻ sinh viên" className="max-h-56 w-full object-contain" />
                                </div>
                            )}
                        </div>
                    </div>

                    <button type="submit" disabled={loading} className="mt-4 w-full rounded-lg bg-indigo-600 px-4 py-2 font-bold text-white hover:bg-indigo-700 disabled:opacity-50">
                        {loading ? 'Đang xử lý...' : 'Đăng ký tài khoản'}
                    </button>
                </form>

                <p className="text-center text-sm text-gray-600">
                    Đã có tài khoản? <Link to="/login" className="font-medium text-indigo-600 hover:underline">Đăng nhập</Link>
                </p>
            </div>
        </div>
    );
}
