import { Router } from 'express';
import { 
  getSales, 
  createSale, 
  cancelSale 
} from '../controllers/saleController';
import { protect } from '../middlewares/authMiddleware';

const router = Router();

router.use(protect);

router.get('/', getSales);
router.post('/', createSale);
router.post('/:id/cancel', cancelSale);

export default router;
