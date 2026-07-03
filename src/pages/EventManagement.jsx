import { useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient';

const emptyEvent = {
    name: '',
    season: 'SPRING',
    year: new Date().getFullYear(),
    regStartDate: '',
    regEndDate: '',
    eventStartDate: '',
    eventEndDate: '',
    submissionDeadline: '',
    roundCount: 2,
    tracks: ['Software Engineering', 'AI Application'],
};

export default function EventManagement() {
    const [events, setEvents] = useState([]);
    const [formData, setFormData] = useState(emptyEvent);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    const fetchEvents = async () => {
        const response = await axiosClient.get('/events');
        setEvents(response.result || []);
    };

    useEffect(() => {
        fetchEvents().catch(() => {});
    }, []);

    const updateTrack = (index, value) => {
        setFormData((current) => ({
            ...current,
            tracks: current.tracks.map((track, idx) => idx === index ? value : track),
        }));
    };

    const addTrack = () => {
        setFormData((current) => ({ ...current, tracks: [...current.tracks, ''] }));
    };

    const removeTrack = (index) => {
        setFormData((current) => ({
            ...current,
            tracks: current.tracks.filter((_, idx) => idx !== index),
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ text: '', type: '' });

        try {
            const payload = {
                ...formData,
                roundCount: Number(formData.roundCount),
                tracks: formData.tracks.map((track) => track.trim()).filter(Boolean),
            };
            await axiosClient.post('/events', payload);
            setMessage({ text: 'Tạo giải đấu và sinh cấu trúc Track/Round thành công.', type: 'success' });
            setFormData(emptyEvent);
            await fetchEvents();
        } catch (err) {
            setMessage({ text: err.message || 'Không thể tạo giải đấu.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mx-auto max-w-6xl space-y-6">
            <section className="rounded-lg border border-blue-100 bg-white p-8 shadow-sm">
                <div className="mb-7">
                    <h2 className="text-2xl font-black uppercase tracking-wide text-slate-900">Tạo giải đấu</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                        Khi lưu, backend tạo Hackathon Event, Track, Round và TrackRoundMatrix thật trong database.
                    </p>
                </div>

                {message.text && (
                    <div className={`mb-6 rounded-lg border p-4 text-sm font-semibold ${
                        message.type === 'success'
                            ? 'border-green-200 bg-green-50 text-green-700'
                            : 'border-red-200 bg-red-50 text-red-700'
                    }`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid gap-5 md:grid-cols-3">
                        <div className="md:col-span-2">
                            <label className="mb-1 block text-sm font-bold text-slate-700">Tên giải đấu</label>
                            <input
                                required
                                className="input-custom"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="SEAL Hackathon Spring 2026"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-bold text-slate-700">Mùa</label>
                            <select className="input-custom" value={formData.season} onChange={(e) => setFormData({ ...formData, season: e.target.value })}>
                                <option value="SPRING">Spring</option>
                                <option value="SUMMER">Summer</option>
                                <option value="FALL">Fall</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid gap-5 md:grid-cols-3">
                        <div>
                            <label className="mb-1 block text-sm font-bold text-slate-700">Năm</label>
                            <input
                                required
                                type="number"
                                className="input-custom"
                                value={formData.year}
                                onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-bold text-slate-700">Số vòng thi</label>
                            <input
                                required
                                min="1"
                                type="number"
                                className="input-custom"
                                value={formData.roundCount}
                                onChange={(e) => setFormData({ ...formData, roundCount: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-bold text-slate-700">Deadline nộp bài</label>
                            <input
                                type="datetime-local"
                                className="input-custom"
                                value={formData.submissionDeadline}
                                onChange={(e) => setFormData({ ...formData, submissionDeadline: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid gap-5 md:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-sm font-bold text-slate-700">Mở đăng ký</label>
                            <input required type="datetime-local" className="input-custom" value={formData.regStartDate} onChange={(e) => setFormData({ ...formData, regStartDate: e.target.value })} />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-bold text-slate-700">Đóng đăng ký</label>
                            <input required type="datetime-local" className="input-custom" value={formData.regEndDate} onChange={(e) => setFormData({ ...formData, regEndDate: e.target.value })} />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-bold text-slate-700">Bắt đầu sự kiện</label>
                            <input required type="datetime-local" className="input-custom" value={formData.eventStartDate} onChange={(e) => setFormData({ ...formData, eventStartDate: e.target.value })} />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-bold text-slate-700">Kết thúc sự kiện</label>
                            <input required type="datetime-local" className="input-custom" value={formData.eventEndDate} onChange={(e) => setFormData({ ...formData, eventEndDate: e.target.value })} />
                        </div>
                    </div>

                    <div>
                        <div className="mb-3 flex items-center justify-between">
                            <label className="block text-sm font-bold text-slate-700">Hạng mục thi</label>
                            <button type="button" onClick={addTrack} className="btn-secondary">Thêm track</button>
                        </div>
                        <div className="space-y-3">
                            {formData.tracks.map((track, index) => (
                                <div key={index} className="flex gap-3">
                                    <input
                                        required
                                        className="input-custom"
                                        value={track}
                                        onChange={(e) => updateTrack(index, e.target.value)}
                                        placeholder="Tên hạng mục thi"
                                    />
                                    {formData.tracks.length > 1 && (
                                        <button type="button" onClick={() => removeTrack(index)} className="btn-secondary">
                                            Xóa
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <button type="submit" disabled={loading} className="btn-primary w-full">
                        {loading ? 'Đang tạo...' : 'Tạo giải đấu và sinh ma trận'}
                    </button>
                </form>
            </section>

            <section className="rounded-lg border border-blue-100 bg-white shadow-sm">
                <div className="border-b border-blue-100 bg-blue-50 px-6 py-4">
                    <h3 className="font-black uppercase tracking-wide text-slate-900">Giải đấu hiện có</h3>
                </div>
                <div className="divide-y divide-blue-50">
                    {events.length === 0 ? (
                        <div className="p-6 text-sm text-slate-500">Chưa có giải đấu trong database.</div>
                    ) : events.map((event) => (
                        <div key={event.id} className="grid gap-3 px-6 py-4 md:grid-cols-[1fr_auto] md:items-center">
                            <div>
                                <p className="font-black text-slate-900">{event.name}</p>
                                <p className="text-sm text-slate-500">
                                    {event.season} {event.year} - {event.tracks?.length || 0} track - {event.rounds?.length || 0} vòng - {event.teamCount || 0} đội
                                </p>
                            </div>
                            <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
                                {event.active ? 'Đang hoạt động' : 'Tạm đóng'}
                            </span>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
