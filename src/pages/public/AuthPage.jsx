import React, { useState, useEffect } from 'react';

export default function AuthPage() {
    // State chuyển tab: 'login' hoặc 'register'
    const [isLoginView, setIsLoginView] = useState(true);

    // State lưu dữ liệu Form
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        fullName: '',
        studentId: '',
        universityName: 'FPT University',
        otpCode: '',
        isFptStudent: 'true' // Mặc định chọn Sinh viên FPT dạng String để quản lý select box
    });

    const [message, setMessage] = useState('');
    const [isOtpSent, setIsOtpSent] = useState(false);

    // State xử lý thời gian đếm ngược của nút gửi mã
    const [countdown, setCountdown] = useState(0);

    // Hiệu ứng đếm ngược 60s bằng useEffect
    useEffect(() => {
        let timer;
        if (countdown > 0) {
            timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [countdown]);

    // Hàm cập nhật dữ liệu khi người dùng gõ vào các ô input
    const handleChange = (e) => {
        const { name, value } = e.target;
        // Nếu người dùng đổi loại sinh viên, tự động reset tên trường tương ứng
        if (name === 'isFptStudent') {
            setFormData(prev => ({
                ...prev,
                [name]: value,
                universityName: value === 'true' ? 'FPT University' : ''
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    // Chuyển đổi qua lại giữa Login & Register
    const switchTab = (toLogin) => {
        setIsLoginView(toLogin);
        setMessage('');
        setIsOtpSent(false);
        setCountdown(0);
    };

    // 1. Hàm xử lý gửi mã OTP và kích hoạt đếm ngược 60s
    const handleSendOtp = async () => {
        if (!formData.email) {
            setMessage('❌ Vui lòng nhập email trước khi nhận mã!');
            return;
        }

        try {
            // Kích hoạt trạng thái đếm ngược 60s ngay lập tức để chặn bấm liên tục
            setCountdown(60);
            setIsOtpSent(true);
            setMessage('⏳ Đang gửi mã OTP, vui lòng kiểm tra hòm thư...');

            const response = await fetch(`http://localhost:8080/api/public/auth/send-otp?email=${formData.email}`, { method: 'POST' });
            const text = await response.text();

            if (response.ok) {
                setMessage('🎉 Mã OTP đã được gửi về mail của bạn!');
            } else {
                setMessage(`❌ Lỗi từ server: ${text}`);
                setCountdown(0); // Nếu lỗi thì reset nút cho bấm lại
            }
        } catch (error) {
            setMessage('❌ Lỗi kết nối gửi OTP!');
            setCountdown(0);
        }
    };

    // 2. Hàm xử lý Đăng nhập / Đăng ký khi bấm submit form
    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');

        const url = isLoginView
            ? 'http://localhost:8080/api/public/auth/login'
            : 'http://localhost:8080/api/public/auth/register';

        const bodyData = isLoginView
            ? { email: formData.email, password: formData.password }
            : formData;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bodyData)
            });

            if (isLoginView) {
                const data = await response.json();
                if (response.ok) {
                    setMessage(`🎉 Đăng nhập thành công! Chào ${data.fullName}`);
                    localStorage.setItem('user_role', data.role);
                } else {
                    setMessage(`❌ Thất bại: ${data.message || 'Sai tài khoản hoặc mật khẩu'}`);
                }
            } else {
                const text = await response.text();
                if (response.ok) {
                    setMessage(`✅ ${text}`);
                    setTimeout(() => switchTab(true), 2000);
                } else {
                    setMessage(`❌ Đăng ký thất bại: ${text}`);
                }
            }
        } catch (error) {
            setMessage('❌ Lỗi kết nối đến Server Backend!');
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>

                {/* THANH CHUYỂN TAB */}
                <div style={styles.tabContainer}>
                    <button type="button" onClick={() => switchTab(true)} style={{ ...styles.tab, ...(isLoginView ? styles.activeTabLogin : {}) }}>
                        ĐĂNG NHẬP
                    </button>
                    <button type="button" onClick={() => switchTab(false)} style={{ ...styles.tab, ...(!isLoginView ? styles.activeTabRegister : {}) }}>
                        ĐĂNG KÝ
                    </button>
                </div>

                {/* KHU VỰC HIỂN THỊ FORM */}
                <form onSubmit={handleSubmit} style={styles.form}>
                    <h2 style={{ ...styles.title, color: isLoginView ? '#f27024' : '#0056aa' }}>
                        {isLoginView ? 'SEAL SYSTEM' : 'TẠO TÀI KHOẢN THÍ SINH'}
                    </h2>

                    {/* [ĐĂNG KÝ] - Nhập Họ và Tên */}
                    {!isLoginView && (
                        <input type="text" name="fullName" placeholder="Họ và Tên đầy đủ" required onChange={handleChange} style={styles.input} />
                    )}

                    {/* KHU VỰC EMAIL & NÚT XÁC THỰC */}
                    {isLoginView ? (
                        <input type="email" name="email" placeholder="Email của bạn" required onChange={handleChange} style={styles.input} />
                    ) : (
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                            <input type="email" name="email" placeholder="Nhập Email đăng ký" required onChange={handleChange} style={{ ...styles.input, marginBottom: 0, flex: 1 }} />
                            <button
                                type="button"
                                onClick={handleSendOtp}
                                disabled={countdown > 0}
                                style={{ ...styles.otpButton, background: countdown > 0 ? '#aaa' : '#f27024', cursor: countdown > 0 ? 'not-allowed' : 'pointer' }}
                            >
                                {countdown > 0 ? `Thử lại sau (${countdown}s)` : 'Gửi mã'}
                            </button>
                        </div>
                    )}

                    {/* [ĐĂNG KÝ] - Ô nhập OTP ẩn/hiện thông minh */}
                    {!isLoginView && isOtpSent && (
                        <input type="text" name="otpCode" placeholder="Nhập 6 số mã OTP từ Email" required onChange={handleChange} style={{ ...styles.input, borderColor: '#f27024', backgroundColor: '#fff9f5' }} />
                    )}

                    {/* Ô NHẬP MẬT KHẨU */}
                    <input type="password" name="password" placeholder="Mật khẩu" required onChange={handleChange} style={styles.input} />

                    {/* [ĐĂNG KÝ] - Chọn phân loại Sinh viên & Nhập Trường / MSSV */}
                    {!isLoginView && (
                        <>
                            <select name="isFptStudent" value={formData.isFptStudent} onChange={handleChange} style={styles.select}>
                                <option value="true">Sinh viên thuộc FPT University</option>
                                <option value="false">Sinh viên Trường Đại học khác</option>
                            </select>

                            {/* Nếu là sinh viên trường khác mới hiện ô nhập tên trường */}
                            {formData.isFptStudent === 'false' && (
                                <input type="text" name="universityName" placeholder="Nhập tên trường Đại học của bạn" required onChange={handleChange} style={styles.input} />
                            )}

                            {/* Ô nhập Mã số sinh viên */}
                            <input type="text" name="studentId" placeholder={formData.isFptStudent === 'true' ? "Mã số sinh viên (Ví dụ: SE19xxxx)" : "Mã số sinh viên tại trường"} required onChange={handleChange} style={styles.input} />
                        </>
                    )}

                    {/* NÚT SUBMIT CHÍNH */}
                    <button type="submit" style={{ ...styles.button, background: isLoginView ? '#f27024' : '#0056aa' }}>
                        {isLoginView ? 'Đăng Nhập ngay' : 'Xác nhận Đăng ký'}
                    </button>

                    {/* THÔNG BÁO KẾT QUẢ */}
                    {message && <p style={styles.message}>{message}</p>}
                </form>

            </div>
        </div>
    );
}

// =========================================================================
// BỘ CSS ĐÃ CẬP NHẬT THÊM ĐỊNH DẠNG CHO SELECT BOX
// =========================================================================
const styles = {
    container: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f4f6f9' },
    card: { background: '#fff', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', width: '420px', overflow: 'hidden' },
    tabContainer: { display: 'flex', background: '#eee' },
    tab: { flex: 1, padding: '15px 0', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 'bold', color: '#666', fontSize: '14px', transition: 'all 0.3s' },
    activeTabLogin: { background: '#fff', color: '#f27024', borderBottom: '3px solid #f27024' },
    activeTabRegister: { background: '#fff', color: '#0056aa', borderBottom: '3px solid #0056aa' },
    form: { padding: '30px 40px', textAlign: 'center' },
    title: { marginBottom: '24px', fontFamily: 'Arial, sans-serif', fontSize: '20px', fontWeight: 'bold' },
    input: { width: '100%', padding: '12px', marginBottom: '16px', border: '1px solid #ddd', borderRadius: '6px', boxSizing: 'border-box', fontSize: '14px' },
    select: { width: '100%', padding: '12px', marginBottom: '16px', border: '1px solid #ddd', borderRadius: '6px', boxSizing: 'border-box', fontSize: '14px', backgroundColor: '#fff', cursor: 'pointer' },
    otpButton: { padding: '0 12px', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '12px', width: '130px', transition: 'all 0.3s' },
    button: { width: '100%', padding: '12px', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px', marginTop: '10px' },
    message: { marginTop: '15px', fontSize: '13px', fontWeight: 'bold', color: '#333' }
};