import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axiosClient from '../api/axiosClient';

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
    const [message, setMessage] = useState({ text: '', type: '' });

    const fetchProfile = async () => {
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
    };

    useEffect(() => {
        setLoading(true);
        fetchProfile()
            .catch((err) => setMessage({ text: err.message || 'Không thể tải profile.', type: 'error' }))
            .finally(() => setLoading(false));
    }, [userId]);

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

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        if (passwords.newPassword !== passwords.confirmPassword) {
            setMessage({ text: 'Mật khẩu mới không khớp.', type: 'error' });
            return;
        }
        try {
            setSavingPassword(true);
            await axiosClient.put('/users/change-password', {
                oldPassword: passwords.oldPassword,
                newPassword: passwords.newPassword,
            });
            setPasswords({ oldPassword: '', newPassword: '', confirmPassword: '' });
            setMessage({ text: 'Đổi mật khẩu thành công.', type: 'success' });
        } catch (err) {
            setMessage({ text: err.message || 'Không thể đổi mật khẩu.', type: 'error' });
        } finally {
            setSavingPassword(false);
        }
    };

    if (loading) {
        return <main className="section-shell"><div className="rounded-lg bg-white p-8 text-center text-[#5c6d83]">Đang tải profile...</div></main>;
    }

    return (
        <main className="section-shell">
            {message.text && (
                <div className={`mb-6 rounded-lg border p-4 text-sm font-semibold ${message.type === 'success' ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
                    {message.text}
                </div>
            )}

            <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
                <aside className="space-y-6">
                    <section className="rounded-lg border border-[#d7e6f8] bg-white p-6 shadow-sm">
                        <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-[#eaf3ff] text-3xl font-black text-[#0f63c9]">
                            {profile?.avatarUrl ? <img src={profile.avatarUrl} alt={profile.fullName} className="h-full w-full object-cover" /> : profile?.fullName?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <p className="mt-5 text-xs font-black uppercase tracking-[0.18em] text-[#0f63c9]">{profile?.role}</p>
                        <h1 className="mt-2 text-2xl font-black uppercase tracking-[0.06em] text-[#071936]">{profile?.fullName}</h1>
                        <p className="mt-2 text-sm text-[#5c6d83]">{profile?.email}</p>
                        <p className="mt-1 text-sm text-[#5c6d83]">{profile?.studentId || 'Chưa có MSSV'} - {profile?.universityName || 'Chưa có trường'}</p>
                    </section>

                    <section className="rounded-lg border border-[#d7e6f8] bg-white p-6 shadow-sm">
                        <h2 className="text-lg font-black uppercase tracking-[0.08em] text-[#071936]">Thành tích</h2>
                        <div className="mt-4 space-y-3">
                            {achievements.length ? achievements.map((item) => (
                                <div key={item.id} className="rounded-lg border border-[#d7e6f8] bg-[#f8fbff] p-4">
                                    <p className="font-black text-[#071936]">{item.prizeName}</p>
                                    <p className="mt-1 text-sm text-[#5c6d83]">{item.eventName} {item.eventYear}</p>
                                </div>
                            )) : <p className="text-sm text-[#5c6d83]">Chưa có thành tích được công bố.</p>}
                        </div>
                    </section>
                </aside>

                <div className="space-y-6">
                    <section className="rounded-lg border border-[#d7e6f8] bg-white p-6 shadow-sm">
                        <h2 className="text-lg font-black uppercase tracking-[0.08em] text-[#071936]">Bằng khen ảo</h2>
                        <div className="mt-5 grid gap-4 md:grid-cols-2">
                            {achievements.length ? achievements.map((item) => (
                                <article key={item.id} className="rounded-lg border border-[#d7e6f8] bg-[#f8fbff] p-5">
                                    <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0f63c9]">SEAL Certificate</p>
                                    <h3 className="mt-3 text-xl font-black text-[#071936]">{item.prizeName}</h3>
                                    <p className="mt-2 text-sm leading-6 text-[#5c6d83]">{item.eventName} {item.eventYear} - {item.teamName}</p>
                                    {isOwnProfile && (
                                        <button type="button" onClick={() => exportAchievement(profile, item)} className="btn-primary mt-5">
                                            Export
                                        </button>
                                    )}
                                </article>
                            )) : <div className="rounded-lg border border-[#d7e6f8] bg-[#f8fbff] p-6 text-[#5c6d83]">Khi ban tổ chức công bố giải thưởng, chứng nhận sẽ xuất hiện tại đây.</div>}
                        </div>
                    </section>

                    {isOwnProfile && (
                        <>
                            <section className="rounded-lg border border-[#d7e6f8] bg-white p-6 shadow-sm">
                                <h2 className="text-lg font-black uppercase tracking-[0.08em] text-[#071936]">Cập nhật avatar</h2>
                                <form onSubmit={handleAvatarSubmit} className="mt-5 space-y-4">
                                    <input type="url" className="input-custom" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://..." />
                                    <button type="submit" disabled={savingProfile} className="btn-primary">{savingProfile ? 'Đang lưu...' : 'Lưu avatar'}</button>
                                </form>
                            </section>

                            <section className="rounded-lg border border-[#d7e6f8] bg-white p-6 shadow-sm">
                                <h2 className="text-lg font-black uppercase tracking-[0.08em] text-[#071936]">Đổi mật khẩu</h2>
                                <form onSubmit={handlePasswordSubmit} className="mt-5 space-y-4">
                                    <input required type="password" className="input-custom" placeholder="Mật khẩu hiện tại" value={passwords.oldPassword} onChange={(e) => setPasswords({ ...passwords, oldPassword: e.target.value })} />
                                    <input required minLength={6} type="password" className="input-custom" placeholder="Mật khẩu mới" value={passwords.newPassword} onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} />
                                    <input required minLength={6} type="password" className="input-custom" placeholder="Xác nhận mật khẩu mới" value={passwords.confirmPassword} onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })} />
                                    <button type="submit" disabled={savingPassword} className="btn-primary">{savingPassword ? 'Đang đổi...' : 'Đổi mật khẩu'}</button>
                                </form>
                            </section>
                        </>
                    )}
                </div>
            </div>
        </main>
    );
}
