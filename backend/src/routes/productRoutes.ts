import { Router } from 'express';
import { getProductGroups, getProducts, createProductGroup, createProduct } from '../controllers/productController';
import { protect } from '../middlewares/authMiddleware';

const router = Router();

console.log('!!! PRODUCT ROUTES LOADED !!!');

/**
 * @swagger
 * tags:
 *   name: MasterData
 *   description: Master data management for products and groups
 */

// Apply protection to all routes
router.use(protect);

/**
 * @swagger
 * /api/master-data/groups:
 *   get:
 *     summary: Get all product groups with their products
 *     tags: [MasterData]
 *     responses:
 *       200:
 *         description: List of product groups
 *   post:
 *     summary: Create a new product group
 *     tags: [MasterData]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               note:
 *                 type: string
 *     responses:
 *       201:
 *         description: Group created
 *       400:
 *         description: Invalid input or duplicate name
 */
router.get('/groups', getProductGroups);
router.post('/groups', createProductGroup);

/**
 * @swagger
 * /api/master-data:
 *   get:
 *     summary: Get all products
 *     tags: [MasterData]
 *     parameters:
 *       - in: query
 *         name: groupId
 *         schema:
 *           type: integer
 *         description: Filter by group ID
 *     responses:
 *       200:
 *         description: List of products
 *   post:
 *     summary: Create a new product
 *     tags: [MasterData]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - groupId
 *             properties:
 *               name:
 *                 type: string
 *               unit:
 *                 type: string
 *               groupId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Product created
 */
router.get('/', getProducts);
router.post('/', createProduct);

export default router;
