import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { userAPI } from '../services/api';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './LoginPage.css';

function LoginPage() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        rememberMe: false,
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // 이미 로그인된 사용자는 메인 페이지로 리다이렉트
    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    await userAPI.getCurrentUser();
                    // 토큰이 유효하면 메인 페이지로 이동
                    navigate('/');
                } catch (error) {
                    // 토큰이 유효하지 않으면 제거
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                }
            }
        };

        checkAuth();
    }, [navigate]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value,
        });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            setLoading(true);
            const response = await userAPI.login({
                email: formData.email,
                password: formData.password,
            });

            // 토큰 저장
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));

            // 메인 페이지로 이동
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || '로그인에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    // Google Login Handler
    const handleGoogleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            try {
                setLoading(true);
                // 백엔드에 액세스 토큰 전달하여 로그인/회원가입 처리
                const res = await userAPI.googleLogin({ access_token: tokenResponse.access_token });

                localStorage.setItem('token', res.data.token);
                localStorage.setItem('user', JSON.stringify(res.data.user));
                navigate('/');
            } catch (err) {
                console.error('Google Login Error:', err);
                setError(err.response?.data?.message || '구글 로그인 중 오류가 발생했습니다.');
            } finally {
                setLoading(false);
            }
        },
        onError: () => {
            setError('구글 로그인에 실패했습니다.');
        }
    });

    return (
        <div className="login-page">
            <Header user={null} onLogout={() => { }} />

            <div className="login-container">
                <div className="login-card">
                    <h2 className="login-title">로그인</h2>
                    <p className="login-subtitle">계정에 로그인하여 쇼핑을 시작하세요</p>

                    {error && <div className="alert alert-error">{error}</div>}

                    <form onSubmit={handleSubmit} className="login-form">
                        <div className="form-group">
                            <label htmlFor="email">이메일</label>
                            <div className="input-wrapper">
                                <span className="input-icon">✉</span>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    placeholder="your@email.com"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">비밀번호</label>
                            <div className="input-wrapper">
                                <span className="input-icon">🔒</span>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    placeholder="비밀번호를 입력하세요"
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? '👁' : '👁‍🗨'}
                                </button>
                            </div>
                        </div>

                        <div className="form-options">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    name="rememberMe"
                                    checked={formData.rememberMe}
                                    onChange={handleChange}
                                />
                                <span>로그인 상태 유지</span>
                            </label>
                            <a href="/forgot-password" className="forgot-link">비밀번호 찾기</a>
                        </div>

                        <button type="submit" className="login-button" disabled={loading}>
                            {loading ? '로그인 중...' : '로그인'}
                        </button>
                    </form>

                    <div className="divider">
                        <span>또는 소셜 계정으로 로그인</span>
                    </div>

                    <div className="social-login">
                        <button
                            className="social-button google"
                            onClick={() => handleGoogleLogin()}
                            disabled={loading}
                            type="button"
                        >
                            <span className="social-icon">G</span>
                            Google로 시작하기
                        </button>
                    </div>

                    <div className="login-footer">
                        <p>아직 계정이 없으신가요? <Link to="/signup">회원가입</Link></p>
                        <p className="footer-description">
                            로그인하시면 이용약관 및 개인정보처리방침에 동의하는 것으로 간주됩니다.
                        </p>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}

export default LoginPage;
