import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { wishlistAPI } from '../services/api';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard'; // 재사용
import './WishlistPage.css';

function WishlistPage() {
    const navigate = useNavigate();
    const [wishlist, setWishlist] = useState({ items: [] });
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchWishlist = async () => {
            const token = localStorage.getItem('token');
            const storedUser = localStorage.getItem('user');

            if (!token) {
                alert('로그인이 필요한 서비스입니다.');
                navigate('/login');
                return;
            }

            if (storedUser) {
                setUser(JSON.parse(storedUser));
            }

            try {
                const response = await wishlistAPI.get();
                setWishlist(response.data);
            } catch (error) {
                console.error('Failed to fetch wishlist', error);
            } finally {
                setLoading(false);
            }
        };

        fetchWishlist();
    }, [navigate]);

    const handleRemove = async (e, productId) => {
        e.preventDefault();
        e.stopPropagation(); // 카드 클릭 방지

        if (!window.confirm('즐겨찾기에서 삭제하시겠습니까?')) return;

        try {
            await wishlistAPI.delete(productId);
            // 목록에서 즉시 제거 (서버 응답 기다리지 않고 UI 갱신하거나 응답값 쓰기)
            // 여기선 다시 fetch보다는 필터링
            setWishlist(prev => ({
                ...prev,
                items: prev.items.filter(item => item.product._id !== productId)
            }));
        } catch (error) {
            console.error('Failed to remove item', error);
            alert('삭제에 실패했습니다.');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        navigate('/login');
    };

    if (loading) return <div className="loading-screen">로딩 중...</div>;

    return (
        <div className="wishlist-page">
            <Header user={user} onLogout={handleLogout} />

            <main className="wishlist-content">
                <div className="container">
                    <h2 className="page-title">
                        ❤️ 즐겨찾기 상품
                    </h2>
                    <p className="page-subtitle">관심있는 상품을 모아보세요.</p>

                    {wishlist.items.length === 0 ? (
                        <div className="empty-wishlist">
                            <div className="icon">💔</div>
                            <p>즐겨찾기에 담긴 상품이 없습니다.</p>
                            <button className="btn-shop" onClick={() => navigate('/')}>상품 둘러보기</button>
                        </div>
                    ) : (
                        <div className="product-grid">
                            {wishlist.items.map(item => {
                                // ProductCard는 product 객체를 받음. item.product가 product 객체임.
                                // 근데 ProductCard 내부에 '위시리스트 추가' 버튼이 있음.
                                // 위시리스트 페이지에서는 '삭제' 버튼이어야 함.
                                // ProductCard를 수정하거나, 여기서 Wrapping 하여 버튼을 덮어씌우는게 좋음.
                                // 하지만 ProductCard 내부 구현상 버튼이 하드코딩 되어 있음.
                                // ProductCard에 isWishlistPage prop을 줘서 버튼을 바꾸는게 깔끔함.

                                return (
                                    <div key={item._id} className="wishlist-item-wrapper">
                                        <ProductCard product={item.product} />
                                        <button
                                            className="btn-remove-wishlist"
                                            onClick={(e) => handleRemove(e, item.product._id)}
                                            title="목록에서 삭제"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}

export default WishlistPage;
