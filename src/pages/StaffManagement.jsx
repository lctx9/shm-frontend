import { useEffect, useMemo, useState } from 'react';
import axiosClient from '../api/axiosClient';

const staffRoles = new Set(['STAFF', 'MENTOR', 'JUDGE', 'COORDINATOR', 'ADMIN']);

export default function StaffManagement() {
    const [users, setUsers] = useState([]);
    const [roleFilter, setRoleFilter] = useState('ALL');
    const [staffForm, setStaffForm] = useState({ fullName: '', email: '', password: '1', role: 'STAFF' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

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
            setStaffForm({ fullName: '', email: '', password: '1', role: 'STAFF' });
            await fetchUsers();
        } catch (err) {
            setError(err.message || 'Không thể tạo tài khoản staff.');
        } finally {
            setSaving(false);
        }
    };

    const handleStatus = async (userId, status) => {
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
            {error && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}

            <section className="rounded-lg border border-blue-100 bg-white p-8 shadow-sm">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0f63c9]">Staff account</p>
                <h2 className="mt-2 text-2xl font-black uppercase tracking-wide text-slate-900">Tạo tài khoản Staff</h2>
                <p className="mt-2 text-sm text-slate-600">Một Staff có thể được phân công làm Mentor ở bảng này và Judge ở vòng đấu khác.</p>

                <form onSubmit={handleCreateStaff} className="mt-6 grid gap-4 md:grid-cols-[1fr_1fr_160px_160px_auto]">
                    <input required className="input-custom" value={staffForm.fullName} onChange={(e) => setStaffForm({ ...staffForm, fullName: e.target.value })} placeholder="Họ tên" />
                    <input required type="email" className="input-custom" value={staffForm.email} onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })} placeholder="email@fpt.edu.vn" />
                    <input required className="input-custom" value={staffForm.password} onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })} placeholder="Mật khẩu" />
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
