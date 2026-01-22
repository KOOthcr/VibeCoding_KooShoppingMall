import { useSearchParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useState, useEffect } from 'react';
import { userAPI } from '../services/api';
import './OrderSuccessPage.css'; // 재사용 (스타일이 비슷함, 필요시 분리)

function OrderFailPage() {
    const [searchParams] = useSearchParams();
    const message = searchParams.get('message') || '알 수 없는 오류가 발생했습니다.';
    const navigate = useNavigate();
    const [user, setUser] = useState(null);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await userAPI.getCurrentUser();
                setUser(res.data);
            } catch (err) {
                // ignore
            }
        };
        fetchUser();
    }, []);

    return (
        <div className="order-success-page">
            <Header user={user} onLogout={() => { }} />
            <main className="success-content">
                <div className="success-container">
                    <div className="icon-area">
                        <div className="success-icon" style={{ backgroundColor: '#ff4444' }}>!</div>
                    </div>
                    <h2>주문에 실패했습니다</h2>
                    <p className="success-msg" style={{ color: '#ff4444' }}>{message}</p>

                    <div className="button-group">
                        <button className="btn-home" onClick={() => navigate('/cart')} style={{ backgroundColor: '#666' }}>장바구니로 돌아가기</button>
                        <button className="btn-home" onClick={() => navigate('/')}>메인으로</button>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}

export default OrderFailPage;
