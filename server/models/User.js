import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
        },
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
            validate: {
                validator: function (name) {
                    // 한글만 (공백 불가)
                    const koreanOnly = /^[가-힣]+$/;
                    // 영문만 (단어 사이 공백 1개만)
                    const englishOnly = /^[a-zA-Z]+(\s[a-zA-Z]+)*$/;
                    // 한글+영문 혼합 (단어 사이 공백 1개만)
                    const mixed = /^[가-힣a-zA-Z]+(\s[가-힣a-zA-Z]+)*$/;

                    return koreanOnly.test(name) || englishOnly.test(name) || mixed.test(name);
                },
                message: 'Name format is invalid. Korean names cannot have spaces, English names can have single spaces between words only.'
            }
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [6, 'Password must be at least 6 characters long'],
        },
        userType: {
            type: String,
            required: [true, 'User type is required'],
            enum: {
                values: ['customer', 'admin'],
                message: 'User type must be either customer or admin',
            },
            default: 'customer',
        },
        address: {
            type: String,
            trim: true,
        },
    },
    {
        timestamps: true, // createdAt, updatedAt 자동 생성
    }
);

// 비밀번호를 JSON으로 변환할 때 제외
userSchema.set('toJSON', {
    transform: function (doc, ret) {
        delete ret.password;
        return ret;
    },
});

const User = mongoose.model('User', userSchema);

export default User;
