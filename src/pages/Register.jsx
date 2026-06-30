import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AUTH_CONFIG } from '../config/authConfig';

// =========================================================================
// ⚙️ KHU VỰC CẤU HÌNH TẬP TRUNG (DỄ DÀNG CONFIG HỆ THỐNG TẠI ĐÂY)
// =========================================================================

const Register = () => {
    const navigate = useNavigate();

    // 1. State lưu trữ các trường dữ liệu text gửi xuống RegisterRequest (Java)
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        fullName: '',
        studentId: '',
        universityName: '',
        otpCode: '',
        isFptStudent: 'false'
    });

    // Các State bổ sung dùng riêng tại Frontend
    const [confirmPassword, setConfirmPassword] = useState('');
    const [studentCard, setStudentCard] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [countdown, setCountdown] = useState(0); // Bộ đếm ngược giây OTP

    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [otpLoading, setOtpLoading] = useState(false);

    // Tự động chạy lùi thời gian đếm ngược 60s cho nút OTP
    useEffect(() => {
        if (countdown <= 0) return;
        const timer = setInterval(() => {
            setCountdown((prev) => prev - 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [countdown]);

    // Hàm tự động cập nhật dữ liệu khi người dùng gõ phím
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    // Xử lý tải ảnh lên và tạo link xem trước ảnh
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setStudentCard(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    // Kích hoạt gửi mã OTP thật về Email thông qua Backend Java
    const handleSendOtp = () => {
        if (!formData.email) {
            setErrorMessage("Vui lòng điền chính xác địa chỉ Email trước khi nhận mã OTP!");
            return;
        }

        // Check nhanh format email từ cấu hình config tập trung
        if (!AUTH_CONFIG.validation.email.regex.test(formData.email)) {
            setErrorMessage(AUTH_CONFIG.validation.email.message);
            return;
        }

        setOtpLoading(true);
        setErrorMessage('');

        axios.post(`http://localhost:8080/api/public/auth/send-otp?email=${formData.email}`)
            .then((res) => {
                setOtpLoading(false);
                setCountdown(AUTH_CONFIG.otpCountdownSeconds); // Bật đếm ngược 60 giây khóa nút
            })
            .catch((err) => {
                setOtpLoading(false);
                setErrorMessage(err.response?.data || "Không thể gửi email OTP. Vui lòng kiểm tra Mail Server Backend!");
            });
    };

    // 2. Hàm xử lý kiểm tra định dạng tập trung và nộp dữ liệu (FormData Multipart)
    const handleFormSubmit = (e) => {
        e.preventDefault();
        setErrorMessage('');
        setSuccessMessage('');

        const config = AUTH_CONFIG.validation;

        // CHỮA CHÁY VÀ CHECK FORMAT THEO CONFIG TẬP TRUNG
        // Kiểm tra định dạng Email
        if (!config.email.regex.test(formData.email)) {
            setErrorMessage(config.email.message);
            return;
        }

        // Kiểm tra độ dài mật khẩu
        if (formData.password.length < config.password.minLength) {
            setErrorMessage(config.password.message);
            return;
        }

        // Kiểm tra cấu trúc mật khẩu (Chữ + Số)
        const hasLetter = /[A-Za-z]/.test(formData.password);
        const hasNumber = /\d/.test(formData.password);
        if ((config.password.requireLetters && !hasLetter) || (config.password.requireNumbers && !hasNumber)) {
            setErrorMessage(config.password.message);
            return;
        }

        // Kiểm tra trùng mật khẩu
        if (formData.password !== confirmPassword) {
            setErrorMessage("Mật khẩu xác nhận không khớp! Vui lòng kiểm tra kỹ hai ô mật khẩu.");
            return;
        }

        // Kiểm tra file ảnh thẻ sinh viên bắt buộc
        if (!studentCard) {
            setErrorMessage("Vui lòng tải lên hình ảnh thẻ sinh viên của bạn để làm căn cứ duyệt tài khoản!");
            return;
        }

        setLoading(true);

        // ĐÓNG GÓI DỮ LIỆU SANG MULTIPART/FORM-DATA ĐỂ BẮN FILE LÊN JAVA
        const data = new FormData();
        data.append('email', formData.email);
        data.append('password', formData.password);
        data.append('fullName', formData.fullName);
        data.append('studentId', formData.studentId);
        data.append('universityName', formData.isFptStudent === 'true' ? 'FPT University' : formData.universityName);
        data.append('otpCode', formData.otpCode);
        data.append('isFptStudent', formData.isFptStudent);
        data.append('studentCard', studentCard); // Trùng khít khớp @RequestParam("studentCard") bên Java

        axios.post('http://localhost:8080/api/public/auth/register', data, {
            headers: { 'Content-Type': 'multipart/form-data' }
        })
            .then((response) => {
                setLoading(false);
                setSuccessMessage(response.data);
                setTimeout(() => navigate('/login'), 2500);
            })
            .catch((error) => {
                setLoading(false);
                setErrorMessage(error.response?.data || "Đăng ký thất bại. Vui lòng kiểm tra các thông tin đã điền!");
            });
    };

    return (
        <div style={styles.container}>
            <div style={styles.registerCard}>

                <div style={styles.headerArea}>
                    <h2 style={styles.mainTitle}>ĐĂNG KÝ TÀI KHOẢN</h2>
                    <p style={styles.subTitle}>Hệ thống xác thực tư cách thí sinh tham gia SEAL Hackathon</p>
                </div>

                {errorMessage && <div style={styles.errorBox}>⚠️ {errorMessage}</div>}
                {successMessage && <div style={styles.successBox}>✅ {successMessage}</div>}

                <form onSubmit={handleFormSubmit} style={styles.form}>

                    {/* 1. Họ và Tên */}
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Họ và Tên</label>
                        <input type="text" name="fullName" placeholder="Ví dụ: Nguyễn Văn A" value={formData.fullName} onChange={handleInputChange} style={styles.input} required />
                    </div>

                    {/* 2. Email & Nút OTP */}
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Địa chỉ Email</label>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <input type="email" name="email" placeholder="Nhập địa chỉ email của bạn" value={formData.email} onChange={handleInputChange} style={{ ...styles.input, flex: 1 }} required />
                            <button
                                type="button"
                                onClick={handleSendOtp}
                                disabled={otpLoading || countdown > 0}
                                style={{
                                    ...styles.otpBtn,
                                    backgroundColor: (otpLoading || countdown > 0) ? '#e2e8f0' : '#ffffff',
                                    color: (otpLoading || countdown > 0) ? '#a0aec0' : '#ed8936',
                                    borderColor: (otpLoading || countdown > 0) ? '#cbd5e0' : '#ed8936',
                                    cursor: (otpLoading || countdown > 0) ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {otpLoading ? "Đang gửi..." : countdown > 0 ? `Gửi lại sau (${countdown}s)` : "Gửi Mã"}
                            </button>
                        </div>
                    </div>

                    {/* 3. Ô OTP Cách Điệu Sang Xịn Mịn */}
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Mã xác thực OTP (6 số)</label>
                        <input type="text" name="otpCode" placeholder="Nhập mã xác thực hệ thống gửi về mail" value={formData.otpCode} onChange={handleInputChange} style={styles.modernOtpInput} maxLength={6} required />
                    </div>

                    {/* 4. Hai ô Mật khẩu rải thành 2 hàng dài trơn tru chuyên nghiệp */}
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Mật khẩu đăng ký</label>
                        <input type="password" name="password" placeholder="Tối thiểu 8 ký tự bao gồm chữ và số" value={formData.password} onChange={handleInputChange} style={styles.input} required />
                    </div>

                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Xác nhận lại mật khẩu</label>
                        <input type="password" name="confirmPassword" placeholder="Nhập lại chính xác mật khẩu phía trên" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} style={styles.input} required />
                    </div>

                    {/* 5. Phân Loại Loại Hình Sinh Viên */}
                    <div style={styles.rowGrid}>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Sinh viên FPTU?</label>
                            <select name="isFptStudent" value={formData.isFptStudent} onChange={handleInputChange} style={styles.select}>
                                <option value="true">Sinh viên FPT</option>
                                <option value="false">Trường đối tác</option>
                            </select>
                        </div>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Mã số sinh viên (MSSV)</label>
                            <input type="text" name="studentId" placeholder="Ví dụ: SE160123" value={formData.studentId} onChange={handleInputChange} style={styles.input} required />
                        </div>
                    </div>

                    {/* 6. Trường Ngoài thì hiển thị Thêm Tên Trường */}
                    {formData.isFptStudent === 'false' && (
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Tên trường Đại học hiện tại</label>
                            <input type="text" name="universityName" placeholder="Ví dụ: Đại học Bách Khoa TP.HCM" value={formData.universityName} onChange={handleInputChange} style={styles.input} required />
                        </div>
                    )}

                    {/* 7. Ô Upload Minh Chứng Ảnh Thẻ Sinh Viên */}
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Ảnh thẻ sinh viên (Xác thực đối tượng)</label>
                        <div style={styles.uploadContainer}>
                            <input type="file" id="file-upload" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
                            <label htmlFor="file-upload" style={styles.uploadLabel}>
                                📷 {studentCard ? "Thay đổi hình ảnh khác" : "Bấm vào đây để tải ảnh thẻ của bạn lên"}
                            </label>

                            {imagePreview && (
                                <div style={styles.previewWrapper}>
                                    <img src={imagePreview} alt="Preview" style={styles.imagePreview} />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Nút đăng ký chính */}
                    <button type="submit" style={styles.submitBtn} disabled={loading}>
                        {loading ? 'ĐANG TIẾN HÀNH KHỞI TẠO TÀI KHOẢN...' : 'HOÀN TẤT ĐĂNG KÝ THÀNH VIÊN'}
                    </button>

                </form>

                <div style={styles.footerArea}>
                    <span style={{ color: '#718096' }}>Đã có tài khoản thi đấu? </span>
                    <span style={styles.loginLink} onClick={() => navigate('/login')}>Đăng nhập ngay</span>
                </div>

            </div>
        </div>
    );
};

const PRIMARY_BLUE = '#3182ce';
const DARK_TEXT = '#2d3748';

const styles = {
    container: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#ffffff', padding: '40px 20px', fontFamily: "'Segoe UI', Roboto, sans-serif" },
    registerCard: { width: '100%', maxWidth: '520px', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '40px 30px', boxShadow: '0 10px 25px rgba(0, 0, 0, 0.04)' },
    headerArea: { textAlign: 'center', marginBottom: '25px' },
    mainTitle: { fontSize: '24px', fontWeight: '800', color: DARK_TEXT, marginBottom: '8px' },
    subTitle: { fontSize: '13px', color: '#718096', fontWeight: '500', lineHeight: '1.4' },
    errorBox: { backgroundColor: '#fff5f5', color: '#c53030', border: '1px solid #fed7d7', padding: '12px', borderRadius: '6px', fontSize: '13px', fontWeight: '500', marginBottom: '20px', textAlign: 'left' },
    successBox: { backgroundColor: '#f0fff4', color: '#2f855a', border: '1px solid #c6f6d5', padding: '12px', borderRadius: '6px', fontSize: '13px', fontWeight: '500', marginBottom: '20px', textAlign: 'left' },
    form: { display: 'flex', flexDirection: 'column' },
    inputGroup: { display: 'flex', flexDirection: 'column', marginBottom: '18px', textAlign: 'left' },
    rowGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' },
    label: { fontSize: '13px', fontWeight: '700', color: '#4a5568', marginBottom: '6px' },
    input: { padding: '11px 14px', fontSize: '14px', borderRadius: '6px', border: '1px solid #cbd5e0', backgroundColor: '#fafafa', color: DARK_TEXT, outline: 'none' },
    select: { padding: '11px 14px', fontSize: '14px', borderRadius: '6px', border: '1px solid #cbd5e0', backgroundColor: '#fafafa', color: DARK_TEXT, outline: 'none', cursor: 'pointer' },
    modernOtpInput: { padding: '12px 14px', fontSize: '16px', fontWeight: '700', borderRadius: '6px', border: '2px solid #f6ad55', backgroundColor: '#fffaf0', color: '#dd6b20', letterSpacing: '4px', outline: 'none', textAlign: 'center', boxShadow: '0 2px 8px rgba(221, 107, 32, 0.08)' },
    otpBtn: { backgroundColor: '#ffffff', color: '#ed8936', border: '1px solid #ed8936', padding: '0 15px', borderRadius: '6px', fontSize: '13px', fontWeight: '700', transition: 'all 0.2s' },
    uploadContainer: { display: 'flex', flexDirection: 'column', gap: '10px' },
    uploadLabel: { padding: '12px', border: '2px dashed #cbd5e0', borderRadius: '8px', textAlign: 'center', cursor: 'pointer', backgroundColor: '#f7fafc', fontSize: '13px', color: '#4a5568', fontWeight: '600' },
    previewWrapper: { display: 'flex', justifyContent: 'center', marginTop: '5px', backgroundColor: '#f7fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' },
    imagePreview: { maxWidth: '100%', maxHeight: '180px', borderRadius: '6px', objectFit: 'contain' },
    submitBtn: { backgroundColor: PRIMARY_BLUE, color: '#ffffff', border: 'none', padding: '14px', fontSize: '14px', fontWeight: '700', borderRadius: '6px', letterSpacing: '0.5px', marginTop: '10px', boxShadow: '0 4px 12px rgba(49, 130, 206, 0.2)', cursor: 'pointer' },
    footerArea: { marginTop: '25px', textAlign: 'center', fontSize: '13px', fontWeight: '500' },
    loginLink: { color: PRIMARY_BLUE, fontWeight: '700', cursor: 'pointer', marginLeft: '3px' }
};

export default Register;