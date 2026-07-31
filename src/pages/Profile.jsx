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
    <p style="font-size:18px;line-height:1.7">Achieved <b>${achievement.prizeName}</b> at <b>${achievement.eventName || 'SEAL Hackathon'} ${achievement.eventYear || ''}</b>.</p>
    <p style="font-size:16px">Team: <b>${achievement.teamName || "Pending update"}</b></p>
    <p style="margin-top:48px;color:#5c6d83">Achievement code: SEAL-${achievement.id}</p>
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
    if (normalized.includes("best") || normalized.includes("champion") || normalized.includes('first')) return { rank: '01', medal: '🥇', label: "First prize", tone: 'gold' };
    if (normalized.includes("second") || normalized.includes("runner-up") || normalized.includes('second')) return { rank: '02', medal: '🥈', label: "Second prize", tone: 'silver' };
    if (normalized.includes('ba') || normalized.includes('third')) return { rank: '03', medal: '🥉', label: "Third prize", tone: 'bronze' };
    return { rank: '★', medal: '🏅', label: prizeName || "Prize", tone: 'award' };
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
            .catch((err) => setMessage({ text: err.message || "Unable to load profile.", type: 'error' }))
            .finally(() => setLoading(false));
    }, [fetchProfile]);

    const handleAvatarSubmit = async (e) => {
        e.preventDefault();
        try {
            setSavingProfile(true);
            const response = await axiosClient.put('/users/me/profile', { avatarUrl });
            setProfile(response.result);
            setMessage({ text: "Updated avatar successfully.", type: 'success' });
        } catch (err) {
            setMessage({ text: err.message || "Unable to update profile.", type: 'error' });
        } finally {
            setSavingProfile(false);
        }
    };

    const handleAvatarUpload = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            setMessage({ text: "Please select a valid image file.", type: 'error' });
            event.target.value = '';
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            setMessage({ text: "Profile photo cannot exceed 2MB.", type: 'error' });
            event.target.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            setAvatarUrl(String(reader.result || ''));
            setMessage({ text: '', type: '' });
        };
        reader.onerror = () => setMessage({ text: "Cannot read image file. Please try again.", type: 'error' });
        reader.readAsDataURL(file);
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setPasswordErrors({ oldPassword: '', newPassword: '', confirmPassword: '', general: '' });

        let hasErr = false;
        const newErrs = { oldPassword: '', newPassword: '', confirmPassword: '', general: '' };

        if (passwords.newPassword === passwords.oldPassword) {
            newErrs.newPassword = "The new password must not be the same as the current password.";
            hasErr = true;
        }

        if (passwords.newPassword !== passwords.confirmPassword) {
            newErrs.confirmPassword = "The confirmation password does not match the new password.";
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
            setMessage({ text: "Password changed successfully.", type: 'success' });
        } catch (err) {
            const errMsg = err.message || "Cannot change password.";
            const isOldPwdErr = errMsg.toLowerCase().includes("Present") || errMsg.toLowerCase().includes('old') || errMsg.toLowerCase().includes('current') || errMsg.toLowerCase().includes("old password");
            
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
        return <main className="section-shell"><div className="rounded-lg bg-white p-8 text-center text-[#5c6d83]">Loading profile...</div></main>;
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
                            <div><span>Student code</span><strong>{profile?.studentId || "Not updated yet"}</strong></div>
                            <div><span>School</span><strong>{profile?.universityName || "Not updated yet"}</strong></div>
                        </div>
                    </section>

                    {isOwnProfile && (
                        <section className="profile-actions">
                            <div className="profile-actions__header">
                                <p>Set up an account</p>
                                <h2>Update profile</h2>
                            </div>

                            <form onSubmit={handleAvatarSubmit} className="avatar-upload-form">
                                <label htmlFor="profile-avatar-upload" className="avatar-upload-label">
                                    <span className="avatar-upload-icon">↑</span>
                                    <span><strong>Select avatar</strong><small>PNG, JPG or WEBP · maximum 2MB</small></span>
                                </label>
                                <input id="profile-avatar-upload" type="file" accept="image/*" onChange={handleAvatarUpload} className="sr-only" />
                                {avatarUrl && avatarUrl !== profile?.avatarUrl && (
                                    <button type="submit" disabled={savingProfile} className="btn-primary w-full">
                                        {savingProfile ? "Saving..." : "Save your avatar"}
                                    </button>
                                )}
                            </form>

                            <button type="button" className="profile-password-toggle" onClick={() => setShowPasswordForm((current) => !current)} aria-expanded={showPasswordForm}>
                                <span><strong>Change password</strong><small>Increase account security</small></span>
                                <span aria-hidden="true">{showPasswordForm ? '−' : '+'}</span>
                            </button>

                            {showPasswordForm && (
                                <form onSubmit={handlePasswordSubmit} className="profile-password-form space-y-4">
                                    <div>
                                        <label htmlFor="current-password">Current password</label>
                                        <input id="current-password" required type="password" className="input-custom" value={passwords.oldPassword} onChange={(e) => { setPasswords({ ...passwords, oldPassword: e.target.value }); setPasswordErrors(prev => ({ ...prev, oldPassword: '', general: '' })); }} />
                                        {passwordErrors.oldPassword && <p className="mt-1.5 text-xs font-semibold text-red-600">{passwordErrors.oldPassword}</p>}
                                    </div>
                                    <div>
                                        <label htmlFor="new-password">New password</label>
                                        <input id="new-password" required minLength={6} type="password" className="input-custom" value={passwords.newPassword} onChange={(e) => { setPasswords({ ...passwords, newPassword: e.target.value }); setPasswordErrors(prev => ({ ...prev, newPassword: '', general: '' })); }} />
                                        {passwordErrors.newPassword && <p className="mt-1.5 text-xs font-semibold text-red-600">{passwordErrors.newPassword}</p>}
                                    </div>
                                    <div>
                                        <label htmlFor="confirm-password">Confirm new password</label>
                                        <input id="confirm-password" required minLength={6} type="password" className="input-custom" value={passwords.confirmPassword} onChange={(e) => { setPasswords({ ...passwords, confirmPassword: e.target.value }); setPasswordErrors(prev => ({ ...prev, confirmPassword: '', general: '' })); }} />
                                        {passwordErrors.confirmPassword && <p className="mt-1.5 text-xs font-semibold text-red-600">{passwordErrors.confirmPassword}</p>}
                                    </div>
                                    {passwordErrors.general && (
                                        <p className="text-sm font-semibold text-red-600">{passwordErrors.general}</p>
                                    )}
                                    <div className="flex gap-2">
                                        <button type="submit" disabled={savingPassword} className="btn-primary flex-1">{savingPassword ? "Changing..." : "Confirm exchange"}</button>
                                        <button type="button" className="btn-secondary" onClick={() => { setShowPasswordForm(false); setPasswordErrors({ oldPassword: '', newPassword: '', confirmPassword: '', general: '' }); }}>Cancel</button>
                                    </div>
                                </form>
                            )}
                        </section>
                    )}
                </aside>

                <section className="profile-achievements">
                    <div className="profile-achievements__header">
                        <div>
                            <p>Achievement history</p>
                            <h2>Outstanding achievements</h2>
                            <span>Milestones and awards achieved at the SEAL Hackathon.</span>
                        </div>
                        <strong>{achievements.length} <small>achievements</small></strong>
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
                                            <span>Team</span>
                                            <strong>{item.teamName || "Updating"}</strong>
                                        </div>
                                        {isOwnProfile && (
                                            <button type="button" onClick={() => exportAchievement(profile, item)} className="achievement-row__export" title="Export certificate">
                                                Export certificate <span aria-hidden="true">↗</span>
                                            </button>
                                        )}
                                    </article>
                                );
                            }) : <div className="achievement-empty"><span>☆</span><h3>No achievements yet</h3><p>When the organizers announce the first, second or third prize, the achievements will appear here.</p></div>}
                    </div>
                </section>
            </div>
        </main>
    );
}
