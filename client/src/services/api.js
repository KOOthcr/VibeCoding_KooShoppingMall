import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// 요청 인터셉터 추가: 모든 요청에 토큰 자동 포함
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 응답 인터셉터 추가: 토큰 만료 처리 등
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            // 토큰 만료나 권한 없음 시 로그아웃 처리 (선택 사항)
            // localStorage.removeItem('token');
            // localStorage.removeItem('user');
            // window.location.href = '/login'; // 강제 리다이렉트는 UX에 따라 신중히
        }
        return Promise.reject(error);
    }
);

// Products API
export const productAPI = {
    // 모든 상품 조회
    getAll: (params) => api.get('/products', { params }),

    // 특정 상품 조회
    getById: (id) => api.get(`/products/${id}`),

    // 상품 생성
    create: (data) => api.post('/products', data),

    // 상품 수정
    update: (id, data) => api.put(`/products/${id}`, data),

    // 상품 삭제
    delete: (id) => api.delete(`/products/${id}`),
};

// Orders API
export const orderAPI = {
    // 모든 주문 조회
    getAll: (params) => api.get('/orders', { params }),

    // 특정 주문 조회
    getById: (id) => api.get(`/orders/${id}`),

    // 주문번호로 조회
    getByOrderId: (orderId) => api.get(`/orders/orderId/${orderId}`),

    // 주문 생성
    create: (data) => api.post('/orders', data),

    // 주문 상태 변경
    updateStatus: (id, status) => api.patch(`/orders/${id}/status`, { status }),

    // 주문 삭제
    delete: (id) => api.delete(`/orders/${id}`),
};

// Users API
export const userAPI = {
    // 모든 사용자 조회
    getAll: (params) => api.get('/users', { params }),

    // 특정 사용자 조회
    getById: (id) => api.get(`/users/${id}`),

    // 이메일로 사용자 조회
    getByEmail: (email) => api.get(`/users/email/${email}`),

    // 회원가입
    create: (data) => api.post('/users', data),

    // 구글 로그인
    googleLogin: (data) => api.post('/users/google-login', data),

    // 로그인
    login: (data) => api.post('/users/login', data),

    // 현재 사용자 정보 조회 (토큰 필요)
    getCurrentUser: () => {
        return api.get('/users/me');
    },

    // 사용자 정보 수정
    update: (id, data) => api.put(`/users/${id}`, data),

    // 사용자 삭제
    delete: (id) => api.delete(`/users/${id}`),
};

// Cart API
export const cartAPI = {
    // 장바구니 조회
    get: () => api.get('/cart'),

    // 장바구니에 상품 추가
    add: (data) => api.post('/cart', data),

    // 아이템 수량 수정
    update: (itemId, quantity) => api.put(`/cart/items/${itemId}`, { quantity }),

    // 아이템 삭제
    delete: (itemId) => api.delete(`/cart/items/${itemId}`),

    // 장바구니 비우기
    clear: () => api.delete('/cart'),
};

// Wishlist API
export const wishlistAPI = {
    // 위시리스트 조회
    get: () => api.get('/wishlist'),

    // 추가
    add: (productId) => api.post('/wishlist', { productId }),

    // 삭제
    delete: (productId) => api.delete(`/wishlist/${productId}`),
};

export default api;

