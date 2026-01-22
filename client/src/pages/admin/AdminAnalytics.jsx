import { useState, useEffect } from 'react';
import { orderAPI } from '../../services/api';
import './AdminAnalytics.css';

function AdminAnalytics() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('month'); // week, month, year

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const response = await orderAPI.getAll({ scope: 'all' });
            setOrders(response.data || []);
        } catch (error) {
            console.error('Failed to fetch orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatPrice = (price) => {
        if (price === undefined || price === null) return '₩0';
        return `₩${price.toLocaleString()}`;
    };

    // 매출 통계 계산
    const totalRevenue = orders.reduce((acc, order) => acc + (order.totalAmount || 0), 0);
    const completedOrders = orders.filter(o => o.status === 'delivered');
    const completedRevenue = completedOrders.reduce((acc, order) => acc + (order.totalAmount || 0), 0);
    // 평균 주문금액
    const avgOrderValue = orders.length > 0 ? Math.round(totalRevenue / orders.length) : 0;

    // 카테고리별 매출
    const categoryRevenue = {};
    orders.forEach(order => {
        order.items?.forEach(item => {
            const category = item.product?.category || '기타'; // product가 없을 수 있으니 주의. item에 category 저장 안되어있으면 product populate 필요.
            // 현재 구조상 order.items에 product 상세정보가 없을 수 있음.
            // 만약 item에 category 정보가 없다면 'Undefined'로 처리되거나 백엔드 쿼리 수정 필요.
            // 여기서는 일단 있는 정보로 처리.
            const catName = category || '기타';
            categoryRevenue[catName] = (categoryRevenue[catName] || 0) + (item.price * item.quantity);
        });
    });

    // 월별 매출 (최근 6개월)
    const monthlyRevenue = {};
    orders.forEach(order => {
        const date = new Date(order.createdAt);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlyRevenue[monthKey] = (monthlyRevenue[monthKey] || 0) + (order.totalAmount || 0);
    });

    if (loading) {
        return (
            <div className="admin-analytics">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>데이터를 불러오는 중입니다...</p>
                </div>
            </div>
        );
    }

    // 최대 매출값 계산 (그래프 비율용)
    const maxMonthlyRevenue = Math.max(...Object.values(monthlyRevenue), 1);
    const maxCategoryRevenue = Math.max(...Object.values(categoryRevenue), 1);

    return (
        <div className="admin-analytics">
            <div className="page-header">
                <div>
                    <h1 className="page-title">매출 분석</h1>
                    <p className="page-subtitle">쇼핑몰의 매출 현황과 성장 추이를 분석합니다.</p>
                </div>
                <div className="time-range-group">
                    <button className={`range-btn ${timeRange === 'week' ? 'active' : ''}`} onClick={() => setTimeRange('week')}>주간</button>
                    <button className={`range-btn ${timeRange === 'month' ? 'active' : ''}`} onClick={() => setTimeRange('month')}>월간</button>
                    <button className={`range-btn ${timeRange === 'year' ? 'active' : ''}`} onClick={() => setTimeRange('year')}>연간</button>
                </div>
            </div>

            {/* 매출 요약 */}
            <div className="stats-overview">
                <div className="stat-card blue">
                    <div className="stat-icon">💰</div>
                    <div className="stat-content">
                        <span className="stat-label">총 매출</span>
                        <span className="stat-value">{formatPrice(totalRevenue)}</span>
                        <span className="stat-desc">전체 기간 누적</span>
                    </div>
                </div>

                <div className="stat-card green">
                    <div className="stat-icon">✅</div>
                    <div className="stat-content">
                        <span className="stat-label">실매출 (배송완료)</span>
                        <span className="stat-value">{formatPrice(completedRevenue)}</span>
                        <span className="stat-desc">반품/취소 제외</span>
                    </div>
                </div>

                <div className="stat-card purple">
                    <div className="stat-icon">📊</div>
                    <div className="stat-content">
                        <span className="stat-label">객단가</span>
                        <span className="stat-value">{formatPrice(avgOrderValue)}</span>
                        <span className="stat-desc">주문 1건당 평균</span>
                    </div>
                </div>

                <div className="stat-card yellow">
                    <div className="stat-icon">📦</div>
                    <div className="stat-content">
                        <span className="stat-label">총 주문수</span>
                        <span className="stat-value">{orders.length}건</span>
                        <span className="stat-desc">누적 주문 건수</span>
                    </div>
                </div>
            </div>

            <div className="charts-grid">
                {/* 월별 매출 추이 */}
                <div className="chart-card">
                    <div className="card-header">
                        <h2 className="card-title">월별 매출 추이</h2>
                    </div>
                    <div className="chart-body">
                        {Object.keys(monthlyRevenue).length === 0 ? (
                            <div className="empty-chart">데이터가 없습니다.</div>
                        ) : (
                            <div className="bar-chart monthly">
                                {Object.entries(monthlyRevenue).sort().map(([month, revenue]) => (
                                    <div key={month} className="bar-group">
                                        <div className="bar-wrapper">
                                            <div className="bar-tooltip">{formatPrice(revenue)}</div>
                                            <div
                                                className="bar-fill"
                                                style={{ height: `${(revenue / maxMonthlyRevenue) * 100}%` }}
                                            ></div>
                                        </div>
                                        <span className="bar-label">{month}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* 카테고리별 매출 */}
                <div className="chart-card">
                    <div className="card-header">
                        <h2 className="card-title">카테고리별 매출</h2>
                    </div>
                    <div className="chart-body">
                        {Object.keys(categoryRevenue).length === 0 ? (
                            <div className="empty-chart">데이터가 없습니다.</div>
                        ) : (
                            <div className="horizontal-bar-chart">
                                {Object.entries(categoryRevenue)
                                    .sort(([, a], [, b]) => b - a)
                                    .map(([category, revenue]) => (
                                        <div key={category} className="h-bar-group">
                                            <div className="h-bar-info">
                                                <span className="category-name">{category}</span>
                                                <span className="category-amount">{formatPrice(revenue)}</span>
                                            </div>
                                            <div className="h-bar-track">
                                                <div
                                                    className="h-bar-fill"
                                                    style={{ width: `${(revenue / maxCategoryRevenue) * 100}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminAnalytics;
