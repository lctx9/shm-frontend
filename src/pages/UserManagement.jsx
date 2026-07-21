import { useEffect, useMemo, useState } from 'react';
import axiosClient from '../api/axiosClient';
import Toast from '../components/Toast';

const roles = ['USER', 'STAFF', 'COORDINATOR', 'ADMIN'];
const statusStyle = { APPROVED: 'bg-emerald-50 text-emerald-700', PENDING: 'bg-amber-50 text-amber-700', REJECTED: 'bg-red-50 text-red-700' };

export default function UserManagement() {
    const currentEmail = localStorage.getItem('email');
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [query, setQuery] = useState('');
    const [filterRole, setFilterRole] = useState('ALL');
    const [message, setMessage] = useState(null);
    const [form, setForm] = useState({ fullName: '', email: '', password: '', role: 'COORDINATOR' });

    const loadUsers = async () => {
        try {
            setLoading(true);
            const response = await axiosClient.get('/admin/users');
            setUsers(response.result || []);
        } catch (error) { setMessage({ type: 'error', text: error?.message || 'Không thể tải danh sách tài khoản.' }); }
        finally { setLoading(false); }
    };

    useEffect(() => { loadUsers(); }, []);

    const visibleUsers = useMemo(() => users.filter((user) => {
        if (user.email === currentEmail) return false;
        const keyword = query.trim().toLowerCase();
        return (filterRole === 'ALL' || user.role === filterRole)
            && (!keyword || `${user.fullName} ${user.email} ${user.studentId || ''}`.toLowerCase().includes(keyword));
    }), [users, query, filterRole, currentEmail]);

    const createAccount = async (event) => {
        event.preventDefault();
        try {
            setSaving(true); setMessage(null);
            await axiosClient.post('/users/staff', form);
            setForm({ fullName: '', email: '', password: '', role: 'COORDINATOR' });
            setMessage({ type: 'success', text: `Đã tạo tài khoản ${form.role}.` });
            await loadUsers();
        } catch (error) { setMessage({ type: 'error', text: error?.message || 'Không thể tạo tài khoản.' }); }
        finally { setSaving(false); }
    };

    const changeRole = async (user, role) => {
        if (role === user.role) return;
        try {
            await axiosClient.put(`/admin/users/${user.id}/role`, { role });
            setUsers((current) => current.map((item) => item.id === user.id ? { ...item, role } : item));
            setMessage({ type: 'success', text: `Đã đổi quyền của ${user.fullName} thành ${role}.` });
        } catch (error) { setMessage({ type: 'error', text: error?.message || 'Không thể đổi quyền.' }); }
    };

    const toggleStatus = async (user) => {
        const status = user.status === 'APPROVED' ? 'REJECTED' : 'APPROVED';
        const actionText = status === 'REJECTED' ? 'khóa' : 'kích hoạt';
        if (!window.confirm(`Bạn có chắc chắn muốn ${actionText} tài khoản của ${user.fullName} không?`)) return;

        try {
            await axiosClient.put(`/admin/users/${user.id}/status`, { status, reason: status === 'REJECTED' ? 'Tài khoản bị khóa bởi Admin' : '' });
            setUsers((current) => current.map((item) => item.id === user.id ? { ...item, status } : item));
            setMessage({ type: 'success', text: `Đã cập nhật trạng thái của ${user.fullName}.` });
        } catch (error) { setMessage({ type: 'error', text: error?.message || 'Không thể cập nhật trạng thái.' }); }
    };

    return <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-lg border border-blue-100 bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0f63c9]">Role-based access control</p>
            <h2 className="mt-2 text-2xl font-black text-slate-900">Tài khoản & phân quyền</h2>
            <p className="mt-2 text-sm text-slate-600">Admin quản lý vòng đời tài khoản và quyền truy cập. Coordinator chỉ quản lý nhân sự cuộc thi.</p>
        </section>
        <Toast message={message} onClose={() => setMessage(null)} />
        <section className="rounded-lg border border-blue-100 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-black text-slate-900">Tạo tài khoản nội bộ</h3>
            <form onSubmit={createAccount} className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                <input required className="input-custom" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="Họ và tên" />
                <input required type="email" className="input-custom" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" />
                <input required minLength="6" type="password" className="input-custom" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Mật khẩu ban đầu" />
                <select className="input-custom" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}><option value="COORDINATOR">Coordinator</option><option value="STAFF">Staff</option></select>
                <button disabled={saving} className="btn-primary">{saving ? 'Đang tạo...' : 'Tạo tài khoản'}</button>
            </form>
        </section>
        <section className="overflow-hidden rounded-lg border border-blue-100 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-blue-100 bg-blue-50 p-4 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-1 gap-3"><input className="input-custom max-w-md" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm tên, email, MSSV..." /><select className="input-custom max-w-44" value={filterRole} onChange={(e) => setFilterRole(e.target.value)}><option value="ALL">Tất cả role</option>{roles.map((role) => <option key={role}>{role}</option>)}</select></div>
                <span className="text-sm font-bold text-slate-600">{visibleUsers.length} tài khoản</span>
            </div>
            <div className="overflow-x-auto"><table className="w-full text-left">
                <thead className="border-b border-blue-100 text-xs font-black uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-4">Người dùng</th><th className="px-5 py-4">Role</th><th className="px-5 py-4">Trạng thái</th><th className="px-5 py-4 text-right">Kiểm soát</th></tr></thead>
                <tbody className="divide-y divide-blue-50">{loading ? <tr><td colSpan="4" className="p-8 text-center text-slate-500">Đang tải...</td></tr> : visibleUsers.map((user) => <tr key={user.id} className="hover:bg-blue-50/40">
                    <td className="px-5 py-4"><p className="font-bold text-slate-900">{user.fullName}</p><p className="text-sm text-slate-500">{user.email}</p></td>
                    <td className="px-5 py-4"><select disabled={user.email === currentEmail} className="input-custom min-w-40 disabled:cursor-not-allowed disabled:opacity-60" value={user.role} onChange={(e) => changeRole(user, e.target.value)}>{roles.map((role) => <option key={role}>{role}</option>)}</select></td>
                    <td className="px-5 py-4"><span className={`rounded-full px-3 py-1 text-xs font-black ${statusStyle[user.status] || 'bg-slate-100 text-slate-700'}`}>{user.status}</span></td>
                    <td className="px-5 py-4 text-right"><button type="button" disabled={user.email === currentEmail} onClick={() => toggleStatus(user)} className="btn-secondary disabled:cursor-not-allowed disabled:opacity-50">{user.email === currentEmail ? 'Tài khoản hiện tại' : user.status === 'APPROVED' ? 'Khóa' : 'Kích hoạt'}</button></td>
                </tr>)}</tbody>
            </table></div>
        </section>
    </div>;
}
