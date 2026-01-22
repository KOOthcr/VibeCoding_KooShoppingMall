import { Link, useNavigate } from 'react-router-dom';
import { cartAPI, wishlistAPI } from '../services/api';
import './ProductCard.css';

function ProductCard({ product }) {
    const navigate = useNavigate();

    const formatPrice = (price) => {
        return price.toLocaleString('ko-KR');
    };

    const handleAddToWishlist = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        const token = localStorage.getItem('token');
        if (!token) {
            if (window.confirm('로그인이 필요한 서비스입니다.\n로그인 페이지로 이동하시겠습니까?')) {
                navigate('/login');
            }
            return;
        }

        try {
            await wishlistAPI.add(product._id);
            if (window.confirm('상품을 즐겨찾기에 추가했습니다.\n즐겨찾기 페이지로 이동하시겠습니까?')) {
                navigate('/wishlist');
            }
        } catch (error) {
            console.error('Add to wishlist failed:', error);
            if (error.response && error.response.status === 400) {
                alert('이미 즐겨찾기에 추가된 상품입니다.');
            } else {
                alert('즐겨찾기 추가에 실패했습니다.');
            }
        }
    };

    const handleAddToCart = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        const token = localStorage.getItem('token');
        if (!token) {
            if (window.confirm('로그인이 필요한 서비스입니다.\n로그인 페이지로 이동하시겠습니까?')) {
                navigate('/login');
            }
            return;
        }

        try {
            await cartAPI.add({
                productId: product._id,
                quantity: 1,
            });

            if (window.confirm('장바구니에 상품을 담았습니다.\n장바구니로 이동하시겠습니까?')) {
                navigate('/cart');
            }
        } catch (error) {
            console.error('Add to cart failed:', error);
            alert('장바구니 추가에 실패했습니다.');
        }
    };

    // 할인가 계산 (가상 필드 discountRate 사용 또는 직접 계산)
    const discountRate = product.discountRate || (product.originalPrice && product.price < product.originalPrice
        ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
        : 0);

    const isSale = discountRate > 0;
    const isSoldOut = product.status === 'SOLD_OUT';

    // 할인율별 배지 색상 클래스 결정
    const getSaleBadgeClass = (rate) => {
        if (rate <= 10) return 'badge-sale white';
        if (rate <= 30) return 'badge-sale yellow';
        if (rate <= 60) return 'badge-sale orange';
        return 'badge-sale red';
    };

    // 신상 여부 (7일 이내)
    const isNew = product.createdAt && new Date() - new Date(product.createdAt) < 7 * 24 * 60 * 60 * 1000;

    return (
        <Link to={`/products/${product._id}`} className={`product-card ${isSoldOut ? 'sold-out' : ''}`}>
            {/* 상품 이미지 영역 */}
            <div className="product-image">
                {product.mainImage ? (
                    <img
                        src={product.mainImage}
                        alt={product.name}
                        className="product-img-real"
                        onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                        }}
                    />
                ) : null}

                <div className="image-placeholder" style={{ display: product.mainImage ? 'none' : 'flex' }}>
                    <svg className="placeholder-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </div>

                {/* 품절 오버레이 */}
                {isSoldOut && (
                    <div className="sold-out-overlay">
                        <span>SOLD OUT</span>
                    </div>
                )}

                {/* 배지 (품절이 아닐 때만 표시하거나, 품절이라도 표시할지 결정 - 여기서는 품절 시 숨김 처리 예시) */}
                {!isSoldOut && (
                    <div className="product-badges">
                        {isNew && <span className="badge badge-new">NEW</span>}
                        {isSale && <span className={`badge ${getSaleBadgeClass(discountRate)}`}>SALE {discountRate}%</span>}
                    </div>
                )}

                {/* 호버 액션 버튼 - 클릭 시 페이지 이동 방지 */}
                <div className="product-actions">
                    <button
                        className="action-btn"
                        title="위시리스트 추가"
                        onClick={handleAddToWishlist}
                    >
                        <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                    </button>
                    <button
                        className="action-btn"
                        title="장바구니 추가"
                        onClick={handleAddToCart}
                    >
                        <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* 상품 정보 */}
            <div className="product-info">
                <p className="product-category">{product.category?.main || product.category || '기타'}</p>
                <h3 className="product-name">{product.name}</h3>

                <div className="product-price">
                    {product.originalPrice ? (
                        <>
                            <span className="price-original">{formatPrice(product.originalPrice)}원</span>
                            <span className="price-current">{formatPrice(product.price)}원</span>
                        </>
                    ) : (
                        <span className="price-current">{formatPrice(product.price)}원</span>
                    )}
                </div>
            </div>
        </Link>
    );
}

export default ProductCard;
