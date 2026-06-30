import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';

// Giao diện Trang Đăng Ký tạm thời (Placeholder)
const RegisterPlaceholder = () => (
    <div style={{ padding: '100px 20px', textAlign: 'center', color: '#2d3748', fontFamily: 'sans-serif' }}>
        <h2>[Giao diện Trang Đăng Ký]</h2>
        <p style={{ color: '#718096', marginTop: '10px' }}>Dán code Form Đăng ký của bạn vào đây sau.</p>
    </div>
);

function App() {
    return (
        <Router>
            {/* Khung chứa ép cứng toàn màn hình sang nền trắng mịn, khử sạch màu tối */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                minHeight: '100vh',
                backgroundColor: '#ffffff',
                color: '#2d3748',
                margin: 0,
                padding: 0
            }}>

                {/* Thanh Header luôn nằm cố định trên cùng */}
                <Header />

                {/* Nội dung thay đổi động theo đường dẫn URL trên thanh địa chỉ */}
                <main style={{ flex: 1, backgroundColor: '#ffffff' }}>
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                    </Routes>
                </main>

            </div>
        </Router>
    );
}

export default App;