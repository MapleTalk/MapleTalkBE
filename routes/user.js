import express from 'express';
import {
  getUsers,
  checkUser,
  registerUser,
} from '../controllers/userController.js';

const router = express.Router();

router.get('/', getUsers);
router.get('/checkUser/:id', checkUser);
router.post('/register', registerUser);

export default router;
