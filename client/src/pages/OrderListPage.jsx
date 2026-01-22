import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderAPI, userAPI } from '../services/api';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './OrderListPage.css';

function OrderListPage() {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState('all');

    const tabs = [
        { id: 'all', label: '전체' },
        { id: 'pending', label: '배송준비' }, // pending, processing
        { id: 'shipped', label: '배송중' },
        { id: 'delivered', label: '배송완료' },
        { id: 'cancelled', label: '취소/반품' }
    ];

    useEffect(() => {
        const loadData = async () => {
            try {
                // 1. 사용자 정보 확인
                const userRes = await userAPI.getCurrentUser();
                setUser(userRes.data);

                // 2. 주문 목록 조회
                // params 없이 호출하면 서버 컨트롤러에서 자동으로 본인의 주문만 조회하도록 되어 있음 (getOrders)
                const orderRes = await orderAPI.getAll();
                setOrders(orderRes.data);
            } catch (error) {
                console.error('주문 목록 로딩 실패:', error);
                // 로그인 안된 상태라면 로그인 페이지로 (401/403 등)
                // 하지만 api.js 인터셉터에서 처리가 될 수도 있음.
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const getFilteredOrders = () => {
        if (activeTab === 'all') return orders;
        return orders.filter(order => {
            // 모델에 status가 없으므로 shippingStatus.status를 사용. 없으면 pending으로 가정.
            const status = order.shippingStatus?.status || 'pending';

            if (activeTab === 'pending') {
                return status === 'pending' || status === 'processing';
            }
            return status === activeTab;
        });
    };

    const filteredOrders = getFilteredOrders();

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        navigate('/login');
    };

    if (loading) return <div className="loading-screen">로딩 중...</div>;

    return (
        <div className="order-list-page">
            <Header user={user} onLogout={handleLogout} />
            <main className="order-list-content">
                <div className="container">
                    <h2 className="page-title">내 주문 목록</h2>

                    <div className="order-tabs">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {filteredOrders.length === 0 ? (
                        <div className="empty-orders">
                            <p>해당하는 주문 내역이 없습니다.</p>
                            {activeTab === 'all' && (
                                <button className="btn-shop" onClick={() => navigate('/')}>쇼핑하러 가기</button>
                            )}
                        </div>
                    ) : (
                        <div className="order-list">
                            {filteredOrders.map(order => {
                                // 뱃지 표시용 상태
                                const status = order.shippingStatus?.status || 'pending';

                                return (
                                    <div key={order._id} className="order-card">
                                        <div className="order-header">
                                            <div className="order-date-id">
                                                <span className="date">{new Date(order.createdAt).toLocaleDateString()}</span>
                                                <span className="order-id">({order.orderId})</span>
                                            </div>
                                            <button className="btn-detail" onClick={() => navigate(`/order/success/${order._id}`)}>상세보기</button>
                                        </div>
                                        <div className="order-items">
                                            {order.items.map((item, idx) => (
                                                <div key={idx} className="order-item">
                                                    <div className="item-image">
                                                        {/* 이미지가 있으면 표시, 없으면 placeholder */}
                                                        {item.image ? (
                                                            <img src={item.image} alt={item.name} />
                                                        ) : (
                                                            <div className="no-image"></div>
                                                        )}
                                                    </div>
                                                    <div className="item-info">
                                                        <span className="item-name">{item.name}</span>
                                                        <span className="item-meta">{item.quantity}개 / {item.price.toLocaleString()}원</span>
                                                        {item.options && Object.keys(item.options).length > 0 && (
                                                            <span className="item-options">
                                                                옵션: {Object.values(item.options).join(', ')}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="item-status">
                                                        {/* 주문 상태 표시 (한글화) */}
                                                        <span className={`status-badge ${status}`}>
                                                            {(status === 'pending' || status === 'processing') && '배송준비'}
                                                            {status === 'shipped' && '배송중'}
                                                            {status === 'delivered' && '배송완료'}
                                                            {status === 'cancelled' && '취소/반품'}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="order-footer">
                                            <span className="total-amount">총 결제금액: <strong>{order.totalAmount.toLocaleString()}원</strong></span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    );
}

export default OrderListPage;
