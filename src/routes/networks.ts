import { Router } from 'express';
import * as networkController from '../controllers/networkController';

const router = Router();

router.get('/',        networkController.getNetworks);
router.get('/:id',     networkController.getNetwork);
router.post('/',       networkController.createNetwork);
router.put('/:id',     networkController.updateNetwork);
router.delete('/:id',  networkController.deleteNetwork);

export default router;
