import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productAPI } from '../../services/api';
import './AdminProducts.css';

// 카테고리 및 상태 상수 정의 (서버와 동일하게)
const MAIN_CATEGORIES = {
    TOP: '상의',
    BOTTOM: '하의',
    OUTER: '아우터',
    DRESS: '원피스',
    ACC: '잡화'
};

const PRODUCT_STATUS = {
    SELLING: '판매중',
    SOLD_OUT: '품절',
    HIDDEN: '노출전'
};

function AdminProducts() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    // 검색 및 필터 상태
    const [searchTerm, setSearchTerm] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        status: '',
        category: ''
    });

    // 페이지네이션 상태
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [limit] = useState(4); // 한 페이지당 4개
    const [inputPage, setInputPage] = useState(''); // 페이지 이동 입력값

    useEffect(() => {
        // 검색어나 필터가 변경될 때
        if (currentPage !== 1) {
            // 1페이지가 아니면 1페이지로 이동 (이후 page useEffect가 데이터를 가져옴)
            setCurrentPage(1);
        } else {
            // 이미 1페이지라면 바로 데이터 갱신
            fetchProducts(1);
        }
    }, [searchTerm, filters]);

    // 페이지 변경 시 해당 페이지 데이터 로드
    useEffect(() => {
        fetchProducts(currentPage);
    }, [currentPage]);

    const fetchProducts = async (page = currentPage) => {
        setLoading(true);
        try {
            const params = {
                page,
                limit,
                search: searchTerm,
                status: filters.status,
                category: filters.category
            };

            const response = await productAPI.getAll(params);

            // 서버 응답 구조 변경에 따른 처리
            if (response.data && response.data.products) {
                setProducts(response.data.products);
                setTotalPages(response.data.totalPages);
            } else {
                setProducts(response.data || []);
                setTotalPages(1);
            }
        } catch (error) {
            console.error('Failed to fetch products:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (productId) => {
        try {
            await productAPI.delete(productId);
            // 삭제 후 현재 페이지 다시 로드
            fetchProducts();
            setDeleteConfirm(null);
        } catch (error) {
            console.error('Failed to delete product:', error);
            alert('상품 삭제에 실패했습니다.');
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const clearFilters = () => {
        setSearchTerm('');
        setFilters({
            status: '',
            category: ''
        });
    };

    // 필터링은 서버에서 처리하므로 클라이언트 필터링 로직 제거

    const formatPrice = (price) => `₩${price.toLocaleString()}`;

    const formatStock = (stock) => {
        return stock > 9999 ? '9999+' : stock;
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    const handleGoToPage = () => {
        const pageNum = parseInt(inputPage);
        if (pageNum >= 1 && pageNum <= totalPages) {
            setCurrentPage(pageNum);
            setInputPage('');
        } else {
            alert(`1부터 ${totalPages} 사이의 페이지 번호를 입력해주세요.`);
        }
    };

    if (loading && products.length === 0) {
        return (
            <div className="admin-products">
                <div className="loading">데이터를 불러오는 중...</div>
            </div>
        );
    }

    return (
        <div className="admin-products">
            <div className="page-header">
                <h1 className="page-title">상품 관리</h1>
                <Link to="/admin/products/new" className="btn-primary">
                    <span className="btn-icon">➕</span>
                    상품 등록
                </Link>
            </div>

            {/* 검색 및 필터 영역 */}
            <div className="search-filter-container">
                <div className="search-bar">
                    <input
                        type="text"
                        placeholder="상품명으로 검색..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                    <button
                        className={`btn-filter ${showFilters ? 'active' : ''}`}
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <span className="btn-icon">🔍</span>
                        필터
                    </button>
                    {(searchTerm || filters.status || filters.category) && (
                        <button className="btn-reset" onClick={clearFilters}>
                            초기화
                        </button>
                    )}
                </div>

                {showFilters && (
                    <div className="filter-options">
                        <div className="filter-group">
                            <label>판매 상태</label>
                            <select
                                value={filters.status}
                                onChange={(e) => handleFilterChange('status', e.target.value)}
                            >
                                <option value="">전체</option>
                                {Object.entries(PRODUCT_STATUS).map(([key, label]) => (
                                    <option key={key} value={key}>{label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="filter-group">
                            <label>카테고리</label>
                            <select
                                value={filters.category}
                                onChange={(e) => handleFilterChange('category', e.target.value)}
                            >
                                <option value="">전체</option>
                                {Object.entries(MAIN_CATEGORIES).map(([key, label]) => (
                                    <option key={key} value={key}>{label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}
            </div>

            <div className="table-container">
                <table className="products-table">
                    <thead>
                        <tr>
                            <th className="col-image">이미지</th>
                            <th className="col-name">상품명</th>
                            <th className="col-description">상품설명</th>
                            <th className="col-status">판매상태</th>
                            <th className="col-category">카테고리</th>
                            <th className="col-price">가격</th>
                            <th className="col-shipping">배송비</th>
                            <th className="col-stock">재고</th>
                            <th className="col-origin">제조국</th>
                            <th className="col-actions">관리</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map((product) => (
                            <tr key={product._id}>
                                <td className="col-image">
                                    <div className="admin-product-image">
                                        {product.mainImage ? (
                                            <img src={product.mainImage} alt={product.name} />
                                        ) : (
                                            <div className="no-image">No Image</div>
                                        )}
                                    </div>
                                </td>
                                <td className="col-name">
                                    <p className="product-name">{product.name}</p>
                                </td>
                                <td className="col-description">
                                    <p className="product-description">{product.description?.substring(0, 80) || '-'}</p>
                                </td>
                                <td className="col-status">
                                    <span className={`status-badge status-${product.status?.toLowerCase()}`}>
                                        {product.status === 'SELLING' ? '판매중' :
                                            product.status === 'SOLD_OUT' ? '품절' :
                                                product.status === 'HIDDEN' ? '노출전' : product.status}
                                    </span>
                                </td>
                                <td className="col-category">
                                    <span className="badge">
                                        {product.category?.main || product.category}
                                    </span>
                                </td>
                                <td className="col-price">
                                    <span className="price">{formatPrice(product.price)}</span>
                                </td>
                                <td className="col-shipping">
                                    <div className="shipping-info">
                                        <span className={`shipping-badge ${product.shipping?.feeType?.toLowerCase()}`}>
                                            {product.shipping?.feeType === 'FREE' ? '무료' :
                                                product.shipping?.feeType === 'PAID' ? '유료' :
                                                    product.shipping?.feeType === 'CONDITIONAL_FREE' ? '조건부무료' : '-'}
                                        </span>
                                        {product.shipping?.feeType !== 'FREE' && (
                                            <small>{formatPrice(product.shipping?.fee || 0)}</small>
                                        )}
                                    </div>
                                </td>
                                <td className="col-stock">
                                    {product.useOptions ? (
                                        <span className="stock-badge in-stock">
                                            {formatStock(product.skus?.reduce((sum, sku) => sum + (sku.stock || 0), 0) || 0)}개
                                        </span>
                                    ) : (
                                        <span className={`stock-badge ${product.stock > 10 ? 'in-stock' : 'low-stock'}`}>
                                            {formatStock(product.stock || 0)}개
                                        </span>
                                    )}
                                </td>
                                <td className="col-origin">
                                    <span className="origin-text">{product.madeIn || '-'}</span>
                                </td>
                                <td className="col-actions">
                                    <div className="action-buttons">
                                        <Link to={`/admin/products/${product._id}/edit`} className="btn-icon-small">
                                            ✏️
                                        </Link>
                                        <button
                                            className="btn-icon-small btn-delete"
                                            onClick={() => setDeleteConfirm(product)}
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {products.length === 0 && (
                <div className="empty-state">
                    {searchTerm || filters.status || filters.category ? (
                        <p>검색 결과가 없습니다.</p>
                    ) : (
                        <p>등록된 상품이 없습니다.</p>
                    )}
                </div>
            )}

            {/* Pagination Controls */}
            {products.length > 0 && (
                <div className="pagination">
                    <button
                        className="pagination-btn prev-next"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                    >
                        ← 이전
                    </button>

                    <div className="pagination-pages">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <button
                                key={page}
                                className={`pagination-btn page-num ${currentPage === page ? 'active' : ''}`}
                                onClick={() => handlePageChange(page)}
                            >
                                {page}
                            </button>
                        ))}
                    </div>

                    <button
                        className="pagination-btn prev-next"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                    >
                        다음 →
                    </button>

                    <div className="page-search">
                        <input
                            type="number"
                            min="1"
                            max={totalPages}
                            value={inputPage}
                            onChange={(e) => setInputPage(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleGoToPage()}
                            placeholder="페이지"
                            className="page-search-input"
                        />
                        <button onClick={handleGoToPage} className="btn-go">이동</button>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Dialog */}
            {deleteConfirm && (
                <div className="dialog-overlay" onClick={() => setDeleteConfirm(null)}>
                    <div className="dialog" onClick={(e) => e.stopPropagation()}>
                        <h3 className="dialog-title">상품을 삭제하시겠습니까?</h3>
                        <p className="dialog-description">
                            이 작업은 되돌릴 수 없습니다. 상품이 영구적으로 삭제됩니다.
                        </p>
                        <div className="dialog-actions">
                            <button className="btn-secondary" onClick={() => setDeleteConfirm(null)}>
                                취소
                            </button>
                            <button className="btn-danger" onClick={() => handleDelete(deleteConfirm._id)}>
                                삭제
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminProducts;
