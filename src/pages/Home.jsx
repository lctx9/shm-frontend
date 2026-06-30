import React, { useState, useEffect } from 'react';

const Home = () => {
    // Dữ liệu động giả lập của Giải đấu từ Backend truyền vào
    const [eventData, setEventData] = useState({
        title: "SEAL HACKATHON SUMMER 2026",
        subTitle: "CHUYÊN NGÀNH KỸ THUẬT PHẦN MỀM & PDP FPTU",
        description: "Cuộc thi học thuật thường niên tìm kiếm những giải pháp phần mềm đột phá. Đấu loại nghẹt thở qua 3 vòng thi, quy tụ toàn bộ sinh viên tài năng từ FPTU và các trường đại học đối tác danh tiếng.",
        status: "OPENING", // 'OPENING' (Đang mở đăng ký) hoặc 'ENDED' (Đã kết thúc)
        registrationDeadline: "2026-07-30T23:59:59",
        // Data phục vụ cho giai đoạn đang mở đăng ký
        prizePool: "50.000.000 VNĐ",
        maxTeams: 32,
        registeredTeamsCount: 14,
        tracks: ["Web App Innovation", "AI & Machine Learning", "IoT Sustainable Solution"],
        // Data phục vụ cho giai đoạn đã kết thúc (Ảnh 2 của bạn)
        stats: { athletes: 22, registrations: 58, matches: 102, categories: 3 },
        winners: [
            { track: "Web App Innovation", team: "APOLLO TECH", rank: "VÔ ĐỊCH", members: "Trần Như Tín / Lê Văn Chung" },
            { track: "AI & Machine Learning", team: "GEN AI FPTU", rank: "VÔ ĐỊCH", members: "Vũ Tuấn Thanh / Phạm Thị Nga" }
        ]
    });

    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

    // Logic tự động tính toán đếm ngược thời gian thực
    const calculateTimeLeft = (deadline) => {
        const difference = +new Date(deadline) - +new Date();
        let timeLeftStructure = { days: 0, hours: 0, minutes: 0, seconds: 0 };
        if (difference > 0) {
            timeLeftStructure = {
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60)
            };
        }
        return timeLeftStructure;
    };

    useEffect(() => {
        if (eventData.status !== 'OPENING') return;
        setTimeLeft(calculateTimeLeft(eventData.registrationDeadline));
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft(eventData.registrationDeadline));
        }, 1000);
        return () => clearInterval(timer);
    }, [eventData.registrationDeadline, eventData.status]);

    return (
        <div style={styles.container}>

            {/* KHỐI 1: HERO SECTION TO ĐÙNG ĐẬP VÀO MẮT (Ảnh 1) */}
            <section style={styles.heroSection}>
                <div style={styles.heroContent}>
                    <div style={{
                        ...styles.statusBadge,
                        backgroundColor: eventData.status === 'OPENING' ? '#e6fffa' : '#fff5f5',
                        color: eventData.status === 'OPENING' ? '#319795' : '#e53e3e',
                        borderColor: eventData.status === 'OPENING' ? '#319795' : '#e53e3e',
                    }}>
                        {eventData.status === 'OPENING' ? '🟢 CỔNG ĐĂNG KÝ ĐANG MỞ' : '🔴 GIẢI ĐẤU ĐÃ KẾT THÚC'}
                    </div>

                    <h4 style={styles.heroSubTitle}>{eventData.subTitle}</h4>
                    <h1 style={styles.heroMainTitle}>{eventData.title}</h1>
                    <p style={styles.heroDescription}>{eventData.description}</p>

                    {eventData.status === 'OPENING' ? (
                        <div style={styles.countdownContainer}>
                            <div style={styles.timerGrid}>
                                <div style={styles.timeBox}><span style={styles.timeNum}>{timeLeft.days}</span><span style={styles.timeUnit}>NGÀY</span></div>
                                <div style={styles.timeBox}><span style={styles.timeNum}>{timeLeft.hours}</span><span style={styles.timeUnit}>GIỜ</span></div>
                                <div style={styles.timeBox}><span style={styles.timeNum}>{timeLeft.minutes}</span><span style={styles.timeUnit}>PHÚT</span></div>
                                <div style={styles.timeBox}><span style={styles.timeNum}>{timeLeft.seconds}</span><span style={styles.timeUnit}>GIÂY</span></div>
                            </div>
                            <button style={styles.primaryBtn} onClick={() => alert("Chuyển tới trang đăng ký nhóm")}>
                                🚀 LẬP ĐỘI ĐĂNG KÝ THAM GIA NGAY
                            </button>
                        </div>
                    ) : (
                        <div>
                            <button style={styles.dangerBtn} onClick={() => alert("Cuộn nhanh xuống phần xem kết quả công cuộc")}>
                                🏆 XEM TOÀN BỘ KẾT QUẢ
                            </button>
                        </div>
                    )}
                </div>
            </section>

            {/* KHỐI 2: THÔNG SỐ ĐỘNG THEO TỪNG GIAI ĐOẠN (Ảnh 2) */}
            <section style={styles.statsSection}>
                <div style={styles.statsGrid}>
                    {eventData.status === 'OPENING' ? (
                        <>
                            <div style={styles.statsCard} onClick={() => alert("Xem chi tiết cơ cấu giải thưởng")}>
                                <span style={styles.statsNum}>💎 {eventData.prizePool}</span>
                                <span style={styles.statsLabel}>TỔNG GIÁ TRỊ GIẢI THƯỞNG</span>
                            </div>
                            <div style={styles.statsCard} onClick={() => alert("Xem danh sách các đội đã ghi danh")}>
                                <span style={styles.statsNum}>{eventData.registeredTeamsCount} / {eventData.maxTeams}</span>
                                <span style={styles.statsLabel}>ĐỘI THI ĐÃ ĐĂNG KÝ CHÍNH THỨC</span>
                            </div>
                        </>
                    ) : (
                        <>
                            <div style={styles.statsCard}><span style={styles.statsNum}>{eventData.stats.registrations}</span><span style={styles.statsLabel}>LƯỢT ĐĂNG KÝ</span></div>
                            <div style={styles.statsCard}><span style={styles.statsNum}>{eventData.stats.matches}</span><span style={styles.statsLabel}>TRẬN ĐẤU ĐÃ DIỄN RA</span></div>
                            <div style={styles.statsCard}><span style={styles.statsNum}>{eventData.stats.categories}</span><span style={styles.statsLabel}>HẠNG MỤC THI ĐẤU</span></div>
                        </>
                    )}
                </div>
            </section>

            {/* KHỐI 3: KẾT QUẢ CHUNG CUỘC HOẶC THÔNG TIN HẠNG MỤC ĐĂNG KÝ (Mấu chốt câu hỏi của bạn) */}
            <section style={styles.contentSection}>
                {eventData.status === 'OPENING' ? (
                    <div>
                        <h2 style={styles.sectionTitle}>CÁC HẠNG MỤC THI ĐẤU (TRACKS) ĐANG MỞ</h2>
                        <p style={styles.sectionDesc}>Thí sinh có thể lựa chọn 1 trong các hướng phát triển dưới đây để lập đội nộp đề tài:</p>
                        <div style={styles.trackGrid}>
                            {eventData.tracks.map((track, idx) => (
                                <div key={idx} style={styles.trackCard} onClick={() => alert(`Xem quy định và đề bài mẫu của Track: ${track}`)}>
                                    <h3 style={{color: PRIMARY_BLUE, marginBottom: '10px'}}>📌 Track {idx + 1}: {track}</h3>
                                    <p style={{fontSize: '14px', color: '#718096'}}>Nhấn để xem thể lệ riêng, danh sách Mentor hỗ trợ và bộ tiêu chí chấm điểm của hội đồng giám khảo dành riêng cho phân môn này.</p>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div>
                        <h2 style={styles.sectionTitle}>🏆 KẾT QUẢ CHUNG CUỘC</h2>
                        <div style={styles.trackGrid}>
                            {eventData.winners.map((winner, idx) => (
                                <div key={idx} style={styles.winnerCard} onClick={() => alert(`Xem giải pháp/sản phẩm của đội ${winner.team}`)}>
                                    <div style={styles.winnerBadge}>{winner.rank} - {winner.track}</div>
                                    <h3 style={{margin: '15px 0 5px 0', color: '#2d3748'}}>{winner.team}</h3>
                                    <p style={{fontSize: '14px', color: '#e53e3e', fontWeight: 'bold'}}>{winner.members}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </section>

            {/* NÚT TEST NHANH ĐỂ BẠN NHÌN THẤY SỰ THAY ĐỔI CỦA 2 GIAI ĐOẠN */}
            <section style={styles.testSection}>
                <span style={{fontSize: '13px', color: '#718096', fontWeight: 'bold'}}>[ Test Vòng Đời Giải Đấu ] Bấm để chuyển đổi giao diện:</span>
                <div style={{display: 'flex', gap: '10px', marginTop: '10px'}}>
                    <button style={styles.testBtn} onClick={() => setEventData(prev => ({ ...prev, status: 'OPENING' }))}>Giai đoạn 1: Đang mở cổng đăng ký (Hiện Countdown + Hạng mục thi)</button>
                    <button style={styles.testBtn} onClick={() => setEventData(prev => ({ ...prev, status: 'ENDED' }))}>Giai đoạn 2: Giải đấu đã kết thúc (Hiện kết quả vô địch giống ảnh mẫu)</button>
                </div>
            </section>

        </div>
    );
};

const PRIMARY_BLUE = '#3182ce';
const DARK_TEXT = '#2d3748';

const styles = {
    container: { backgroundColor: '#ffffff', color: DARK_TEXT, fontFamily: 'sans-serif', width: '100%' },
    heroSection: { padding: '80px 6%', backgroundColor: '#f7fafc', textAlign: 'center', borderBottom: '1px solid #edf2f7' },
    heroContent: { maxWidth: '850px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' },
    statusBadge: { padding: '6px 14px', fontSize: '11px', fontWeight: '700', borderRadius: '20px', border: '1px solid', marginBottom: '20px', letterSpacing: '0.5px' },
    heroSubTitle: { fontSize: '12px', fontWeight: '700', color: '#718096', letterSpacing: '2px', marginBottom: '10px' },
    heroMainTitle: { fontSize: '42px', fontWeight: '800', color: '#1a202c', marginBottom: '20px' },
    heroDescription: { fontSize: '15px', color: '#4a5568', lineHeight: '1.6', marginBottom: '35px' },
    countdownContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' },
    timerGrid: { display: 'flex', gap: '12px', marginBottom: '30px' },
    timeBox: { backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', width: '75px', height: '80px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' },
    timeNum: { fontSize: '24px', fontWeight: '800', color: PRIMARY_BLUE },
    timeUnit: { fontSize: '10px', color: '#a0aec0', marginTop: '4px', fontWeight: '600' },
    primaryBtn: { backgroundColor: PRIMARY_BLUE, color: '#ffffff', border: 'none', padding: '15px 35px', fontSize: '14px', fontWeight: '700', borderRadius: '4px', cursor: 'pointer', boxShadow: '0 4px 10px rgba(49,130,206,0.3)' },
    dangerBtn: { backgroundColor: '#e53e3e', color: '#ffffff', border: 'none', padding: '15px 35px', fontSize: '14px', fontWeight: '700', borderRadius: '4px', cursor: 'pointer' },
    statsSection: { padding: '40px 6%', backgroundColor: '#ffffff', display: 'flex', justifyContent: 'center' },
    statsGrid: { display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap', width: '100%', maxWidth: '900px' },
    statsCard: { flex: 1, minWidth: '200px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', padding: '20px', borderRadius: '8px', textAlign: 'center', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.01)' },
    statsNum: { display: 'block', fontSize: '26px', fontWeight: '800', color: '#e53e3e', marginBottom: '5px' },
    statsLabel: { fontSize: '11px', color: '#718096', fontWeight: '700', letterSpacing: '0.5px' },
    contentSection: { padding: '60px 6%', backgroundColor: '#fcfcfd', borderTop: '1px solid #edf2f7' },
    sectionTitle: { fontSize: '24px', fontWeight: '800', textAlign: 'center', marginBottom: '10px', color: '#1a202c' },
    sectionDesc: { textAlign: 'center', color: '#718096', fontSize: '14px', marginBottom: '40px' },
    trackGrid: { display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' },
    trackCard: { flex: '1', minWidth: '280px', maxWidth: '350px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', padding: '25px', borderRadius: '8px', cursor: 'pointer' },
    winnerCard: { flex: '1', minWidth: '280px', maxWidth: '400px', backgroundColor: '#fffaf0', border: '1px solid #fbd38d', padding: '25px', borderRadius: '8px', textAlign: 'center', cursor: 'pointer' },
    winnerBadge: { backgroundColor: '#feebc8', color: '#c05621', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '700', display: 'inline-block' },
    testSection: { padding: '20px 6%', backgroundColor: '#edf2f7', display: 'flex', flexDirection: 'column', alignItems: 'center', borderTop: '1px solid #e2e8f0' },
    testBtn: { backgroundColor: '#ffffff', color: '#4a5568', border: '1px solid #cbd5e0', padding: '6px 12px', fontSize: '12px', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }
};

export default Home;