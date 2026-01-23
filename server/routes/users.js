import express from 'express';
import {
    getAllUsers,
    getUserById,
    getUserByEmail,
    createUser,
    loginUser,
    googleLogin,
    updateUser,
    deleteUser,
} from '../controllers/userController.js';
import { authenticateToken, getCurrentUser } from '../middleware/auth.js';

const router = express.Router();

// GET /api/users/me - 토큰으로 현재 사용자 정보 조회 (인증 필요)
router.get('/me', authenticateToken, getCurrentUser);

// GET /api/users - 모든 사용자 조회
router.get('/', getAllUsers);

// GET /api/users/:id - 특정 사용자 조회
router.get('/:id', getUserById);

// GET /api/users/email/:email - 이메일로 사용자 조회
router.get('/email/:email', getUserByEmail);

// POST /api/users - 새 사용자 생성 (회원가입)
router.post('/', createUser);

// POST /api/users/google-login - 구글 로그인
router.post('/google-login', googleLogin);

// POST /api/users/login - 로그인
router.post('/login', loginUser);

// PUT /api/users/:id - 사용자 정보 수정
router.put('/:id', updateUser);

// DELETE /api/users/:id - 사용자 삭제
router.delete('/:id', deleteUser);

export default router;

