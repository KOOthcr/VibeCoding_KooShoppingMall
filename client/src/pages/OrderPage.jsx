import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cartAPI, orderAPI, userAPI } from '../services/api';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './OrderPage.css';

function OrderPage() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [cart, setCart] = useState(null);
    const [loading, setLoading] = useState(true);

    // 배송 정보 상태
    const [shippingInfo, setShippingInfo] = useState({
        name: '',
        phone: '',
        zipCode: '',
        address: '',
        detailAddress: '',
        message: ''
    });

    // 결제 수단 상태
    const [paymentMethod, setPaymentMethod] = useState('card');

    useEffect(() => {
        // 포트원 초기화
        if (window.IMP) {
            window.IMP.init('imp54146210');
        }

        const fetchData = async () => {
            try {
                // 사용자 정보와 장바구니 정보를 동시에 가져옵니다.
                const [userResponse, cartResponse] = await Promise.allSettled([
                    userAPI.getCurrentUser(),
                    cartAPI.get()
                ]);

                if (userResponse.status === 'fulfilled') {
                    setUser(userResponse.value.data);
                    // 사용자 정보가 있으면 배송지 정보 초기값으로 설정 (편의성)
                    // 실제 DB에 주소 정보가 있다면 여기서 세팅해주면 좋습니다.
                    if (userResponse.value.data) {
                        setShippingInfo(prev => ({
                            ...prev,
                            name: userResponse.value.data.name || '',
                            // email은 user 객체에 있지만 배송 정보엔 보통 안 넣음
                        }));
                    }
                } else {
                    alert('로그인이 필요합니다.');
                    navigate('/login');
                    return;
                }

                if (cartResponse.status === 'fulfilled') {
                    const cartData = cartResponse.value.data;
                    if (!cartData || !cartData.items || cartData.items.length === 0) {
                        alert('장바구니가 비어있습니다.');
                        navigate('/cart');
                        return;
                    }
                    setCart(cartData);
                } else {
                    console.error('장바구니 조회 실패');
                    navigate('/cart');
                }

            } catch (error) {
                console.error('데이터 로딩 실패:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [navigate]);

    // 입력 핸들러
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setShippingInfo(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // 주소 찾기 (Daum 주소 API 연동)
    const handleSearchAddress = () => {
        new window.daum.Postcode({
            oncomplete: function (data) {
                // 팝업에서 검색결과 항목을 클릭했을때 실행할 코드를 작성하는 부분.

                // 각 주소의 노출 규칙에 따라 주소를 조합한다.
                // 내려오는 변수가 값이 없는 경우엔 공백('')값을 가지므로, 이를 참고하여 분기 한다.
                let addr = ''; // 주소 변수
                let extraAddr = ''; // 참고항목 변수

                //사용자가 선택한 주소 타입에 따라 해당 주소 값을 가져온다.
                if (data.userSelectedType === 'R') { // 사용자가 도로명 주소를 선택했을 경우
                    addr = data.roadAddress;
                } else { // 사용자가 지번 주소를 선택했을 경우(J)
                    addr = data.jibunAddress;
                }

                // 사용자가 선택한 주소가 도로명 타입일때 참고항목을 조합한다.
                if (data.userSelectedType === 'R') {
                    // 법정동명이 있을 경우 추가한다. (법정리는 제외)
                    // 법정동의 경우 마지막 문자가 "동/로/가"로 끝난다.
                    if (data.bname !== '' && /[동|로|가]$/g.test(data.bname)) {
                        extraAddr += data.bname;
                    }
                    // 건물명이 있고, 공동주택일 경우 추가한다.
                    if (data.buildingName !== '' && data.apartment === 'Y') {
                        extraAddr += (extraAddr !== '' ? ', ' + data.buildingName : data.buildingName);
                    }
                    // 표시할 참고항목이 있을 경우, 괄호까지 추가한 최종 문자열을 만든다.
                    if (extraAddr !== '') {
                        extraAddr = ' (' + extraAddr + ')';
                    }
                    // 조합된 참고항목을 해당 필드에 넣는다.
                    addr += extraAddr;
                }

                // 우편번호와 주소 정보를 해당 필드에 넣는다.
                setShippingInfo(prev => ({
                    ...prev,
                    zipCode: data.zonecode,
                    address: addr,
                    detailAddress: '' // 주소가 바뀌면 상세주소 초기화
                }));

                // 상세주소 필드로 포커스 이동 (선택 사항)
                document.querySelector('input[name="detailAddress"]')?.focus();
            }
        }).open();
    };

    // 주문 제출 핸들러 (결제 요청 포함)
    const handleSubmitOrder = async () => {
        // 유효성 검사
        if (!shippingInfo.name || !shippingInfo.phone || !shippingInfo.address || !shippingInfo.zipCode) {
            alert('배송 정보를 모두 입력해주세요.');
            return;
        }

        if (!cart) return;

        // 결제 전 사전 확인 (재고 등) - 생략 가능하지만 권장

        const { IMP } = window;
        if (!IMP) {
            alert('결제 모듈을 불러오지 못했습니다. 새로고침 해주세요.');
            return;
        }

        // 결제 데이터 준비
        const data = {
            pg: 'html5_inicis', // 테스트용 PG사
            pay_method: paymentMethod, // 'card', 'vbank' 등
            merchant_uid: `mid_${new Date().getTime()}`, // 주문번호 (임시)
            name: cart.items.length > 1
                ? `${cart.items[0].product.name} 외 ${cart.items.length - 1}건`
                : cart.items[0].product.name,
            amount: cart.totalPrice,
            buyer_email: user?.email,
            buyer_name: shippingInfo.name,
            buyer_tel: shippingInfo.phone,
            buyer_addr: `${shippingInfo.address} ${shippingInfo.detailAddress}`,
            buyer_postcode: shippingInfo.zipCode,
        };

        // 포트원 결제 요청
        IMP.request_pay(data, async (rsp) => {
            if (rsp.success) {
                // 결제 성공 시: 서버에 주문 생성 요청
                try {
                    // Order 스키마에 맞춰서 데이터 준비
                    const orderData = {
                        items: cart.items.map(item => ({
                            product: item.product._id,
                            name: item.product.name,
                            image: item.product.mainImage,
                            price: item.price,
                            quantity: item.quantity,
                            options: item.options,
                            skuId: item.skuId,
                            status: 'ordered'
                        })),
                        shippingAddress: shippingInfo,
                        paymentMethod: paymentMethod,
                        totalAmount: cart.totalPrice,
                        shippingCost: 0, // 현재는 무료배송
                        transactionId: rsp.imp_uid, // 결제 번호 저장
                        paymentStatus: 'paid' // 결제 완료 상태
                    };

                    // API 호출
                    const response = await orderAPI.create(orderData);

                    if (response.status === 201) {
                        // alert('결제가 완료되었습니다!'); // 성공 페이지로 대체
                        // response.data.order._id 를 사용하거나 orderId 사용
                        // create API 응답 구조: { message, order }
                        navigate(`/order/success/${response.data.order._id}`);
                    }
                } catch (error) {
                    console.error('주문 생성 실패:', error);
                    // 결제 성공 후 주문 생성 실패 시
                    // 실제로는 환불 로직이 돌거나 에러 페이지에서 관리자 문의 안내 등을 해야 함
                    navigate(`/order/fail?message=${encodeURIComponent('결제는 완료되었으나 주문 생성에 실패했습니다. 관리자에게 문의해주세요.')}`);
                }
            } else {
                // 결제 실패 시
                // alert(`결제에 실패하였습니다. 에러 내용: ${rsp.error_msg}`);
                navigate(`/order/fail?message=${encodeURIComponent(rsp.error_msg)}`);
            }
        });
    };

    if (loading) return <div className="loading-screen">로딩 중...</div>;

    return (
        <div className="order-page">
            <Header user={user} onLogout={() => { }} />

            <main className="order-content">
                <div className="order-container">
                    <h2 className="page-title">주문 / 결제</h2>

                    <div className="order-layout">
                        {/* 왼쪽 섹션: 배송지 정보 & 결제 수단 */}
                        <div className="order-left-section">
                            {/* 배송지 정보 */}
                            <section className="info-card">
                                <h3 className="card-title">배송 정보</h3>
                                <div className="form-group">
                                    <label>받는 분</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={shippingInfo.name}
                                        onChange={handleInputChange}
                                        placeholder="이름"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>연락처</label>
                                    <input
                                        type="text"
                                        name="phone"
                                        value={shippingInfo.phone}
                                        onChange={handleInputChange}
                                        placeholder="- 없이 입력"
                                    />
                                </div>
                                <div className="form-group address-group">
                                    <label>주소</label>
                                    <div className="zipcode-row">
                                        <input
                                            type="text"
                                            name="zipCode"
                                            value={shippingInfo.zipCode}
                                            readOnly
                                            placeholder="우편번호"
                                        />
                                        <button type="button" className="btn-search-addr" onClick={handleSearchAddress}>주소 찾기</button>
                                    </div>
                                    <input
                                        type="text"
                                        name="address"
                                        value={shippingInfo.address}
                                        readOnly
                                        placeholder="기본 주소"
                                        className="addr-input"
                                    />
                                    <input
                                        type="text"
                                        name="detailAddress"
                                        value={shippingInfo.detailAddress}
                                        onChange={handleInputChange}
                                        placeholder="나머지 주소 (동, 호수 등)"
                                        className="addr-input"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>배송 메모</label>
                                    <select name="message" onChange={handleInputChange} value={shippingInfo.message}>
                                        <option value="">-- 메시지 선택 (선택사항) --</option>
                                        <option value="배송 전 연락바랍니다.">배송 전 연락바랍니다.</option>
                                        <option value="부재 시 경비실에 맡겨주세요.">부재 시 경비실에 맡겨주세요.</option>
                                        <option value="부재 시 문 앞에 놓아주세요.">부재 시 문 앞에 놓아주세요.</option>
                                        <option value="택배함에 넣어주세요.">택배함에 넣어주세요.</option>
                                    </select>
                                </div>
                            </section>

                            {/* 결제 수단 */}
                            <section className="info-card">
                                <h3 className="card-title">결제 수단</h3>
                                <div className="payment-methods-grid">
                                    {['card', 'bank', 'kakao', 'naver'].map(method => (
                                        <label key={method} className={`payment-option ${paymentMethod === method ? 'selected' : ''}`}>
                                            <input
                                                type="radio"
                                                name="paymentMethod"
                                                value={method}
                                                checked={paymentMethod === method}
                                                onChange={(e) => setPaymentMethod(e.target.value)}
                                            />
                                            <span className="method-name">
                                                {method === 'card' && '신용카드'}
                                                {method === 'bank' && '무통장입금'}
                                                {method === 'kakao' && '카카오페이'}
                                                {method === 'naver' && '네이버페이'}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </section>
                        </div>

                        {/* 오른쪽 섹션: 주문 상품 및 결제 금액 */}
                        <div className="order-right-section">
                            <section className="summary-card sticky">
                                <h3 className="card-title">주문 상품 ({cart?.totalQuantity}개)</h3>
                                <div className="order-items-list">
                                    {cart?.items.map((item) => (
                                        <div key={item._id} className="summary-item">
                                            <div className="summary-item-info">
                                                <span className="item-name">{item.product.name}</span>
                                                <div className="item-meta">
                                                    {item.options && Object.values(item.options).join(' / ')}
                                                    &nbsp; | &nbsp; {item.quantity}개
                                                </div>
                                            </div>
                                            <span className="item-price">{(item.price * item.quantity).toLocaleString()}원</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="divider"></div>

                                <div className="price-row">
                                    <span>총 상품 금액</span>
                                    <span>{cart?.totalPrice?.toLocaleString()}원</span>
                                </div>
                                <div className="price-row">
                                    <span>배송비</span>
                                    <span>0원</span>
                                </div>
                                <div className="price-row total">
                                    <span>최종 결제 금액</span>
                                    <span className="total-price">{cart?.totalPrice?.toLocaleString()}원</span>
                                </div>

                                <button className="btn-place-order" onClick={handleSubmitOrder}>
                                    {cart?.totalPrice?.toLocaleString()}원 결제하기
                                </button>
                            </section>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}

export default OrderPage;
