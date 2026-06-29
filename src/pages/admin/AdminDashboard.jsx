import React, { useState } from 'react';
import SidebarLayout from '../../components/SidebarLayout';

export default function AdminDashboard() {
    const adminMenu = [
        { name: 'Thống Kê Hệ Thống', path: '/admin/dashboard', icon: '📊', isActive: true },
        { name: 'Quản Lý Hệ Thống', path: '#', icon: '⚙️', isActive: false },
    ];

    // Giả lập danh sách các Coordinator thuộc quyền quản lý của Admin
    const [coordinators, setCoordinators] = useState([
        { id: 1, name: 'Nguyễn Thị B', email: 'bnt@fpt.edu.vn', department: 'SE Department', status: 'ACTIVE' },
        { id: 2, name: 'Trần Văn C', email: 'ctv@fpt.edu.vn', department: 'PDP Staff', status: 'ACTIVE' },
    ]);

    const handleToggleStatus = (id, currentStatus) => {
        const newStatus = currentStatus === 'ACTIVE' ? 'LOCKED' : 'ACTIVE';
        setCoordinators(coordinators.map(c => c.id === id ? { ...c, status: newStatus } : c));
        alert(`Đã cập nhật trạng thái Coordinator thành: ${newStatus}`);
    };

    return (
        <SidebarLayout role="Admin Platform" menuItems={adminMenu}>
            <div className="space-y-8">
                {/* Tiêu đề */}
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Báo cáo vĩ mô & Quản trị Nền tảng</h1>
                    <p className="text-slate-500 text-sm mt-1">Dành cho chủ sở hữu hệ thống (Ban Giám Hiệu / Quản lý cấp cao).</p>
                </div>

                {/* Thống kê dạng Thẻ (Cards) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200/80">
                        <div className="text-sm text-slate-400 font-medium">Mùa giải trên hệ thống</div>
                        <div className="text-3xl font-extrabold text-slate-800 mt-2">6 <span className="text-sm font-normal text-slate-400">mùa giải</span></div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200/80">
                        <div className="text-sm text-slate-400 font-medium">Nhân sự Ban Tổ Chức (Coordinator)</div>
                        <div className="text-3xl font-extrabold text-slate-800 mt-2">{coordinators.length} <span className="text-sm font-normal text-slate-400">tài khoản</span></div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200/80">
                        <div className="text-sm text-slate-400 font-medium">Tổng thí sinh đăng ký</div>
                        <div className="text-3xl font-extrabold text-slate-800 mt-2">245 <span className="text-sm font-normal text-slate-400">sinh viên</span></div>
                    </div>
                </div>

                {/* Biểu đồ giả lập phục vụ Nghiên cứu học thuật */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200/80 lg:col-span-2">
                        <h3 className="font-bold text-slate-700 mb-2">Độ tin cậy liên đánh giá viên (Inter-rater Reliability)</h3>
                        <p className="text-xs text-slate-400 mb-4">Chỉ số ICC (Intraclass Correlation) phân tích tính nhất quán giữa các giám khảo.</p>
                        <div className="h-48 bg-slate-50 rounded-lg border border-dashed flex flex-col items-center justify-center text-slate-400 text-sm p-4 text-center">
                            <span className="font-semibold text-green-600 text-lg mb-1">Krippendorff's Alpha: 0.84</span>
                            <span>[Hệ thống đánh giá: Độ nhất quán đạt chuẩn chất lượng cao]</span>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200/80">
                        <h3 className="font-bold text-slate-700 mb-4">Các trường đối tác</h3>
                        <div className="space-y-2 text-sm text-slate-600">
                            <div className="p-2 bg-slate-50 rounded border flex justify-between"><span>ĐH Bách Khoa TP.HCM</span> <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">External</span></div>
                            <div className="p-2 bg-slate-50 rounded border flex justify-between"><span>ĐH Khoa Học Tự Nhiên</span> <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">External</span></div>
                        </div>
                    </div>
                </div>

                {/* Bảng quản lý Coordinator */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 overflow-hidden">
                    <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                        <h3 className="font-bold text-slate-700">Danh sách nhân sự vận hành giải đấu (Coordinators)</h3>
                        <button className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3 py-2 rounded-lg transition">
                            + Cấp quyền Coordinator
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-sm">
                            <thead>
                            <tr className="bg-slate-50 text-slate-600 font-semibold border-b">
                                <th className="p-4">Họ và Tên</th>
                                <th className="p-4">Phòng ban / Khoa</th>
                                <th className="p-4">Trạng thái</th>
                                <th className="p-4 text-center">Hành động</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y text-slate-600">
                            {coordinators.map(c => (
                                <tr key={c.id} className="hover:bg-slate-50">
                                    <td className="p-4">
                                        <div className="font-semibold text-slate-800">{c.name}</div>
                                        <div className="text-xs text-slate-400">{c.email}</div>
                                    </td>
                                    <td className="p-4">{c.department}</td>
                                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${c.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {c.status}
                      </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <button
                                            onClick={() => handleToggleStatus(c.id, c.status)}
                                            className={`px-3 py-1.5 rounded text-xs font-semibold text-white transition ${c.status === 'ACTIVE' ? 'bg-red-500 hover:bg-red-600' : 'bg-green-600 hover:bg-green-700'}`}
                                        >
                                            {c.status === 'ACTIVE' ? 'Khóa quyền' : 'Mở khóa'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </SidebarLayout>
    );
}