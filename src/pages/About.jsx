import { Link } from 'react-router-dom';
import heroCourt from '../assets/OIP.png';

const ecosystem = [
    ['01', 'Thí sinh', 'Lập đội, chọn hạng mục và phát triển sản phẩm qua từng vòng thi.'],
    ['02', 'Mentor', 'Đồng hành về sản phẩm, kỹ thuật và cách biến ý tưởng thành prototype.'],
    ['03', 'Giám khảo', 'Đánh giá minh bạch theo rubric và phản hồi trực tiếp cho đội thi.'],
    ['04', 'Ban tổ chức', 'Điều phối mùa giải, lịch trình, bài nộp và kết quả trên một hệ thống.'],
];

const principles = [
    ['Build thật', 'Ưu tiên sản phẩm chạy được, giải quyết một vấn đề rõ ràng và có khả năng phát triển tiếp.'],
    ['Học qua phản hồi', 'Mỗi vòng thi là một cơ hội nhận góp ý từ mentor và cải thiện sản phẩm nhanh hơn.'],
    ['Ghi nhận minh bạch', 'Điểm số, giải thưởng và thành tích cá nhân được lưu lại rõ ràng trong hồ sơ.'],
];

export default function About() {
    return (
        <main className="about-devpost">
            <section className="about-devpost__hero">
                <div>
                    <p>Về SEAL Hackathon</p>
                    <h1>Nơi sinh viên biến ý tưởng thành sản phẩm thật</h1>
                    <span>SEAL kết nối thí sinh, mentor, giám khảo và ban tổ chức trong một hành trình xây dựng sản phẩm công nghệ có định hướng rõ ràng.</span>
                    <div className="about-devpost__actions"><Link to="/events">Khám phá hackathon</Link><Link to="/register">Tham gia cộng đồng</Link></div>
                </div>
                <div className="about-devpost__visual"><img src={heroCourt} alt="Không gian tổ chức SEAL Hackathon" /><div><strong>SEAL</strong><span>IDEATE · BUILD · SHIP</span></div></div>
            </section>

            <section className="about-devpost__mission">
                <p>Sứ mệnh của chúng tôi</p>
                <h2>Một sân chơi đủ thực tế để học, đủ thử thách để trưởng thành.</h2>
                <div><span>SEAL Hackathon tạo ra môi trường để sinh viên thử sức với bài toán thật trong thời gian giới hạn.</span><span>Hệ thống hỗ trợ toàn bộ hành trình từ tìm đồng đội, nộp bài, nhận đánh giá đến lưu giữ thành tích cho portfolio cá nhân.</span></div>
            </section>

            <section className="about-devpost__ecosystem">
                <div className="about-devpost__section-heading"><div><p>Hệ sinh thái</p><h2>Ai cùng tạo nên SEAL?</h2></div><span>Mỗi vai trò có một trách nhiệm rõ ràng, nhưng cùng hướng đến chất lượng trải nghiệm và sản phẩm của đội thi.</span></div>
                <div className="about-devpost__ecosystem-grid">{ecosystem.map(([number, title, copy]) => <article key={title}><span>{number}</span><h3>{title}</h3><p>{copy}</p></article>)}</div>
            </section>

            <section className="about-devpost__principles">
                <div><p>Giá trị cốt lõi</p><h2>Tinh thần của mỗi mùa giải</h2></div>
                <div>{principles.map(([title, copy]) => <article key={title}><span>✓</span><div><h3>{title}</h3><p>{copy}</p></div></article>)}</div>
            </section>

            <section className="about-devpost__cta">
                <div><p>Bắt đầu hành trình của bạn</p><h2>Sẵn sàng xây dựng điều gì đó đáng nhớ?</h2></div>
                <div><Link to="/events">Xem các sự kiện</Link><Link to="/leaderboard">Khám phá Hall of Fame</Link></div>
            </section>
        </main>
    );
}
