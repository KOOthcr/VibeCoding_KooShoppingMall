import { Link } from 'react-router-dom';

function Footer() {
    return (
        <footer className="footer">
            <div className="container">
                <div className="footer-content">
                    <div className="footer-section">
                        <h3>KOO</h3>
                        <p>당신의 스타일을 완성하는 쇼핑몰</p>
                    </div>
                    <div className="footer-section">
                        <h4>고객 서비스</h4>
                        <Link to="/help">고객센터</Link>
                        <Link to="/faq">자주 묻는 질문</Link>
                        <Link to="/shipping">배송 안내</Link>
                        <Link to="/returns">반품/교환</Link>
                    </div>
                    <div className="footer-section">
                        <h4>회사 정보</h4>
                        <Link to="/about">회사 소개</Link>
                        <Link to="/terms">이용약관</Link>
                        <Link to="/privacy">개인정보처리방침</Link>
                    </div>
                    <div className="footer-section">
                        <h4>소셜 미디어</h4>
                        <Link to="#">Instagram</Link>
                        <Link to="#">Facebook</Link>
                        <Link to="#">Twitter</Link>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>&copy; 2024 KOO. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}

export default Footer;
