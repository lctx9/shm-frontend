export const AUTH_CONFIG = {
    // Bộ đếm ngược nút OTP (sau này muốn đổi thành 90s hay 120s chỉ cần sửa số này)
    otpCountdownSeconds: 60,

    // Các cấu hình kiểm tra định dạng
    validation: {
        email: {
            regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            message: "Định dạng Email không hợp lệ!"
        },
        password: {
            // Dễ dàng đổi cấu hình tại đây
            minLength: 8,
            requireLetters: true,
            requireNumbers: true,
            message: "Mật khẩu phải chứa tối thiểu 8 ký tự, bao gồm cả chữ cái và chữ số!"
        }
    }
};