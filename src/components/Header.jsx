import React, { useState } from 'react';
import sealLogo from '../assets/logo.png';
import { useNavigate } from 'react-router-dom';

const Header = () => {
    // Quản lý trang đang active (Mặc định ban đầu là 'TRANG CHỦ')
    const [activeMenu, setActiveMenu] = useState('TRANG CHỦ');
    const navigate = useNavigate();

    // Quản lý trạng thái login để test
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);

    // Danh sách menu ở giữa hệ thống
    const menuItems = [
        { id: 'HOME', name: 'TRANG CHỦ' },
        { id: 'TEAM', name: 'ĐỘI CỦA TÔI', authRequired: true }, // Chỉ hiện khi đã login
        { id: 'EVENTS', name: 'SỰ KIỆN' },
        { id: 'LEADERBOARD', name: 'BẢNG XẾP HẠNG' },
        { id: 'ABOUT', name: 'VỀ CHÚNG TÔI' }
    ];

    const handleMenuClick = (item) => {
        setActiveMenu(item.name);
        // NOTE: Sau này bạn có thể điều hướng bằng router thật ở đây
    };

    const handleLogout = () => {
        alert("Đang thực hiện đăng xuất...");
        setIsLoggedIn(false);
        setShowProfileMenu(false);
        setActiveMenu('TRANG CHỦ');
    };



    return (
        <header style={styles.header}>

            {/* 1. GÓC TRÁI: LOGO THEO MÀU SẮC LOGO SEAL CỦA BẠN */}
            <div style={styles.logoContainer} onClick={() => { setActiveMenu('TRANG CHỦ'); alert("Quay về Trang Chủ"); }}>
                <img
                    src={sealLogo}
                    alt="SEAL Hackathon Logo"
                    style={styles.logoImage}
                />
                <span style={styles.logoSubText}>HACKATHON</span>
            </div>
            {/* 2. Ở GIỮA: MENU GIỐNG SAIGON REF TEAM (Có gạch chân khi Active) */}
            <nav style={styles.nav}>
                {menuItems.map((item) => {
                    // Nếu mục yêu cầu đăng nhập mới hiện mà chưa đăng nhập thì bỏ qua
                    if (item.authRequired && !isLoggedIn) return null;

                    const isActive = activeMenu === item.name;

                    return (
                        <span
                            key={item.id}
                            onClick={() => handleMenuClick(item)}
                            style={{
                                ...styles.navLink,
                                ...(isActive ? styles.navLinkActive : {})
                            }}
                        >
              {item.name}
            </span>
                    );
                })}
            </nav>

            {/* 3. GÓC PHẢI: KHỐI AUTH & BUTTON TEST */}
            <div style={styles.rightSection}>
                {!isLoggedIn ? (
                    <div style={styles.authButtons}>
                        <button onClick={() => navigate('/login')} style={styles.loginBtn}>Đăng Nhập</button>
                        <button onClick={() => navigate('/register')} style={styles.registerBtn}>Đăng Ký</button>
                    </div>
                ) : (
                    <div style={styles.userArea}>
                        <div style={styles.profileTrigger} onClick={() => setShowProfileMenu(!showProfileMenu)}>
                            <div style={styles.avatar}>T</div>
                            <span style={styles.userName}>Lê Chí Tâm ▼</span>
                        </div>

                        {/* Dropdown Menu */}
                        {showProfileMenu && (
                            <div style={styles.dropdownMenu}>
                                <div style={styles.dropdownItem} onClick={() => { alert("Xem hồ sơ"); setShowProfileMenu(false); }}>
                                    👤 Hồ Sơ Cá Nhân
                                </div>
                                <hr style={{ border: '0', borderTop: '1px solid #e2e8f0', margin: '5px 0' }} />
                                <div style={{ ...styles.dropdownItem, color: '#e53e3e' }} onClick={handleLogout}>
                                    🚪 Đăng Xuất
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Nút nhỏ góc màn hình giúp bạn click test đổi giao diện nhanh */}
                <button onClick={() => setIsLoggedIn(!isLoggedIn)} style={styles.testToggleBtn}>
                    [Test] Đổi Login
                </button>
            </div>

        </header>
    );
};

// Hệ thống màu sắc kế thừa tone màu xanh lam nước biển của ảnh "Gemini_Generated_Image_pzbuiupzbuiupzbu.png"
const PRIMARY_BLUE = '#3182ce'; // Màu xanh nước biển chủ đạo của khiên
const DARK_TEXT = '#2d3748';    // Màu chữ tối phong cách thể thao/công nghệ thanh lịch

const styles = {
    header: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '0 4%', backgroundColor: '#ffffff',
        height: '75px', position: 'sticky', top: 0, zIndex: 1000,
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)', borderBottom: '1px solid #edf2f7',
        fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
    },
    logo: { display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' },
    logoShield: { fontSize: '22px' },
    logoText: { fontSize: '24px', fontWeight: '800', color: DARK_TEXT, letterSpacing: '1.5px' },
    logoSub: { fontSize: '13px', fontWeight: '400', color: PRIMARY_BLUE, letterSpacing: '2px', marginLeft: '5px', alignSelf: 'flex-end', marginBottom: '3px' },
    nav: { display: 'flex', gap: '5px', alignItems: 'center', height: '100%' },

    // Style chữ phong cách giống ảnh mẫu của bạn
    navLink: {
        color: '#718096', cursor: 'pointer', fontSize: '14px', fontWeight: '600',
        padding: '0 16px', height: '100%', display: 'flex', alignItems: 'center',
        borderBottom: '3px solid transparent', transition: 'all 0.15s ease-in-out',
        letterSpacing: '0.5px'
    },
    // Style khi mục đó được click chọn (Hiện viền gạch chân xanh nước biển)
    navLinkActive: {
        color: PRIMARY_BLUE,
        borderBottom: `3px solid ${PRIMARY_BLUE}`,
        fontWeight: '700'
    },

    rightSection: { display: 'flex', alignItems: 'center', gap: '15px' },
    authButtons: { display: 'flex', gap: '12px' },
    loginBtn: { backgroundColor: '#ffffff', color: PRIMARY_BLUE, border: `1px solid ${PRIMARY_BLUE}`, padding: '8px 18px', borderRadius: '4px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' },
    registerBtn: { backgroundColor: PRIMARY_BLUE, color: '#ffffff', border: 'none', padding: '8px 18px', borderRadius: '4px', cursor: 'pointer', fontWeight: '600', fontSize: '13px', boxShadow: '0 2px 6px rgba(49, 130, 206, 0.2)' },
    userArea: { position: 'relative' },
    profileTrigger: { display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' },
    avatar: { width: '34px', height: '34px', borderRadius: '50%', backgroundColor: PRIMARY_BLUE, color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' },
    userName: { fontSize: '14px', fontWeight: '600', color: DARK_TEXT },
    dropdownMenu: { position: 'absolute', top: '45px', right: 0, backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', width: '160px', padding: '5px 0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' },
    dropdownItem: { padding: '10px 15px', fontSize: '14px', cursor: 'pointer', color: '#4a5568' },
    testToggleBtn: { marginLeft: '10px', backgroundColor: '#f7fafc', color: '#718096', border: '1px solid #cbd5e0', padding: '4px 8px', fontSize: '11px', borderRadius: '4px', cursor: 'pointer' },
    logoContainer: {
        display: 'flex',
        alignItems: 'center',
        cursor: 'pointer',
        height: '100%',
        padding: '5px 0' // Tạo khoảng cách đệm trên dưới để logo không chạm viền header
    },
    logoImage: {
        height: '100px',       // NOTE: Khống chế chiều cao tối đa chỉ 40px (thanh header cao 75px là vừa đẹp)
        width: 'auto',        // Tự động bo theo tỷ lệ dọc để không bị méo hình
        maxWidth: '150px',    // Bọc thêm chiều rộng tối đa đề phòng trình duyệt không nhận width: auto
        objectFit: 'contain',
        display: 'inline-block',
        verticalAlign: 'middle'},
};

export default Header;