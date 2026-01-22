import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userAPI } from '../services/api';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './ProfilePage.css';

function ProfilePage() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [step, setStep] = useState('verification'); // 'verification' | 'edit'
    const [password, setPassword] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await userAPI.getCurrentUser();
                // userAPI.getCurrentUser returns response; data is user object (or wrapped)
                // userController.js: getUserById returns res.json(user) 
                // auth.js: getCurrentUser returns res.json(user)
                setUser(response.data);
                setFormData(prev => ({
                    ...prev,
                    name: response.data.name,
                    address: response.data.address || '',
                }));
            } catch (err) {
                console.error('Failed to fetch user:', err);
                navigate('/login');
            }
        };

        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
        } else {
            fetchUser();
        }
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        navigate('/login');
    };

    const handleVerificationSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Re-login to verify password
            // We use userAPI.login with current email and entered password
            if (!user || !user.email) return;

            await userAPI.login({
                email: user.email,
                password: password,
            });

            // If success, move to edit step
            setStep('edit');
        } catch (err) {
            setError('비밀번호가 일치하지 않습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
            setError('새 비밀번호가 일치하지 않습니다.');
            return;
        }

        setLoading(true);

        try {
            const updateData = {
                name: formData.name,
                address: formData.address,
            };

            if (formData.newPassword) {
                updateData.password = formData.newPassword;
            }

            const response = await userAPI.update(user._id, updateData);

            // Update local user state
            setUser(response.data);
            localStorage.setItem('user', JSON.stringify(response.data));

            alert('정보가 수정되었습니다.');
            // Optionally redirect or reset form
            setFormData(prev => ({ ...prev, newPassword: '', confirmPassword: '' }));
        } catch (err) {
            console.error('Update failed:', err);
            setError('정보 수정에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    if (!user) return null;

    return (
        <div className="profile-page">
            <Header user={user} onLogout={handleLogout} />

            <div className="profile-container">
                <h2 className="page-title">내 정보 관리</h2>

                <div className="profile-card">
                    {step === 'verification' ? (
                        <div className="verification-section">
                            <h3>본인 확인</h3>
                            <p className="description">
                                개인정보 보호를 위해 비밀번호를 다시 입력해주세요.
                            </p>

                            {error && <div className="alert alert-error">{error}</div>}

                            <form onSubmit={handleVerificationSubmit}>
                                <div className="form-group">
                                    <label>아이디 (이메일)</label>
                                    <input
                                        type="text"
                                        value={user.email}
                                        disabled
                                        className="input-disabled"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>비밀번호</label>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="현재 비밀번호를 입력하세요"
                                        required
                                        autoFocus
                                    />
                                </div>
                                <button type="submit" className="btn-primary" disabled={loading}>
                                    {loading ? '확인 중...' : '확인'}
                                </button>
                            </form>
                        </div>
                    ) : (
                        <div className="edit-section">
                            <h3>정보 수정</h3>
                            <p className="description">
                                변경하실 정보를 입력해주세요.
                            </p>

                            {error && <div className="alert alert-error">{error}</div>}

                            <form onSubmit={handleUpdateSubmit}>
                                <div className="form-group">
                                    <label>이름</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>주소</label>
                                    <input
                                        type="text"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        placeholder="배송지 주소를 입력하세요"
                                    />
                                </div>

                                <div className="divider"></div>
                                <h4>비밀번호 변경 (선택사항)</h4>

                                <div className="form-group">
                                    <label>새 비밀번호</label>
                                    <input
                                        type="password"
                                        name="newPassword"
                                        value={formData.newPassword}
                                        onChange={handleChange}
                                        placeholder="변경할 경우에만 입력하세요"
                                        minLength={6}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>새 비밀번호 확인</label>
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        placeholder="새 비밀번호를 한번 더 입력하세요"
                                    />
                                </div>

                                <div className="btn-group">
                                    <button type="button" className="btn-secondary" onClick={() => navigate('/')}>
                                        취소
                                    </button>
                                    <button type="submit" className="btn-primary" disabled={loading}>
                                        {loading ? '저장 중...' : '저장하기'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>

            <Footer />
        </div>
    );
}

export default ProfilePage;
