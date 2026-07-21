import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import Toast from '../components/Toast';

function exportAchievement(profile, achievement) {
    const html = `
<!doctype html>
<html lang="vi">
<meta charset="utf-8" />
<title>SEAL Achievement - ${profile.fullName}</title>
<body style="font-family:Arial,sans-serif;margin:0;background:#f4f8ff;color:#071936">
  <section style="width:900px;margin:40px auto;padding:56px;border:2px solid #0f63c9;background:white">
    <p style="letter-spacing:6px;text-transform:uppercase;color:#0f63c9;font-weight:800">SEAL Hackathon Certificate</p>
    <h1 style="font-size:48px;margin:24px 0 8px">${profile.fullName}</h1>
    <p style="font-size:18px;line-height:1.7">Đã đạt <b>${achievement.prizeName}</b> tại <b>${achievement.eventName || 'SEAL Hackathon'} ${achievement.eventYear || ''}</b>.</p>
    <p style="font-size:16px">Đội thi: <b>${achievement.teamName || 'Đang cập nhật'}</b></p>
    <p style="margin-top:48px;color:#5c6d83">Mã thành tích: SEAL-${achievement.id}</p>
  </section>
</body>
</html>`;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `seal-achievement-${achievement.id}.html`;
    link.click();
    URL.revokeObjectURL(url);
}

function getPrizePresentation(prizeName = '') {
    const normalized = prizeName.toLowerCase();
    if (normalized.includes('nhất') || normalized.includes('vô địch') || normalized.includes('first')) return { rank: '01', medal: '🥇', label: 'Giải nhất', tone: 'gold' };
    if (normalized.includes('nhì') || normalized.includes('á quân') || normalized.includes('second')) return { rank: '02', medal: '🥈', label: 'Giải nhì', tone: 'silver' };
    if (normalized.includes('ba') || normalized.includes('third')) return { rank: '03', medal: '🥉', label: 'Giải ba', tone: 'bronze' };
    return { rank: '★', medal: '🏅', label: prizeName || 'Giải thưởng', tone: 'award' };
}

