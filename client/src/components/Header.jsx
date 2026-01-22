import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import { cartAPI, wishlistAPI } from '../services/api';

function Header({ user, onLogout }) {
    const navigate = useNavigate();
    const location = useLocation();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [cartCount, setCartCount] = useState(0);
    const [wishlistCount, setWishlistCount] = useState(0);

    const fetchCartCount = useCallback(async () => {
        if (!user) {
            setCartCount(0);
            return;
        }
        try {
            const response = await cartAPI.get();
            const count = response.data.totalQuantity || response.data.items?.reduce((acc, item) => acc + item.quantity, 0) || 0;
            setCartCount(count);
        } catch (error) {
            console.error('Failed to fetch cart count:', error);
        }
    }, [user]);

    const fetchWishlistCount = useCallback(async () => {
        if (!user) {
            setWishlistCount(0);
            return;
        }
        try {
            const response = await wishlistAPI.get();
            const items = response.data?.items || [];
            setWishlistCount(items.length);
        } catch (error) {
            console.error('Failed to fetch wishlist count:', error);
        }
    }, [user]);

    useEffect(() => {
        fetchCartCount();
        fetchWishlistCount();
    }, [fetchCartCount, fetchWishlistCount, location.pathname]); // 페이지 이동 시마다 갱신 (장바구니 변경 사항 반영 위해)

    const toggleDropdown = useCallback(() => {
        setDropdownOpen(prev => !prev);
    }, []);

    const toggleMobileMenu = useCallback(() => {
        setMobileMenuOpen(prev => !prev);
    }, []);

    const toggleSearch = useCallback(() => {
        setSearchOpen(prev => !prev);
    }, []);

    const handleLogout = useCallback(() => {
        setDropdownOpen(false);
        onLogout();
    }, [onLogout]);

    // 드롭다운 외부 클릭 시 닫기
    useEffect(() => {
        if (!dropdownOpen) return;

        const handleClickOutside = (event) => {
            if (!event.target.closest('.user-menu')) {
                setDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [dropdownOpen]);

    return (
        <header className="header">
            <div className="header-content">
                {/* Left Section - Navigation */}
                <div className="header-left">
                    {/* Mobile Menu Button */}
                    <button
                        className="mobile-menu-btn"
                        onClick={toggleMobileMenu}
                    >
                        <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>

                    {/* Desktop Navigation */}
                    <nav className="desktop-nav">
                        <Link to="/" className="nav-link">쇼핑하기</Link>
                        <Link to="/?sort=best" className="nav-link">베스트셀러</Link>
                        <Link to="/?sort=new" className="nav-link">신상품</Link>
                        <Link to="/?category=sale" className="nav-link">오늘의 기획전</Link>
                    </nav>
                </div>

                {/* Center - Logo */}
                <Link to="/" className="logo">
                    <h1>KOO</h1>
                </Link>

                {/* Right Section - Icons */}
                <div className="header-right">
                    {/* Search - Responsive */}
                    <div className="search-container">
                        {/* Desktop Search Input (1350px+) */}
                        <div className="search-input-desktop">
                            <svg className="search-icon-input" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="search"
                                placeholder="검색..."
                                className="search-input-field"
                            />
                        </div>

                        {/* Mobile Search Icon (<1350px) */}
                        <button className="search-icon-mobile" onClick={toggleSearch}>
                            <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </button>
                    </div>

                    {/* Admin Button - Only for admin users */}
                    {user && user.userType === 'admin' && (
                        <Link to="/admin">
                            <button className="admin-btn">어드민</button>
                        </Link>
                    )}

                    {/* User Menu or Login Button */}
                    {!user ? (
                        <Link to="/login">
                            <button className="login-btn">로그인</button>
                        </Link>
                    ) : (
                        <div className="user-menu">
                            <button className="user-button" onClick={toggleDropdown}>
                                {user.name}님 반갑습니다
                            </button>
                            {dropdownOpen && (
                                <div className="dropdown-menu">
                                    <div className="dropdown-header">
                                        <p className="user-name">{user.name}님</p>
                                        <p className="user-email">{user.email}</p>
                                    </div>
                                    <div className="dropdown-divider"></div>
                                    <button className="dropdown-item" onClick={() => navigate('/profile')}>
                                        내 정보
                                    </button>
                                    <button className="dropdown-item" onClick={() => navigate('/orders')}>
                                        주문 내역
                                    </button>
                                    <div className="dropdown-divider"></div>
                                    <button className="dropdown-item logout" onClick={handleLogout}>
                                        로그아웃
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Wishlist Icon */}
                    <Link to="/wishlist" className="icon-btn desktop-only">
                        <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        {wishlistCount > 0 && <span className="cart-badge">{wishlistCount}</span>}
                    </Link>

                    {/* Shopping Bag Icon */}
                    <Link to="/cart" className="icon-btn cart-btn">
                        <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                        <span className="cart-badge">{cartCount}</span>
                    </Link>
                </div>
            </div>

            {/* Search Dropdown */}
            {searchOpen && (
                <>
                    <div className="search-overlay" onClick={toggleSearch}></div>
                    <div className="search-dropdown">
                        <div className="search-input-wrapper">
                            <svg className="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="search"
                                placeholder="검색어를 입력하세요"
                                className="search-input"
                                autoFocus
                            />
                            <button className="search-close" onClick={toggleSearch}>
                                <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="mobile-menu">
                    <nav className="mobile-nav">
                        <Link to="/" className="mobile-nav-link" onClick={toggleMobileMenu}>쇼핑하기</Link>
                        <Link to="/?sort=best" className="mobile-nav-link" onClick={toggleMobileMenu}>베스트셀러</Link>
                        <Link to="/?sort=new" className="mobile-nav-link" onClick={toggleMobileMenu}>신상품</Link>
                        <Link to="/?category=sale" className="mobile-nav-link" onClick={toggleMobileMenu}>오늘의 기획전</Link>
                    </nav>
                </div>
            )}
        </header>
    );
}

Header.propTypes = {
    user: PropTypes.shape({
        name: PropTypes.string.isRequired,
        email: PropTypes.string.isRequired,
        userType: PropTypes.string
    }),
    onLogout: PropTypes.func.isRequired
};

export default Header;
