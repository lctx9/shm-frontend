import React, { useState } from 'react';
import SidebarLayout from '../../components/SidebarLayout';

export default function StaffDashboard() {
    const [currentRole, setCurrentRole] = useState('JUDGE'); // Trạng thái đổi vai trò: JUDGE hoặc MENTOR

    const staffMenu = [
        { name: 'Bảng Làm Việc Staff', path: '/staff/dashboard', icon: '💼', isActive: true },
        { name: 'Tài nguyên & Tài liệu', path: '#', icon: '📁', isActive: false },
    ];

    // Giả lập danh sách bài nộp cần chấm điểm cho Giám khảo
    const submissionsToJudge = [
        { id: 1, teamName: 'Agile Knights', track: 'Track A - Web App', round: 'Vòng Loại', status: 'PENDING' },
        { id: 2, teamName: 'Dev Dynamic', track: 'Track A - Web App', round: 'Vòng Loại', status: 'GRADED', score: '9.0' },
    ];

    // Giả lập danh sách đội cần hỗ trợ cho Mentor
    const teamsToMentor = [
        { id: 101, teamName: 'Code Masters', track: 'Track B - Mobile App', members: 4, channelStatus: 'ACTIVE' },
    ];

    return (
        <SidebarLayout role={`Staff / ${currentRole}`} menuItems={staffMenu}>
            <div className="space-y-6">
                {/* THANH CHUYỂN ĐỔI NGỮ CẢNH (Context Switcher) */}
                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-slate-800">Không gian Chuyên gia Đa nhiệm (Staff) 🧠</h1>
                        <p className="text-sm text-slate-500 mt-0.5">Hệ thống ghi nhận bạn có nhiều nhiệm vụ song song. Vui lòng chọn góc nhìn làm việc:</p>
                    </div>

                    <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 w-fit h-fit self-start sm:self-center">
                        <button
                            onClick={() => setCurrentRole('JUDGE')}
                            className={`px-4 py-2 text-sm font-semibold rounded-md transition ${currentRole === 'JUDGE' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                        >
                            👨‍⚖️ Giám Khảo (Round 1)
                        </button>
                        <button
                            onClick={() => setCurrentRole('MENTOR')}
                            className={`px-4 py-2 text-sm font-semibold rounded-md transition ${currentRole === 'MENTOR' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                        >
                            🧠 Mentor (Track B)
                        </button>
                    </div>
                </div>

                {/* HIỂN THỊ LOGIC TƯƠNG ỨNG THEO VAI TRÒ CHỌN */}
                {currentRole === 'JUDGE' ? (
                    /* GIAO DIỆN HỘI ĐỒNG GIÁM KHẢO */
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 overflow-hidden">
                        <div className="p-5 border-b border-slate-100">
                            <h3 className="font-bold text-slate-700">Danh sách bài dự thi cần chấm điểm</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-sm">
                                <thead>
                                <tr className="bg-slate-50 text-slate-600 font-semibold border-b">
                                    <th className="p-4">Đội thi</th>
                                    <th className="p-4">Phân bảng / Vòng</th>
                                    <th className="p-4">Trạng thái</th>
                                    <th className="p-4 text-center">Hành động</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y text-slate-600">
                                {submissionsToJudge.map(sub => (
                                    <tr key={sub.id} className="hover:bg-slate-50">
                                        <td className="p-4 font-semibold text-slate-800">{sub.teamName}</td>
                                        <td className="p-4">
                                            <div>{sub.track}</div>
                                            <div className="text-xs text-slate-400">{sub.round}</div>
                                        </td>
                                        <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${sub.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                          {sub.status === 'PENDING' ? 'Chưa chấm điểm' : `Đã chấm: ${sub.score}`}
                        </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <button
                                                onClick={() => alert(`Mở Form chấm điểm đội ${sub.teamName} theo tiêu chí mẫu (40% Tech, 30% Agile, 30% Presentation)`)}
                                                className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded text-xs font-medium transition shadow-sm"
                                            >
                                                {sub.status === 'PENDING' ? 'Nhập điểm' : 'Sửa điểm'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    /* GIAO DIỆN ĐỘI NGŨ CỐ VẤN (MENTOR) */
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200/80 space-y-4">
                        <div>
                            <h3 className="font-bold text-slate-700 text-lg">Đội thi bạn đang phụ trách hướng dẫn</h3>
                            <p className="text-sm text-slate-400">Theo dõi, review kiến trúc hệ thống và giải đáp thắc mắc quy trình Agile.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {teamsToMentor.map(team => (
                                <div key={team.id} className="p-5 border border-slate-200 rounded-xl bg-slate-50 flex flex-col justify-between space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="font-bold text-slate-800 text-base">{team.teamName}</h4>
                                            <p className="text-xs text-slate-500 mt-0.5">{team.track}</p>
                                        </div>
                                        <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-medium">Kênh hỗ trợ mở</span>
                                    </div>
                                    <div className="text-xs text-slate-500">Quy mô: {team.members} thành viên (Sinh viên FPT)</div>
                                    <button
                                        onClick={() => alert(`Đang kết nối vào Không gian trao đổi với Đội: ${team.teamName}`)}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 rounded-lg transition"
                                    >
                                        Vào phòng Tư vấn Đội
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </SidebarLayout>
    );
}