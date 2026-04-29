import { Router } from 'express';
import { 
  getBranches, 
  getBranch, 
  createBranch, 
  updateBranch, 
  deleteBranch,
  getStocks,
  getBranchStockHistory
} from '../controllers/branchController';
import { protect } from '../middlewares/authMiddleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Branches
 *   description: Branch and Stock management
 */

router.use(protect);

/**
 * @swagger
 * /api/branches:
 *   get:
 *     summary: Get all branches
 *     tags: [Branches]
 *     responses:
 *       200:
 *         description: List of branches
 */
router.get('/', getBranches);

/**
 * @swagger
 * /api/branches/stocks:
 *   get:
 *     summary: Get all stocks across branches
 *     tags: [Stocks]
 *     parameters:
 *       - in: query
 *         name: branchId
 *         schema:
 *           type: integer
 *         description: Filter by branch ID
 *     responses:
 *       200:
 *         description: List of stocks
 */
router.get('/stocks', getStocks);

/**
 * @swagger
 * /api/branches/{id}/stock-history:
 *   get:
 *     summary: Get stock movement history for a branch
 *     tags: [Stocks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Branch ID or "all"
 *     responses:
 *       200:
 *         description: List of stock movements
 */
router.get('/:id/stock-history', getBranchStockHistory);


/**
 * @swagger
 * /api/branches/{id}:
 *   get:
 *     summary: Get a branch by ID
 *     tags: [Branches]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Branch details
 *       404:
 *         description: Branch not found
 */
router.get('/:id', getBranch);

/**
 * @swagger
 * /api/branches:
 *   post:
 *     summary: Create a new branch
 *     tags: [Branches]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [branchCode, branchName]
 *             properties:
 *               branchCode: { type: string }
 *               branchName: { type: string }
 *               address: { type: string }
 *               phone: { type: string }
 *               isActive: { type: boolean }
 *     responses:
 *       201:
 *         description: Branch created
 */
router.post('/', createBranch);

/**
 * @swagger
 * /api/branches/{id}:
 *   put:
 *     summary: Update a branch
 *     tags: [Branches]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               branchCode: { type: string }
 *               branchName: { type: string }
 *               address: { type: string }
 *               phone: { type: string }
 *               isActive: { type: boolean }
 *     responses:
 *       200:
 *         description: Branch updated
 */
router.put('/:id', updateBranch);

/**
 * @swagger
 * /api/branches/{id}:
 *   delete:
 *     summary: Delete a branch
 *     tags: [Branches]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Branch deleted
 */
router.delete('/:id', deleteBranch);

export default router;

