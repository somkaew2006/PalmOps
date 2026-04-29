import { Router } from 'express';
import { 
  getSales, 
  createSale, 
  cancelSale 
} from '../controllers/saleController';
import { protect } from '../middlewares/authMiddleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Sales
 *   description: Palm oil sale management
 */

router.use(protect);

/**
 * @swagger
 * /api/sales:
 *   get:
 *     summary: Get all sales
 *     tags: [Sales]
 *     responses:
 *       200:
 *         description: List of sales
 */
router.get('/', getSales);

/**
 * @swagger
 * /api/sales:
 *   post:
 *     summary: Create a new sale
 *     tags: [Sales]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [saleNo, branchId, quantityKg, pricePerKg, grade]
 *             properties:
 *               saleNo: { type: string }
 *               branchId: { type: integer }
 *               quantityKg: { type: number }
 *               pricePerKg: { type: number }
 *               grade: { type: string, enum: [A, B, C] }
 *               customerName: { type: string }
 *               note: { type: string }
 *               saleDate: { type: string, format: date-time }
 *     responses:
 *       201:
 *         description: Sale created
 */
router.post('/', createSale);

/**
 * @swagger
 * /api/sales/{id}/cancel:
 *   post:
 *     summary: Cancel a sale and return stock
 *     tags: [Sales]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Sale cancelled
 */
router.post('/:id/cancel', cancelSale);

export default router;

