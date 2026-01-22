# VC Shopping Mall - Backend Server

Node.js + Express + MongoDB 기반 쇼핑몰 백엔드 서버

## 기술 스택

- **Node.js**: JavaScript 런타임
- **Express**: 웹 프레임워크
- **MongoDB**: NoSQL 데이터베이스
- **Mongoose**: MongoDB ODM

## 설치 및 실행

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경 변수 설정
`.env` 파일을 확인하고 필요시 수정:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/vc_shopping
NODE_ENV=development
```

### 3. MongoDB 실행
로컬 MongoDB가 실행 중인지 확인하거나, MongoDB Atlas URI를 사용하세요.

### 4. 서버 실행

**개발 모드 (nodemon 사용)**:
```bash
npm run dev
```

**프로덕션 모드**:
```bash
npm start
```

서버는 기본적으로 `http://localhost:5000`에서 실행됩니다.

## API 엔드포인트

### Products (상품)

#### 모든 상품 조회
```
GET /api/products
Query Parameters:
  - category: 카테고리 필터 (optional)
  - sort: 정렬 (price_asc, price_desc, newest) (optional)
```

#### 특정 상품 조회
```
GET /api/products/:id
```

#### 상품 생성
```
POST /api/products
Body: {
  name: String (required),
  price: Number (required),
  originalPrice: Number (optional),
  image: String (required),
  images: [String] (optional),
  category: String (required),
  colors: [String] (optional),
  sizes: [String] (optional),
  description: String (optional),
  stock: Number (required)
}
```

#### 상품 수정
```
PUT /api/products/:id
Body: (상품 생성과 동일)
```

#### 상품 삭제
```
DELETE /api/products/:id
```

### Orders (주문)

#### 모든 주문 조회
```
GET /api/orders
Query Parameters:
  - status: 상태 필터 (pending, processing, shipped, delivered, cancelled) (optional)
  - search: 주문번호 또는 주문자명 검색 (optional)
```

#### 특정 주문 조회 (MongoDB ID)
```
GET /api/orders/:id
```

#### 주문번호로 조회
```
GET /api/orders/orderId/:orderId
```

#### 주문 생성
```
POST /api/orders
Body: {
  orderId: String (required),
  items: [{
    product: ObjectId (required),
    quantity: Number (required),
    selectedColor: String (optional),
    selectedSize: String (optional),
    price: Number (required)
  }],
  total: Number (required),
  status: String (default: 'pending'),
  shippingAddress: {
    name: String (required),
    phone: String (required),
    address: String (required),
    detailAddress: String (optional),
    zipCode: String (required)
  },
  paymentMethod: String (required)
}
```

#### 주문 상태 변경
```
PATCH /api/orders/:id/status
Body: {
  status: String (pending, processing, shipped, delivered, cancelled)
}
```

#### 주문 삭제
```
DELETE /api/orders/:id
```

## 프로젝트 구조

```
server/
├── config/
│   └── db.js              # MongoDB 연결 설정
├── models/
│   ├── Product.js         # 상품 모델
│   └── Order.js           # 주문 모델
├── routes/
│   ├── products.js        # 상품 라우트
│   └── orders.js          # 주문 라우트
├── .env                   # 환경 변수
├── .gitignore            # Git 무시 파일
├── package.json          # 프로젝트 설정
├── server.js             # 메인 서버 파일
└── README.md             # 문서
```

## 데이터 모델

### Product (상품)
- name: 상품명
- price: 판매가
- originalPrice: 정가 (할인 표시용)
- image: 메인 이미지 URL
- images: 추가 이미지 URL 배열
- category: 카테고리
- colors: 색상 옵션
- sizes: 사이즈 옵션
- description: 상품 설명
- stock: 재고 수량

### Order (주문)
- orderId: 주문번호
- items: 주문 상품 목록
- total: 총 결제금액
- status: 주문 상태
- shippingAddress: 배송지 정보
- paymentMethod: 결제 수단

## 개발 팁

- `nodemon`을 사용하여 파일 변경 시 자동으로 서버가 재시작됩니다
- MongoDB Compass를 사용하여 데이터베이스를 시각적으로 관리할 수 있습니다
- Postman이나 Thunder Client를 사용하여 API를 테스트할 수 있습니다
