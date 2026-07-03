export const demoEvent = {
    id: 'demo-seal-2026',
    name: 'SEAL Hackathon 2026',
    season: 'SUMMER',
    year: 2026,
    regStartDate: '2026-07-01T08:00:00',
    regEndDate: '2026-07-20T23:59:00',
    eventStartDate: '2026-07-25T08:00:00',
    eventEndDate: '2026-07-27T18:00:00',
    teamCount: 24,
    tracks: [
        { id: 'ai', name: 'AI for Education', description: 'Sản phẩm AI hỗ trợ học tập, cố vấn và vận hành đào tạo.' },
        { id: 'green', name: 'Green Campus', description: 'Giải pháp công nghệ cho môi trường học đường bền vững.' },
    ],
    matrices: [
        {
            id: 'demo-matrix',
            roundName: 'Vòng chung kết',
            trackName: 'AI for Education',
            guidelineUrl: 'https://example.com/seal-guideline.pdf',
            submissionDeadline: '2026-07-27T12:00:00',
        },
    ],
};

export const demoWinners = [
    {
        rank: 1,
        teamName: 'Byte Bloom',
        track: 'AI for Education',
        score: 96,
        members: [{ fullName: 'Nguyễn Minh An' }, { fullName: 'Lê Gia Huy' }, { fullName: 'Trần Khánh Vy' }],
    },
    {
        rank: 2,
        teamName: 'Signal One',
        track: 'Green Campus',
        score: 91,
        members: [{ fullName: 'Phạm Hoàng Nam' }, { fullName: 'Đỗ Bảo Ngọc' }],
    },
    {
        rank: 3,
        teamName: 'Stack Stars',
        track: 'AI for Education',
        score: 88,
        members: [{ fullName: 'Võ Anh Quân' }, { fullName: 'Mai Thanh Trúc' }],
    },
];

export function formatDateTime(value) {
    if (!value) return 'Chưa cập nhật';
    return new Date(value).toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
}

export function getEventPhase(event) {
    const now = new Date();
    const regStart = event?.regStartDate ? new Date(event.regStartDate) : null;
    const regEnd = event?.regEndDate ? new Date(event.regEndDate) : null;
    const eventEnd = event?.eventEndDate ? new Date(event.eventEndDate) : null;

    if (eventEnd && now > eventEnd) {
        return { key: 'ended', label: 'GIẢI ĐẤU ĐÃ KẾT THÚC' };
    }

    if (regStart && now < regStart) {
        return { key: 'upcoming', label: 'SẮP MỞ ĐĂNG KÝ' };
    }

    if (regEnd && now <= regEnd) {
        return { key: 'registration', label: 'ĐANG MỞ ĐĂNG KÝ' };
    }

    return { key: 'running', label: 'ĐANG DIỄN RA' };
}

export function pickFeaturedEvent(events = []) {
    if (!events.length) return demoEvent;
    return [...events].sort((a, b) => {
        const aTime = new Date(a.regEndDate || a.eventStartDate || 0).getTime();
        const bTime = new Date(b.regEndDate || b.eventStartDate || 0).getTime();
        return Math.abs(Date.now() - aTime) - Math.abs(Date.now() - bTime);
    })[0];
}

export function getCountdownParts(target) {
    if (!target) return null;
    const diff = new Date(target).getTime() - Date.now();
    if (diff <= 0) return null;

    const totalMinutes = Math.floor(diff / 60000);
    const days = Math.floor(totalMinutes / 1440);
    const hours = Math.floor((totalMinutes % 1440) / 60);
    const minutes = totalMinutes % 60;

    return [
        { label: 'Ngày', value: days },
        { label: 'Giờ', value: hours },
        { label: 'Phút', value: minutes },
    ];
}

export function classifyEvents(events = []) {
    const upcoming = [];
    const past = [];

    events.forEach((event) => {
        const phase = getEventPhase(event);
        if (phase.key === 'ended') past.push(event);
        else upcoming.push(event);
    });

    return { upcoming, past };
}
