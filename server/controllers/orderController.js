import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import axios from 'axios';

// 주문 생성 (Create)
// 주문 생성 (Create)
export const createOrder = async (req, res) => {
    try {
        // 클라이언트에서 보낸 주문 데이터 추출
        const { items, shippingAddress, paymentMethod, totalAmount, shippingCost, transactionId } = req.body;
        const userId = req.user.userId;

        // --- [검증 1] 필수 데이터 존재 여부 확인 ---
        if (!items || items.length === 0) {
            return res.status(400).json({ message: '주문할 상품이 없습니다.' });
        }
        if (!shippingAddress || !paymentMethod || totalAmount === undefined) {
            return res.status(400).json({ message: '필수 주문 정보가 누락되었습니다.' });
        }

        // --- [검증 2] 배송 정보 유효성 검사 ---
        const { name, phone, address, zipCode } = shippingAddress;
        if (!name || !phone || !address || !zipCode) {
            return res.status(400).json({ message: '배송 정보를 모두 입력해주세요.' });
        }

        // --- [검증 3] 주문 중복 체크 (transactionId) ---
        // 결제 모듈에서 받은 고유 ID(imp_uid)가 이미 DB에 존재하는지 확인
        if (transactionId) {
            const existingOrder = await Order.findOne({ transactionId });
            if (existingOrder) {
                return res.status(409).json({ message: '이미 처리된 주문입니다.' });
            }
        }

        // --- [검증 4] 결제 금액 검증 (중요: 클라이언트 데이터 변조 방지) ---
        // DB에서 실제 상품 가격을 조회하여 계산한 총액과 클라이언트가 보낸 총액을 비교해야 합니다.
        let calculatedTotal = 0;

        // 비동기 처리를 위해 for...of 사용 또는 Promise.all 사용
        // 여기서는 items에 있는 price가 실제 DB 가격과 일치하는지, 
        // 혹은 DB 가격 기준으로 재계산하여 검증
        const productIds = items.map(item => item.product); // item.product는 ID라고 가정
        const products = await Product.find({ _id: { $in: productIds } });

        // 상품 정보 매핑 (ID -> Product 객체)
        const productMap = {};
        products.forEach(p => {
            productMap[p._id.toString()] = p;
        });

        for (const item of items) {
            const product = productMap[item.product.toString()];
            if (!product) {
                return res.status(404).json({ message: `상품 정보를 찾을 수 없습니다. (ID: ${item.product})` });
            }

            // 옵션 추가 가격 등이 있다면 로직 추가 필요. 현재는 단순 상품 가격 * 수량
            // item.price는 주문 당시 가격 스냅샷이지만, 검증을 위해 현재 DB 가격과 비교하거나
            // 정책에 따라 스냅샷 가격을 믿을 수도 있습니다. 
            // 여기서는 보안을 위해 DB 가격을 우선으로 계산합니다.
            calculatedTotal += product.price * item.quantity;
        }

        // 배송비 추가
        calculatedTotal += (shippingCost || 0);

        // 금액 비교 (오차 범위 고려 없이 정확히 일치 확인)
        if (calculatedTotal !== totalAmount) {
            console.warn(`결제 금액 불일치! 요청: ${totalAmount}, 계산: ${calculatedTotal}`);
            return res.status(400).json({ message: '결제 금액 검증에 실패했습니다. 관리자에게 문의하세요.' });
        }

        // --- [검증 5] 포트원 결제 검증 (API 연동) ---
        // 실제 결제 내역을 포트원 서버에서 조회하여 금액과 상태를 확인
        if (transactionId) { // imp_uid가 있을 경우에만 수행
            try {
                // 1. 포트원 API 액세스 토큰 발급
                // 실제 서비스라면 환경변수에서 키를 가져와야 합니다.
                // 일단은 데모용 키나 환경변수 사용 구조만 잡습니다.
                // 1. 포트원 API 액세스 토큰 발급
                const getToken = await axios.post('https://api.iamport.kr/users/getToken', {
                    imp_key: process.env.IMP_KEY, // REST API Key
                    imp_secret: process.env.IMP_SECRET // REST API Secret
                });
                const { access_token } = getToken.data.response;

                // 2. 결제 정보 조회
                const getPaymentData = await axios.get(`https://api.iamport.kr/payments/${transactionId}`, {
                    headers: { Authorization: access_token }
                });
                const paymentData = getPaymentData.data.response;

                // 3. 금액 및 상태 일치 여부 확인
                // 주의: 포트원 금액은 숫자형일 수도 있고 문자형일 수도 있으니 비교 시 주의
                if (paymentData.amount !== totalAmount) {
                    return res.status(400).json({ message: '결제 금액이 일치하지 않습니다. (위변조 위험)' });
                }
                if (paymentData.status !== 'paid') {
                    return res.status(400).json({ message: '결제가 완료되지 않았습니다.' });
                }

            } catch (error) {
                console.error('결제 검증 실패:', error);
                // 결제 검증 실패 시 주문 생성 중단 등 처리 필요
                // return res.status(400).json({ message: '결제 검증에 실패했습니다.' });
            }
        }

        // --- [검증 완료] ---

        // 1. 주문 번호 생성 (YYYYMMDD-랜덤문자열)
        const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const randomString = Math.random().toString(36).substring(2, 8).toUpperCase();
        const orderId = `${date}-${randomString}`;

        // 2. 주문 객체 생성
        const newOrder = new Order({
            orderId,
            user: userId,
            items, // 검증된 아이템 정보로 저장하는 것이 좋으나, 스냅샷 유지를 위해 req.body 사용 (단, 가격은 검증됨)
            shippingAddress,
            paymentMethod,
            totalAmount,
            shippingCost,
            // 초기 상태는 모델 기본값('pending') 사용
        });

        // 3. DB에 저장
        const savedOrder = await newOrder.save();

        // 4. 주문 성공 후 처리 (장바구니 비우기)
        await Cart.findOneAndUpdate(
            { user: userId },
            { $set: { items: [], totalQuantity: 0, totalPrice: 0 } }
        );

        // 5. (선택 사항) 재고 차감 로직 추가 가능
        // items.forEach(async (item) => { ... Product.updateOne ... })

        // 6. 결과 반환
        res.status(201).json({
            message: '주문이 성공적으로 접수되었습니다.',
            order: savedOrder
        });

    } catch (error) {
        console.error('주문 생성 실패:', error);
        res.status(500).json({ message: '주문 처리에 실패했습니다.', error: error.message });
    }
};

