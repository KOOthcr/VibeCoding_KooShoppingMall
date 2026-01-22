# VC Shopping Mall - Client

React + Vite 기반 쇼핑몰 프론트엔드

## 기술 스택

- **React 18**: UI 라이브러리
- **Vite**: 빌드 도구 및 개발 서버
- **React Router**: 라우팅
- **Axios**: HTTP 클라이언트

## 설치 및 실행

### 1. 의존성 설치 (이미 완료됨)
```bash
npm install
```

### 2. 개발 서버 실행
```bash
npm run dev
```

개발 서버는 `http://localhost:5173`에서 실행됩니다.

### 3. 프로덕션 빌드
```bash
npm run build
```

빌드된 파일은 `dist` 폴더에 생성됩니다.

### 4. 프로덕션 미리보기
```bash
npm run preview
```

## 프로젝트 구조

```
client/
├── public/              # 정적 파일
├── src/
│   ├── components/      # 재사용 가능한 컴포넌트
│   ├── pages/          # 페이지 컴포넌트
│   ├── services/       # API 서비스
│   ├── App.jsx         # 메인 앱 컴포넌트
│   ├── main.jsx        # 엔트리 포인트
│   └── index.css       # 글로벌 스타일
├── index.html          # HTML 템플릿
├── package.json        # 프로젝트 설정
└── vite.config.js      # Vite 설정
```

## 백엔드 연동

백엔드 서버가 `http://localhost:5000`에서 실행 중이어야 합니다.

API 엔드포인트:
- Products: `http://localhost:5000/api/products`
- Orders: `http://localhost:5000/api/orders`

## 개발 가이드

### 새 페이지 추가
1. `src/pages/` 폴더에 새 컴포넌트 생성
2. `src/App.jsx`에 라우트 추가

### API 호출
`src/services/api.js`를 사용하여 백엔드와 통신

### 스타일링
- CSS Modules 또는 일반 CSS 사용 가능
- Tailwind CSS 추가 가능 (필요시)

## 사용 가능한 스크립트

- `npm run dev` - 개발 서버 실행
- `npm run build` - 프로덕션 빌드
- `npm run preview` - 빌드 결과 미리보기
- `npm run lint` - ESLint 실행

## 환경 변수

`.env` 파일을 생성하여 환경 변수를 설정할 수 있습니다:

```
VITE_API_URL=http://localhost:5000/api
```

코드에서 사용:
```javascript
const apiUrl = import.meta.env.VITE_API_URL;
```
