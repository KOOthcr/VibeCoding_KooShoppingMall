import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { userAPI, productAPI } from '../services/api';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import './MainPage.css';

function MainPage() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    // Sidebar & Filter States
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [sortOption, setSortOption] = useState('newest');
    const [selectedCategories, setSelectedCategories] = useState(new Set());
    const [selectedColors, setSelectedColors] = useState(new Set());

    // Accordion States
    const [openSections, setOpenSections] = useState({
        sort: true,
        category: true,
        color: true
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [userResponse, productsResponse] = await Promise.allSettled([
                    localStorage.getItem('token') ? userAPI.getCurrentUser() : Promise.resolve(null),
                    productAPI.getAll({ limit: 0 })
                ]);

                if (userResponse.status === 'fulfilled' && userResponse.value) {
                    setUser(userResponse.value.data);
                } else if (userResponse.status === 'rejected') {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                }

                if (productsResponse.status === 'fulfilled') {
                    const data = productsResponse.value.data;
                    const allProducts = data.products || [];
                    const visibleProducts = allProducts.filter(p => p.status !== 'HIDDEN');
                    setProducts(visibleProducts);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleLogout = useCallback(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        navigate('/login');
    }, [navigate]);

    // --- Filter Logic ---

    // Extract Colors from Products
    const availableColors = useState(() => {
        // This initial state will be updated when products load, but actually we need useMemo
        return [];
    });
    // Fix: usage of useMemo properly below

    const uniqueColors = useMemo(() => {
        const colors = new Set();
        products.forEach(p => {
            const colorOption = p.options?.find(opt => opt.name === '색상' || opt.type === 'color');
            if (colorOption) {
                colorOption.values.forEach(v => {
                    // Save both name and code if possible, but Set stores primitives well.
                    // We'll store JSON string or just name. Let's store name for filtering.
                    colors.add(JSON.stringify({ name: v.value, code: v.code }));
                });
            }
        });
        return Array.from(colors).map(c => JSON.parse(c));
    }, [products]);

    const uniqueCategories = useMemo(() => {
        const cats = new Set();
        products.forEach(p => {
            if (p.category?.main) cats.add(p.category.main);
        });
        return Array.from(cats);
    }, [products]);

    const filteredProducts = useMemo(() => {
        let result = [...products];

        // 1. Category Filter
        if (selectedCategories.size > 0) {
            result = result.filter(p => selectedCategories.has(p.category?.main));
        }

        // 2. Color Filter
        if (selectedColors.size > 0) {
            result = result.filter(p => {
                const colorOption = p.options?.find(opt => opt.name === '색상' || opt.type === 'color');
                if (colorOption) {
                    return colorOption.values.some(v => selectedColors.has(v.value));
                }
                return false;
            });
        }

        // 3. Sort
        switch (sortOption) {
            case 'price-low':
                result.sort((a, b) => a.price - b.price);
                break;
            case 'price-high':
                result.sort((a, b) => b.price - a.price);
                break;
            case 'newest':
            default:
                result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                break;
        }

        return result;
    }, [products, selectedCategories, selectedColors, sortOption]);

    // Handlers
    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    const toggleSection = (section) => {
        setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const handleCategoryCheck = (cat) => {
        const newSet = new Set(selectedCategories);
        if (newSet.has(cat)) newSet.delete(cat);
        else newSet.add(cat);
        setSelectedCategories(newSet);
    };

    const handleColorCheck = (colorName) => {
        const newSet = new Set(selectedColors);
        if (newSet.has(colorName)) newSet.delete(colorName);
        else newSet.add(colorName);
        setSelectedColors(newSet);
    };

    return (
        <div className={`main-page ${isSidebarOpen ? 'sidebar-open' : ''}`}>
            <Header user={user} onLogout={handleLogout} />

            <main className="main-content">
                <div className="main-container">
                    {/* Filter Controls Header */}
                    <div className="filter-controls">
                        <button className="filter-btn" onClick={toggleSidebar}>
                            <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                            </svg>
                            정렬 및 필터
                        </button>

                        <h2 className="section-title">ALL ({filteredProducts.length})</h2>

                        {/* Hidden/Removed Recommended Button */}
                        <div style={{ width: '100px' }}></div>
                    </div>

                    {/* Product Grid */}
                    <div className="product-grid">
                        {loading ? (
                            <div className="loading-state">Loading...</div>
                        ) : filteredProducts.length > 0 ? (
                            filteredProducts.map((product) => (
                                <ProductCard key={product._id} product={product} />
                            ))
                        ) : (
                            <div className="empty-state">조건에 맞는 상품이 없습니다.</div>
                        )}
                    </div>
                </div>
            </main>

            {/* Sidebar Overlay */}
            {isSidebarOpen && <div className="sidebar-overlay" onClick={toggleSidebar}></div>}

            {/* Filter Sidebar */}
            <aside className={`filter-sidebar ${isSidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <h3>정렬 및 필터</h3>
                    <button className="close-btn" onClick={toggleSidebar}>×</button>
                </div>

                <div className="sidebar-content">
                    {/* Sort Section */}
                    <div className="filter-section">
                        <button className="accordion-btn" onClick={() => toggleSection('sort')}>
                            정렬
                            <span className={`arrow ${openSections.sort ? 'up' : 'down'}`}>▼</span>
                        </button>
                        {openSections.sort && (
                            <div className="accordion-content">
                                <label className="radio-label">
                                    <input type="radio" name="sort" checked={sortOption === 'newest'} onChange={() => setSortOption('newest')} />
                                    신상품순
                                </label>
                                <label className="radio-label">
                                    <input type="radio" name="sort" checked={sortOption === 'price-low'} onChange={() => setSortOption('price-low')} />
                                    가격 낮은순
                                </label>
                                <label className="radio-label">
                                    <input type="radio" name="sort" checked={sortOption === 'price-high'} onChange={() => setSortOption('price-high')} />
                                    가격 높은순
                                </label>
                            </div>
                        )}
                    </div>

                    {/* Category Section */}
                    <div className="filter-section">
                        <button className="accordion-btn" onClick={() => toggleSection('category')}>
                            카테고리
                            <span className={`arrow ${openSections.category ? 'up' : 'down'}`}>▼</span>
                        </button>
                        {openSections.category && (
                            <div className="accordion-content checkbox-list">
                                {uniqueCategories.map(cat => (
                                    <label key={cat} className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={selectedCategories.has(cat)}
                                            onChange={() => handleCategoryCheck(cat)}
                                        />
                                        {cat}
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Color Section */}
                    <div className="filter-section">
                        <button className="accordion-btn" onClick={() => toggleSection('color')}>
                            색상
                            <span className={`arrow ${openSections.color ? 'up' : 'down'}`}>▼</span>
                        </button>
                        {openSections.color && (
                            <div className="accordion-content color-grid">
                                {uniqueColors.map((colorObj, idx) => (
                                    <button
                                        key={idx}
                                        className={`color-swatch-btn ${selectedColors.has(colorObj.name) ? 'selected' : ''}`}
                                        onClick={() => handleColorCheck(colorObj.name)}
                                        title={colorObj.name}
                                    >
                                        <span
                                            className="swatch"
                                            style={{ backgroundColor: colorObj.code || '#ddd' }}
                                        ></span>
                                        <span className="color-name">{colorObj.name}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="sidebar-footer">
                    <button className="reset-btn" onClick={() => {
                        setSelectedCategories(new Set());
                        setSelectedColors(new Set());
                        setSortOption('newest');
                    }}>초기화</button>
                    <button className="apply-btn" onClick={toggleSidebar}>결과 보기 ({filteredProducts.length})</button>
                </div>
            </aside>

            <Footer />
        </div>
    );
}

export default MainPage;