export default function Profile() {
    const [searchParams] = useSearchParams();
    const userId = searchParams.get('userId');
    const isOwnProfile = !userId;
    const [profile, setProfile] = useState(null);
    const [achievements, setAchievements] = useState([]);
    const [avatarUrl, setAvatarUrl] = useState('');
    const [passwords, setPasswords] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
    const [loading, setLoading] = useState(true);
    const [savingProfile, setSavingProfile] = useState(false);
    const [savingPassword, setSavingPassword] = useState(false);
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [passwordErrors, setPasswordErrors] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
        general: ''
    });

    const fetchProfile = useCallback(async () => {
        const profilePath = userId ? `/users/${userId}` : '/users/me';
        const achievementPath = userId ? `/users/${userId}/achievements` : '/users/me/achievements';
        const [profileRes, achievementRes] = await Promise.allSettled([
            axiosClient.get(profilePath),
            axiosClient.get(achievementPath),
        ]);

        if (profileRes.status === 'fulfilled') {
            setProfile(profileRes.value.result);
            setAvatarUrl(profileRes.value.result?.avatarUrl || '');
        } else {
            throw profileRes.reason;
        }

        if (achievementRes.status === 'fulfilled') {
            setAchievements(achievementRes.value.result || []);
        }
    }, [userId]);

    useEffect(() => {
        setLoading(true);
        fetchProfile()
            .catch((err) => setMessage({ text: err.message || 'Không thể tải profile.', type: 'error' }))
            .finally(() => setLoading(false));
    }, [fetchProfile]);

    const handleAvatarSubmit = async (e) => {
        e.preventDefault();
        try {
            setSavingProfile(true);
            const response = await axiosClient.put('/users/me/profile', { avatarUrl });
            setProfile(response.result);
            setMessage({ text: 'Cập nhật avatar thành công.', type: 'success' });
        } catch (err) {
            setMessage({ text: err.message || 'Không thể cập nhật profile.', type: 'error' });
        } finally {
            setSavingProfile(false);
        }
    };

    const handleAvatarUpload = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            setMessage({ text: 'Vui lòng chọn một file ảnh hợp lệ.', type: 'error' });
            event.target.value = '';
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            setMessage({ text: 'Ảnh đại diện không được vượt quá 2MB.', type: 'error' });
            event.target.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            setAvatarUrl(String(reader.result || ''));
            setMessage({ text: '', type: '' });
        };
        reader.onerror = () => setMessage({ text: 'Không thể đọc file ảnh. Vui lòng thử lại.', type: 'error' });
        reader.readAsDataURL(file);
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setPasswordErrors({ oldPassword: '', newPassword: '', confirmPassword: '', general: '' });

        let hasErr = false;
        const newErrs = { oldPassword: '', newPassword: '', confirmPassword: '', general: '' };

        if (passwords.newPassword === passwords.oldPassword) {
            newErrs.newPassword = 'Mật khẩu mới không được trùng với mật khẩu hiện tại.';
            hasErr = true;
        }

        if (passwords.newPassword !== passwords.confirmPassword) {
            newErrs.confirmPassword = 'Mật khẩu xác nhận không khớp với mật khẩu mới.';
            hasErr = true;
        }

        if (hasErr) {
            setPasswordErrors(newErrs);
            return;
        }

        try {
            setSavingPassword(true);
            await axiosClient.put('/users/change-password', {
                oldPassword: passwords.oldPassword,
                newPassword: passwords.newPassword,
            });
            setPasswords({ oldPassword: '', newPassword: '', confirmPassword: '' });
            setShowPasswordForm(false);
            setMessage({ text: 'Đổi mật khẩu thành công.', type: 'success' });
        } catch (err) {
            const errMsg = err.message || 'Không thể đổi mật khẩu.';
            const isOldPwdErr = errMsg.toLowerCase().includes('hiện tại') || errMsg.toLowerCase().includes('old') || errMsg.toLowerCase().includes('current') || errMsg.toLowerCase().includes('mật khẩu cũ');
            
            if (isOldPwdErr) {
                setPasswordErrors(prev => ({ ...prev, oldPassword: errMsg }));
            } else {
                setPasswordErrors(prev => ({ ...prev, general: errMsg }));
            }
        } finally {
            setSavingPassword(false);
        }
    };

    if (loading) {
        return <main className="section-shell"><div className="rounded-lg bg-white p-8 text-center text-[#5c6d83]">Đang tải profile...</div></main>;
    }

    return (
        <main className="section-shell">
            <Toast message={message} onClose={() => setMessage({ text: '', type: '' })} />

            <div className="profile-layout">
                <aside className="profile-sidebar">
                    <section className="profile-summary">
                        <div className="profile-avatar">
                            {avatarUrl || profile?.avatarUrl ? <img src={avatarUrl || profile.avatarUrl} alt={profile.fullName} /> : profile?.fullName?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <p className="profile-role">{profile?.role}</p>
                        <h1>{profile?.fullName}</h1>
                        <p className="profile-email">{profile?.email}</p>
                        <div className="profile-meta">
                            <div><span>Mã sinh viên</span><strong>{profile?.studentId || 'Chưa cập nhật'}</strong></div>
                            <div><span>Trường</span><strong>{profile?.universityName || 'Chưa cập nhật'}</strong></div>
                        </div>
                    </section>

                    {isOwnProfile && (
                        <section className="profile-actions">
                            <div className="profile-actions__header">
                                <p>Thiết lập tài khoản</p>
                                <h2>Cập nhật hồ sơ</h2>
                            </div>

                            <form onSubmit={handleAvatarSubmit} className="avatar-upload-form">
                                <label htmlFor="profile-avatar-upload" className="avatar-upload-label">
                                    <span className="avatar-upload-icon">↑</span>
                                    <span><strong>Chọn ảnh đại diện</strong><small>PNG, JPG hoặc WEBP · tối đa 2MB</small></span>
                                </label>
                                <input id="profile-avatar-upload" type="file" accept="image/*" onChange={handleAvatarUpload} className="sr-only" />
                                {avatarUrl && avatarUrl !== profile?.avatarUrl && (
                                    <button type="submit" disabled={savingProfile} className="btn-primary w-full">
                                        {savingProfile ? 'Đang lưu...' : 'Lưu ảnh đại diện'}
                                    </button>
                                )}
                            </form>

                            <button type="button" className="profile-password-toggle" onClick={() => setShowPasswordForm((current) => !current)} aria-expanded={showPasswordForm}>
                                <span><strong>Đổi mật khẩu</strong><small>Tăng bảo mật cho tài khoản</small></span>
                                <span aria-hidden="true">{showPasswordForm ? '−' : '+'}</span>
                            </button>

                            {showPasswordForm && (
                                <form onSubmit={handlePasswordSubmit} className="profile-password-form space-y-4">
                                    <div>
                                        <label htmlFor="current-password">Mật khẩu hiện tại</label>
                                        <input id="current-password" required type="password" className="input-custom" value={passwords.oldPassword} onChange={(e) => { setPasswords({ ...passwords, oldPassword: e.target.value }); setPasswordErrors(prev => ({ ...prev, oldPassword: '', general: '' })); }} />
                                        {passwordErrors.oldPassword && <p className="mt-1.5 text-xs font-semibold text-red-600">{passwordErrors.oldPassword}</p>}
                                    </div>
                                    <div>
                                        <label htmlFor="new-password">Mật khẩu mới</label>
                                        <input id="new-password" required minLength={6} type="password" className="input-custom" value={passwords.newPassword} onChange={(e) => { setPasswords({ ...passwords, newPassword: e.target.value }); setPasswordErrors(prev => ({ ...prev, newPassword: '', general: '' })); }} />
                                        {passwordErrors.newPassword && <p className="mt-1.5 text-xs font-semibold text-red-600">{passwordErrors.newPassword}</p>}
                                    </div>
                                    <div>
                                        <label htmlFor="confirm-password">Xác nhận mật khẩu mới</label>
                                        <input id="confirm-password" required minLength={6} type="password" className="input-custom" value={passwords.confirmPassword} onChange={(e) => { setPasswords({ ...passwords, confirmPassword: e.target.value }); setPasswordErrors(prev => ({ ...prev, confirmPassword: '', general: '' })); }} />
                                        {passwordErrors.confirmPassword && <p className="mt-1.5 text-xs font-semibold text-red-600">{passwordErrors.confirmPassword}</p>}
                                    </div>
                                    {passwordErrors.general && (
                                        <p className="text-sm font-semibold text-red-600">{passwordErrors.general}</p>
                                    )}
                                    <div className="flex gap-2">
                                        <button type="submit" disabled={savingPassword} className="btn-primary flex-1">{savingPassword ? 'Đang đổi...' : 'Xác nhận đổi'}</button>
                                        <button type="button" className="btn-secondary" onClick={() => { setShowPasswordForm(false); setPasswordErrors({ oldPassword: '', newPassword: '', confirmPassword: '', general: '' }); }}>Hủy</button>
                                    </div>
                                </form>
                            )}
                        </section>
                    )}
                </aside>

                <section className="profile-achievements">
                    <div className="profile-achievements__header">
                        <div>
                            <p>Hall of achievement</p>
                            <h2>Thành tích nổi bật</h2>
                            <span>Những cột mốc và giải thưởng đã đạt được tại SEAL Hackathon.</span>
                        </div>
                        <strong>{achievements.length}<small>thành tích</small></strong>
                    </div>
                    <div className="achievement-list">
                            {achievements.length ? achievements.map((item) => {
                                const prize = getPrizePresentation(item.prizeName);
                                return (
                                    <article key={item.id} className={`achievement-row achievement-row--${prize.tone}`}>
                                        <div className="achievement-row__place">
                                            <span>{prize.medal}</span>
                                            <strong>{prize.rank}</strong>
                                        </div>
                                        <div className="achievement-row__main">
                                            <p>{prize.label} · {item.eventYear}</p>
                                            <h3>{item.prizeName}</h3>
                                            <span>{item.eventName}</span>
                                        </div>
                                        <div className="achievement-row__team">
                                            <span>Đội thi</span>
                                            <strong>{item.teamName || 'Đang cập nhật'}</strong>
                                        </div>
                                        {isOwnProfile && (
                                            <button type="button" onClick={() => exportAchievement(profile, item)} className="achievement-row__export" title="Xuất chứng nhận">
                                                Xuất chứng nhận <span aria-hidden="true">↗</span>
                                            </button>
                                        )}
                                    </article>
                                );
                            }) : <div className="achievement-empty"><span>☆</span><h3>Chưa có thành tích</h3><p>Khi ban tổ chức công bố giải nhất, nhì hoặc ba, thành tích sẽ xuất hiện tại đây.</p></div>}
                    </div>
                </section>
            </div>
        </main>
    );
}
