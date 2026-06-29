import React from 'react'
import AuthPage from './pages/public/AuthPage' // Đảm bảo bạn đã tạo file AuthPage.jsx trong thư mục src/components
import './App.css'

function App() {
  return (
      <>
        {/* Nạp giao diện Đăng Nhập / Đăng Ký vào đây */}
        <AuthPage />
      </>
  )
}

export default App