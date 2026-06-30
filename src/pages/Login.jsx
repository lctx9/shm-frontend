import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Login = () => {
    const navigate = useNavigate();

    // 1. Quản lý dữ liệu người dùng nhập vào Form
    const [formData, setFormData] = useState({
        username: '', // Khớp chính xác với thuộc tính username trong LoginRequest (Java)
        password: ''  // Khớp chính xác với thuộc tính password trong LoginRequest (Java)
    });

    // Quản lý hiển thị thông báo lỗi nếu đăng nhập thất bại
    const [errorMessage, setErrorMessage] = useState('');
    const [loading, setLoading] = useState(false);

    // Hàm cập nhật dữ liệu tự động khi người dùng gõ phím
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    // 2. Hàm xử lý gửi dữ liệu đăng nhập xuống Java Spring Boot
    const handleFormSubmit = (e) => {
        e.preventDefault(); // Ngăn chặn cơ chế reload lại trang mặc định của HTML Form
        setErrorMessage('');
        setLoading(true);

        // NOTE: Thay URL này bằng đường dẫn API Spring Boot thật chạy trên máy bạn
        axios.post('http://localhost:8080/api/public/auth/login', formData)
            .then((response) => {
                setLoading(false);
                alert("Đăng nhập vào hệ thống SEAL thành công!");

                // NOTE: Nhận AuthResponse từ Java trả về và lưu vào bộ nhớ trình duyệt
                // Giả sử Backend của bạn trả về Object có chứa { token: '...', role: '...' }
                if (response.data && response.data.token) {
                    localStorage.setItem('token', response.data.token);
                    localStorage.setItem('userRole', response.data.role);
                }

                // Đăng nhập thành công thì chuyển hướng ngay về Trang Chủ
                navigate('/');
            })
            .catch((error) => {
                setLoading(false);
                // Đọc thông báo lỗi từ khối e.getMessage() do catch-block của Java đẩy ra
                if (error.response && error.response.data) {
                    setErrorMessage(error.response.data);
                } else {
                    setErrorMessage("Kết nối tới máy chủ thất bại. Vui lòng kiểm tra lại Backend!");
                }
            });
    };

    return (
        <div style={styles.container}>
            <div style={styles.loginCard}>

                {/* Khối Tiêu Đề và Giới Thiệu ngắn */}
                <div style={styles.headerArea}>
                    <h2 style={styles.mainTitle}>ĐĂNG NHẬP</h2>
                    <p style={styles.subTitle}>Hệ thống quản lý cuộc thi SEAL Hackathon</p>
                </div>

                {/* Hiển thị thông báo lỗi màu đỏ nếu có */}
                {errorMessage && (
                    <div style={styles.errorBox}>
                        ⚠️ {errorMessage}
                    </div>
                )}

                {/* Form Nhập Liệu */}
                <form onSubmit={handleFormSubmit} style={styles.form}>

                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Tên đăng nhập / Email</label>
                        <input
                            type="text"
                            name="email"
                            placeholder="Nhập tài khoản sinh viên hoặc ban tổ chức"
                            value={formData.email}
                            onChange={handleInputChange}
                            style={styles.input}
                            required
                        />
                    </div>

                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Mật khẩu</label>
                        <input
                            type="password"
                            name="password"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={handleInputChange}
                            style={styles.input}
                            required
                        />
                    </div>

                    <div style={styles.helperRow}>
            <span style={styles.forgotPass} onClick={() => alert("Tính năng khôi phục mật khẩu qua Email đang được phát triển.")}>
              Quên mật khẩu?
            </span>
                    </div>

                    <button
                        type="submit"
                        style={{
                            ...styles.submitBtn,
                            backgroundColor: loading ? '#63b3ed' : '#3182ce',
                            cursor: loading ? 'not-allowed' : 'pointer'
                        }}
                        disabled={loading}
                    >
                        {loading ? 'ĐANG XỬ LÝ...' : 'XÁC NHẬN ĐĂNG NHẬP'}
                    </button>

                </form>

                {/* Chuyển nhanh sang trang Đăng ký */}
                <div style={styles.footerArea}>
                    <span style={{color: '#718096'}}>Chưa có tài khoản đội thi? </span>
                    <span style={styles.registerLink} onClick={() => navigate('/register')}>
            Đăng ký ngay
          </span>
                </div>

            </div>
        </div>
    );
};

// Khai báo hệ thống mã màu đồng bộ Light Mode của giải đấu
const PRIMARY_BLUE = '#3182ce';
const DARK_TEXT = '#2d3748';

const styles = {
    container: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '80vh', // Cân chỉnh khoảng cách để không bị dính sát vào Header/Footer
        backgroundColor: '#ffffff',
        padding: '20px',
        fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
    },
    loginCard: {
        width: '100%',
        maxWidth: '420px',
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        padding: '40px 30px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.05)'
    },
    headerArea: {
        textAlign: 'center',
        marginBottom: '30px'
    },
    mainTitle: {
        fontSize: '26px',
        fontWeight: '800',
        color: DARK_TEXT,
        letterSpacing: '1px',
        marginBottom: '8px'
    },
    subTitle: {
        fontSize: '14px',
        color: '#718096',
        fontWeight: '500'
    },
    errorBox: {
        backgroundColor: '#fff5f5',
        color: '#c53030',
        border: '1px solid #fed7d7',
        padding: '12px',
        borderRadius: '6px',
        fontSize: '13px',
        fontWeight: '500',
        marginBottom: '20px',
        textAlign: 'left'
    },
    form: {
        display: 'flex',
        flexDirection: 'column'
    },
    inputGroup: {
        display: 'flex',
        flexDirection: 'column',
        marginBottom: '20px',
        textAlign: 'left'
    },
    label: {
        fontSize: '13px',
        fontWeight: '700',
        color: '#4a5568',
        marginBottom: '8px',
        letterSpacing: '0.5px'
    },
    input: {
        padding: '12px 16px',
        fontSize: '14px',
        borderRadius: '6px',
        border: '1px solid #cbd5e0',
        backgroundColor: '#fafafa',
        color: DARK_TEXT,
        outline: 'none',
        transition: 'border-color 0.2s ease'
    },
    helperRow: {
        display: 'flex',
        justifyContent: 'flex-end',
        marginBottom: '25px'
    },
    forgotPass: {
        fontSize: '13px',
        color: PRIMARY_BLUE,
        fontWeight: '600',
        cursor: 'pointer'
    },
    submitBtn: {
        color: '#ffffff',
        border: 'none',
        padding: '14px',
        fontSize: '15px',
        fontWeight: '700',
        borderRadius: '6px',
        letterSpacing: '0.5px',
        boxShadow: '0 4px 12px rgba(49, 130, 206, 0.2)',
        transition: 'background-color 0.2s'
    },
    footerArea: {
        marginTop: '30px',
        textAlign: 'center',
        fontSize: '14px',
        fontWeight: '500'
    },
    registerLink: {
        color: PRIMARY_BLUE,
        fontWeight: '700',
        cursor: 'pointer',
        marginLeft: '3px'
    }
};

export default Login;