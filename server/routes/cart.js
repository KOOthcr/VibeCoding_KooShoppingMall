import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
    getCart,
    addToCart,
    updateCartItem,
    deleteCartItem,
    clearCart
} from '../controllers/cartController.js';

const router = express.Router();

// 모든 장바구니 라우트에 인증 미들웨어 적용
router.use(authenticateToken);

// 장바구니 조회
router.get('/', getCart);

// 장바구니에 상품 추가
router.post('/', addToCart);

// 아이템 수량 수정
router.put('/items/:itemId', updateCartItem);

// 아이템 삭제
router.delete('/items/:itemId', deleteCartItem);

// 장바구니 비우기
router.delete('/', clearCart);

export default router;
