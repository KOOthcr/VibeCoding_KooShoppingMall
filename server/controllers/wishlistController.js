import Wishlist from '../models/Wishlist.js';
import Product from '../models/Product.js';

// 위시리스트 조회
export const getWishlist = async (req, res) => {
    try {
        let wishlist = await Wishlist.findOne({ user: req.user.userId }).populate('items.product');

        if (!wishlist) {
            wishlist = new Wishlist({ user: req.user.userId, items: [] });
            await wishlist.save();
        }

        res.json(wishlist);
    } catch (error) {
        console.error('Get wishlist error:', error);
        res.status(500).json({ message: 'Failed to fetch wishlist', error: error.message });
    }
};

// 위시리스트에 추가
export const addToWishlist = async (req, res) => {
    const { productId } = req.body;

    try {
        let wishlist = await Wishlist.findOne({ user: req.user.userId });

        if (!wishlist) {
            wishlist = new Wishlist({ user: req.user.userId, items: [] });
        }

        // 이미 존재하는지 확인
        const existingItem = wishlist.items.find(item => item.product.toString() === productId);
        if (existingItem) {
            return res.status(400).json({ message: '이미 즐겨찾기에 추가된 상품입니다.' });
        }

        wishlist.items.push({ product: productId });
        await wishlist.save();

        const updatedWishlist = await Wishlist.findById(wishlist._id).populate('items.product');
        res.status(200).json(updatedWishlist);
    } catch (error) {
        console.error('Add to wishlist error:', error);
        res.status(500).json({ message: 'Failed to add item to wishlist', error: error.message });
    }
};

// 위시리스트에서 삭제
export const removeFromWishlist = async (req, res) => {
    const { productId } = req.params;

    try {
        const wishlist = await Wishlist.findOne({ user: req.user.userId });

        if (!wishlist) {
            return res.status(404).json({ message: 'Wishlist not found' });
        }

        // items 배열에서 해당 상품 ID를 가진 항목 제거
        wishlist.items = wishlist.items.filter(item => item.product.toString() !== productId);

        await wishlist.save();
        const updatedWishlist = await Wishlist.findById(wishlist._id).populate('items.product');
        res.json(updatedWishlist);
    } catch (error) {
        console.error('Delete wishlist item error:', error);
        res.status(500).json({ message: 'Failed to remove item', error: error.message });
    }
};
