import Cart from '../models/Cart.js';
import Product from '../models/Product.js';

// 장바구니 조회
export const getCart = async (req, res) => {
    try {
        let cart = await Cart.findOne({ user: req.user.userId }).populate('items.product');

        if (!cart) {
            // 장바구니가 없으면 빈 장바구니 반환
            return res.json({ items: [], totalPrice: 0, totalQuantity: 0 });
        }

        res.json(cart);
    } catch (error) {
        console.error('Get cart error:', error);
        res.status(500).json({ message: 'Failed to fetch cart', error: error.message });
    }
};

// 장바구니에 상품 추가
export const addToCart = async (req, res) => {
    const { productId, quantity, options, skuId } = req.body;

    try {
        let cart = await Cart.findOne({ user: req.user.userId });

        if (!cart) {
            cart = new Cart({ user: req.user.userId, items: [] });
        }

        // Product 조회
        const targetProduct = await Product.findOne({
            $or: [{ productId: productId }, { _id: productId.match(/^[0-9a-fA-F]{24}$/) ? productId : null }]
        });

        if (!targetProduct) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // 가격 결정
        let price = targetProduct.price;
        if (skuId && targetProduct.skus) {
            const sku = targetProduct.skus.find(s => s.skuId === skuId);
            if (sku && sku.additionalPrice) {
                price += sku.additionalPrice;
            }
        }

        // 중복 아이템 확인 (같은 상품 + 같은 옵션/SKU)
        const existingItemIndex = cart.items.findIndex(item => {
            const isSameProduct = item.product.toString() === targetProduct._id.toString();
            if (!isSameProduct) return false;

            if (skuId && item.skuId) return skuId === item.skuId;

            // SKU가 없는 경우 옵션 맵 비교 (단순 JSON 문자열 비교)
            const opts1 = item.options ? JSON.stringify(Object.fromEntries(item.options)) : "{}";
            const opts2 = options ? JSON.stringify(options) : "{}";
            return opts1 === opts2;
        });

        if (existingItemIndex > -1) {
            // 수량 증가
            cart.items[existingItemIndex].quantity += quantity;
        } else {
            // 새 아이템 추가
            cart.items.push({
                product: targetProduct._id, // ObjectId 저장
                quantity,
                options,
                price,
                skuId
            });
        }

        await cart.save();
        const updatedCart = await Cart.findById(cart._id).populate('items.product');
        res.status(200).json(updatedCart);

    } catch (error) {
        console.error('Add to cart error:', error);
        res.status(500).json({ message: 'Failed to add item to cart', error: error.message });
    }
};

// 아이템 수량 수정
export const updateCartItem = async (req, res) => {
    const { itemId } = req.params;
    const { quantity } = req.body;

    if (quantity < 1) {
        return res.status(400).json({ message: 'Quantity must be at least 1' });
    }

    try {
        const cart = await Cart.findOne({ user: req.user.userId });
        if (!cart) return res.status(404).json({ message: 'Cart not found' });

        const item = cart.items.id(itemId); // Mongoose DocumentArray.prototype.id()
        if (!item) return res.status(404).json({ message: 'Item not found in cart' });

        item.quantity = quantity;

        await cart.save();
        const updatedCart = await Cart.findById(cart._id).populate('items.product');
        res.json(updatedCart);

    } catch (error) {
        console.error('Update cart item error:', error);
        res.status(500).json({ message: 'Failed to update item', error: error.message });
    }
};

// 아이템 삭제
export const deleteCartItem = async (req, res) => {
    const { itemId } = req.params;

    try {
        const cart = await Cart.findOne({ user: req.user.userId });
        if (!cart) return res.status(404).json({ message: 'Cart not found' });

        // items 배열에서 해당 아이템 제거
        cart.items.pull({ _id: itemId }); // _id로 제거

        await cart.save();
        const updatedCart = await Cart.findById(cart._id).populate('items.product');
        res.json(updatedCart);

    } catch (error) {
        console.error('Delete cart item error:', error);
        res.status(500).json({ message: 'Failed to delete item', error: error.message });
    }
};

// 장바구니 비우기
export const clearCart = async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user.userId });
        if (cart) {
            cart.items = [];
            await cart.save();
        }
        res.json({ message: 'Cart cleared', items: [], totalPrice: 0, totalQuantity: 0 });
    } catch (error) {
        res.status(500).json({ message: 'Failed to clear cart', error: error.message });
    }
};
