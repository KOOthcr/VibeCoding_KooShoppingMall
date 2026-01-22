import { useState, useEffect } from 'react';
import { userAPI } from '../../services/api';
import './AdminCustomers.css';

function AdminCustomers() {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState(null);

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        try {
            const response = await userAPI.getAll();
            setCustomers(response.data || []);
        } catch (error) {
            console.error('Failed to fetch customers:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    };

    const formatPrice = (price) => {
        if (price === undefined || price === null) return '₩0';
        return `₩${price.toLocaleString()}`;
    };


    const filteredCustomers = customers.filter((customer) =>
        (customer.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (customer.email || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="admin-customers">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>데이터를 불러오는 중입니다...</p>
                </div>
            </div>
        );
    }

    // 신규 고객 (30일 이내 가입)
    const newCustomersCount = customers.filter(c => {
        const date = new Date(c.createdAt);
        const now = new Date();
        const diffDays = (now - date) / (1000 * 60 * 60 * 24);
        return diffDays <= 30;
    }).length;

    // 활성 고객 (주문 1건 이상)
    const activeCustomersCount = customers.filter(c => c.orders?.length > 0).length;

    // 평균 주문 수
    const avgOrderCount = customers.length > 0
        ? (customers.reduce((acc, c) => acc + (c.orders?.length || 0), 0) / customers.length).toFixed(1)
        : 0;

    return (
        <div className="admin-customers">
            <div className="page-header">
                <div>
                    <h1 className="page-title">고객 관리</h1>
                    <p className="page-subtitle">회원들의 가입 정보와 주문 이력을 관리합니다.</p>
                </div>
            </div>

            {/* 고객 통계 */}
            <div className="stats-overview">
                <div className="stat-card blue">
                    <div className="stat-icon">👥</div>
                    <div className="stat-content">
                        <span className="stat-label">총 고객 수</span>
                        <span className="stat-value">{customers.length}명</span>
                        <span className="stat-desc">전체 가입 회원</span>
                    </div>
                </div>

                <div className="stat-card green">
                    <div className="stat-icon">✨</div>
                    <div className="stat-content">
                        <span className="stat-label">신규 고객</span>
                        <span className="stat-value">{newCustomersCount}명</span>
                        <span className="stat-desc">최근 30일 이내 가입</span>
                    </div>
                </div>

                <div className="stat-card purple">
                    <div className="stat-icon">🔥</div>
                    <div className="stat-content">
                        <span className="stat-label">활성 고객</span>
                        <span className="stat-value">{activeCustomersCount}명</span>
                        <span className="stat-desc">상품 구매 경험 있음</span>
                    </div>
                </div>

                <div className="stat-card yellow">
                    <div className="stat-icon">📊</div>
                    <div className="stat-content">
                        <span className="stat-label">평균 주문 수</span>
                        <span className="stat-value">{avgOrderCount}건</span>
                        <span className="stat-desc">고객 1인당 평균</span>
                    </div>
                </div>
            </div>

            {/* 고객 목록 */}
            <div className="content-card">
                <div className="toolbar">
                    <div className="search-group">
                        <span className="search-icon">🔍</span>
                        <input
                            type="text"
                            placeholder="이름, 이메일로 검색"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="search-input"
                        />
                    </div>
                </div>

                <div className="table-wrapper">
                    <table className="customers-table">
                        <thead>
                            <tr>
                                <th>이름</th>
                                <th>이메일</th>
                                <th>전화번호</th>
                                <th>가입일</th>
                                <th className="text-center">주문 수</th>
                                <th className="text-center">관리</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCustomers.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="empty-state">
                                        <div className="icon">📭</div>
                                        <p>{customers.length === 0 ? '등록된 고객이 없습니다.' : '검색 결과가 없습니다.'}</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredCustomers.map((customer) => (
                                    <tr key={customer._id}>
                                        <td className="cell-name">
                                            <div className="customer-name-wrapper">
                                                <div className="avatar">{customer.name.charAt(0)}</div>
                                                <span className="name">{customer.name}</span>
                                            </div>
                                        </td>
                                        <td className="cell-email">{customer.email}</td>
                                        <td className="cell-phone">{customer.phone || '-'}</td>
                                        <td className="cell-date">{formatDate(customer.createdAt)}</td>
                                        <td className="cell-orders text-center">
                                            <span className={`order-tag ${customer.orders?.length > 0 ? 'active' : ''}`}>
                                                {customer.orders?.length || 0}건
                                            </span>
                                        </td>
                                        <td className="cell-action text-center">
                                            <button className="btn-detail" onClick={() => setSelectedCustomer(customer)}>
                                                상세보기
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 고객 상세 다이얼로그 */}
            {selectedCustomer && (
                <div className="modal-overlay" onClick={() => setSelectedCustomer(null)}>
                    <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>고객 상세 정보</h3>
                            <button className="btn-close" onClick={() => setSelectedCustomer(null)}>✕</button>
                        </div>
                        <div className="modal-content">
                            <div className="customer-profile-header">
                                <div className="large-avatar">{selectedCustomer.name.charAt(0)}</div>
                                <div className="profile-info">
                                    <span className="profile-name">{selectedCustomer.name}</span>
                                    <span className="profile-email">{selectedCustomer.email}</span>
                                </div>
                            </div>

                            <div className="info-section">
                                <h4>기본 정보</h4>
                                <div className="info-grid">
                                    <div className="info-item">
                                        <label>전화번호</label>
                                        <span>{selectedCustomer.phone || '-'}</span>
                                    </div>
                                    <div className="info-item">
                                        <label>가입일자</label>
                                        <span>{formatDate(selectedCustomer.createdAt)}</span>
                                    </div>
                                    {selectedCustomer.role && (
                                        <div className="info-item">
                                            <label>회원등급</label>
                                            <span className="role-badge">{selectedCustomer.role}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="info-section">
                                <h4>활동 요약</h4>
                                <div className="info-grid">
                                    <div className="info-item">
                                        <label>총 주문 횟수</label>
                                        <span className="stat-highlight">{selectedCustomer.orders?.length || 0}회</span>
                                    </div>
                                    <div className="info-item">
                                        <label>총 구매 금액</label>
                                        <span className="stat-highlight">{formatPrice(selectedCustomer.totalSpent)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminCustomers;
