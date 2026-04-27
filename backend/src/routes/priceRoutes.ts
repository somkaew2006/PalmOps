import { Router } from 'express';
import { 
  getPrices, 
  getTodayPrice, 
  createPrice, 
  updatePrice, 
  deletePrice 
} from '../controllers/priceController';
import { protect } from '../middlewares/authMiddleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Prices
 *   description: Daily price management
 */

router.use(protect);

/**
 * @swagger
 * /api/prices:
 *   get:
 *     summary: Get all daily prices
 *     tags: [Prices]
 *     responses:
 *       200:
 *         description: List of prices
 */
router.get('/', getPrices);

/**
 * @swagger
 * /api/prices/today:
 *   get:
 *     summary: Get today's price (or most recent)
 *     tags: [Prices]
 *     responses:
 *       200:
 *         description: Today's price details
 */
router.get('/today', getTodayPrice);

/**
 * @swagger
 * /api/prices:
 *   post:
 *     summary: Create a new daily price
 *     tags: [Prices]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [priceDate, priceGradeA, priceGradeB, priceGradeC]
 *             properties:
 *               priceDate: { type: string, format: date }
 *               priceGradeA: { type: number }
 *               priceGradeB: { type: number }
 *               priceGradeC: { type: number }
 *               referenceSource: { type: string }
 *     responses:
 *       201:
 *         description: Price created
 */
router.post('/', createPrice);

/**
 * @swagger
 * /api/prices/{id}:
 *   put:
 *     summary: Update a price
 *     tags: [Prices]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Price updated
 */
router.put('/:id', updatePrice);

/**
 * @swagger
 * /api/prices/{id}:
 *   delete:
 *     summary: Delete a price
 *     tags: [Prices]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Price deleted
 */
router.delete('/:id', deletePrice);

export default router;
