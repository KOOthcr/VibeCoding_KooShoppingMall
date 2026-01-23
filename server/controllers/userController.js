import User from '../models/User.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);


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

        // 로컬 계정이 아닌 경우 (비밀번호 없음)
        if (user.authProvider === 'google' && !user.password) {
            return res.status(400).json({ message: 'Please login with Google.' });
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

// 구글 로그인
export const googleLogin = async (req, res) => {
    try {
        const { access_token } = req.body;

        // 1. 구글 API로 사용자 정보 가져오기
        const response = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${access_token}`);

        if (!response.ok) {
            return res.status(400).json({ message: 'Invalid Google Token' });
        }

        const googleUser = await response.json();
        const { email, name, sub: googleId } = googleUser;

        // 2. 사용자 확인 또는 생성
        let user = await User.findOne({ email });

        if (user) {
            // 이미 존재하는 이메일
            if (!user.googleId) {
                // 기존 로컬 계정과 연동
                user.googleId = googleId;
                // user.authProvider = 'google'; // 기존 데이터 유지 혹은 변경. 여기서는 로컬+구글 허용 의미로 둠
                await user.save();
            }
        } else {
            // 신규 사용자
            user = new User({
                email,
                name: name,
                googleId,
                authProvider: 'google',
                userType: 'customer',
                // password는 required function에 의해 authProvider==='google'일 때 통과
            });
            await user.save();
        }

        // 3. 토큰 발급
        const token = jwt.sign(
            {
                userId: user._id,
                email: user.email,
                userType: user.userType
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Google Login successful',
            token,
            user: user.toJSON()
        });

    } catch (error) {
        console.error('Google Login Error:', error);
        res.status(500).json({ message: 'Internal Server Error during Google Login' });
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
