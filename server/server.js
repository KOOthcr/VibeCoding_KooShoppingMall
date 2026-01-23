import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';

// 라우트 임포트
import productRoutes from './routes/products.js';
import orderRoutes from './routes/orders.js';
import userRoutes from './routes/users.js';
import cartRoutes from './routes/cart.js';
import wishlistRoutes from './routes/wishlist.js';

// 환경 변수 설정
dotenv.config();

// Express 앱 생성
const app = express();

// MongoDB 연결
connectDB();

// 미들웨어
app.use(cors({
    origin: (origin, callback) => {
        // 로컬 테스트, 모바일 앱, 포스트맨 등 origin이 없는 경우 허용
        if (!origin) return callback(null, true);

        // 허용할 도메인 패턴 확인
        if (origin.startsWith('http://localhost') ||
            origin.endsWith('.vercel.app') ||
            origin.endsWith('.cloudtype.app')) {
            return callback(null, true);
        }

        // 그 외는 차단
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 라우트
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);

// 기본 라우트
app.get('/', (req, res) => {
    res.json({ message: 'VC Shopping Mall API Server' });
});

// 에러 핸들링 미들웨어
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : {}
    });
});

// 서버 시작
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
});
