import User from '../models/User.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// 모든 사용자 조회 (주문 정보 포함)
export const getAllUsers = async (req, res) => {
    try {
        const { userType, search } = req.query;
        let matchQuery = {};

        // userType 필터
        if (userType && userType !== 'all') {
            matchQuery.userType = userType;
        }

        // 검색 (이름 또는 이메일)
        if (search) {
            matchQuery.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
            ];
        }

        const users = await User.aggregate([
            { $match: matchQuery },
            {
                $lookup: {
                    from: 'orders', // Order 컬렉션 이름 (mongoose 기본값은 소문자 복수형)
                    localField: '_id',
                    foreignField: 'user',
                    as: 'orders'
                }
            },
            {
                $addFields: {
                    totalSpent: { $sum: '$orders.totalAmount' },
                    orderCount: { $size: '$orders' }
                }
            },
            {
                $project: {
                    password: 0, // 비밀번호 제외
                    'orders.items': 0, // 주문 상품 상세는 데이터 크기 줄이기 위해 제외 (필요시 포함)
                    'orders.shippingAddress': 0,
                    'orders.paymentMethod': 0
                    // 필요한 필드만 남김
                }
            },
            { $sort: { createdAt: -1 } }
        ]);

        res.json(users);
    } catch (error) {
        console.error('Failed to get users with orders:', error);
        res.status(500).json({ message: error.message });
    }
};

// 특정 사용자 조회 (ID)
export const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 이메일로 사용자 조회
export const getUserByEmail = async (req, res) => {
    try {
        const user = await User.findOne({ email: req.params.email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 새 사용자 생성 (회원가입)
export const createUser = async (req, res) => {
    try {
        const { email, name, password, userType, address } = req.body;

        // 이메일 중복 체크
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        // 비밀번호 해싱
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // 새 사용자 생성
        const user = new User({
            email,
            name,
            password: hashedPassword,
            userType: userType || 'customer',
            address,
        });

        const newUser = await user.save();
        res.status(201).json(newUser);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// 로그인
export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 사용자 찾기
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // 비밀번호 확인
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // JWT 토큰 생성
        const token = jwt.sign(
            {
                userId: user._id,
                email: user.email,
                userType: user.userType
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' } // 7일 유효
        );

        // 비밀번호 제외하고 응답
        const userResponse = user.toJSON();
        res.json({
            message: 'Login successful',
            token,
            user: userResponse,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 사용자 정보 수정
export const updateUser = async (req, res) => {
    try {
        const { email, name, password, userType, address } = req.body;
        const updateData = {};

        // 업데이트할 필드만 추가
        if (email) updateData.email = email;
        if (name) updateData.name = name;
        if (userType) updateData.userType = userType;
        if (address !== undefined) updateData.address = address;

        // 비밀번호 변경 시 해싱
        if (password) {
            const saltRounds = 10;
            updateData.password = await bcrypt.hash(password, saltRounds);
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// 사용자 삭제
export const deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
