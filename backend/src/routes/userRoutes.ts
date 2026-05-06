import { Router } from 'express';
import { getUsers, createUser, updateUser, deleteUser } from '../controllers/userController';
import { protect, authorize } from '../middlewares/authMiddleware';

const router = Router();

// ทุก Route ในนี้ต้อง Login และเป็น Admin เท่านั้น
router.use(protect);
router.use(authorize('admin'));

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management for the current company (Admin only)
 */

router.get('/', getUsers);
router.post('/', createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;
