import { useEffect, useMemo, useState } from 'react';
import axiosClient from '../api/axiosClient';
import Toast from '../components/Toast';

const statusStyle = { APPROVED: 'bg-emerald-50 text-emerald-700', PENDING: 'bg-amber-50 text-amber-700', REJECTED: 'bg-red-50 text-red-700' };

export default function UserManagement() {
    const currentEmail = localStorage.getItem('email');
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState('');
    const [selectedUniversity, setSelectedUniversity] = useState('ALL');
    const [message, setMessage] = useState(null);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const response = await axiosClient.get('/admin/users');
            setUsers(response.result || []);
        } catch (error) { 
            setMessage({ type: 'error', text: error?.message || 'Failed to load user accounts.' }); 
        } finally { 
            setLoading(false); 
        }
    };

    useEffect(() => { loadUsers(); }, []);

    const uniqueUniversities = useMemo(() => {
        const set = new Set();
        users.forEach((u) => {
            if (u.role === 'USER' && u.universityName) {
                set.add(u.universityName);
            }
        });
        return Array.from(set).sort();
    }, [users]);

    const visibleUsers = useMemo(() => users.filter((user) => {
        if (user.email === currentEmail) return false;
        // Only show accounts with the USER role
        if (user.role !== 'USER') return false;

        // University filter
        if (selectedUniversity !== 'ALL' && user.universityName !== selectedUniversity) return false;
        
        const keyword = query.trim().toLowerCase();
        return !keyword || `${user.fullName} ${user.email} ${user.studentId || ''} ${user.universityName || ''}`.toLowerCase().includes(keyword);
    }), [users, query, selectedUniversity, currentEmail]);

    const toggleStatus = async (user) => {
        const status = user.status === 'APPROVED' ? 'REJECTED' : 'APPROVED';
        const actionText = status === 'REJECTED' ? 'lock' : 'activate';
        if (!window.confirm(`Are you sure you want to ${actionText} the account of ${user.fullName}?`)) return;

        try {
            await axiosClient.put(`/admin/users/${user.id}/status`, { status, reason: status === 'REJECTED' ? 'Account locked by Admin' : '' });
            setUsers((current) => current.map((item) => item.id === user.id ? { ...item, status } : item));
            setMessage({ type: 'success', text: `Successfully updated status for ${user.fullName}.` });
        } catch (error) { 
            setMessage({ type: 'error', text: error?.message || 'Failed to update status.' }); 
        }
    };

    return <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-lg border border-blue-100 bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0f63c9]">Participant Accounts</p>
            <h2 className="mt-2 text-2xl font-black text-slate-900">User Accounts Management</h2>
            <p className="mt-2 text-sm text-slate-600">Admins manage participant user accounts lifecycle, approvals, and status activations. Staff roles are managed under the Staff section.</p>
        </section>
        <Toast message={message} onClose={() => setMessage(null)} />
        <section className="overflow-hidden rounded-lg border border-blue-100 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-blue-100 bg-blue-50 p-4 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-1 gap-3">
                    <input className="input-custom max-w-md" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name, email, student ID..." />
                    <select className="input-custom max-w-56" value={selectedUniversity} onChange={(e) => setSelectedUniversity(e.target.value)}>
                        <option value="ALL">All Universities</option>
                        {uniqueUniversities.map((uni) => (
                            <option key={uni} value={uni}>{uni}</option>
                        ))}
                    </select>
                </div>
                <span className="text-sm font-bold text-slate-600">{visibleUsers.length} user accounts</span>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="border-b border-blue-100 text-xs font-black uppercase tracking-wide text-slate-500">
                        <tr>
                            <th className="px-5 py-4">User</th>
                            <th className="px-5 py-4">University</th>
                            <th className="px-5 py-4">Role</th>
                            <th className="px-5 py-4">Status</th>
                            <th className="px-5 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-blue-50">
                        {loading ? (
                            <tr>
                                <td colSpan="5" className="p-8 text-center text-slate-500">Loading...</td>
                            </tr>
                        ) : visibleUsers.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="p-8 text-center text-slate-500">No user accounts found.</td>
                            </tr>
                        ) : (
                            visibleUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-blue-50/40">
                                    <td className="px-5 py-4">
                                        <p className="font-bold text-slate-900">{user.fullName}</p>
                                        <p className="text-sm text-slate-500">{user.email}</p>
                                    </td>
                                    <td className="px-5 py-4 text-sm text-slate-700 font-semibold">
                                        {user.universityName || 'N/A'}
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className="inline-block bg-slate-100 text-slate-700 border border-slate-200 rounded px-2 py-0.5 text-xs font-black">
                                            USER
                                        </span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className={`rounded-full px-3 py-1 text-xs font-black ${statusStyle[user.status] || 'bg-slate-100 text-slate-700'}`}>
                                            {user.status}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 text-right">
                                        <button 
                                            type="button" 
                                            disabled={user.email === currentEmail} 
                                            onClick={() => toggleStatus(user)} 
                                            className="btn-secondary disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {user.email === currentEmail ? 'Current Account' : user.status === 'APPROVED' ? 'Lock' : 'Activate'}
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    </div>;
}
