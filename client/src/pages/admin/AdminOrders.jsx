import { useState, useEffect } from 'react';
import { orderAPI } from '../../services/api';
import './AdminOrders.css';

const statusMap = {
    pending: { label: '결제완료', color: 'blue', icon: '💳' },
    processing: { label: '상품준비중', color: 'yellow', icon: '📦' },
    shipped: { label: '배송중', color: 'purple', icon: '🚚' },
    delivered: { label: '배송완료', color: 'green', icon: '✅' },
    cancelled: { label: '취소/반품', color: 'red', icon: '❌' },
};

function AdminOrders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedOrder, setSelectedOrder] = useState(null);

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

    const handleStatusChange = async (orderId, newStatus) => {
        try {
            if (!window.confirm(`주문 상태를 '${statusMap[newStatus].label}'(으)로 변경하시겠습니까?`)) {
                return;
            }

            await orderAPI.updateStatus(orderId, newStatus);

            // 목록 새로고침
            await fetchOrders();

            // 모달이 열려있다면 모달 내부 데이터도 업데이트하거나 닫기
            // 여기서는 간단히 모달 닫기
            setSelectedOrder(null);

            alert('주문 상태가 변경되었습니다.');
        } catch (error) {
            console.error('Failed to update status:', error);
            alert('상태 변경에 실패했습니다.');
        }
    };

    const formatPrice = (price) => {
        if (price === undefined || price === null) return '₩0';
        return `₩${price.toLocaleString()}`;
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Helper to get status safely
    const getOrderStatus = (order) => order.shippingStatus?.status || 'pending';

    const filteredOrders = orders.filter((order) => {
        const matchesSearch = (order.orderId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (order.shippingAddress?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
        const currentStatus = getOrderStatus(order);
        const matchesStatus = statusFilter === 'all' || currentStatus === statusFilter;
        return matchesSearch && matchesStatus;
    });

    if (loading) {
        return (
            <div className="admin-orders">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>데이터를 불러오는 중입니다...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-orders">
            <div className="page-header">
                <h1 className="page-title">주문 관리</h1>
                <p className="page-subtitle">고객들의 주문 내역을 조회하고 상태를 관리합니다.</p>
            </div>

            {/* Stats Overview */}
            {orders.length > 0 && (
                <div className="stats-overview">
                    <div className="stat-card total">
                        <div className="stat-icon">📑</div>
                        <div className="stat-content">
                            <span className="stat-label">전체 주문</span>
                            <span className="stat-value">{orders.length}</span>
                        </div>
                    </div>
                    {Object.entries(statusMap).map(([key, config]) => {
                        const count = orders.filter(o => getOrderStatus(o) === key).length;
                        return (
                            <div key={key} className={`stat-card ${config.color}`}>
                                <div className="stat-icon">{config.icon}</div>
                                <div className="stat-content">
                                    <span className="stat-label">{config.label}</span>
                                    <span className="stat-value">{count}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Filters & Table */}
            <div className="content-card">
                <div className="toolbar">
                    <div className="search-group">
                        <span className="search-icon">🔍</span>
                        <input
                            type="text"
                            placeholder="주문번호, 주문자명 검색"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="search-input"
                        />
                    </div>
                    <div className="filter-group">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="status-select"
                        >
                            <option value="all">전체 상태 보기</option>
                            {Object.entries(statusMap).map(([key, config]) => (
                                <option key={key} value={key}>{config.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="table-wrapper">
                    <table className="orders-table">
                        <thead>
                            <tr>
                                <th>주문번호</th>
                                <th>주문일시</th>
                                <th>주문자 정보</th>
                                <th>주문 상품</th>
                                <th>결제금액</th>
                                <th>상태</th>
                                <th>관리</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="empty-state">
                                        <div className="icon">📭</div>
                                        <p>{orders.length === 0 ? '접수된 주문이 없습니다.' : '검색 결과가 없습니다.'}</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredOrders.map((order) => {
                                    const status = getOrderStatus(order);
                                    return (
                                        <tr key={order._id}>
                                            <td className="cell-id">
                                                <span className="order-id-badge">{order.orderId || order._id.slice(-8)}</span>
                                            </td>
                                            <td className="cell-date">{formatDate(order.createdAt)}</td>
                                            <td className="cell-user">
                                                <div className="user-info">
                                                    <span className="name">{order.shippingAddress?.name || '정보 없음'}</span>
                                                    <span className="phone">{order.shippingAddress?.phone}</span>
                                                </div>
                                            </td>
                                            <td className="cell-items">
                                                <div className="items-summary">
                                                    <span className="count">{order.items?.length || 0}개 상품</span>
                                                    <span className="preview">
                                                        {order.items?.[0]?.name}
                                                        {order.items?.length > 1 && ` 외 ${order.items.length - 1}건`}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="cell-amount">
                                                {formatPrice(order.totalAmount)}
                                            </td>
                                            <td className="cell-status">
                                                <select
                                                    value={status}
                                                    onChange={(e) => handleStatusChange(order._id, e.target.value)}
                                                    className={`status-select-badge ${statusMap[status]?.color || 'gray'}`}
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    {Object.entries(statusMap).map(([key, config]) => (
                                                        <option key={key} value={key}>{config.label}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="cell-action">
                                                <button className="btn-detail" onClick={() => setSelectedOrder(order)}>
                                                    상세보기
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Order Detail Modal */}
            {selectedOrder && (
                <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
                    <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>주문 상세 정보</h3>
                            <button className="btn-close" onClick={() => setSelectedOrder(null)}>✕</button>
                        </div>
                        <div className="modal-content">
                            <div className="info-section">
                                <div className="section-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <h4>기본 정보</h4>
                                    <div className="status-control">
                                        <select
                                            value={getOrderStatus(selectedOrder)}
                                            onChange={(e) => handleStatusChange(selectedOrder._id, e.target.value)}
                                            className={`status-select-badge ${statusMap[getOrderStatus(selectedOrder)]?.color || 'gray'}`}
                                        >
                                            {Object.entries(statusMap).map(([key, config]) => (
                                                <option key={key} value={key}>{config.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="info-grid">
                                    <div className="info-item">
                                        <label>주문번호</label>
                                        <span>{selectedOrder.orderId || selectedOrder._id}</span>
                                    </div>
                                    <div className="info-item">
                                        <label>주문일시</label>
                                        <span>{formatDate(selectedOrder.createdAt)}</span>
                                    </div>
                                    <div className="info-item">
                                        <label>주문상태</label>
                                        <span className={`status-text ${statusMap[getOrderStatus(selectedOrder)]?.color}`}>
                                            {statusMap[getOrderStatus(selectedOrder)]?.label}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="info-section">
                                <h4>배송 정보</h4>
                                <div className="info-grid">
                                    <div className="info-item">
                                        <label>받는 분</label>
                                        <span>{selectedOrder.shippingAddress?.name}</span>
                                    </div>
                                    <div className="info-item">
                                        <label>연락처</label>
                                        <span>{selectedOrder.shippingAddress?.phone}</span>
                                    </div>
                                    <div className="info-item full">
                                        <label>주소</label>
                                        <span>
                                            ({selectedOrder.shippingAddress?.zipCode}) {selectedOrder.shippingAddress?.address} {selectedOrder.shippingAddress?.detailAddress}
                                        </span>
                                    </div>
                                    <div className="info-item full">
                                        <label>배송메시지</label>
                                        <span>{selectedOrder.shippingAddress?.message || '-'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="info-section">
                                <h4>주문 상품</h4>
                                <ul className="product-list">
                                    {selectedOrder.items.map((item, idx) => (
                                        <li key={idx} className="product-item">
                                            <div className="product-thumb">
                                                {item.image && <img src={item.image} alt={item.name} />}
                                            </div>
                                            <div className="product-details">
                                                <span className="product-name">{item.name}</span>
                                                <span className="product-opt">
                                                    {item.options ? Object.values(item.options).join(' / ') : '-'} | {item.quantity}개
                                                </span>
                                            </div>
                                            <div className="product-price">
                                                {formatPrice(item.price * item.quantity)}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="info-section total-section">
                                <div className="total-row">
                                    <span>배송비</span>
                                    <span>{formatPrice(selectedOrder.shippingCost || 0)}</span>
                                </div>
                                <div className="total-row final">
                                    <span>총 결제금액</span>
                                    <span className="amount">{formatPrice(selectedOrder.totalAmount || 0)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminOrders;
