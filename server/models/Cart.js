import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
        default: 1
    },
    // 선택된 옵션 (예: { "Color": "Red", "Size": "L" })
    options: {
        type: Map,
        of: String,
        default: {}
    },
    // 장바구니 담을 당시의 가격 (옵션 추가금 포함)
    price: {
        type: Number,
        required: true
    },
    // 선택된 SKU ID (재고 관리를 위해)
    skuId: {
        type: String
    }
});

const cartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true // 한 유저당 하나의 장바구니
    },
    items: [cartItemSchema],
    totalPrice: {
        type: Number,
        default: 0
    },
    totalQuantity: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// 아이템 변경 시 총 가격 및 수량 자동 계산 미들웨어
cartSchema.pre('save', function (next) {
    if (this.items) {
        this.totalPrice = this.items.reduce((total, item) => {
            return total + (item.price * item.quantity);
        }, 0);
        this.totalQuantity = this.items.reduce((total, item) => {
            return total + item.quantity;
        }, 0);
    }
    next();
});

const Cart = mongoose.model('Cart', cartSchema);

export default Cart;
