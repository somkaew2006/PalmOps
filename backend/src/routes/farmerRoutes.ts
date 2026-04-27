import { Router } from 'express';
import { 
  getFarmers, 
  getFarmer, 
  createFarmer, 
  updateFarmer, 
  deleteFarmer 
} from '../controllers/farmerController';
import { protect } from '../middlewares/authMiddleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Farmers
 *   description: Farmer management
 */

router.use(protect);

/**
 * @swagger
 * /api/farmers:
 *   get:
 *     summary: Get all farmers
 *     tags: [Farmers]
 *     responses:
 *       200:
 *         description: List of farmers
 */
router.get('/', getFarmers);

/**
 * @swagger
 * /api/farmers/{id}:
 *   get:
 *     summary: Get a farmer by ID
 *     tags: [Farmers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Farmer details
 *       404:
 *         description: Farmer not found
 */
router.get('/:id', getFarmer);

/**
 * @swagger
 * /api/farmers:
 *   post:
 *     summary: Create a new farmer
 *     tags: [Farmers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [farmerCode, fullName]
 *             properties:
 *               farmerCode: { type: string }
 *               fullName: { type: string }
 *               phone: { type: string }
 *               address: { type: string }
 *     responses:
 *       201:
 *         description: Farmer created
 */
router.post('/', createFarmer);

/**
 * @swagger
 * /api/farmers/{id}:
 *   put:
 *     summary: Update a farmer
 *     tags: [Farmers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Farmer updated
 */
router.put('/:id', updateFarmer);

/**
 * @swagger
 * /api/farmers/{id}:
 *   delete:
 *     summary: Delete a farmer
 *     tags: [Farmers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Farmer deleted
 */
router.delete('/:id', deleteFarmer);

export default router;
