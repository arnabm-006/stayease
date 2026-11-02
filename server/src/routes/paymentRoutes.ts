import { Router } from 'express';
import {
  createOrder,
  verifyPayment,
  handleWebhook,
  getMyPayments,
  refundPayment,
} from '../controllers/paymentController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validateMiddleware.js';
import {
  createOrderSchema,
  verifyPaymentSchema,
  refundPaymentSchema,
} from '../validators/paymentValidators.js';

const router = Router();

router.post('/create-order', authenticate, validate(createOrderSchema), createOrder);
router.post('/verify', authenticate, validate(verifyPaymentSchema), verifyPayment);
router.post('/webhook', handleWebhook);
router.get('/my', authenticate, getMyPayments);
router.post('/:id/refund', authenticate, validate(refundPaymentSchema), refundPayment);

export default router;
