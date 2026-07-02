import React from 'react';
import { useNavigate } from 'react-router-dom';
import sealLogo from '../assets/logo.png';

const Footer = () => {
    const navigate = useNavigate();
    const currentYear = new Date().getFullYear();

    return (
        <footer style={styles.footerContainer}>
            <div style={styles.mainContent}>

                {/* Khối 1: Giới thiệu ngắn & Logo */}
                <div style={styles.brandSection}>
                    <div style={styles.logoWrapper} onClick={() => navigate('/')}>
                        <img src={sealLogo} alt="SEAL Logo" style={styles.logoImage} />
                        <span style={styles.logoSubText}>HACKATHON</span>
                    </div>
                    <p style={styles.brandDescription}>
                        Sân chơi công nghệ đỉnh cao dành cho sinh viên đam mê lập trình, sáng tạo và giải quyết các bài toán thực tế.
                    </p>
                </div>

                {/* Khối 2: Điều hướng nhanh */}
                <div style={styles.linksSection}>
                    <h4 style={styles.sectionTitle}>ĐIỀU HƯỚNG</h4>
                    <ul style={styles.linksList}>
                        <li style={styles.linkItem} onClick={() => navigate('/')}>Trang Chủ</li>
                        <li style={styles.linkItem} onClick={() => navigate('/register')}>Đăng Ký Đội Thi</li>
                        <li style={styles.linkItem}>Sự Kiện</li>
                        <li style={styles.linkItem}>Bảng Xếp Hạng</li>
                    </ul>
                </div>

                {/* Khối 3: Thông tin liên hệ BTC */}
                <div style={styles.contactSection}>
                    <h4 style={styles.sectionTitle}>LIÊN HỆ BAN TỔ CHỨC</h4>
                    <p style={styles.contactText}>📍 <strong>Địa điểm:</strong> Đại học FPT TP.HCM</p>
                    <p style={styles.contactText}>📧 <strong>Email:</strong> sealhackathon@fpt.edu.vn</p>
                    <p style={styles.contactText}>📞 <strong>Hotline:</strong> 0123 456 789</p>
                </div>

            </div>

            {/* Thanh bản quyền dưới cùng */}
            <div style={styles.bottomBar}>
                <p style={styles.copyright}>
                    &copy; {currentYear} SEAL Hackathon Ecosystem. All rights reserved. Developed by Lê Chí Tâm.
                </p>
            </div>
        </footer>
    );
};

const PRIMARY_BLUE = '#3182ce';
const DARK_TEXT = '#2d3748';

const styles = {
    footerContainer: {
        backgroundColor: '#ffffff',
        borderTop: '1px solid #edf2f7',
        padding: '40px 4% 0 4%',
        fontFamily: "'Segoe UI', Roboto, sans-serif",
        marginTop: 'auto' // Đẩy footer luôn nằm dưới cùng màn hình nếu nội dung trang ít
    },
    mainContent: {
        display: 'grid',
        gridTemplateColumns: '2fr 1fr 1.5fr',
        gap: '40px',
        paddingBottom: '30px',
        maxWidth: '1200px',
        margin: '0 auto',
        textAlign: 'left'
    },
    brandSection: {
        display: 'flex',
        flexDirection: 'column',
        gap: '15px'
    },
    logoWrapper: {
        display: 'flex',
        alignItems: 'center',
        cursor: 'pointer'
    },
    logoImage: {
        height: '45px',
        width: 'auto',
        objectFit: 'contain'
    },
    logoSubText: {
        fontSize: '13px',
        fontWeight: '700',
        color: PRIMARY_BLUE,
        letterSpacing: '2px',
        marginLeft: '8px',
        alignSelf: 'center'
    },
    brandDescription: {
        fontSize: '14px',
        color: '#718096',
        lineHeight: '1.6',
        maxWidth: '320px'
    },
    sectionTitle: {
        fontSize: '15px',
        fontWeight: '700',
        color: DARK_TEXT,
        marginBottom: '15px',
        letterSpacing: '0.5px',
        position: 'relative'
    },
    linksList: {
        listStyle: 'none',
        padding: 0,
        margin: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
    },
    linkItem: {
        fontSize: '14px',
        color: '#718096',
        cursor: 'pointer',
        fontWeight: '500',
        transition: 'color 0.15s ease',
        // Hiệu ứng hover đổi màu xanh lam thao tác thể thao
        ':hover': {
            color: PRIMARY_BLUE
        }
    },
    contactSection: {
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
    },
    contactText: {
        fontSize: '14px',
        color: '#718096',
        lineHeight: '1.5'
    },
    bottomBar: {
        borderTop: '1px solid #edf2f7',
        padding: '20px 0',
        textAlign: 'center'
    },
    copyright: {
        fontSize: '13px',
        color: '#a0aec0',
        fontWeight: '500'
    }
};

// CSS di động cơ bản cho Grid layout
const mediaQuery = window.matchMedia('(max-width: 768px)');
if (mediaQuery.matches) {
    styles.mainContent.gridTemplateColumns = '1fr';
    styles.mainContent.gap = '25px';
}

export default Footer;