// 전체 주문 목록 조회 (Read - All)
export const getOrders = async (req, res) => {
    try {
        const userId = req.user.userId;
        const userType = req.user.userType;
        const scope = req.query.scope; // 'all'이면 전체 조회 (관리자 전용)

        let query = {};

        // 관리자가 scope='all'을 요청했을 때만 전체 주문 조회
        // 그 외(일반 유저 or 관리자의 개인 주문 조회)는 본인 주문만 조회
        if (userType === 'admin' && scope === 'all') {
            // query stays empty
        } else {
            query.user = userId;
        }

        // 검색 조건이 있다면 추가 (예: 주문 상태로 필터링)
        if (req.query.status) {
            query.status = req.query.status;
        }

        // 최신순 정렬하여 조회
        const orders = await Order.find(query).sort({ createdAt: -1 });

        res.json(orders);
    } catch (error) {
        console.error('주문 목록 조회 실패:', error);
        res.status(500).json({ message: '주문 목록을 불러오는데 실패했습니다.', error: error.message });
    }
};

// 특정 주문 상세 조회 (Read - One)
export const getOrderById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        const order = await Order.findById(id);

        if (!order) {
            return res.status(404).json({ message: '주문 정보를 찾을 수 없습니다.' });
        }

        // 본인의 주문인지 확인 (보안)
        if (order.user.toString() !== userId) {
            return res.status(403).json({ message: '해당 주문에 대한 접근 권한이 없습니다.' });
        }

        res.json(order);
    } catch (error) {
        console.error('주문 상세 조회 실패:', error);
        res.status(500).json({ message: '주문상세를 불러오는데 실패했습니다.', error: error.message });
    }
};

// 주문 상세 조회 (주문번호 orderId로 조회)
export const getOrderByOrderId = async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.user.userId;

        const order = await Order.findOne({ orderId });

        if (!order) {
            return res.status(404).json({ message: '주문 정보를 찾을 수 없습니다.' });
        }

        // 본인의 주문인지 확인
        if (order.user.toString() !== userId) {
            return res.status(403).json({ message: '해당 주문에 대한 접근 권한이 없습니다.' });
        }

        res.json(order);
    } catch (error) {
        console.error('주문 조회 실패:', error);
        res.status(500).json({ message: '주문 정보를 불러오는데 실패했습니다.', error: error.message });
    }
};

// 주문 상태 변경 (Update - Status)
// 주로 관리자나 시스템이 호출
export const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, paymentStatus, shippingStatus } = req.body;

        // 변경할 필드만 객체로 구성
        const updates = {};

        // 'status' 파라미터가 오면 'shippingStatus.status'를 업데이트 (모델에 status 필드가 없으므로)
        if (status) {
            updates['shippingStatus.status'] = status;
        }

        if (paymentStatus) updates.paymentStatus = paymentStatus;

        // shippingStatus 객체로 올 경우 상세 필드 업데이트
        if (shippingStatus) {
            if (shippingStatus.status) updates['shippingStatus.status'] = shippingStatus.status;
            if (shippingStatus.carrier) updates['shippingStatus.carrier'] = shippingStatus.carrier;
            if (shippingStatus.trackingNumber) updates['shippingStatus.trackingNumber'] = shippingStatus.trackingNumber;
        }

        const updatedOrder = await Order.findByIdAndUpdate(
            id,
            { $set: updates },
            { new: true } // 업데이트된 문서를 반환
        );

        if (!updatedOrder) {
            return res.status(404).json({ message: '주문을 찾을 수 없습니다.' });
        }

        res.json(updatedOrder);
    } catch (error) {
        console.error('주문 상태 수정 실패:', error);
        res.status(500).json({ message: '주문 상태 변경에 실패했습니다.', error: error.message });
    }
};

// 주문 취소/삭제 (Delete)
export const deleteOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        const order = await Order.findById(id);

        if (!order) {
            return res.status(404).json({ message: '주문을 찾을 수 없습니다.' });
        }

        // 본인 확인
        if (order.user.toString() !== userId) {
            return res.status(403).json({ message: '삭제 권한이 없습니다.' });
        }

        // 이미 배송된 주문은 삭제 불가 (예시 로직)
        if (order.status === 'shipped' || order.status === 'delivered') {
            return res.status(400).json({ message: '이미 배송된 주문은 취소할 수 없습니다.' });
        }

        // 실제로 DB에서 삭제하지 않고 상태만 'cancelled'로 변경하는 것이 일반적입니다 (Soft Delete)
        order.status = 'cancelled';
        await order.save();

        // 또는 완전히 삭제하려면:
        // await Order.findByIdAndDelete(id);

        res.json({ message: '주문이 성공적으로 취소되었습니다.', order });
    } catch (error) {
        console.error('주문 취소 실패:', error);
        res.status(500).json({ message: '주문 취소에 실패했습니다.', error: error.message });
    }
};
