import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { orderAPI, userAPI } from '../services/api';
import './OrderSuccessPage.css';

function OrderSuccessPage() {
    const { orderId } = useParams(); // URL 파라미터로 받은 주문 번호
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrderData = async () => {
            try {
                // 로그인 사용자 정보 확인
                const userRes = await userAPI.getCurrentUser();
                setUser(userRes.data);

                // 주문 내역 조회
                if (orderId) {
                    const orderRes = await orderAPI.getById(orderId); // 혹은 orderId로 조회하는 API 사용
                    // 여기서는 기존 getOrderById(ID)를 사용하거나, `getOrderByOrderId`를 사용해야 할 수 있음.
                    // orderController를 보니 `getOrderById`는 _id를 사용하고, `getOrderByOrderId`는 orderId 필드를 사용함.
                    // URL 파라미터가 '_id'인지 'orderId(문자열)'인지에 따라 다름.
                    // 편의상 _id를 받는다고 가정하거나, API 호출 실패 시 orderId로 재시도 하는 등 로직 필요.
                    // 일단 _id 기준으로 구현하고, 실제 넘길 때 _id를 넘기도록 유도.
                    setOrder(orderRes.data);
                }
            } catch (error) {
                console.error('주문 정보 로딩 실패:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchOrderData();
    }, [orderId]);

    if (loading) return <div className="loading-screen">로딩 중...</div>;

    // 주문 정보가 없을 때 (예: URL 직접 접근 실패 등)
    if (!loading && !order) {
        return (
            <div className="order-success-page">
                <Header user={user} onLogout={() => { }} />
                <main className="success-content error-state">
                    <h3>주문 정보를 찾을 수 없습니다.</h3>
                    <button onClick={() => navigate('/')}>메인으로 돌아가기</button>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="order-success-page">
            <Header user={user} onLogout={() => { }} />
            <main className="success-content">
                <div className="success-container">
                    <div className="icon-area">
                        <div className="success-icon">✔</div>
                    </div>
                    <h2>주문이 완료되었습니다!</h2>
                    <p className="success-msg">고객님의 주문이 성공적으로 접수되었습니다.</p>

                    <div className="order-info-card">
                        <div className="info-row">
                            <span className="label">주문 번호</span>
                            <span className="value">{order.orderId}</span>
                        </div>
                        <div className="info-row">
                            <span className="label">결제 금액</span>
                            <span className="value Price">{order.totalAmount.toLocaleString()}원</span>
                        </div>
                        <div className="info-row">
                            <span className="label">배송지</span>
                            <span className="value">{order.shippingAddress.address} {order.shippingAddress.detailAddress}</span>
                        </div>
                    </div>

                    <div className="button-group">
                        <button className="btn-home" onClick={() => navigate('/')}>쇼핑 계속하기</button>
                        <button className="btn-order-list" onClick={() => navigate('/orders')}>주문 목록 보기</button>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}

export default OrderSuccessPage;
