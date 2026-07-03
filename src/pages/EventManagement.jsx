import { useState } from 'react';
import axiosClient from '../api/axiosClient';

export default function EventManagement() {
    const [formData, setFormData] = useState({
        name: '',
        season: 'SPRING',
        year: new Date().getFullYear(),
        regStartDate: '',
        regEndDate: '',
        eventStartDate: '',
        eventEndDate: ''
    });

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ text: '', type: '' });

        try {
            await axiosClient.post('/events', formData);
            setMessage({ text: 'Khởi tạo giải đấu thành công! Hệ thống đã sẵn sàng nhận đăng ký.', type: 'success' });
            // Reset form sau khi tạo thành công
            setFormData({
                ...formData,
                name: '',
                regStartDate: '',
                regEndDate: '',
                eventStartDate: '',
                eventEndDate: ''
            });
        } catch (err) {
            setMessage({ text: err.message || 'Có lỗi xảy ra khi tạo giải đấu!', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-100">
            <div className="mb-8 border-b pb-4">
                <h2 className="text-2xl font-bold text-gray-800">Khởi tạo Giải đấu (Hackathon Event)</h2>
                <p className="text-sm text-gray-500 mt-1">Chỉ dành cho Ban Tổ Chức (Coordinator) để thiết lập mùa giải mới.</p>
            </div>

            {message.text && (
                <div className={`mb-6 p-4 text-sm rounded-lg border ${message.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tên Giải Đấu</label>
                        <input
                            type="text" required placeholder="VD: SEAL Hackathon Spring 2026..."
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-gray-50"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mùa giải (Season)</label>
                        <select
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-gray-50"
                            value={formData.season}
                            onChange={(e) => setFormData({...formData, season: e.target.value})}
                        >
                            <option value="SPRING">Spring (Mùa Xuân)</option>
                            <option value="SUMMER">Summer (Mùa Hè)</option>
                            <option value="FALL">Fall (Mùa Thu)</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-5 rounded-lg border border-slate-200">
                    <h3 className="md:col-span-2 font-semibold text-slate-800 text-base border-b pb-2">Thời gian Đăng ký</h3>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mở cổng đăng ký</label>
                        <input
                            type="datetime-local" required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            value={formData.regStartDate}
                            onChange={(e) => setFormData({...formData, regStartDate: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Đóng cổng đăng ký (Deadline)</label>
                        <input
                            type="datetime-local" required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            value={formData.regEndDate}
                            onChange={(e) => setFormData({...formData, regEndDate: e.target.value})}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-indigo-50 p-5 rounded-lg border border-indigo-100">
                    <h3 className="md:col-span-2 font-semibold text-indigo-900 text-base border-b border-indigo-200 pb-2">Thời gian Thi đấu (Hackathon)</h3>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bắt đầu sự kiện</label>
                        <input
                            type="datetime-local" required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            value={formData.eventStartDate}
                            onChange={(e) => setFormData({...formData, eventStartDate: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Kết thúc sự kiện</label>
                        <input
                            type="datetime-local" required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            value={formData.eventEndDate}
                            onChange={(e) => setFormData({...formData, eventEndDate: e.target.value})}
                        />
                    </div>
                </div>

                <div className="pt-4 border-t flex justify-end">
                    <button
                        type="submit" disabled={loading}
                        className="px-8 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 transition-all shadow-md"
                    >
                        {loading ? 'Đang lưu dữ liệu...' : 'Tạo Giải Đấu Mới'}
                    </button>
                </div>
            </form>
        </div>
    );
}