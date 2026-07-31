import { useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient';
import Toast from '../components/Toast';

const size = (bytes) => bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

export default function BackupRestore() {
    const [backups, setBackups] = useState([]);
    const [busy, setBusy] = useState('');
    const [message, setMessage] = useState(null);

    const load = async () => {
        try {
            setBackups((await axiosClient.get('/admin/backups')).result || []);
        } catch (error) {
            setMessage({ error: true, text: error?.message || 'Unable to load backups.' });
        }
    };

    useEffect(() => { load(); }, []);

    const createBackup = async () => {
        try {
            setBusy('create');
            setMessage(null);
            await axiosClient.post('/admin/backups');
            await load();
            setMessage({ text: 'New backup created.' });
        } catch (error) {
            setMessage({ error: true, text: error?.message || 'Backup failed.' });
        } finally {
            setBusy('');
        }
    };

    const restore = async (backup) => {
        if (!window.confirm(`Restore data from ${backup.fileName}? The system will create a safety backup before replacing the current data.`)) return;

        try {
            setBusy(backup.fileName);
            setMessage(null);
            await axiosClient.post(`/admin/backups/${encodeURIComponent(backup.fileName)}/restore`);
            setMessage({ text: `${backup.fileName} restored. Please sign in again if your current session changes.` });
            await load();
        } catch (error) {
            setMessage({ error: true, text: error?.message || 'Restore failed.' });
        } finally {
            setBusy('');
        }
    };

    return (
        <div className="mx-auto max-w-5xl space-y-6">
            <section className="rounded-lg border border-blue-100 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0f63c9]">Data protection</p>
                        <h2 className="mt-2 text-2xl font-black text-slate-900">Backup & restore</h2>
                        <p className="mt-2 text-sm text-slate-600">Full PostgreSQL backups, including system schema and data.</p>
                    </div>
                    <button disabled={Boolean(busy)} onClick={createBackup} className="btn-primary">{busy === 'create' ? 'Creating backup...' : 'Create backup'}</button>
                </div>
            </section>

            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                <b>Note:</b> before a restore, the system automatically creates a backup of the current data.
            </div>

            <Toast message={message} onClose={() => setMessage(null)} />

            <section className="overflow-hidden rounded-lg border border-blue-100 bg-white shadow-sm">
                <div className="border-b border-blue-100 bg-blue-50 px-5 py-4">
                    <h3 className="font-black text-slate-900">Backup history</h3>
                </div>
                <div className="divide-y divide-blue-50">
                    {backups.map((backup) => (
                        <div key={backup.fileName} className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
                            <div>
                                <p className="font-black text-slate-900">{backup.fileName}</p>
                                <p className="mt-1 text-sm text-slate-500">{new Date(backup.createdAt).toLocaleString('en-GB')} · {size(backup.size)}</p>
                            </div>
                            <button type="button" disabled={Boolean(busy)} onClick={() => restore(backup)} className="btn-secondary">
                                {busy === backup.fileName ? 'Restoring...' : 'Restore'}
                            </button>
                        </div>
                    ))}
                    {backups.length === 0 && <p className="p-8 text-center text-sm text-slate-500">No backups yet.</p>}
                </div>
            </section>
        </div>
    );
}
