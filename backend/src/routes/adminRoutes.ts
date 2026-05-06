
import { Router } from 'express';
import { createBackup, listBackups, restoreBackup, deleteBackup, downloadBackup } from '../controllers/adminController';
import { protect, adminOnly } from '../middlewares/authMiddleware';

const router = Router();

// All routes here are protected and only for admins
router.use(protect);
router.use(adminOnly);

router.post('/backup', createBackup);
router.get('/backups', listBackups);
router.post('/restore', restoreBackup);
router.delete('/backups/:filename', deleteBackup);
router.get('/backups/:filename/download', downloadBackup);

export default router;
