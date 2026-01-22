import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
    createOrder,
    getOrders,
    getOrderById,
    getOrderByOrderId,
    updateOrderStatus,
    deleteOrder
} from '../controllers/orderController.js';

const router = express.Router();

// 모든 라우트에 인증 미들웨어 적용
// 주문은 로그인한 사용자만 가능하므로 router 레벨에서 적용합니다.
router.use(authenticateToken);

// 1. 주문 생성 (POST /api/orders)
// 클라이언트에서 결제 완료 후 또는 결제 요청 시 호출
router.post('/', createOrder);

// 2. 주문 목록 조회 (GET /api/orders)
// 로그인한 사용자의 모든 주문 내역 조회
// 쿼리 파라미터(?status=Example)로 상태 필터링 가능
router.get('/', getOrders);

// 3. 특정 주문 상세 조회 (GET /api/orders/:id)
// 주문의 DB ID(_id)로 조회
router.get('/:id', getOrderById);

// 4. 주문번호로 상세 조회 (GET /api/orders/orderId/:orderId)
// 사용자에게 보여지는 주문번호(예: 20240101-ABCD)로 조회
router.get('/orderId/:orderId', getOrderByOrderId);

// 5. 주문 상태 변경 (PATCH /api/orders/:id/status)
// 배송 상태, 결제 상태 등을 업데이트
// TODO: 관리자 권한 체크 미들웨어 추가 필요 (현재는 로그인 유저 누구나 호출 가능하여 보안 취약)
router.patch('/:id/status', updateOrderStatus);

// 6. 주문 취소 (DELETE /api/orders/:id)
// 실제 삭제 대신 상태를 'cancelled'로 변경하도록 컨트롤러 구현됨
router.delete('/:id', deleteOrder);

export default router;
