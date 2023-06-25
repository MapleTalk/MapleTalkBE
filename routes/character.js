import express from 'express';
import {
    getInfo,
} from '../controllers/characterController.js';

const router = express.Router();

router.get('/:token', getInfo);

export default router;
