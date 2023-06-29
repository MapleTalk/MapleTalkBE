import express from 'express';
import {
    getInfo,
} from '../controllers/sundayController.js';

const router = express.Router();

router.get('/:token', getInfo);

export default router;
