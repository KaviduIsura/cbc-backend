// routes/cartRouter.js
import express from 'express';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  getCartCount
} from '../controllers/CartController.js';

const router = express.Router();

// All routes require authentication
router.get('/', getCart);
router.get('/count', getCartCount);
router.post('/add', addToCart);
router.put('/:itemId', updateCartItem);
router.delete('/:itemId', removeCartItem);
router.delete('/', clearCart);

export default router;