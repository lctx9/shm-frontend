import { useEffect, useMemo, useState } from 'react';
import axiosClient from '../api/axiosClient';
import Toast from '../components/Toast';

const studentRoles = new Set(['USER']);

function StatusBadge({ status }) {
    const tone = {
        PENDING: 'bg-amber-100 text-amber-700',
        APPROVED: 'bg-green-100 text-green-700',
        REJECTED: 'bg-red-100 text-red-700',
        BANNED: 'bg-slate-200 text-slate-700',
    }[status] || 'bg-slate-100 text-slate-700';

    const label = {
        PENDING: 'Chờ duyệt',
        APPROVED: 'Đã duyệt',
        REJECTED: 'Đã từ chối',
        BANNED: 'Đã khóa',
    }[status] || status;

    return <span className={`rounded-full px-3 py-1 text-xs font-black ${tone}`}>{label}</span>;
}

function StudentCardPreview({ user }) {
    const [imgError, setImgError] = useState(false);
    const [imgLoaded, setImgLoaded] = useState(false);

    if (!user?.studentCardUrl) {
        return (
            <div className="flex min-h-[360px] items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm font-semibold text-slate-500">
                Thí sinh chưa upload thẻ sinh viên.
            </div>
        );
    }

    // Lấy tên file từ URL (ví dụ: "abc123.jpg")
    const rawFileName = user.studentCardUrl.split('/').pop()?.split('?')[0] || 'student-card';
    const displayName = rawFileName.length > 40 ? rawFileName.substring(0, 37) + '...' : rawFileName;

    return (
        <div className="overflow-hidden rounded-lg border border-blue-100 bg-slate-50">
            {/* Thanh tên file */}
            <div className="flex items-center gap-2 border-b border-blue-100 bg-white px-4 py-2">
                <svg className="h-4 w-4 shrink-0 text-[#0f63c9]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-xs font-bold text-slate-700 break-all">{displayName}</span>
            </div>

            {/* Ảnh thẻ sinh viên */}
            {imgError ? (
                <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 p-6 text-center">
                    <svg className="h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p className="text-sm font-bold text-red-600">Không thể tải ảnh</p>
                    <p className="text-xs text-slate-500">File có thể đã bị xóa hoặc đường dẫn không hợp lệ.</p>
                </div>
            ) : (
                <div className="relative min-h-[200px]">
                    {!imgLoaded && (
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-[#0f63c9]" />
                        </div>
                    )}
                    <img
                        src={user.studentCardUrl}
                        alt={`Thẻ sinh viên của ${user.fullName}`}
                        className="max-h-[520px] w-full object-contain"
                        onLoad={() => setImgLoaded(true)}
                        onError={() => setImgError(true)}
                    />
                </div>
            )}

            {/* Nút mở ảnh ra tab mới */}
            {!imgError && (
                <a
                    href={user.studentCardUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 border-t border-blue-100 bg-white px-4 py-3 text-sm font-black text-[#0f63c9] hover:bg-blue-50 transition-colors"
                >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Mở ảnh gốc trong tab mới ({displayName})
                </a>
            )}
        </div>
    );
}


export default function StudentApproval() {
    const [users, setUsers] = useState([]);
    const [statusFilter, setStatusFilter] = useState('PENDING');
    const [selectedUser, setSelectedUser] = useState(null);
    const [rejectingUser, setRejectingUser] = useState(null);
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await axiosClient.get('/users');
            setUsers(response.result || []);
            setError('');
        } catch (err) {
            setError(err.message || 'Không thể tải danh sách thí sinh.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const students = useMemo(() => {
        return users
            .filter((user) => studentRoles.has(user.role))
            .filter((user) => statusFilter === 'ALL' || user.status === statusFilter);
    }, [users, statusFilter]);

    const refreshSelectedUser = (userId, nextUsers) => {
        const nextSelected = nextUsers.find((user) => String(user.id) === String(userId));
        setSelectedUser(nextSelected || null);
    };

    const handleStatus = async (userId, status, rejectReason = '') => {
        try {
            await axiosClient.put(`/users/${userId}/status`, { status, reason: rejectReason });
            const response = await axiosClient.get('/users');
            const nextUsers = response.result || [];
            setUsers(nextUsers);
            refreshSelectedUser(userId, nextUsers);
            setRejectingUser(null);
            setReason('');
            setError('');
            // Tính trực tiếp từ dữ liệu fresh đã có, truyền vào event để DashboardLayout cập nhật ngay
            const newPendingCount = nextUsers.filter(
                (u) => u.role === 'USER' && u.status === 'PENDING'
            ).length;
            window.dispatchEvent(
                new CustomEvent('studentStatusChanged', { detail: { pendingCount: newPendingCount } })
            );
        } catch (err) {
            setError(err.message || 'Không thể cập nhật trạng thái tài khoản.');
        }
    };

    const openReject = (user) => {
        setRejectingUser(user);
        setReason('');
    };

    return (
        <div className="mx-auto max-w-7xl space-y-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0f63c9]">Student verification</p>
                    <h2 className="text-2xl font-black uppercase tracking-wide text-slate-900">Phê duyệt thí sinh</h2>
                    <p className="mt-2 text-sm text-slate-600">Bấm chi tiết để đối chiếu thông tin đăng ký và thẻ sinh viên đã upload.</p>
                </div>
                <button type="button" onClick={fetchUsers} title="Làm mới danh sách" className="btn-secondary h-9 w-9 p-0 inline-flex items-center justify-center text-sm font-bold">↻</button>
            </div>

            <Toast error={error} onClose={() => setError('')} />

            <section className="rounded-lg border border-blue-100 bg-white p-4">
                <label className="mb-1 block text-sm font-bold text-slate-700">Trạng thái</label>
                <select className="input-custom max-w-xs" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="PENDING">Chờ duyệt</option>
                    <option value="APPROVED">Đã duyệt</option>
                    <option value="REJECTED">Đã từ chối</option>
                    <option value="BANNED">Đã khóa</option>
                    <option value="ALL">Tất cả</option>
                </select>
            </section>

            <section className="overflow-hidden rounded-lg border border-blue-100 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="border-b border-blue-100 bg-blue-50 text-xs font-black uppercase tracking-wide text-slate-500">
                            <tr>
                                <th className="px-6 py-4">Thí sinh</th>
                                <th className="px-6 py-4">MSSV</th>
                                <th className="px-6 py-4">Trường</th>
                                <th className="px-6 py-4">Thẻ sinh viên</th>
                                <th className="px-6 py-4">Trạng thái</th>
                                <th className="px-6 py-4 text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-blue-50">
                            {loading ? (
                                <tr><td colSpan="6" className="px-6 py-8 text-center text-slate-500">Đang tải...</td></tr>
                            ) : students.length === 0 ? (
                                <tr><td colSpan="6" className="px-6 py-8 text-center text-slate-500">Không có thí sinh phù hợp.</td></tr>
                            ) : students.map((user) => (
                                <tr key={user.id} className="hover:bg-blue-50/40">
                                    <td className="px-6 py-4">
                                        <p className="font-bold text-slate-900">{user.fullName}</p>
                                        <p className="text-sm text-slate-500">{user.email}</p>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-bold text-slate-700">{user.studentId || 'Chưa có'}</td>
                                    <td className="px-6 py-4 text-sm text-slate-600">{user.universityName || 'Chưa cập nhật'}</td>
                                    <td className="px-6 py-4">
                                        <span className={`rounded-full px-3 py-1 text-xs font-black ${user.studentCardUrl ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                            {user.studentCardUrl ? 'Đã upload' : 'Chưa upload'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <StatusBadge status={user.status} />
                                        {user.rejectionReason && <p className="mt-2 max-w-xs text-xs text-red-600">{user.rejectionReason}</p>}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button type="button" onClick={() => setSelectedUser(user)} className="btn-primary">Chi tiết</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {selectedUser && (
                <div className="fixed inset-0 z-40 overflow-y-auto bg-slate-950/55 p-4">
                    <div className="mx-auto my-8 max-w-6xl rounded-lg bg-white shadow-xl">
                        <div className="flex flex-col gap-3 border-b border-blue-100 p-6 md:flex-row md:items-center md:justify-between">
                            <div>
                                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0f63c9]">Chi tiết phê duyệt</p>
                                <h3 className="mt-1 text-xl font-black text-slate-900">{selectedUser.fullName}</h3>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <button type="button" onClick={() => setSelectedUser(null)} className="btn-secondary">Đóng</button>
                                {selectedUser.status !== 'APPROVED' && (
                                    <button type="button" onClick={() => handleStatus(selectedUser.id, 'APPROVED')} className="btn-primary">Duyệt</button>
                                )}
                                {selectedUser.status !== 'REJECTED' && (
                                    <button type="button" onClick={() => openReject(selectedUser)} className="btn-secondary">Từ chối</button>
                                )}
                                {selectedUser.status !== 'BANNED' && (
                                    <button type="button" onClick={() => handleStatus(selectedUser.id, 'BANNED')} className="btn-secondary">Khóa</button>
                                )}
                            </div>
                        </div>

                        <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(420px,1.1fr)]">
                            <section className="rounded-lg border border-blue-100 bg-blue-50 p-5">
                                <div className="mb-5 flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-xs font-black uppercase tracking-[0.16em] text-[#0f63c9]">Thông tin sinh viên</p>
                                        <p className="mt-1 text-lg font-black text-slate-900">{selectedUser.fullName}</p>
                                    </div>
                                    <StatusBadge status={selectedUser.status} />
                                </div>

                                <dl className="space-y-4 text-sm">
                                    <div>
                                        <dt className="font-black uppercase tracking-wide text-slate-500">Email</dt>
                                        <dd className="mt-1 break-all font-semibold text-slate-900">{selectedUser.email}</dd>
                                    </div>
                                    <div>
                                        <dt className="font-black uppercase tracking-wide text-slate-500">Mã số sinh viên</dt>
                                        <dd className="mt-1 font-semibold text-slate-900">{selectedUser.studentId || 'Chưa cung cấp'}</dd>
                                    </div>
                                    <div>
                                        <dt className="font-black uppercase tracking-wide text-slate-500">Trường</dt>
                                        <dd className="mt-1 font-semibold text-slate-900">{selectedUser.universityName || 'Chưa cập nhật'}</dd>
                                    </div>
                                    <div>
                                        <dt className="font-black uppercase tracking-wide text-slate-500">Loại sinh viên</dt>
                                        <dd className="mt-1 font-semibold text-slate-900">{selectedUser.fptStudent ? 'Sinh viên FPT' : 'Sinh viên ngoài FPT'}</dd>
                                    </div>
                                    {selectedUser.rejectionReason && (
                                        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                                            <dt className="font-black uppercase tracking-wide text-red-600">Lý do từ chối</dt>
                                            <dd className="mt-1 text-red-700">{selectedUser.rejectionReason}</dd>
                                        </div>
                                    )}
                                </dl>
                            </section>

                            <section>
                                <div className="mb-3 flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-xs font-black uppercase tracking-[0.16em] text-[#0f63c9]">Thẻ sinh viên đã upload</p>
                                        <h4 className="mt-1 font-black text-slate-900">Đối chiếu hình ảnh</h4>
                                    </div>
                                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                                        {selectedUser.studentCardUrl ? 'Có file ảnh' : 'Thiếu file ảnh'}
                                    </span>
                                </div>
                                <StudentCardPreview user={selectedUser} />
                            </section>
                        </div>
                    </div>
                </div>
            )}

            {rejectingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleStatus(rejectingUser.id, 'REJECTED', reason);
                        }}
                        className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
                    >
                        <h3 className="text-lg font-black uppercase tracking-wide text-slate-900">Lý do từ chối</h3>
                        <p className="mt-2 text-sm text-slate-600">{rejectingUser.fullName} - {rejectingUser.email}</p>
                        <textarea required rows="4" className="input-custom mt-5" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ví dụ: ảnh thẻ không rõ MSSV..." />
                        <div className="mt-5 flex gap-3">
                            <button type="button" onClick={() => setRejectingUser(null)} className="btn-secondary flex-1">Hủy</button>
                            <button type="submit" className="btn-primary flex-1">Xác nhận</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
