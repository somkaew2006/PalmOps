import { Router } from 'express';
import { 
  getTickets, 
  getTicket, 
  createTicket, 
  updateTicket, 
  deleteTicket 
} from '../controllers/weighController';
import { protect } from '../middlewares/authMiddleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: WeighTickets
 *   description: Weighing operations and ticket management
 */

router.use(protect);

/**
 * @swagger
 * /api/weigh:
 *   get:
 *     summary: Get all weigh tickets
 *     tags: [WeighTickets]
 *     responses:
 *       200:
 *         description: List of tickets
 */
router.get('/', getTickets);

/**
 * @swagger
 * /api/weigh/{id}:
 *   get:
 *     summary: Get a ticket by ID
 *     tags: [WeighTickets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Ticket details
 */
router.get('/:id', getTicket);

/**
 * @swagger
 * /api/weigh:
 *   post:
 *     summary: Create a new weigh ticket
 *     tags: [WeighTickets]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [farmerId, priceId, grossWeightKg, tareWeightKg]
 *             properties:
 *               farmerId: { type: integer }
 *               vehicleId: { type: integer }
 *               priceId: { type: integer }
 *               grossWeightKg: { type: number }
 *               tareWeightKg: { type: number }
 *               ffaPercent: { type: number }
 *               oilPercent: { type: number }
 *               grade: { type: string, enum: [A, B, C] }
 *     responses:
 *       201:
 *         description: Ticket created
 */
router.post('/', createTicket);

/**
 * @swagger
 * /api/weigh/{id}:
 *   put:
 *     summary: Update a weigh ticket (e.g. confirm payment)
 *     tags: [WeighTickets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Ticket updated
 */
router.put('/:id', updateTicket);

/**
 * @swagger
 * /api/weigh/{id}:
 *   delete:
 *     summary: Delete a weigh ticket
 *     tags: [WeighTickets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Ticket deleted
 */
router.delete('/:id', deleteTicket);

export default router;
