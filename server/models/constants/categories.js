// 카테고리 상수 정의
export const MAIN_CATEGORIES = {
    TOP: 'TOP',
    BOTTOM: 'BOTTOM',
    OUTER: 'OUTER',
    DRESS: 'DRESS',
    ACC: 'ACC'
};

export const SUB_CATEGORIES = {
    TOP: ['티셔츠', '셔츠', '니트/맨투맨'],
    BOTTOM: ['데님/팬츠', '슬랙스', '스커트'],
    OUTER: ['코트/자켓', '가디건/점퍼'],
    DRESS: ['미니원피스', '롱원피스'],
    ACC: ['가방', '신발', '액세서리']
};

export const CATEGORY_LABELS = {
    TOP: '상의',
    BOTTOM: '하의',
    OUTER: '아우터',
    DRESS: '원피스',
    ACC: '잡화'
};

// 판매 상태
export const PRODUCT_STATUS = {
    SELLING: 'SELLING',      // 판매중
    SOLD_OUT: 'SOLD_OUT',    // 품절
    HIDDEN: 'HIDDEN'         // 노출전
};

export const STATUS_LABELS = {
    SELLING: '판매중',
    SOLD_OUT: '품절',
    HIDDEN: '노출전'
};

// 과세 구분
export const TAX_TYPE = {
    TAXABLE: 'TAXABLE',      // 과세
    TAX_FREE: 'TAX_FREE'     // 면세
};

export const TAX_TYPE_LABELS = {
    TAXABLE: '과세',
    TAX_FREE: '면세'
};

// 배송비 정책
export const SHIPPING_FEE_TYPE = {
    FREE: 'FREE',                    // 무료
    PAID: 'PAID',                    // 유료
    CONDITIONAL_FREE: 'CONDITIONAL_FREE'  // 조건부 무료
};

export const SHIPPING_FEE_TYPE_LABELS = {
    FREE: '무료',
    PAID: '유료',
    CONDITIONAL_FREE: '조건부 무료'
};

// 배송 방법
export const SHIPPING_METHOD = {
    COURIER: 'COURIER',      // 택배
    QUICK: 'QUICK',          // 퀵서비스
    DIRECT: 'DIRECT'         // 직접배송
};

export const SHIPPING_METHOD_LABELS = {
    COURIER: '택배',
    QUICK: '퀵서비스',
    DIRECT: '직접배송'
};
