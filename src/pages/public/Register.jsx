import React, { useState } from 'react';

export default function Register() {
    const [formData, setFormData] = useState({ email: '', password: '', fullName: '', studentId: '', universityName: 'FPT University', otpCode: '' });
    const [message, setMessage] = useState('');
    const [isOtpSent, setIsOtpSent] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Hàm gọi API Backend gửi mã OTP về mail
    const handleSendOtp = async () => {
        if (!formData.email) {
            setMessage('❌ Vui lòng nhập email trước khi nhận mã!');
            return;
        }
        try {
            const response = await fetch(`http://localhost:8080/api/auth/send-otp?email=${formData.email}`, { method: 'POST' });
            const text = await response.text();
            if (response.ok) {
                setIsOtpSent(true);
                setMessage('🎉 Mã OTP đã được gửi, check mail liền nha!');
            } else {
                setMessage(`❌ ${text}`);
            }
        } catch (error) {
            setMessage('❌ Lỗi kết nối gửi OTP!');
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        // Tiến hành gọi API /register kèm theo thuộc tính `otpCode` gửi lên để Backend check
        // ... (Giữ nguyên logic fetch của file cũ, chỉ cần truyền toàn bộ formData)
    };

    return (
        <div style={styles.container}>
            <form onSubmit={handleRegister} style={styles.form}>
                <h2 style={{color: '#0056aa', marginBottom: '24px'}}>ĐĂNG KÝ HỆ THỐNG</h2>
                <input type="text" name="fullName" placeholder="Họ và Tên" required onChange={handleChange} style={styles.input} />

                {/* Ô Email đi kèm nút Gửi mã */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                    <input type="email" name="email" placeholder="Email đăng ký" required onChange={handleChange} style={{...styles.input, marginBottom: 0, flex: 1}} />
                    <button type="button" onClick={handleSendOtp} style={styles.otpButton}>Gửi mã</button>
                </div>

                {/* Hiện ô nhập OTP nếu đã nhấn nút gửi mã thành công */}
                {isOtpSent && (
                    <input type="text" name="otpCode" placeholder="Nhập 6 số mã OTP từ mail" required onChange={handleChange} style={{...styles.input, borderColor: '#f27024'}} />
                )}

                <input type="password" name="password" placeholder="Mật khẩu" required onChange={handleChange} style={styles.input} />
                <input type="text" name="studentId" placeholder="Mã số sinh viên" onChange={handleChange} style={styles.input} />

                <button type="submit" style={{...styles.button, background: '#0056aa'}}>Xác nhận & Tạo tài khoản</button>
                {message && <p style={styles.message}>{message}</p>}
            </form>
        </div>
    );
}

const styles = {
    container: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f4f6f9' },
    form: { background: '#fff', padding: '40px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', width: '380px', textAlign: 'center' },
    input: { width: '100%', padding: '12px', marginBottom: '16px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' },
    otpButton: { padding: '0 15px', background: '#f27024', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' },
    button: { width: '100%', padding: '12px', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' },
    message: { marginTop: '15px', fontSize: '14px', fontWeight: 'bold' }
};