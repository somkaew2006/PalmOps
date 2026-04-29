import { Router } from 'express';
import { getExpenses, createExpense, deleteExpense } from '../controllers/expenseController';
import { protect } from '../middlewares/authMiddleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Expenses
 *   description: Branch expense management
 */

router.use(protect);

/**
 * @swagger
 * /api/expenses:
 *   get:
 *     summary: Get all expenses
 *     tags: [Expenses]
 *     parameters:
 *       - in: query
 *         name: branchId
 *         schema:
 *           type: integer
 *         description: Filter by branch ID
 *     responses:
 *       200:
 *         description: List of expenses
 */
router.get('/', getExpenses);

/**
 * @swagger
 * /api/expenses:
 *   post:
 *     summary: Create a new expense
 *     tags: [Expenses]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount, category, branchId]
 *             properties:
 *               amount: { type: number }
 *               category: { type: string }
 *               description: { type: string }
 *               branchId: { type: integer }
 *               expenseDate: { type: string, format: date-time }
 *     responses:
 *       201:
 *         description: Expense created
 */
router.post('/', createExpense);

/**
 * @swagger
 * /api/expenses/{id}:
 *   delete:
 *     summary: Delete an expense
 *     tags: [Expenses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Expense deleted
 */
router.delete('/:id', deleteExpense);

export default router;

