import express from 'express';
import Product from '../models/Product.js';

const router = express.Router();

// GET /api/products - 모든 상품 조회 (필터링, 정렬, 페이지네이션 지원)
router.get('/', async (req, res) => {
    try {
        const { category, status, sort, search, page = 1, limit = 10 } = req.query;
        let query = {};

        // 카테고리 필터 (메인 카테고리)
        if (category && category !== 'all') {
            query['category.main'] = category;
        }

        // 상태 필터
        if (status) {
            query.status = status;
        }

        // 검색 (상품명 또는 브랜드)
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { brand: { $regex: search, $options: 'i' } }
            ];
        }

        // 페이지네이션 설정
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // 전체 상품 수 (필터 적용된 상태)
        const totalProducts = await Product.countDocuments(query);
        const totalPages = Math.ceil(totalProducts / limitNum);

        let productsQuery = Product.find(query);

        // 정렬
        if (sort === 'price_asc') {
            productsQuery = productsQuery.sort({ price: 1 });
        } else if (sort === 'price_desc') {
            productsQuery = productsQuery.sort({ price: -1 });
        } else if (sort === 'newest') {
            productsQuery = productsQuery.sort({ createdAt: -1 });
        } else if (sort === 'name') {
            productsQuery = productsQuery.sort({ name: 1 });
        } else {
            // 기본 정렬: 최신순
            productsQuery = productsQuery.sort({ createdAt: -1 });
        }

        // 페이지네이션 적용
        productsQuery = productsQuery.skip(skip).limit(limitNum);

        const products = await productsQuery;

        res.json({
            products,
            currentPage: pageNum,
            totalPages,
            totalProducts
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: error.message });
    }
});

// GET /api/products/:id - 특정 상품 조회 (ID 또는 productId)
router.get('/:id', async (req, res) => {
    try {
        let product;

        // MongoDB ObjectId 형식인지 확인
        if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            product = await Product.findById(req.params.id);
        } else {
            // productId로 검색
            product = await Product.findOne({ productId: req.params.id });
        }

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json(product);
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ message: error.message });
    }
});

// POST /api/products - 새 상품 생성
router.post('/', async (req, res) => {
    try {
        // productId 중복 확인
        const existingProduct = await Product.findOne({ productId: req.body.productId });
        if (existingProduct) {
            return res.status(400).json({ message: 'Product ID already exists' });
        }

        const product = new Product(req.body);
        const newProduct = await product.save();
        res.status(201).json(newProduct);
    } catch (error) {
        console.error('Error creating product:', error);

        // Validation 에러 처리
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ message: 'Validation failed', errors });
        }

        res.status(400).json({ message: error.message });
    }
});

// PUT /api/products/:id - 상품 수정
router.put('/:id', async (req, res) => {
    try {
        // productId 변경 시 중복 확인
        if (req.body.productId) {
            const existingProduct = await Product.findOne({
                productId: req.body.productId,
                _id: { $ne: req.params.id }
            });
            if (existingProduct) {
                return res.status(400).json({ message: 'Product ID already exists' });
            }
        }

        const product = await Product.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.json(product);
    } catch (error) {
        console.error('Error updating product:', error);

        // Validation 에러 처리
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ message: 'Validation failed', errors });
        }

        res.status(400).json({ message: error.message });
    }
});

// PATCH /api/products/:id/status - 상품 상태만 변경
router.patch('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({ message: 'Status is required' });
        }

        const product = await Product.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true, runValidators: true }
        );

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.json(product);
    } catch (error) {
        console.error('Error updating product status:', error);
        res.status(400).json({ message: error.message });
    }
});

// PATCH /api/products/:id/stock - 재고 업데이트
router.patch('/:id/stock', async (req, res) => {
    try {
        const { stock, skuId, stockChange } = req.body;
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        if (product.useOptions && skuId) {
            // SKU별 재고 업데이트
            const sku = product.skus.find(s => s.skuId === skuId);
            if (!sku) {
                return res.status(404).json({ message: 'SKU not found' });
            }
            sku.stock = stock !== undefined ? stock : sku.stock + (stockChange || 0);
        } else {
            // 단일 재고 업데이트
            product.stock = stock !== undefined ? stock : product.stock + (stockChange || 0);
        }

        await product.save();
        res.json(product);
    } catch (error) {
        console.error('Error updating stock:', error);
        res.status(400).json({ message: error.message });
    }
});

// DELETE /api/products/:id - 상품 삭제
router.delete('/:id', async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.json({
            message: 'Product deleted successfully',
            deletedProduct: {
                id: product._id,
                productId: product.productId,
                name: product.name
            }
        });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ message: error.message });
    }
});

// GET /api/products/category/:main - 메인 카테고리별 상품 조회
router.get('/category/:main', async (req, res) => {
    try {
        const products = await Product.find({
            'category.main': req.params.main.toUpperCase()
        }).sort({ createdAt: -1 });

        res.json(products);
    } catch (error) {
        console.error('Error fetching products by category:', error);
        res.status(500).json({ message: error.message });
    }
});

export default router;
