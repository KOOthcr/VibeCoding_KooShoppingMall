
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { productAPI, userAPI, cartAPI, wishlistAPI } from '../services/api';
import './ProductDetailPage.css';

function ProductDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);
    const [selectedOptions, setSelectedOptions] = useState({});
    const [quantity, setQuantity] = useState(1);

    // 로그아웃 핸들러
    const handleLogout = () => {
        localStorage.removeItem('token');
        setUser(null);
        navigate('/login');
    };

    const handleAddToCart = async () => {
        if (!user) {
            alert('로그인이 필요한 서비스입니다.');
            navigate('/login');
            return;
        }

        // 모든 옵션이 선택되었는지 확인
        if (product.options && product.options.length > 0) {
            const missingOptions = product.options.filter(opt => !selectedOptions[opt.name]);
            if (missingOptions.length > 0) {
                alert(`${missingOptions[0].name}을(를) 선택해주세요.`);
                return;
            }
        }

        // SKU 찾기
        let selectedSkuId = null;
        if (product.skus && product.skus.length > 0) {
            const sku = product.skus.find(s => {
                // 모든 옵션 키-값이 일치하는지 확인
                // s.combination은 Map이거나 객체일 수 있음. 
                // Product 모델 스키마에서는 combination: { type: Map, of: String }
                // Mongoose Map은 객체처럼 접근 불가할 수도 있으나, .get()이 필요할 수 있음.
                // 하지만 JSON으로 변환되어 내려온 데이터(res.json)는 보통 일반 객체로 변환됨 (toJSON virtuals: true 등 설정에 따라).
                // 확인된 Product.js에서 toJSON 설정은 virtuals만 있고 transform은 없음. 
                // 보통 Mongoose Map은 JSON으로 변환되면 객체가 됨.
                // 따라서 일반 객체처럼 접근 가능.
                return Object.entries(selectedOptions).every(([key, value]) => s.combination[key] === value);
            });
            if (sku) {
                selectedSkuId = sku.skuId;

                // 재고 확인
                if (sku.stock < quantity) {
                    alert('선택하신 상품의 재고가 부족합니다.');
                    return;
                }
            }
        }

        try {
            await cartAPI.add({
                productId: product._id,
                quantity,
                options: selectedOptions,
                skuId: selectedSkuId
            });

            if (window.confirm('장바구니에 상품이 담겼습니다. 장바구니로 이동하시겠습니까?')) {
                navigate('/cart');
            }
        } catch (error) {
            console.error('Failed to add to cart:', error);
            alert('장바구니 담기에 실패했습니다.');
        }
    };

    const handleAddToWishlist = async () => {
        if (!user) {
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

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [productResponse, userResponse] = await Promise.allSettled([
                    productAPI.getById(id),
                    localStorage.getItem('token') ? userAPI.getCurrentUser() : Promise.resolve(null)
                ]);

                if (productResponse.status === 'fulfilled') {
                    setProduct(productResponse.value.data);
                    setSelectedImage(productResponse.value.data.mainImage);
                } else {
                    console.error('Failed to fetch product:', productResponse.reason);
                }

                if (userResponse.status === 'fulfilled' && userResponse.value) {
                    setUser(userResponse.value.data);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    if (loading) return <div className="loading-container">Loading...</div>;
    if (!product) return <div className="error-container">상품을 찾을 수 없습니다.</div>;

    const discountRate = product.discountRate || (product.originalPrice && product.price < product.originalPrice
        ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
        : 0);

    return (
        <div className="product-detail-page">
            <Header user={user} onLogout={handleLogout} />

            <main className="main-content">
                <div className="product-detail-container">
                    {/* 왼쪽: 이미지 영역 */}
                    <div className="product-images-section">
                        <div className="thumbnail-list">
                            {/* 메인 이미지를 썸네일로도 표시 (추후 추가 이미지가 있다면 매핑) */}
                            <div
                                className={`thumbnail-item ${selectedImage === product.mainImage ? 'active' : ''}`}
                                onClick={() => setSelectedImage(product.mainImage)}
                            >
                                <img src={product.mainImage} alt={product.name} />
                            </div>
                            {/* 추가 이미지가 있다면 여기에 렌더링 */}
                        </div>
                        <div className="main-image-view">
                            <img src={selectedImage || product.mainImage} alt={product.name} />
                        </div>
                    </div>

                    {/* 오른쪽: 정보 영역 */}
                    <div className="product-info-section">
                        <div className="product-header">
                            <h1 className="product-title">{product.name}</h1>
                            <div className="product-price-box">
                                {product.originalPrice && (
                                    <span className="original-price">{product.originalPrice.toLocaleString()}원</span>
                                )}
                                <span className="current-price">{product.price.toLocaleString()}원</span>
                                {discountRate > 0 && (
                                    <span className="discount-rate">{discountRate}% OFF</span>
                                )}
                            </div>
                        </div>

                        <div className="product-options">
                            {product.options && product.options.map((option, index) => {
                                // 사이즈 옵션인 경우, 선택된 색상에 따라 유효한 값 필터링
                                let availableValues = null;
                                if (option.name === '사이즈' && selectedOptions['색상']) {
                                    const selectedColor = selectedOptions['색상'];
                                    // 해당 색상을 가진 SKU들 중 재고가 있는 것 찾기
                                    const validSkus = product.skus.filter(sku =>
                                        sku.combination['색상'] === selectedColor && sku.stock > 0
                                    );
                                    availableValues = new Set(validSkus.map(sku => sku.combination['사이즈']));
                                }

                                return (
                                    <div key={index} className="option-group">
                                        <label>{option.name}</label>
                                        <div className={option.type === 'color' ? "color-options" : "size-options"}>
                                            {option.values.map((valObj, vIndex) => {
                                                // 사이즈 옵션일 때 비활성화 여부 결정
                                                const isDisabled = availableValues && !availableValues.has(valObj.value);

                                                return (
                                                    <button
                                                        key={vIndex}
                                                        className={`
                                                            ${option.type === 'color' ? 'color-btn' : 'size-btn'}
                                                            ${selectedOptions[option.name] === valObj.value ? 'selected' : ''}
                                                            ${isDisabled ? 'disabled' : ''}
                                                        `}
                                                        style={option.type === 'color' ? { backgroundColor: valObj.code || '#000000' } : {}}
                                                        onClick={() => {
                                                            if (isDisabled) return;

                                                            const newSelected = { ...selectedOptions, [option.name]: valObj.value };

                                                            // 색상이 변경되면 이미지 변경 및 사이즈 초기화
                                                            if (option.name === '색상') {
                                                                if (valObj.image) {
                                                                    setSelectedImage(valObj.image);
                                                                } else {
                                                                    // 색상별 이미지가 없으면 메인 이미지로 복귀? 아니면 유지? -> 유지
                                                                }

                                                                // 색상이 바뀌면 하위 옵션(사이즈 등) 초기화
                                                                // 이 조건은 '색상' 옵션 자체에만 해당하므로, '사이즈' 옵션이 아닌 경우에만 하위 옵션을 초기화
                                                                // 현재 로직에서는 '색상' 옵션이 선택되었을 때만 이 블록에 들어오므로,
                                                                // '사이즈' 옵션이 아닌 경우라는 조건은 사실상 '색상' 옵션이 선택되었을 때
                                                                // 다른 하위 옵션(예: 사이즈)을 초기화하라는 의미로 해석
                                                                delete newSelected['사이즈']; // 색상 변경 시 사이즈 선택 초기화
                                                            }

                                                            setSelectedOptions(newSelected);
                                                        }}
                                                        title={isDisabled ? "품절" : valObj.value}
                                                        disabled={isDisabled}
                                                    >
                                                        {option.type !== 'color' && valObj.value}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}

                            {(!product.options || product.options.length === 0) && (
                                <p className="no-options-message">단일 옵션 상품입니다.</p>
                            )}

                            <div className="option-group">
                                <label>수량</label>
                                <div className="quantity-control">
                                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
                                    <span>{quantity}</span>
                                    <button onClick={() => setQuantity(quantity + 1)}>+</button>
                                </div>
                            </div>
                        </div>

                        <div className="action-buttons">
                            <button className="btn-cart" onClick={handleAddToCart}>장바구니 담기</button>
                            <button className="btn-wishlist" onClick={handleAddToWishlist}>♥</button>
                        </div>

                        <div className="product-meta">
                            <div className="meta-item">
                                <span>SKU: {product._id.slice(-6).toUpperCase()}</span>
                            </div>
                            <div className="meta-item">
                                <span>Category: {product.category?.main || product.category}</span>
                            </div>
                        </div>

                        <div className="accordion-menu">
                            <details className="accordion-item" open>
                                <summary>상품 설명</summary>
                                <div className="accordion-content">
                                    <p>{product.description || '상품 설명이 없습니다.'}</p>
                                </div>
                            </details>
                            <details className="accordion-item">
                                <summary>배송 및 반품</summary>
                                <div className="accordion-content">
                                    <p style={{ whiteSpace: 'pre-line' }}>{product.returnPolicy || '반품/교환 정책이 등록되지 않았습니다.'}</p>
                                    <div className="shipping-info-box" style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #eee' }}>
                                        <strong>배송 정보</strong>
                                        <p>배송 방법: {product.shipping?.method === 'COURIER' ? '택배 배송' : '직접 전달'}</p>
                                        <p>배송비: {product.shipping?.feeType === 'FREE' ? '무료' : `${product.shipping?.fee?.toLocaleString()}원`}</p>
                                    </div>
                                </div>
                            </details>
                            <details className="accordion-item">
                                <summary>리뷰</summary>
                                <div className="accordion-content">
                                    <p>리뷰 내용...</p>
                                </div>
                            </details>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default ProductDetailPage;
