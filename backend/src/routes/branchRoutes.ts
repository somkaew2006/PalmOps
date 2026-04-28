import { Router } from 'express';
import { 
  getBranches, 
  getBranch, 
  createBranch, 
  updateBranch, 
  deleteBranch,
  getStocks
} from '../controllers/branchController';
import { protect } from '../middlewares/authMiddleware';

const router = Router();

router.use(protect);

router.get('/', getBranches);
router.get('/stocks', getStocks);
router.get('/:id', getBranch);
router.post('/', createBranch);
router.put('/:id', updateBranch);
router.delete('/:id', deleteBranch);

export default router;
