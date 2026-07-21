import { useEffect, useMemo, useState } from 'react';
import axiosClient from '../api/axiosClient';
import Toast from '../components/Toast';

const staffRoles = new Set(['STAFF', 'MENTOR', 'JUDGE', 'COORDINATOR', 'ADMIN']);

export default function StaffManagement() {
    const [users, setUsers] = useState([]);
    const [roleFilter, setRoleFilter] = useState('ALL');
    const [staffForm, setStaffForm] = useState({ fullName: '', email: '', password: '123456', role: 'STAFF' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [message, setMessage] = useState(null);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await axiosClient.get('/users');
            setUsers(response.result || []);
            setError('');
        } catch (err) {
            setError(err.message || 'Không thể tải danh sách staff.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const myRole = localStorage.getItem('role');
    const myId = localStorage.getItem('userId');

    const staffUsers = useMemo(() => {
        return users
            .filter((user) => staffRoles.has(user.role))
            .filter((user) => {
                if (String(user.id) === String(myId)) return false;
                if (myRole === 'COORDINATOR' && (user.role === 'COORDINATOR' || user.role === 'ADMIN')) return false;
                return roleFilter === 'ALL' || user.role === roleFilter;
            });
    }, [users, roleFilter, myRole, myId]);

    const handleCreateStaff = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            await axiosClient.post('/users/staff', staffForm);
            setStaffForm({ fullName: '', email: '', password: '123456', role: 'STAFF' });
            setMessage({ text: 'Tạo tài khoản Staff thành công!', type: 'success' });
            setError('');
            await fetchUsers();
        } catch (err) {
            setError(err.message || 'Không tạo được tài khoản staff.');
        } finally {
            setSaving(false);
        }
    };

    const handleStatus = async (userId, status) => {
        const actionText = status === 'REJECTED' ? 'khóa' : 'mở khóa';
        if (!window.confirm(`Bạn có chắc chắn muốn ${actionText} tài khoản này không?`)) return;

        try {
            setError('');
            await axiosClient.put(`/users/${userId}/status`, { status, reason: status === 'REJECTED' ? 'Tài khoản bị khóa bởi Coordinator' : '' });
            await fetchUsers();
        } catch (err) {
            setError(err.message || 'Không thể cập nhật trạng thái.');
        }
    };

    return (
        <div className="mx-auto max-w-7xl space-y-6">
            <Toast message={message || (error ? { text: error, type: 'error' } : null)} onClose={() => { setMessage(null); setError(''); }} />

            <section className="rounded-lg border border-blue-100 bg-white p-8 shadow-sm">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0f63c9]">Staff account</p>
                <h2 className="mt-2 text-2xl font-black uppercase tracking-wide text-slate-900">Tạo tài khoản Staff</h2>
                <p className="mt-2 text-sm text-slate-600">Một Staff có thể được phân công làm Mentor ở bảng này và Judge ở vòng đấu khác.</p>

                <form onSubmit={handleCreateStaff} className="mt-6 grid gap-4 md:grid-cols-[1fr_1fr_160px_160px_auto]">
                    <input required className="input-custom" value={staffForm.fullName} onChange={(e) => setStaffForm({ ...staffForm, fullName: e.target.value })} placeholder="Họ tên" />
                    <input required type="email" className="input-custom" value={staffForm.email} onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })} placeholder="email@fpt.edu.vn" />
                    <div className="relative">
                        <input required minLength="6" type={showPassword ? 'text' : 'password'} className="input-custom w-full pr-10" value={staffForm.password} onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })} placeholder="Mật khẩu ban đầu" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600">
                            {showPassword ? (
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            ) : (
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                            )}
                        </button>
                    </div>
                    <select className="input-custom" value={staffForm.role} onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}>
                        <option value="STAFF">Staff</option>
                        {myRole !== 'COORDINATOR' && <option value="COORDINATOR">Coordinator</option>}
                    </select>
                    <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Đang tạo...' : 'Tạo'}</button>
                </form>
            </section>

            <section className="rounded-lg border border-blue-100 bg-white shadow-sm">
                <div className="flex flex-col justify-between gap-4 border-b border-blue-100 bg-blue-50 px-6 py-4 sm:flex-row sm:items-end">
                    <div>
                        <h2 className="text-xl font-black uppercase tracking-wide text-slate-900">Danh sách Staff</h2>
                        <p className="mt-1 text-sm text-slate-600">Mentor/Judge là nhiệm vụ phân công, không phải role tài khoản.</p>
                    </div>
                    <select className="input-custom max-w-xs" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                        <option value="ALL">Tất cả vai trò</option>
                        <option value="STAFF">Staff</option>
                        {myRole !== 'COORDINATOR' && <option value="COORDINATOR">Coordinator</option>}
                        {myRole !== 'COORDINATOR' && <option value="ADMIN">Admin</option>}
                    </select>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="border-b border-blue-100 bg-white text-xs font-black uppercase tracking-wide text-slate-500">
                        <tr>
                            <th className="px-6 py-4">Staff</th>
                            <th className="px-6 py-4">Role</th>
                            <th className="px-6 py-4">Trạng thái</th>
                            <th className="px-6 py-4 text-right">Thao tác</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-blue-50">
                        {loading ? (
                            <tr><td colSpan="4" className="px-6 py-8 text-center text-slate-500">Đang tải...</td></tr>
                        ) : staffUsers.length === 0 ? (
                            <tr><td colSpan="4" className="px-6 py-8 text-center text-slate-500">Chưa có staff phù hợp.</td></tr>
                        ) : staffUsers.map((user) => (
                            <tr key={user.id} className="hover:bg-blue-50/40">
                                <td className="px-6 py-4">
                                    <p className="font-bold text-slate-900">{user.fullName}</p>
                                    <p className="text-sm text-slate-500">{user.email}</p>
                                </td>
                                <td className="px-6 py-4"><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">{user.role}</span></td>
                                <td className="px-6 py-4"><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">{user.status}</span></td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        {user.status !== 'APPROVED' && <button type="button" onClick={() => handleStatus(user.id, 'APPROVED')} className="btn-primary">Mở</button>}
                                        {user.status === 'APPROVED' && <button type="button" onClick={() => handleStatus(user.id, 'REJECTED')} className="btn-secondary">Khóa</button>}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}
