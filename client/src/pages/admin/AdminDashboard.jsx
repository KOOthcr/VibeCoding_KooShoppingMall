import { useState, useEffect } from 'react';
import { productAPI, orderAPI } from '../../services/api';
import './AdminDashboard.css';

function AdminDashboard() {
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [productsRes, ordersRes] = await Promise.all([
                    productAPI.getAll({ limit: 0 }),
                    orderAPI.getAll({ scope: 'all' })
                ]);
                setProducts(productsRes.data.products || productsRes.data || []);
                setOrders(ordersRes.data || []);
            } catch (error) {
                console.error('Failed to fetch data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const totalRevenue = orders.reduce((acc, order) => acc + (order.totalAmount || 0), 0);
    const totalProducts = products.length;
    const totalOrders = orders.length;
    const pendingOrders = orders.filter((o) => o.status === 'pending' || o.status === 'processing').length;
    const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    const formatPrice = (price) => {
        if (price === undefined || price === null) return '₩0';
        return `₩${price.toLocaleString()}`;
    };
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('ko-KR');
    };

    const recentOrders = orders.slice(0, 5);

    if (loading) {
        return (
            <div className="admin-dashboard">
                <div className="loading">데이터를 불러오는 중...</div>
            </div>
        );
    }

    return (
        <div className="admin-dashboard">
            <h1 className="page-title">대시보드</h1>

            {/* Stats Grid */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon-wrapper">💰</div>
                    <div className="stat-content">
                        <span className="stat-title">총 매출</span>
                        <div className="stat-value">{formatPrice(totalRevenue)}</div>
                        <p className="stat-description">전체 주문 기준</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon-wrapper">🛒</div>
                    <div className="stat-content">
                        <span className="stat-title">총 주문</span>
                        <div className="stat-value">{totalOrders}건</div>
                        <p className="stat-description">처리 대기 {pendingOrders}건</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon-wrapper">📦</div>
                    <div className="stat-content">
                        <span className="stat-title">등록 상품</span>
                        <div className="stat-value">{totalProducts}개</div>
                        <p className="stat-description">판매 가능 상품</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon-wrapper">📈</div>
                    <div className="stat-content">
                        <span className="stat-title">평균 주문금액</span>
                        <div className="stat-value">{formatPrice(avgOrderValue)}</div>
                        <p className="stat-description">주문당 평균</p>
                    </div>
                </div>
            </div>

            {/* Recent Orders */}
            <div className="recent-orders-card">
                <h2 className="card-title">최근 주문</h2>
                {recentOrders.length === 0 ? (
                    <p className="empty-message">아직 주문이 없습니다.</p>
                ) : (
                    <div className="orders-list">
                        {recentOrders.map((order) => (
                            <div key={order._id} className="order-item">
                                <div className="order-info">
                                    <p className="order-id">{order.orderId || order._id}</p>
                                    <p className="order-customer">{order.shippingAddress?.name || '고객명 없음'}</p>
                                </div>
                                <div className="order-details">
                                    <p className="order-total">{formatPrice(order.totalAmount)}</p>
                                    <p className="order-date">{formatDate(order.createdAt)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default AdminDashboard;
