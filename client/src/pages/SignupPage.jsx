import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { userAPI } from '../services/api';
import '../App.css';

function SignupPage() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        name: '',
        password: '',
        confirmPassword: '',
        zipCode: '',
        address: '',
        detailAddress: '',
        agreeToTerms: false,
        agreeToPrivacy: false,
        agreeToMarketing: false,
        agreeAll: false,
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [modalContent, setModalContent] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value,
        });
        setError('');
    };

    const handleAgreeAll = (e) => {
        const checked = e.target.checked;
        setFormData({
            ...formData,
            agreeAll: checked,
            agreeToTerms: checked,
            agreeToPrivacy: checked,
            agreeToMarketing: checked,
        });
        setError('');
    };

    const openModal = (type) => {
        const content = {
            terms: {
                title: '이용약관',
                content: `제1조 (목적)
이 약관은 KOO 쇼핑몰(이하 "회사")이 제공하는 전자상거래 관련 서비스의 이용과 관련하여 회사와 이용자의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.

제2조 (정의)
1. "쇼핑몰"이란 회사가 재화 또는 용역을 이용자에게 제공하기 위하여 컴퓨터 등 정보통신설비를 이용하여 재화 또는 용역을 거래할 수 있도록 설정한 가상의 영업장을 말합니다.
2. "이용자"란 쇼핑몰에 접속하여 이 약관에 따라 쇼핑몰이 제공하는 서비스를 받는 회원 및 비회원을 말합니다.
3. "회원"이란 쇼핑몰에 개인정보를 제공하여 회원등록을 한 자로서, 쇼핑몰의 정보를 지속적으로 제공받으며, 쇼핑몰이 제공하는 서비스를 계속적으로 이용할 수 있는 자를 말합니다.

제3조 (약관의 명시와 개정)
1. 회사는 이 약관의 내용과 상호, 영업소 소재지, 대표자의 성명, 사업자등록번호, 연락처 등을 이용자가 알 수 있도록 쇼핑몰의 초기 서비스화면에 게시합니다.
2. 회사는 약관의 규제에 관한 법률, 전자거래기본법, 전자서명법, 정보통신망 이용촉진 및 정보보호 등에 관한 법률 등 관련법을 위배하지 않는 범위에서 이 약관을 개정할 수 있습니다.

제4조 (서비스의 제공 및 변경)
1. 회사는 다음과 같은 업무를 수행합니다:
   - 재화 또는 용역에 대한 정보 제공 및 구매계약의 체결
   - 구매계약이 체결된 재화 또는 용역의 배송
   - 기타 회사가 정하는 업무

제5조 (회원가입)
1. 이용자는 회사가 정한 가입 양식에 따라 회원정보를 기입한 후 이 약관에 동의한다는 의사표시를 함으로서 회원가입을 신청합니다.
2. 회사는 제1항과 같이 회원으로 가입할 것을 신청한 이용자 중 다음 각호에 해당하지 않는 한 회원으로 등록합니다.`
            },
            privacy: {
                title: '개인정보처리방침',
                content: `KOO 쇼핑몰(이하 "회사")은 이용자의 개인정보를 중요시하며, "정보통신망 이용촉진 및 정보보호 등에 관한 법률", "개인정보보호법"을 준수하고 있습니다.

제1조 (개인정보의 수집 항목 및 방법)
1. 수집하는 개인정보 항목:
   - 필수항목: 이름, 이메일, 비밀번호
   - 선택항목: 주소, 전화번호

2. 개인정보 수집방법:
   - 회원가입 및 서비스 이용 과정에서 이용자가 직접 입력
   - 로그 분석 프로그램을 통한 자동 수집

제2조 (개인정보의 수집 및 이용목적)
회사는 수집한 개인정보를 다음의 목적을 위해 활용합니다:
1. 서비스 제공에 관한 계약 이행 및 서비스 제공에 따른 요금정산
   - 컨텐츠 제공, 물품배송 또는 청구서 등 발송, 본인인증, 구매 및 요금 결제
2. 회원 관리
   - 회원제 서비스 이용에 따른 본인확인, 개인식별, 불량회원의 부정 이용 방지와 비인가 사용 방지, 가입 의사 확인, 연령확인
3. 마케팅 및 광고에 활용
   - 신규 서비스 개발 및 맞춤 서비스 제공, 이벤트 및 광고성 정보 제공 및 참여기회 제공

제3조 (개인정보의 보유 및 이용기간)
1. 이용자의 개인정보는 원칙적으로 개인정보의 수집 및 이용목적이 달성되면 지체 없이 파기합니다.
2. 단, 다음의 정보에 대해서는 아래의 이유로 명시한 기간 동안 보존합니다:
   - 보존 항목: 이름, 이메일
   - 보존 근거: 전자상거래 등에서의 소비자보호에 관한 법률
   - 보존 기간: 5년

제4조 (개인정보의 파기절차 및 방법)
1. 파기절차: 이용자가 입력한 정보는 목적이 달성된 후 별도의 DB로 옮겨져 내부 방침 및 기타 관련 법령에 의한 정보보호 사유에 따라 일정 기간 저장된 후 파기됩니다.
2. 파기방법: 전자적 파일형태로 저장된 개인정보는 기록을 재생할 수 없는 기술적 방법을 사용하여 삭제합니다.

제5조 (이용자의 권리와 그 행사방법)
이용자는 언제든지 등록되어 있는 자신의 개인정보를 조회하거나 수정할 수 있으며 가입해지를 요청할 수도 있습니다.`
            },
            marketing: {
                title: '마케팅 정보 수신 동의',
                content: `KOO 쇼핑몰은 회원님께 다양한 혜택과 최신 정보를 제공하기 위해 마케팅 정보 수신 동의를 받고 있습니다.

제1조 (수집 및 이용 목적)
1. 신규 서비스 및 이벤트 정보 안내
2. 맞춤형 상품 추천 및 할인 정보 제공
3. 프로모션 및 특별 행사 안내
4. 쿠폰 및 혜택 정보 제공

제2조 (수신 방법)
1. 이메일을 통한 정보 발송
2. SMS/MMS를 통한 정보 발송
3. 앱 푸시 알림을 통한 정보 발송

제3조 (수신 동의 철회)
1. 회원님은 언제든지 마케팅 정보 수신 동의를 철회할 수 있습니다.
2. 수신 동의 철회 방법:
   - 마이페이지에서 직접 설정 변경
   - 고객센터를 통한 요청
   - 수신한 이메일 하단의 수신거부 링크 클릭

제4조 (개인정보의 보유 및 이용기간)
마케팅 정보 수신을 위한 개인정보는 회원 탈퇴 시 또는 수신 동의 철회 시까지 보유 및 이용됩니다.

제5조 (동의 거부권 및 불이익)
1. 회원님은 마케팅 정보 수신에 대한 동의를 거부할 권리가 있습니다.
2. 마케팅 정보 수신 동의를 거부하시더라도 서비스 이용에는 제한이 없습니다.
3. 단, 각종 이벤트 및 프로모션 안내를 받으실 수 없습니다.

본 동의는 선택사항이며, 동의하지 않으셔도 회원가입 및 서비스 이용이 가능합니다.`
            }
        };
        setModalContent(content[type]);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setModalContent(null);
    };

    const handleSearchAddress = () => {
        new window.daum.Postcode({
            oncomplete: function (data) {
                let addr = '';
                let extraAddr = '';

                if (data.userSelectedType === 'R') {
                    addr = data.roadAddress;
                } else {
                    addr = data.jibunAddress;
                }

                if (data.userSelectedType === 'R') {
                    if (data.bname !== '' && /[동|로|가]$/g.test(data.bname)) {
                        extraAddr += data.bname;
                    }
                    if (data.buildingName !== '' && data.apartment === 'Y') {
                        extraAddr += (extraAddr !== '' ? ', ' + data.buildingName : data.buildingName);
                    }
                    if (extraAddr !== '') {
                        extraAddr = ' (' + extraAddr + ')';
                    }
                    addr += extraAddr;
                }

                setFormData(prev => ({
                    ...prev,
                    zipCode: data.zonecode,
                    address: addr,
                    detailAddress: ''
                }));

                setTimeout(() => document.getElementById('detailAddress')?.focus(), 100);
            }
        }).open();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // 비밀번호 확인
        if (formData.password !== formData.confirmPassword) {
            setError('비밀번호가 일치하지 않습니다.');
            return;
        }

        // 비밀번호 길이 확인
        if (formData.password.length < 6) {
            setError('비밀번호는 최소 6자 이상이어야 합니다.');
            return;
        }

        // 이름 검증
        const trimmedName = formData.name.trim();

        // 한글만 있는 경우 (공백 불가)
        const koreanOnlyRegex = /^[가-힣]+$/;
        // 영문만 있는 경우 (단어 사이 공백 1개만 허용)
        const englishOnlyRegex = /^[a-zA-Z]+(\s[a-zA-Z]+)*$/;
        // 한글+영문 혼합 (공백 1개만 허용)
        const mixedRegex = /^[가-힣a-zA-Z]+(\s[가-힣a-zA-Z]+)*$/;

        if (!koreanOnlyRegex.test(trimmedName) &&
            !englishOnlyRegex.test(trimmedName) &&
            !mixedRegex.test(trimmedName)) {
            setError('이름 형식이 올바르지 않습니다. 한글은 공백 없이, 영문은 단어 사이 공백 1개만 가능합니다.');
            return;
        }

        // 앞뒤 공백 체크
        if (formData.name !== trimmedName) {
            setError('이름 앞뒤에 공백이 있으면 안됩니다.');
            return;
        }

        // 연속된 공백 체크
        if (/\s{2,}/.test(formData.name)) {
            setError('공백은 2개 이상 연속으로 사용할 수 없습니다.');
            return;
        }

        // 약관 동의 확인
        if (!formData.agreeToTerms) {
            alert('이용약관에 동의해주세요.');
            setError('이용약관에 동의해주세요.');
            return;
        }

        if (!formData.agreeToPrivacy) {
            alert('개인정보처리방침에 동의해주세요.');
            setError('개인정보처리방침에 동의해주세요.');
            return;
        }

        try {
            setLoading(true);

            // 주소 조합
            const fullAddress = formData.address
                ? `(${formData.zipCode}) ${formData.address} ${formData.detailAddress}`.trim()
                : '';

            const response = await userAPI.create({
                email: formData.email,
                name: formData.name,
                password: formData.password,
                userType: 'customer',
                address: fullAddress,
            });

            alert('축하합니다. 회원가입이 완성되었습니다.');
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.message || '회원가입에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="signup-container">
            <div className="signup-card">
                <Link to="/" className="back-link">← 메인으로</Link>

                <h1 className="signup-title">회원가입</h1>
                <p className="signup-subtitle">KOO 쇼핑몰에 오신 것을 환영합니다</p>

                {error && <div className="alert alert-error">{error}</div>}
                {success && <div className="alert alert-success">{success}</div>}

                <form onSubmit={handleSubmit} className="signup-form">
                    <div className="form-group">
                        <label htmlFor="email">이메일 *</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            placeholder="example@email.com"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="name">이름 *</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            placeholder="홍길동"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">비밀번호 *</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            placeholder="최소 6자 이상"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmPassword">비밀번호 확인 *</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                            placeholder="비밀번호를 다시 입력하세요"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="address">주소 (선택)</label>
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                            <input
                                type="text"
                                name="zipCode"
                                value={formData.zipCode}
                                readOnly
                                placeholder="우편번호"
                                style={{ width: '120px' }}
                            />
                            <button
                                type="button"
                                onClick={handleSearchAddress}
                                style={{
                                    padding: '0 16px',
                                    borderRadius: '4px',
                                    border: '1px solid #ddd',
                                    background: '#f9fafb',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    height: '42px' // input height matching
                                }}
                            >
                                주소 찾기
                            </button>
                        </div>
                        <input
                            type="text"
                            name="address"
                            value={formData.address}
                            readOnly
                            placeholder="주소 찾기를 통해 입력해주세요"
                            style={{ marginBottom: '8px' }}
                        />
                        <input
                            type="text"
                            id="detailAddress"
                            name="detailAddress"
                            value={formData.detailAddress}
                            onChange={handleChange}
                            placeholder="상세 주소를 입력해주세요"
                        />
                    </div>

                    {/* 약관 동의 */}
                    <div className="agreements-section">
                        {/* 전체 동의 */}
                        <div className="checkbox-group all-agree">
                            <input
                                type="checkbox"
                                id="agreeAll"
                                name="agreeAll"
                                checked={formData.agreeAll}
                                onChange={handleAgreeAll}
                            />
                            <label htmlFor="agreeAll" className="checkbox-label">
                                전체 동의
                            </label>
                        </div>

                        <div className="divider"></div>

                        {/* 이용약관 동의 (필수) */}
                        <div className="checkbox-group">
                            <input
                                type="checkbox"
                                id="agreeToTerms"
                                name="agreeToTerms"
                                checked={formData.agreeToTerms}
                                onChange={handleChange}
                            />
                            <label htmlFor="agreeToTerms" className="checkbox-label">
                                이용약관 동의 <span className="required">(필수)</span>
                            </label>
                            <button type="button" className="view-btn" onClick={() => openModal('terms')}>보기</button>
                        </div>

                        {/* 개인정보처리방침 동의 (필수) */}
                        <div className="checkbox-group">
                            <input
                                type="checkbox"
                                id="agreeToPrivacy"
                                name="agreeToPrivacy"
                                checked={formData.agreeToPrivacy}
                                onChange={handleChange}
                            />
                            <label htmlFor="agreeToPrivacy" className="checkbox-label">
                                개인정보처리방침 동의 <span className="required">(필수)</span>
                            </label>
                            <button type="button" className="view-btn" onClick={() => openModal('privacy')}>보기</button>
                        </div>

                        {/* 마케팅 정보 수신 동의 (선택) */}
                        <div className="checkbox-group">
                            <input
                                type="checkbox"
                                id="agreeToMarketing"
                                name="agreeToMarketing"
                                checked={formData.agreeToMarketing}
                                onChange={handleChange}
                            />
                            <label htmlFor="agreeToMarketing" className="checkbox-label">
                                마케팅 정보 수신 동의 <span className="optional">(선택)</span>
                            </label>
                            <button type="button" className="view-btn" onClick={() => openModal('marketing')}>보기</button>
                        </div>
                    </div>

                    <button type="submit" className="submit-button" disabled={loading}>
                        {loading ? '처리 중...' : '회원가입'}
                    </button>
                </form>

                <div className="signup-footer">
                    <p>이미 계정이 있으신가요? <a href="/login">로그인</a></p>
                </div>
            </div>

            {/* 약관 모달 */}
            {isModalOpen && modalContent && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{modalContent.title}</h2>
                            <button className="modal-close" onClick={closeModal}>×</button>
                        </div>
                        <div className="modal-body">
                            <pre>{modalContent.content}</pre>
                        </div>
                        <div className="modal-footer">
                            <button className="modal-btn" onClick={closeModal}>확인</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default SignupPage;
