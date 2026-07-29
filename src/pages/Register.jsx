import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import Toast from '../components/Toast';

// Upload file ảnh riêng — không set Content-Type thủ công, để axios tự thêm boundary
async function uploadImageFile(file) {
    const form = new FormData();
    form.append('file', file);
    const res = await axiosClient.post('/upload/student-card', form, {
        headers: { 'Content-Type': undefined },
    });
    return res.result; // URL thật dạng http://localhost:8080/uploads/student-cards/xxx.jpg
}

function getFileName(file) {
    if (!file) return '';
    return file.name;
}

function isFptStudentEmail(email) {
    const normalized = (email || '').trim().toLowerCase();
    if (!normalized.endsWith('@fpt.edu.vn')) return false;
    const username = normalized.substring(0, normalized.indexOf('@'));
    return /^.*[a-z]{2}\d{6}$/.test(username);
}

export default function Register() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: Xác thực email, 2: Thông tin sinh viên, 3: Mật khẩu
    const [loading, setLoading] = useState(false);
    const [sendingOtp, setSendingOtp] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [otpSuccess, setOtpSuccess] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // File ảnh thực tế để upload
    const [studentCardFile, setStudentCardFile] = useState(null);
    // Object URL tạm để preview
    const [studentCardPreview, setStudentCardPreview] = useState('');
    const [uploading, setUploading] = useState(false);

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        studentId: '',
        isFptStudent: true,
        universityName: 'Đại học FPT',
        otp: '',
    });

    const handleStudentCardUpload = (event) => {
        const file = event.target.files?.[0];
        if (!file) {
            setStudentCardFile(null);
            setStudentCardPreview('');
            return;
        }

        if (!file.type.startsWith('image/')) {
            setFieldErrors((curr) => ({
                ...curr,
                studentCard: 'Chỉ chấp nhận file ảnh (.jpg, .png, .webp, .gif).',
            }));
            event.target.value = '';
            return;
        }

        const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp'];
        const ext = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
        if (!allowedExtensions.includes(ext)) {
            setFieldErrors((curr) => ({
                ...curr,
                studentCard: `Đuôi file không hợp lệ. Chỉ nhận: ${allowedExtensions.join(', ')}`,
            }));
            event.target.value = '';
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setFieldErrors((curr) => ({
                ...curr,
                studentCard: 'Ảnh thẻ sinh viên không được vượt quá 5MB.',
            }));
            event.target.value = '';
            return;
        }

        if (studentCardPreview) {
            URL.revokeObjectURL(studentCardPreview);
        }
        const previewUrl = URL.createObjectURL(file);
        setStudentCardFile(file);
        setStudentCardPreview(previewUrl);
        setFieldErrors((curr) => ({ ...curr, studentCard: '' }));
    };

    const handleSendOtp = async () => {
        setFieldErrors((curr) => ({ ...curr, email: '' }));
        setOtpSuccess('');
        setError('');
        if (!formData.email) {
            setFieldErrors((curr) => ({ ...curr, email: 'Vui lòng nhập email trước.' }));
            return;
        }

        setSendingOtp(true);
        try {
            const response = await axiosClient.post('/auth/send-otp', { email: formData.email });
            setOtpSent(true);
            setOtpSuccess(response.result || 'Đã gửi mã OTP.');
        } catch (err) {
            setFieldErrors((curr) => ({ ...curr, email: err.message || 'Không thể gửi mã OTP.' }));
        } finally {
            setSendingOtp(false);
        }
    };

    // ===================== VALIDATION NGHIỆP VỤ =====================

    /** Bước 1: kiểm tra client + gọi server verify OTP (async) */
    const handleNextStep1 = async () => {
        setFieldErrors({});
        setError('');
        const errors = {};
        let hasErr = false;

        // 1. Họ và tên: không rỗng, ít nhất 2 từ, không chứa số
        const nameTrimmed = formData.fullName.trim();
        if (!nameTrimmed) {
            errors.fullName = 'Vui lòng nhập họ và tên.';
            hasErr = true;
        } else if (nameTrimmed.split(/\s+/).length < 2) {
            errors.fullName = 'Họ và tên phải có ít nhất 2 từ (VD: Nguyễn Văn A).';
            hasErr = true;
        } else if (/\d/.test(nameTrimmed)) {
            errors.fullName = 'Họ và tên không được chứa chữ số.';
            hasErr = true;
        }

        // 2. Email: không rỗng, đúng định dạng
        const emailTrimmed = formData.email.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailTrimmed) {
            errors.email = 'Vui lòng nhập địa chỉ email.';
            hasErr = true;
        } else if (!emailRegex.test(emailTrimmed)) {
            errors.email = 'Địa chỉ email không đúng định dạng.';
            hasErr = true;
        } else if (!otpSent) {
            errors.email = 'Vui lòng nhấn "Gửi mã" để nhận OTP trước.';
            hasErr = true;
        }

        // 3. OTP: không rỗng, đúng 6 chữ số
        const otpVal = formData.otp.trim();
        if (!otpVal) {
            errors.otp = 'Vui lòng nhập mã OTP từ email.';
            hasErr = true;
        } else if (!/^\d{6}$/.test(otpVal)) {
            errors.otp = 'Mã OTP phải gồm đúng 6 chữ số.';
            hasErr = true;
        }

        if (hasErr) {
            setFieldErrors(errors);
            return;
        }

        // 4. Xác minh OTP với server (peek — không xóa OTP)
        setLoading(true);
        try {
            await axiosClient.post('/auth/verify-otp', {
                email: emailTrimmed,
                otp: otpVal,
            });
            // OTP hợp lệ → tiếp tục
            setStep(2);
        } catch (err) {
            setFieldErrors({ otp: err.message || 'Mã OTP không đúng hoặc đã hết hạn. Vui lòng gửi lại.' });
        } finally {
            setLoading(false);
        }
    };

    /** Bước 2: kiểm tra thông tin sinh viên */
    const handleNextStep2 = () => {
        setFieldErrors({});
        setError('');
        const errors = {};
        let hasErr = false;

        const emailVal = formData.email.trim().toLowerCase();
        const isFptEmail = emailVal.endsWith('@fpt.edu.vn');
        const isFptStudent = isFptEmail ? isFptStudentEmail(emailVal) : formData.isFptStudent;
        const isFptLecturer = isFptEmail && !isFptStudent;

        // Mã số sinh viên: bắt buộc với sinh viên (FPT hoặc ngoài), không bắt buộc với giảng viên
        const sid = formData.studentId.trim();
        if (!isFptLecturer) {
            if (!sid) {
                errors.studentId = 'Vui lòng nhập mã số sinh viên.';
                hasErr = true;
            } else if (sid.length < 4) {
                errors.studentId = 'Mã số sinh viên phải có ít nhất 4 ký tự.';
                hasErr = true;
            }
        }

        // Tên trường (nếu không phải FPT)
        if (!isFptStudent && !formData.universityName.trim() && !isFptLecturer) {
            errors.universityName = 'Vui lòng nhập tên trường đại học.';
            hasErr = true;
        }

        // Ảnh thẻ sinh viên bắt buộc (trừ khi dùng email @fpt.edu.vn)
        if (!isFptEmail && !studentCardFile) {
            errors.studentCard = 'Vui lòng tải lên ảnh thẻ sinh viên.';
            hasErr = true;
        }

        if (hasErr) {
            setFieldErrors(errors);
            return;
        }
        setStep(3);
    };

    const handleNext = () => {
        if (step === 1) handleNextStep1();
        else if (step === 2) handleNextStep2();
    };

    const handleBack = () => {
        if (step > 1) {
            setStep(step - 1);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setFieldErrors({});
        setSuccessMessage('');

        // Validate mật khẩu ngay lập tức trước khi gọi API
        const pwErrors = {};
        let pwHasErr = false;

        if (!formData.password) {
            pwErrors.password = 'Vui lòng nhập mật khẩu.';
            pwHasErr = true;
        } else if (formData.password.length < 6) {
            pwErrors.password = 'Mật khẩu phải chứa ít nhất 6 ký tự.';
            pwHasErr = true;
        }

        if (!formData.confirmPassword) {
            pwErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu.';
            pwHasErr = true;
        } else if (formData.password !== formData.confirmPassword) {
            pwErrors.confirmPassword = 'Mật khẩu xác nhận không khớp.';
            pwHasErr = true;
        }

        if (pwHasErr) {
            setFieldErrors(pwErrors);
            return;
        }

        setLoading(true);
        try {
            let uploadedCardUrl = '';
            if (studentCardFile) {
                setUploading(true);
                uploadedCardUrl = await uploadImageFile(studentCardFile);
                setUploading(false);
            }

            const emailVal = formData.email.trim().toLowerCase();
            const isFptEmail = emailVal.endsWith('@fpt.edu.vn');
            
            let finalIsFptStudent = formData.isFptStudent;
            if (isFptEmail) {
                finalIsFptStudent = isFptStudentEmail(emailVal);
            }

            const response = await axiosClient.post('/auth/register', {
                fullName: formData.fullName,
                email: formData.email,
                password: formData.password,
                studentId: formData.studentId,
                isFptStudent: finalIsFptStudent,
                universityName: isFptEmail
                    ? (finalIsFptStudent ? 'Đại học FPT' : 'Đại học FPT (Giảng viên)')
                    : (formData.isFptStudent ? 'Đại học FPT' : formData.universityName),
                studentCardUrl: uploadedCardUrl,
                otp: formData.otp,
            });

            setSuccessMessage(response.result || 'Đăng ký thành công.');
            if (studentCardPreview) URL.revokeObjectURL(studentCardPreview);
            setTimeout(() => {
                navigate('/login');
            }, 2500);
        } catch (err) {
            setUploading(false);
            setError(err.message || 'Có lỗi xảy ra khi đăng ký. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    // Các biến style phụ trợ đã được chuyển thành class CSS trong index.css để tăng tính đồng bộ.

    return (
        /* Thay đổi devpost-auth--register sang devpost-auth--login để căn giữa form theo chiều dọc giống hệt trang Đăng nhập */
        <main className="devpost-auth devpost-auth--login">
            <section className="devpost-auth__story">
                <Link to="/" className="devpost-auth__wordmark"><span>SEAL</span><strong>SEAL Hackathon</strong></Link>
                <div>
                    <p>Nền tảng hackathon dành cho sinh viên</p>
                    <h1>Tạo hồ sơ.<br />Tìm đồng đội.<br />Bắt đầu xây dựng.</h1>
                    <span>Tài khoản sinh viên giúp thành tích, giải thưởng và chứng nhận của bạn được lưu lại xuyên suốt các mùa giải.</span>
                </div>
                <ul>
                    <li style={{ opacity: step === 1 ? 1 : 0.5, fontWeight: step === 1 ? 'bold' : 'normal' }}>
                        <strong>01</strong>Xác thực tài khoản
                    </li>
                    <li style={{ opacity: step === 2 ? 1 : 0.5, fontWeight: step === 2 ? 'bold' : 'normal' }}>
                        <strong>02</strong>Thông tin sinh viên
                    </li>
                    <li style={{ opacity: step === 3 ? 1 : 0.5, fontWeight: step === 3 ? 'bold' : 'normal' }}>
                        <strong>03</strong>Thiết lập mật khẩu
                    </li>
                </ul>
            </section>

            <section className="devpost-auth__form-panel" aria-labelledby="register-title">
                <div className="devpost-auth__form-wrap">
                    
                    {/* Tiến trình Step bar */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'between', marginBottom: '16px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--seal-700)' }}>
                            Bước {step}/3
                        </span>
                        <div style={{ display: 'flex', gap: '6px', marginLeft: 'auto' }}>
                            <span style={{ height: '6px', width: '32px', borderRadius: '999px', transition: 'background-color 0.2s', backgroundColor: step >= 1 ? 'var(--seal-600)' : '#e2e8f0' }} />
                            <span style={{ height: '6px', width: '32px', borderRadius: '999px', transition: 'background-color 0.2s', backgroundColor: step >= 2 ? 'var(--seal-600)' : '#e2e8f0' }} />
                            <span style={{ height: '6px', width: '32px', borderRadius: '999px', transition: 'background-color 0.2s', backgroundColor: step >= 3 ? 'var(--seal-600)' : '#e2e8f0' }} />
                        </div>
                    </div>

                    <p className="devpost-auth__eyebrow">Đăng ký</p>
                    <h1 id="register-title">
                        {step === 1 && 'Tạo tài khoản'}
                        {step === 2 && 'Thông tin sinh viên'}
                        {step === 3 && 'Thiết lập mật khẩu'}
                    </h1>
                    <span className="devpost-auth__copy">
                        {step === 1 && 'Nhập tên, email và xác thực mã OTP.'}
                        {step === 2 && 'Cung cấp mã sinh viên và ảnh thẻ sinh viên.'}
                        {step === 3 && 'Tạo mật khẩu an toàn cho tài khoản.'}
                    </span>

                    <Toast error={error} success={successMessage} onClose={() => { setError(''); setSuccessMessage(''); }} />

                    <form onSubmit={step === 3 ? handleSubmit : (e) => e.preventDefault()}>
                        
                        {/* ================= STEP 1: XÁC THỰC EMAIL ================= */}
                        {step === 1 && (
                            <>
                                <label htmlFor="register-name">Họ và tên</label>
                                <input
                                    id="register-name"
                                    required
                                    type="text"
                                    placeholder="Nguyễn Văn A"
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                />
                                {fieldErrors.fullName && <p style={{ color: '#ef4444', fontSize: '12px', fontWeight: 'bold', marginTop: '4px' }}>{fieldErrors.fullName}</p>}

                                <label htmlFor="register-email">Email</label>
                                <div className="flex gap-3 items-center mb-4">
                                    <input
                                        required
                                        id="register-email"
                                        type="email"
                                        placeholder="example@fpt.edu.vn"
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
                                        className="btn-secondary h-[42px] px-4 whitespace-nowrap text-xs font-bold w-auto"
                                    >
                                        {sendingOtp ? 'Đang gửi...' : otpSent ? 'Gửi lại' : 'Gửi mã'}
                                    </button>
                                </div>
                                {fieldErrors.email && <p style={{ color: '#ef4444', fontSize: '12px', fontWeight: 'bold', marginTop: '-12px', marginBottom: '8px' }}>{fieldErrors.email}</p>}
                                {otpSuccess && <p style={{ color: '#16a34a', fontSize: '12px', fontWeight: 'bold', marginTop: '-12px', marginBottom: '8px' }}>{otpSuccess}</p>}

                                <label htmlFor="register-otp">Mã OTP email</label>
                                <input
                                    id="register-otp"
                                    required
                                    type="text"
                                    inputMode="numeric"
                                    maxLength="6"
                                    placeholder="Nhập 6 số"
                                    value={formData.otp}
                                    onChange={(e) => setFormData({ ...formData, otp: e.target.value.replace(/\D/g, '') })}
                                />
                                {fieldErrors.otp && <p style={{ color: '#ef4444', fontSize: '12px', fontWeight: 'bold', marginTop: '4px' }}>{fieldErrors.otp}</p>}
                            </>
                        )}
                        {/* ================= STEP 2: THÔNG TIN SINH VIÊN ================= */}
                        {step === 2 && (() => {
                            const emailVal = formData.email.trim().toLowerCase();
                            const isFptEmail = emailVal.endsWith('@fpt.edu.vn');
                            const isFptStudent = isFptEmail ? isFptStudentEmail(emailVal) : formData.isFptStudent;
                            const isFptLecturer = isFptEmail && !isFptStudent;

                            return (
                                <>
                                    {!isFptLecturer ? (
                                        <>
                                            <label htmlFor="register-student-id">Mã số sinh viên</label>
                                            <input
                                                id="register-student-id"
                                                required
                                                type="text"
                                                placeholder="SE170001"
                                                value={formData.studentId}
                                                onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                                            />
                                            {fieldErrors.studentId && <p style={{ color: '#ef4444', fontSize: '12px', fontWeight: 'bold', marginTop: '4px' }}>{fieldErrors.studentId}</p>}
                                        </>
                                    ) : (
                                        <>
                                            <label htmlFor="register-student-id">Mã cán bộ (không bắt buộc)</label>
                                            <input
                                                id="register-student-id"
                                                type="text"
                                                placeholder="Mã cán bộ FPT của bạn"
                                                value={formData.studentId}
                                                onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                                            />
                                            {fieldErrors.studentId && <p style={{ color: '#ef4444', fontSize: '12px', fontWeight: 'bold', marginTop: '4px' }}>{fieldErrors.studentId}</p>}
                                        </>
                                    )}

                                    {!isFptEmail && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '8px 0 16px 0' }}>
                                            <input
                                                type="checkbox"
                                                id="isFpt"
                                                style={{ width: '18px', height: '18px', margin: 0, accentColor: 'var(--seal-600)', cursor: 'pointer' }}
                                                checked={formData.isFptStudent}
                                                onChange={(e) => setFormData({ ...formData, isFptStudent: e.target.checked })}
                                            />
                                            <label htmlFor="isFpt" style={{ margin: 0, cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', color: 'var(--seal-700)' }}>
                                                Tôi là sinh viên Đại học FPT
                                            </label>
                                        </div>
                                    )}

                                    {!isFptEmail && !formData.isFptStudent && (
                                        <>
                                            <label htmlFor="register-university">Tên trường đại học</label>
                                            <input
                                                id="register-university"
                                                required
                                                type="text"
                                                placeholder="Trường đại học của bạn"
                                                value={formData.universityName}
                                                onChange={(e) => setFormData({ ...formData, universityName: e.target.value })}
                                            />
                                            {fieldErrors.universityName && <p style={{ color: '#ef4444', fontSize: '12px', fontWeight: 'bold', marginTop: '4px' }}>{fieldErrors.universityName}</p>}
                                        </>
                                    )}

                                    {!isFptEmail && (
                                        <>
                                            <label htmlFor="register-card">Ảnh thẻ sinh viên (bắt buộc)</label>
                                            <label
                                                htmlFor="register-card"
                                                className="student-card-upload-label mb-4"
                                            >
                                                {studentCardFile ? (
                                                    <div className="flex items-center gap-3">
                                                        <svg className="h-6 w-6 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                        <div className="text-left leading-normal">
                                                            <p className="text-sm font-bold text-emerald-800 max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap m-0">
                                                                {getFileName(studentCardFile)}
                                                            </p>
                                                            <p className="text-xs text-emerald-600 m-0">
                                                                {(studentCardFile.size / 1024).toFixed(0)} KB (Nhấn đổi ảnh)
                                                            </p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <svg className="h-7 w-7 text-[var(--seal-600)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                                        </svg>
                                                        <p className="text-sm font-bold text-[var(--seal-600)] m-0">Tải ảnh thẻ lên</p>
                                                        <p className="text-xs text-gray-500 m-0">Chỉ nhận file .jpg, .png, .webp (Max 5MB)</p>
                                                    </>
                                                )}
                                            </label>
                                            <input
                                                id="register-card"
                                                type="file"
                                                accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/bmp"
                                                className="sr-only"
                                                onChange={handleStudentCardUpload}
                                            />
                                            {fieldErrors.studentCard && <p style={{ color: '#ef4444', fontSize: '12px', fontWeight: 'bold', marginTop: '-8px', marginBottom: '8px' }}>{fieldErrors.studentCard}</p>}
                                        </>
                                    )}
                                </>
                            );
                        })()}

                        {/* ================= STEP 3: THIẾT LẬP MẬT KHẨU ================= */}
                        {step === 3 && (
                            <>
                                <label htmlFor="register-password">Mật khẩu</label>
                                <input
                                    id="register-password"
                                    required
                                    type="password"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                                {fieldErrors.password && <p style={{ color: '#ef4444', fontSize: '12px', fontWeight: 'bold', marginTop: '4px' }}>{fieldErrors.password}</p>}

                                <label htmlFor="register-confirm-password">Xác nhận mật khẩu</label>
                                <input
                                    id="register-confirm-password"
                                    required
                                    type="password"
                                    placeholder="••••••••"
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                />
                                {fieldErrors.confirmPassword && <p style={{ color: '#ef4444', fontSize: '12px', fontWeight: 'bold', marginTop: '4px' }}>{fieldErrors.confirmPassword}</p>}
                            </>
                        )}

                        {/* ================= NÚT THAO TÁC DI CHUYỂN BƯỚC ================= */}
                        <div className="flex gap-3 mt-5">
                            {step > 1 && (
                                <button
                                    type="button"
                                    onClick={handleBack}
                                    disabled={loading || uploading}
                                    className="btn-secondary flex-1 w-full"
                                >
                                    Quay lại
                                </button>
                            )}
                            
                            <button
                                type={step === 3 ? 'submit' : 'button'}
                                onClick={step < 3 ? handleNext : undefined}
                                disabled={loading || uploading}
                                className="btn-primary flex-1 w-full"
                            >
                                {step < 3 ? (
                                    'Tiếp tục'
                                ) : uploading ? (
                                    <span className="flex items-center gap-2">
                                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                        </svg>
                                        Đang đăng ký...
                                    </span>
                                ) : loading ? (
                                    'Đang xử lý...'
                                ) : (
                                    'Đăng ký'
                                )}
                            </button>
                        </div>
                    </form>

                    <p className="devpost-auth__switch">
                        Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
                    </p>
                </div>
            </section>
        </main>
    );
}
