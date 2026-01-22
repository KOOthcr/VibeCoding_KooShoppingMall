import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { productAPI } from '../../services/api';
import './AdminProductForm.css';

// Cloudinary 환경변수에서 설정 가져오기
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

const MAIN_CATEGORIES = {
    TOP: 'TOP',
    BOTTOM: 'BOTTOM',
    OUTER: 'OUTER',
    DRESS: 'DRESS',
    ACC: 'ACC'
};

const SUB_CATEGORIES = {
    TOP: ['티셔츠', '셔츠', '니트/맨투맨'],
    BOTTOM: ['데님/팬츠', '슬랙스', '스커트'],
    OUTER: ['코트/자켓', '가디건/점퍼'],
    DRESS: ['미니원피스', '롱원피스'],
    ACC: ['가방', '신발', '액세서리']
};

const CATEGORY_LABELS = {
    TOP: '상의',
    BOTTOM: '하의',
    OUTER: '아우터',
    DRESS: '원피스',
    ACC: '잡화'
};

function AdminProductForm() {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = Boolean(id);
    const cloudinaryWidgetRef = useRef(null);

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        // 1. 기본 정보
        productId: '',
        name: '',
        category: { main: 'TOP', sub: '티셔츠' },
        status: 'HIDDEN',
        brand: '',

        // 2. 가격 정보
        price: '',
        originalPrice: '',
        taxType: 'TAXABLE',

        // 3. 옵션/재고
        useOptions: false,
        options: [],
        skus: [],
        stock: '',

        // 4. 이미지
        mainImage: '',
        additionalImages: [],
        description: '',

        // 5. 배송
        shipping: {
            feeType: 'PAID',
            fee: '',
            freeCondition: '',
            method: 'COURIER'
        },
        returnPolicy: '',

        // 6. 법적 고지
        material: '',
        washingMethod: '',
        madeIn: '',
        kcCertification: ''
    });

    useEffect(() => {
        if (isEditMode) {
            fetchProduct();
        }
    }, [id]);

    // Cloudinary 위젯 초기화
    useEffect(() => {
        if (window.cloudinary) {
            cloudinaryWidgetRef.current = window.cloudinary.createUploadWidget(
                {
                    cloudName: CLOUDINARY_CLOUD_NAME,
                    uploadPreset: CLOUDINARY_UPLOAD_PRESET,
                    sources: ['local', 'url', 'camera'],
                    multiple: false,
                    maxFiles: 1,
                    clientAllowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
                    maxFileSize: 5000000, // 5MB
                    folder: 'products'
                },
                (error, result) => {
                    if (!error && result && result.event === 'success') {
                        const imageUrl = result.info.secure_url;
                        if (cloudinaryWidgetRef.current.uploadType === 'main') {
                            setFormData(prev => ({ ...prev, mainImage: imageUrl }));
                        } else if (cloudinaryWidgetRef.current.uploadType === 'additional') {
                            setFormData(prev => ({
                                ...prev,
                                additionalImages: [...prev.additionalImages, imageUrl]
                            }));
                        }
                    }
                }
            );
        }
    }, []);

    const fetchProduct = async () => {
        try {
            setLoading(true);
            const response = await productAPI.getById(id);
            const product = response.data;

            // 데이터 구조 변환
            setFormData({
                productId: product.productId || '',
                name: product.name || '',
                category: product.category || { main: 'TOP', sub: '티셔츠' },
                status: product.status || 'HIDDEN',
                brand: product.brand || '',

                price: product.price || '',
                originalPrice: product.originalPrice || '',
                taxType: product.taxType || 'TAXABLE',

                useOptions: product.useOptions || false,
                options: product.options || [],
                skus: product.skus || [],
                stock: product.stock || '',

                mainImage: product.mainImage || product.image || '',
                additionalImages: product.additionalImages || [],
                description: product.description || '',

                shipping: product.shipping || {
                    feeType: 'PAID',
                    fee: '',
                    freeCondition: '',
                    method: 'COURIER'
                },
                returnPolicy: product.returnPolicy || '',

                material: product.material || '',
                washingMethod: product.washingMethod || '',
                madeIn: product.madeIn || '',
                kcCertification: product.kcCertification || ''
            });
        } catch (error) {
            console.error('Failed to fetch product:', error);
            alert('상품 정보를 불러오는데 실패했습니다.');
            navigate('/admin/products');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setFormData(prev => ({
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [child]: type === 'checkbox' ? checked : value
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            }));
        }
    };

    const handleCategoryChange = (field, value) => {
        if (field === 'main') {
            setFormData(prev => ({
                ...prev,
                category: {
                    main: value,
                    sub: SUB_CATEGORIES[value][0]
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                category: {
                    ...prev.category,
                    [field]: value
                }
            }));
        }
    };

    const openCloudinaryWidget = (type) => {
        if (cloudinaryWidgetRef.current) {
            // Set a custom property to identify the upload type
            cloudinaryWidgetRef.current.uploadType = type;
            // Temporarily modify widget options for 'additional' to allow multiple
            if (type === 'additional') {
                cloudinaryWidgetRef.current.update({ multiple: true, maxFiles: 5 - formData.additionalImages.length });
            } else {
                cloudinaryWidgetRef.current.update({ multiple: false, maxFiles: 1 });
            }
            cloudinaryWidgetRef.current.open();
        }
    };

    // 계층형 옵션 상태 (색상 -> 사이즈)
    const [hierarchicalOptions, setHierarchicalOptions] = useState([
        { colorCode: '#000000', colorName: '', sizes: [], imageFile: null, imagePreview: null }
    ]);

    const addHierarchicalColor = () => {
        setHierarchicalOptions(prev => [...prev, { colorCode: '#000000', colorName: '', sizes: [], imageFile: null, imagePreview: null }]);
    };

    const removeHierarchicalColor = (index) => {
        setHierarchicalOptions(prev => prev.filter((_, i) => i !== index));
    };

    const updateHierarchicalColor = (index, field, value) => {
        setHierarchicalOptions(prev => {
            const newOptions = [...prev];
            newOptions[index][field] = value;
            return newOptions;
        });
    };

    // 옵션 그룹 이미지 업로드 (Cloudinary Widget)
    const handleOptionImageWidget = (index) => {
        if (!window.cloudinary) {
            alert('이미지 업로드 위젯을 로드하지 못했습니다. 새로고침 해주세요.');
            return;
        }

        const myWidget = window.cloudinary.createUploadWidget(
            {
                cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
                uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET,
                sources: ['local', 'url'],
                showAdvancedOptions: false,
                cropping: false,
                multiple: false,
                defaultSource: "local",
                styles: {
                    palette: {
                        window: "#FFFFFF",
                        windowBorder: "#90A0B3",
                        tabIcon: "#0078FF",
                        menuIcons: "#5A616A",
                        textDark: "#000000",
                        textLight: "#FFFFFF",
                        link: "#0078FF",
                        action: "#FF620C",
                        inactiveTabIcon: "#0E2F5A",
                        error: "#F44235",
                        inProgress: "#0078FF",
                        complete: "#20B832",
                        sourceBg: "#E4EBF1"
                    }
                }
            },
            (error, result) => {
                if (!error && result && result.event === "success") {
                    console.log('Done! Here is the image info: ', result.info);
                    setHierarchicalOptions(prev => {
                        const newOptions = [...prev];
                        newOptions[index].imageFile = null; // 위젯 사용 시 파일 객체 불필요
                        newOptions[index].imagePreview = result.info.secure_url; // URL 직접 저장
                        return newOptions;
                    });
                }
            }
        );

        myWidget.open();
    };

    // 옵션 그룹 이미지 삭제 핸들러
    const removeOptionImage = (index) => {
        setHierarchicalOptions(prev => {
            const newOptions = [...prev];
            newOptions[index].imageFile = null;
            newOptions[index].imagePreview = null;
            return newOptions;
        });
    };

    const addHierarchicalSize = (colorIndex, size) => {
        if (!size.trim()) return;
        setHierarchicalOptions(prev => {
            const newOptions = [...prev];
            // 중복 사이즈 방지
            if (!newOptions[colorIndex].sizes.includes(size.trim())) {
                newOptions[colorIndex].sizes.push(size.trim());
            }
            return newOptions;
        });
    };

    const removeHierarchicalSize = (colorIndex, sizeIndex) => {
        setHierarchicalOptions(prev => {
            const newOptions = [...prev];
            newOptions[colorIndex].sizes = newOptions[colorIndex].sizes.filter((_, i) => i !== sizeIndex);
            return newOptions;
        });
    };

    // 계층형 데이터를 formData의 options와 skus로 변환 (이미지 URL은 아직 없는 상태일 수 있음)
    // 실제 전송 시 handleSubmit에서 이미지 업로드 후 URL로 교체됨
    const syncHierarchicalToFormData = () => {
        // 1. Options 생성
        const colorValues = hierarchicalOptions
            .filter(g => g.colorName.trim())
            .map(g => ({
                value: g.colorName.trim(),
                code: g.colorCode,
                // 이미지가 있으면 프리뷰라도 넣어둠 (UX상 확인용), 실제 전송시에는 URL로 바뀜
                image: g.imagePreview
            }));

        // 사이즈 옵션 (모든 그룹의 사이즈 유니온)
        const allSizes = new Set();
        hierarchicalOptions.forEach(g => {
            g.sizes.forEach(s => allSizes.add(s));
        });
        const sizeValues = Array.from(allSizes).map(s => ({ value: s }));

        if (colorValues.length === 0) {
            alert('최소 1개 이상의 색상을 입력해주세요.');
            return;
        }
        if (sizeValues.length === 0) {
            alert('각 색상별로 최소 1개 이상의 사이즈를 입력해주세요.');
            return;
        }

        const newOptions = [
            { name: '색상', type: 'color', values: colorValues },
            { name: '사이즈', type: 'text', values: sizeValues }
        ];

        // 2. SKUs 생성
        const newSkus = [];
        hierarchicalOptions.forEach(g => {
            if (g.colorName.trim()) {
                g.sizes.forEach(s => {
                    const combo = { '색상': g.colorName.trim(), '사이즈': s };
                    const comboStr = `색상:${g.colorName.trim()}-사이즈:${s}`;

                    // 기존에 설정된 재고/가격이 있으면 유지
                    const existingSku = formData.skus.find(k => k.skuId === `${formData.productId || 'SKU'}-${comboStr}`);

                    newSkus.push({
                        skuId: `${formData.productId || 'SKU'}-${comboStr}`,
                        combination: combo,
                        stock: existingSku ? existingSku.stock : 0,
                        additionalPrice: existingSku ? existingSku.additionalPrice : 0
                    });
                });
            }
        });

        setFormData(prev => ({
            ...prev,
            options: newOptions,
            skus: newSkus
        }));

        // alert('옵션 및 재고 목록이 갱신되었습니다. 아래 재고 관리 섹션에서 수량을 입력해주세요.');
    };

    const removeAdditionalImage = (indexToRemove) => {
        setFormData(prev => ({
            ...prev,
            additionalImages: prev.additionalImages.filter((_, index) => index !== indexToRemove)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // 유효성 검사
        if (!formData.name || !formData.price || !formData.category.main) {
            alert('필수 정보를 모두 입력해주세요.');
            return;
        }

        if (!formData.mainImage) {
            alert('메인 이미지는 필수입니다.');
            return;
        }

        setLoading(true); // Use setLoading as per original context
        try {
            // 1. 이미지 URL 처리 (Cloudinary 위젯으로 이미 업로드됨)
            const mainImageUrl = formData.mainImage;
            const finalAdditionalImages = formData.additionalImages;

            // 3. 옵션 이미지 업로드 및 데이터 구성
            let finalOptions = formData.options;
            let finalSkus = formData.skus;

            if (formData.useOptions && hierarchicalOptions.length > 0) {
                // Cloudinary 위젯을 사용하므로 이미 URL이 imagePreview에 저장되어 있음
                const optionsWithImages = hierarchicalOptions.map(opt => ({
                    ...opt,
                    imageUrl: opt.imagePreview
                }));

                // 색상 옵션 값 생성 (이미지 URL 포함)
                const colorValues = optionsWithImages
                    .filter(g => g.colorName.trim())
                    .map(g => ({
                        value: g.colorName.trim(),
                        code: g.colorCode,
                        image: g.imageUrl // Use the uploaded URL or existing preview URL
                    }));

                // 사이즈 옵션 값 생성
                const allSizes = new Set();
                optionsWithImages.forEach(g => {
                    g.sizes.forEach(s => allSizes.add(s));
                });
                const sizeValues = Array.from(allSizes).map(s => ({ value: s }));

                if (colorValues.length > 0) {
                    finalOptions = [
                        { name: '색상', type: 'color', values: colorValues },
                        { name: '사이즈', type: 'text', values: sizeValues }
                    ];
                }

                // SKUs 재구성 (syncHierarchicalToFormData와 유사하게)
                const newSkus = [];
                optionsWithImages.forEach(g => {
                    if (g.colorName.trim()) {
                        g.sizes.forEach(s => {
                            const combo = { '색상': g.colorName.trim(), '사이즈': s };
                            const comboStr = `색상:${g.colorName.trim()}-사이즈:${s}`;

                            // 기존에 설정된 재고/가격이 있으면 유지
                            const existingSku = formData.skus.find(k => k.skuId === `${formData.productId || 'SKU'}-${comboStr}`);

                            newSkus.push({
                                skuId: `${formData.productId || 'SKU'}-${comboStr}`,
                                combination: combo,
                                stock: existingSku ? existingSku.stock : 0,
                                additionalPrice: existingSku ? existingSku.additionalPrice : 0
                            });
                        });
                    }
                });
                finalSkus = newSkus;
            }

            // 데이터 검증 (기존 handleSubmit의 검증 로직 유지)
            if (!formData.productId || !formData.name || !formData.price) {
                alert('필수 항목을 모두 입력해주세요.');
                setLoading(false);
                return;
            }

            // 옵션 사용 시 검증
            if (formData.useOptions) {
                const validOptions = finalOptions.filter(opt =>
                    opt.name && opt.values.some(v => v.value.trim())
                );

                if (validOptions.length === 0) {
                    alert('옵션을 설정하거나 옵션 사용을 해제해주세요.');
                    setLoading(false);
                    return;
                }

                if (finalSkus.length === 0) {
                    alert('옵션 조합을 생성해주세요.');
                    setLoading(false);
                    return;
                }
            }

            // 서버로 전송할 데이터 준비
            const submitData = {
                productId: formData.productId,
                name: formData.name,
                category: formData.category,
                status: formData.status,
                brand: formData.brand || undefined,

                price: Number(formData.price),
                originalPrice: formData.originalPrice ? Number(formData.originalPrice) : undefined,
                taxType: formData.taxType,

                useOptions: formData.useOptions,
                options: formData.useOptions ? finalOptions.filter(opt =>
                    opt.name && opt.values.some(v => v.value.trim())
                ).map(opt => ({
                    name: opt.name,
                    type: opt.type,
                    values: opt.values.filter(v => v.value.trim())
                })) : undefined,
                skus: formData.useOptions ? finalSkus : undefined,
                stock: formData.useOptions ? undefined : Number(formData.stock), // Stock will be calculated below if options are used

                mainImage: mainImageUrl,
                additionalImages: finalAdditionalImages,
                description: formData.description,

                shipping: {
                    feeType: formData.shipping.feeType,
                    fee: Number(formData.shipping.fee) || 0,
                    freeCondition: formData.shipping.freeCondition ? Number(formData.shipping.freeCondition) : undefined,
                    method: formData.shipping.method
                },
                returnPolicy: formData.returnPolicy,

                material: formData.material,
                washingMethod: formData.washingMethod,
                madeIn: formData.madeIn,
                kcCertification: formData.kcCertification || undefined
            };

            // 총 재고 계산 (옵션 사용 시)
            if (formData.useOptions) {
                submitData.stock = submitData.skus.reduce((sum, sku) => sum + (Number(sku.stock) || 0), 0);
            }

            console.log('Submitting data:', submitData);

            if (isEditMode) {
                await productAPI.update(id, submitData);
                alert('상품이 수정되었습니다.');
            } else {
                await productAPI.create(submitData);
                alert('상품이 등록되었습니다.');
            }

            navigate('/admin/products');
        } catch (error) {
            console.error('Failed to save product:', error);
            const errorMessage = error.response?.data?.message || error.response?.data?.errors?.join(', ') || '상품 저장에 실패했습니다.';
            alert(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (loading && isEditMode) {
        return <div className="admin-product-form"><div className="loading">데이터를 불러오는 중...</div></div>;
    }

    return (
        <div className="admin-product-form">
            <div className="form-header">
                <h1 className="page-title">{isEditMode ? '상품 수정' : '상품 등록'}</h1>
                <button type="button" className="btn-secondary" onClick={() => navigate('/admin/products')}>
                    취소
                </button>
            </div>

            <form onSubmit={handleSubmit}>
                {/* 1. 기본 정보 */}
                <div className="form-section">
                    <h2 className="section-title">1. 기본 정보</h2>
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="required">상품 ID</label>
                            <input type="text" name="productId" value={formData.productId} onChange={handleChange} required disabled={isEditMode} placeholder="예: PROD-001" />
                        </div>
                        <div className="form-group">
                            <label className="required">상품명</label>
                            <input type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="판매할 상품의 이름" />
                        </div>
                        <div className="form-group">
                            <label className="required">메인 카테고리</label>
                            <select value={formData.category.main} onChange={(e) => handleCategoryChange('main', e.target.value)} required>
                                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                                    <option key={key} value={key}>{label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="required">서브 카테고리</label>
                            <select value={formData.category.sub} onChange={(e) => handleCategoryChange('sub', e.target.value)} required>
                                {SUB_CATEGORIES[formData.category.main].map(sub => (
                                    <option key={sub} value={sub}>{sub}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="required">판매 상태</label>
                            <select name="status" value={formData.status} onChange={handleChange} required>
                                <option value="SELLING">판매중</option>
                                <option value="SOLD_OUT">품절</option>
                                <option value="HIDDEN">노출전</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>브랜드</label>
                            <input type="text" name="brand" value={formData.brand} onChange={handleChange} placeholder="브랜드명 (선택)" />
                        </div>
                    </div>
                </div>

                {/* 2. 가격 정보 */}
                <div className="form-section">
                    <h2 className="section-title">2. 가격 및 판매 정보</h2>
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="required">판매가</label>
                            <input type="number" name="price" value={formData.price} onChange={handleChange} required min="0" placeholder="0" />
                        </div>
                        <div className="form-group">
                            <label>정상가</label>
                            <input type="number" name="originalPrice" value={formData.originalPrice} onChange={handleChange} min="0" placeholder="할인 전 가격 (선택)" />
                        </div>
                        <div className="form-group">
                            <label className="required">과세 구분</label>
                            <select name="taxType" value={formData.taxType} onChange={handleChange} required>
                                <option value="TAXABLE">과세</option>
                                <option value="TAX_FREE">면세</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* 3. 재고 관리 */}
                <div className="form-section">
                    <h2 className="section-title">3. 재고 관리</h2>
                    <div className="form-group">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                name="useOptions"
                                checked={formData.useOptions}
                                onChange={(e) => {
                                    const checked = e.target.checked;
                                    setFormData(prev => ({
                                        ...prev,
                                        useOptions: checked,
                                        options: checked ? [{ name: '색상', type: 'color', values: [{ value: '', code: '#000000' }] }] : [],
                                        skus: []
                                    }));
                                }}
                            />
                            옵션 사용 (색상/사이즈 등)
                        </label>
                    </div>

                    {!formData.useOptions && (
                        <div className="form-group">
                            <label className="required">재고 수량</label>
                            <input
                                type="number"
                                name="stock"
                                value={formData.stock}
                                onChange={handleChange}
                                required={!formData.useOptions}
                                min="0"
                                placeholder="0"
                            />
                        </div>
                    )}

                    {formData.useOptions && (
                        <div className="options-container">
                            <h3 className="options-title">옵션 설정 (색상 및 사이즈)</h3>
                            <p className="option-guide">색상을 먼저 등록하고, 각 색상에 해당하는 사이즈를 추가해주세요.</p>

                            <div className="hierarchical-options-list">
                                {hierarchicalOptions.map((group, colorIndex) => (
                                    <div key={colorIndex} className="hierarchical-group">
                                        <div className="h-group-content">
                                            {/* 이미지 섹션 */}
                                            <div className="h-image-section">
                                                <div
                                                    className="h-image-preview"
                                                    onClick={() => handleOptionImageWidget(colorIndex)}
                                                    title="옵션 대표 이미지 등록 (클릭)"
                                                >
                                                    {group.imagePreview ? (
                                                        <>
                                                            <img src={group.imagePreview} alt="Option" />
                                                            <button
                                                                type="button"
                                                                className="btn-remove-opt-img"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    removeOptionImage(colorIndex);
                                                                }}
                                                            >✕</button>
                                                        </>
                                                    ) : (
                                                        <div className="upload-placeholder">
                                                            <span className="icon">📷</span>
                                                            <span className="text">이미지 추가</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* 입력 섹션 (색상 및 사이즈) */}
                                            <div className="h-inputs-section">
                                                <div className="h-group-header">
                                                    <div className="color-input-wrapper">
                                                        <input
                                                            type="color"
                                                            value={group.colorCode}
                                                            onChange={(e) => updateHierarchicalColor(colorIndex, 'colorCode', e.target.value)}
                                                            className="h-color-picker"
                                                            title="색상 코드 선택"
                                                        />
                                                        <input
                                                            type="text"
                                                            placeholder="색상명 (예: 블랙)"
                                                            value={group.colorName}
                                                            onChange={(e) => updateHierarchicalColor(colorIndex, 'colorName', e.target.value)}
                                                            className="h-color-name"
                                                        />
                                                    </div>
                                                    <button
                                                        type="button"
                                                        className="btn-remove-group"
                                                        onClick={() => removeHierarchicalColor(colorIndex)}
                                                        disabled={hierarchicalOptions.length === 1}
                                                    >
                                                        옵션 그룹 삭제
                                                    </button>
                                                </div>

                                                <div className="h-group-sizes">
                                                    <div className="size-chips">
                                                        {group.sizes.map((size, sizeIndex) => (
                                                            <span key={sizeIndex} className="size-chip">
                                                                {size}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeHierarchicalSize(colorIndex, sizeIndex)}
                                                                >✕</button>
                                                            </span>
                                                        ))}
                                                    </div>
                                                    <div className="size-input-wrapper">
                                                        <input
                                                            type="text"
                                                            placeholder="사이즈 입력 (Enter)"
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    e.preventDefault();
                                                                    addHierarchicalSize(colorIndex, e.target.value);
                                                                    e.target.value = '';
                                                                }
                                                            }}
                                                            className="h-size-input"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="h-actions">
                                <button
                                    type="button"
                                    className="btn-add-color"
                                    onClick={addHierarchicalColor}
                                >
                                    + 색상 추가
                                </button>
                                <button
                                    type="button"
                                    className="btn-sync-options"
                                    onClick={syncHierarchicalToFormData}
                                >
                                    🔄 상품 재고 목록 생성 (적용)
                                </button>
                            </div>

                            {/* 옵션 조합 목록 (재고 관리) */}
                            {formData.skus.length > 0 && (
                                <div className="skus-container">
                                    <h3 className="skus-title">옵션별 재고 관리</h3>
                                    <div className="skus-table">
                                        <div className="sku-header">
                                            <div className="sku-col">조합</div>
                                            <div className="sku-col">재고</div>
                                            <div className="sku-col">추가금액</div>
                                        </div>
                                        {formData.skus.map((sku, index) => (
                                            <div key={index} className="sku-row">
                                                <div className="sku-col">
                                                    <strong>{Object.entries(sku.combination).map(([k, v]) => `${k}: ${v}`).join(' / ')}</strong>
                                                </div>
                                                <div className="sku-col">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={sku.stock}
                                                        onChange={(e) => {
                                                            const newSkus = [...formData.skus];
                                                            newSkus[index].stock = Number(e.target.value);
                                                            setFormData(prev => ({ ...prev, skus: newSkus }));
                                                        }}
                                                        className="sku-input"
                                                    />
                                                </div>
                                                <div className="sku-col">
                                                    <input
                                                        type="number"
                                                        value={sku.additionalPrice}
                                                        onChange={(e) => {
                                                            const newSkus = [...formData.skus];
                                                            newSkus[index].additionalPrice = Number(e.target.value);
                                                            setFormData(prev => ({ ...prev, skus: newSkus }));
                                                        }}
                                                        className="sku-input"
                                                        placeholder="0"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* 4. 이미지 및 설명 */}
                <div className="form-section">
                    <h2 className="section-title">4. 이미지 및 상세 설명</h2>

                    {/* 대표 이미지 */}
                    <div className="form-group full-width">
                        <label className="required">대표 이미지</label>
                        <div className="image-upload-container">
                            {formData.mainImage ? (
                                <div className="image-preview-wrapper">
                                    <img src={formData.mainImage} alt="대표 이미지" className="image-preview" />
                                    <button
                                        type="button"
                                        className="btn-remove-image"
                                        onClick={() => setFormData(prev => ({ ...prev, mainImage: '' }))}
                                    >
                                        ✕
                                    </button>
                                </div>
                            ) : (
                                <div className="image-upload-placeholder" onClick={() => openCloudinaryWidget('main')}>
                                    <span className="upload-icon">📷</span>
                                    <p>클릭하여 이미지 업로드</p>
                                </div>
                            )}
                            <button
                                type="button"
                                className="btn-upload"
                                onClick={() => openCloudinaryWidget('main')}
                            >
                                {formData.mainImage ? '이미지 변경' : '이미지 업로드'}
                            </button>
                        </div>
                    </div>

                    {/* 추가 이미지 */}
                    <div className="form-group full-width">
                        <label>추가 이미지 (선택)</label>
                        <div className="additional-images-container">
                            {formData.additionalImages.map((img, index) => (
                                <div key={index} className="additional-image-wrapper">
                                    <img src={img} alt={`추가 이미지 ${index + 1}`} className="additional-image" />
                                    <button
                                        type="button"
                                        className="btn-remove-additional"
                                        onClick={() => removeAdditionalImage(index)}
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                            {formData.additionalImages.length < 5 && (
                                <div
                                    className="additional-image-placeholder"
                                    onClick={() => openCloudinaryWidget('additional')}
                                >
                                    <span className="upload-icon">➕</span>
                                    <p>추가</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="form-group full-width">
                        <label className="required">상세 설명</label>
                        <textarea name="description" value={formData.description} onChange={handleChange} required rows="6" placeholder="상품에 대한 상세한 설명을 입력하세요"></textarea>
                    </div>
                </div>

                {/* 5. 배송 정보 */}
                <div className="form-section">
                    <h2 className="section-title">5. 배송 및 정책</h2>
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="required">배송비 정책</label>
                            <select name="shipping.feeType" value={formData.shipping.feeType} onChange={handleChange} required>
                                <option value="FREE">무료</option>
                                <option value="PAID">유료</option>
                                <option value="CONDITIONAL_FREE">조건부 무료</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="required">배송비</label>
                            <input type="number" name="shipping.fee" value={formData.shipping.fee} onChange={handleChange} required min="0" placeholder="0" />
                        </div>
                        {formData.shipping.feeType === 'CONDITIONAL_FREE' && (
                            <div className="form-group">
                                <label>무료 배송 최소 금액</label>
                                <input type="number" name="shipping.freeCondition" value={formData.shipping.freeCondition} onChange={handleChange} min="0" placeholder="50000" />
                            </div>
                        )}
                        <div className="form-group">
                            <label className="required">배송 방법</label>
                            <select name="shipping.method" value={formData.shipping.method} onChange={handleChange} required>
                                <option value="COURIER">택배</option>
                                <option value="QUICK">퀵서비스</option>
                                <option value="DIRECT">직접배송</option>
                            </select>
                        </div>
                    </div>
                    <div className="form-group full-width">
                        <label className="required">교환/반품 안내</label>
                        <textarea name="returnPolicy" value={formData.returnPolicy} onChange={handleChange} required rows="4" placeholder="교환 및 반품 정책을 입력하세요"></textarea>
                    </div>
                </div>

                {/* 6. 법적 고지 */}
                <div className="form-section">
                    <h2 className="section-title">6. 법적 고지</h2>
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="required">소재</label>
                            <input type="text" name="material" value={formData.material} onChange={handleChange} required placeholder="예: 면 100%" />
                        </div>
                        <div className="form-group">
                            <label className="required">세탁 방법</label>
                            <input type="text" name="washingMethod" value={formData.washingMethod} onChange={handleChange} required placeholder="예: 손세탁, 드라이클리닝" />
                        </div>
                        <div className="form-group">
                            <label className="required">제조국</label>
                            <input type="text" name="madeIn" value={formData.madeIn} onChange={handleChange} required placeholder="예: 대한민국" />
                        </div>
                        <div className="form-group">
                            <label>KC 인증번호</label>
                            <input type="text" name="kcCertification" value={formData.kcCertification} onChange={handleChange} placeholder="해당 시 입력 (선택)" />
                        </div>
                    </div>
                </div>

                {/* 제출 버튼 */}
                <div className="form-actions">
                    <button type="button" className="btn-secondary" onClick={() => navigate('/admin/products')}>
                        취소
                    </button>
                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? '처리중...' : (isEditMode ? '수정하기' : '등록하기')}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default AdminProductForm;
