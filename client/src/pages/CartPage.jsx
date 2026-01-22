import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { cartAPI, userAPI } from '../services/api';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './CartPage.css';

function CartPage() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [cart, setCart] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [userResponse, cartResponse] = await Promise.allSettled([
                    localStorage.getItem('token') ? userAPI.getCurrentUser() : Promise.resolve(null),
                    cartAPI.get()
                ]);

                if (userResponse.status === 'fulfilled' && userResponse.value) {
                    setUser(userResponse.value.data);
                } else if (userResponse.status === 'rejected' || !localStorage.getItem('token')) {
                    navigate('/login');
                    return;
                }

                if (cartResponse.status === 'fulfilled') {
                    setCart(cartResponse.value.data);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [navigate]);

    const handleLogout = useCallback(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        navigate('/login');
    }, [navigate]);

    const handleQuantityChange = async (itemId, newQuantity) => {
        if (newQuantity < 1) return;
        try {
            const response = await cartAPI.update(itemId, newQuantity);
            setCart(response.data);
        } catch (error) {
            console.error('Failed to update quantity:', error);
        }
    };

    const handleDelete = async (itemId) => {
        if (!window.confirm('장바구니에서 삭제하시겠습니까?')) return;
        try {
            const response = await cartAPI.delete(itemId);
            setCart(response.data);
        } catch (error) {
            console.error('Failed to delete item:', error);
        }
    };

    if (loading) return <div className="loading-screen">로딩 중...</div>;

    const shippingFee = 0; // 무료 배송 정책 (추후 로직 추가 가능)
    const finalPrice = (cart?.totalPrice || 0) + shippingFee;

    return (
        <div className="cart-page">
            <Header user={user} onLogout={handleLogout} />

            <main className="cart-content">
                <div className="cart-container">
                    <div className="cart-header">
                        {/* 뒤로 가기 버튼 (아이콘) */}
                        <button className="back-btn" onClick={() => navigate(-1)}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M19 12H5M12 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <h2 className="page-title">장바구니 ({cart?.totalQuantity || 0})</h2>
                    </div>

                    {!cart || !cart.items || cart.items.length === 0 ? (
                        <div className="empty-cart">
                            <p>장바구니에 담긴 상품이 없습니다.</p>
                            <button className="continue-shopping-btn" onClick={() => navigate('/')}>쇼핑하러 가기</button>
                        </div>
                    ) : (
                        <div className="cart-layout">
                            {/* 왼쪽: 상품 리스트 */}
                            <div className="cart-items-section">
                                {cart.items.map((item) => (
                                    <div key={item._id} className="cart-item-card">
                                        <div className="item-image-wrapper">
                                            <img src={item.product?.mainImage} alt={item.product?.name || '상품'} />
                                        </div>
                                        <div className="item-info">
                                            <div className="item-header-row">
                                                <h3 className="item-name">{item.product?.name || '상품 정보 없음'}</h3>
                                                <button className="delete-icon-btn" onClick={() => handleDelete(item._id)}>
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                                                    </svg>
                                                </button>
                                            </div>

                                            <p className="item-options-text">
                                                {item.options && Object.entries(item.options).map(([key, value]) => (
                                                    <span key={key} className="option-tag">{key}: {value}</span>
                                                ))}
                                            </p>

                                            <div className="item-price-row">
                                                <span className="current-price">{item.price?.toLocaleString()}원</span>
                                                {/* 원래 가격이나 할인율 표시 로직이 있다면 추가 가능 */}
                                            </div>

                                            <div className="item-actions-row">
                                                <div className="quantity-control">
                                                    <button onClick={() => handleQuantityChange(item._id, item.quantity - 1)}>-</button>
                                                    <span className="qty-value">{item.quantity}</span>
                                                    <button onClick={() => handleQuantityChange(item._id, item.quantity + 1)}>+</button>
                                                </div>
                                                <button className="save-for-later-btn">
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                                                    </svg>
                                                    나중에 구매
                                                </button>
                                            </div>

                                            <div className="stock-status">
                                                <span className="dot"></span> 재고 있음
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* 오른쪽: 주문 요약 */}
                            <div className="cart-summary-section">
                                <div className="summary-card">
                                    <h3 className="summary-title">주문 요약</h3>

                                    <div className="summary-row">
                                        <span>상품 금액 ({cart.totalQuantity}개)</span>
                                        <span>{cart.totalPrice?.toLocaleString()}원</span>
                                    </div>
                                    <div className="summary-row">
                                        <span>배송비</span>
                                        <span className="free-shipping">무료</span>
                                    </div>

                                    <div className="shipping-message">
                                        ✨ 무료 배송 혜택이 적용되었습니다!
                                    </div>

                                    <div className="divider"></div>

                                    <div className="summary-row total">
                                        <span>총 결제 금액</span>
                                        <span className="total-amount">{finalPrice.toLocaleString()}원</span>
                                    </div>

                                    <button className="checkout-btn-primary" onClick={() => navigate('/order')}>결제하기</button>
                                    <button className="continue-shopping-btn-outline" onClick={() => navigate('/')}>쇼핑 계속하기</button>

                                    <div className="payment-methods">
                                        {/* 결제 아이콘들 (텍스트로 대체) */}
                                        <span>VISA</span> <span>Mastercard</span> <span>PayPal</span>
                                    </div>

                                    <div className="secure-checkout">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                        </svg>
                                        안전한 결제 시스템
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}

export default CartPage;
