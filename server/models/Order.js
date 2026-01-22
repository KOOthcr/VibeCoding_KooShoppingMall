import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
    {
        // 1. 주문 기본 정보
        orderId: {
            type: String,
            required: true,
            unique: true,
            // 주문 고유 번호 (예: 20240118-1A2B3C)
            // 사용자에게 보여줄 때 사용하는 읽기 쉬운 식별자입니다.
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            // 주문한 회원 정보 (users 컬렉션 참조)
            // 누가 주문했는지 식별하기 위함입니다.
        },

        // 2. 주문 상품 목록 (스냅샷)
        // 상품 정보가 나중에 변경되거나 삭제되더라도 주문 당시의 정보는 보존되어야 하므로
        // 필요한 정보들을 복사해서 저장합니다.
        items: [
            {
                product: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Product',
                    required: true,
                    // 원본 상품 참조 (재고 관리, 상품 페이지 이동 등에 사용)
                },
                name: {
                    type: String,
                    required: true,
                    // 주문 당시의 상품명
                },
                image: {
                    type: String,
                    required: true,
                    // 주문 당시의 대표 이미지 URL
                    // 상품 이미지가 바뀌어도 주문 내역에는 주문 시점의 이미지가 보여야 합니다.
                },
                price: {
                    type: Number,
                    required: true,
                    // 주문 당시의 상품 단가 (개당 가격)
                    // 할인이 적용되었다면 할인된 최종 가격을 저장합니다.
                },
                quantity: {
                    type: Number,
                    required: true,
                    min: 1,
                    // 주문 수량
                },
                options: {
                    type: Map,
                    of: String,
                    // 선택한 옵션 정보
                    // 예: { "색상": "Blue", "사이즈": "M" } 형태로 유동적인 옵션을 저장합니다.
                },
                skuId: {
                    type: String,
                    // 재고 관리 단위(SKU) ID
                    // 어떤 구체적인 옵션 조합(재고)이 차감되어야 하는지 식별합니다.
                },
                status: {
                    type: String,
                    default: 'ordered',
                    enum: ['ordered', 'cancelled', 'returned'],
                    // 개별 상품의 상태 (주문됨, 취소됨, 반품됨 등)
                    // 전체 주문 취소가 아니라 일부 상품만 취소/반품하는 경우를 대비합니다.
                },
            },
        ],

        // 3. 결제 정보
        totalAmount: {
            type: Number,
            required: true,
            // 총 결제 금액 (상품 금액 합계 + 배송비)
        },
        shippingCost: {
            type: Number,
            default: 0,
            // 배송비 (무료 배송인 경우 0)
        },
        paymentMethod: {
            type: String,
            required: true,
            enum: ['card', 'bank', 'kakao', 'naver'],
            // 결제 수단 (카드, 무통장입금, 카카오페이, 네이버페이)
        },
        paymentStatus: {
            type: String,
            enum: ['pending', 'paid', 'failed', 'refunded'],
            default: 'pending',
            // 결제 상태
            // pending: 결제 대기 (입금 전)
            // paid: 결제 완료 (입금 확인됨)
            // failed: 결제 실패
            // refunded: 환불됨
        },
        transactionId: {
            type: String,
            // 결제 승인 번호 (PG사에서 발급해주는 고유 번호)
            // 결제 취소나 조회 시 필요합니다.
        },

        // 4. 배송 정보
        shippingAddress: {
            name: {
                type: String,
                required: true,
                // 수령인 이름
            },
            phone: {
                type: String,
                required: true,
                // 수령인 연락처
            },
            address: {
                type: String,
                required: true,
                // 기본 주소
            },
            detailAddress: String,
            // 상세 주소 (동, 호수 등)
            zipCode: {
                type: String,
                required: true,
                // 우편번호
            },
            message: String,
            // 배송 메시지 (예: "문 앞에 놔주세요")
        },
        shippingStatus: {
            status: {
                type: String,
                enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
                default: 'pending',
                // 배송 상태
                // pending: 배송 준비 전
                // processing: 배송 준비 중 (상품 포장 등)
                // shipped: 배송 시작 (택배사 인계됨)
                // delivered: 배송 완료
                // cancelled: 배송 취소
            },
            carrier: String,
            // 택배사 이름 (예: CJ대한통운, 우체국택배)
            trackingNumber: String,
            // 운송장 번호
        },
    },
    {
        timestamps: true,
        // 생성 시간(createdAt)과 수정 시간(updatedAt)을 자동으로 기록합니다.
    }
);

// 모델 생성
const Order = mongoose.model('Order', orderSchema);

export default Order;
