import mongoose from 'mongoose';
import {
    MAIN_CATEGORIES,
    SUB_CATEGORIES,
    PRODUCT_STATUS,
    TAX_TYPE,
    SHIPPING_FEE_TYPE,
    SHIPPING_METHOD
} from './constants/categories.js';

// SKU (재고 관리 단위) 스키마
const skuSchema = new mongoose.Schema({
    skuId: {
        type: String,
        required: true,
        unique: true
    },
    combination: {
        type: Map,
        of: String,
        required: true
    },
    stock: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    additionalPrice: {
        type: Number,
        default: 0
    }
}, { _id: false });

// 옵션 스키마
// 옵션 값 스키마
const optionValueSchema = new mongoose.Schema({
    value: {
        type: String,
        required: true
    },
    code: {
        type: String // 색상 코드 (예: #FF0000)
    },
    image: {
        type: String // 옵션별 이미지 URL (예: 색상별 상세 이미지)
    }
}, { _id: false });

// 옵션 스키마
const optionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['text', 'color'],
        default: 'text'
    },
    values: [optionValueSchema]
}, { _id: false });

// 배송 정보 스키마
const shippingSchema = new mongoose.Schema({
    feeType: {
        type: String,
        enum: Object.values(SHIPPING_FEE_TYPE),
        required: true,
        default: SHIPPING_FEE_TYPE.PAID
    },
    fee: {
        type: Number,
        min: 0,
        default: 0
    },
    freeCondition: {
        type: Number,
        min: 0
    },
    method: {
        type: String,
        enum: Object.values(SHIPPING_METHOD),
        required: true,
        default: SHIPPING_METHOD.COURIER
    }
}, { _id: false });

// 메인 상품 스키마
const productSchema = new mongoose.Schema(
    {
        // 1. 기본 정보
        productId: {
            type: String,
            required: [true, 'Product ID is required'],
            unique: true,
            trim: true
        },
        name: {
            type: String,
            required: [true, 'Product name is required'],
            trim: true
        },
        category: {
            main: {
                type: String,
                enum: Object.values(MAIN_CATEGORIES),
                required: [true, 'Main category is required']
            },
            sub: {
                type: String,
                required: [true, 'Sub category is required'],
                validate: {
                    validator: function (value) {
                        const mainCat = this.category?.main;
                        // 메인 카테고리가 없거나 서브 카테고리 목록이 없으면 통과
                        if (!mainCat || !SUB_CATEGORIES[mainCat]) {
                            return true;
                        }
                        return SUB_CATEGORIES[mainCat]?.includes(value);
                    },
                    message: 'Invalid sub category for the selected main category'
                }
            }
        },
        status: {
            type: String,
            enum: Object.values(PRODUCT_STATUS),
            required: [true, 'Product status is required'],
            default: PRODUCT_STATUS.HIDDEN
        },
        brand: {
            type: String,
            trim: true
        },

        // 2. 가격 및 판매 정보
        price: {
            type: Number,
            required: [true, 'Price is required'],
            min: [0, 'Price must be greater than or equal to 0']
        },
        originalPrice: {
            type: Number,
            min: [0, 'Original price must be greater than or equal to 0']
        },
        taxType: {
            type: String,
            enum: Object.values(TAX_TYPE),
            required: [true, 'Tax type is required'],
            default: TAX_TYPE.TAXABLE
        },

        // 3. 옵션 및 재고 관리
        useOptions: {
            type: Boolean,
            required: [true, 'Use options flag is required'],
            default: false
        },
        options: {
            type: [optionSchema],
            validate: {
                validator: function (value) {
                    if (this.useOptions && (!value || value.length === 0)) {
                        return false;
                    }
                    return true;
                },
                message: 'Options are required when useOptions is true'
            }
        },
        skus: {
            type: [skuSchema],
            validate: {
                validator: function (value) {
                    if (this.useOptions && (!value || value.length === 0)) {
                        return false;
                    }
                    return true;
                },
                message: 'SKUs are required when useOptions is true'
            }
        },
        stock: {
            type: Number,
            min: [0, 'Stock must be greater than or equal to 0'],
            default: 0,
            validate: {
                validator: function (value) {
                    // useOptions가 false일 때만 stock 필드 사용
                    if (!this.useOptions && value === undefined) {
                        return false;
                    }
                    return true;
                },
                message: 'Stock is required when not using options'
            }
        },

        // 4. 이미지 및 상세 설명
        mainImage: {
            type: String,
            required: [true, 'Main image is required']
        },
        additionalImages: [{
            type: String
        }],
        description: {
            type: String,
            required: [true, 'Product description is required']
        },

        // 5. 배송 및 정책
        shipping: {
            type: shippingSchema,
            default: {
                feeType: 'PAID',
                fee: 0,
                method: 'COURIER'
            }
        },
        returnPolicy: {
            type: String,
            default: '상품 수령 후 7일 이내 교환/반품 가능합니다.'
        },

        // 6. 법적 고지
        material: {
            type: String,
            default: '상품 상세 참조'
        },
        washingMethod: {
            type: String,
            default: '상품 상세 참조'
        },
        madeIn: {
            type: String,
            default: '대한민국'
        },
        kcCertification: {
            type: String,
            trim: true
        }
    },
    {
        timestamps: true
    }
);

// 인덱스 설정
productSchema.index({ productId: 1 }, { unique: true });
productSchema.index({ 'category.main': 1, 'category.sub': 1 });
productSchema.index({ status: 1 });
productSchema.index({ createdAt: -1 });

// 가상 필드: 할인율 계산
productSchema.virtual('discountRate').get(function () {
    if (this.originalPrice && this.originalPrice > this.price) {
        return Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
    }
    return 0;
});

// JSON 변환 시 가상 필드 포함
productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

const Product = mongoose.model('Product', productSchema);

export default Product;
