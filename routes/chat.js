import express from 'express';
import {
  getChat,
  sendChat,
  createChatRoom,
  modifyChatRoomInfo,
  getUserChats
} from '../controllers/chatsController.js';

const router = express.Router();

router.get('/getChat/:roomId', getChat);
router.post('/sendChat', sendChat);
router.post('/createChatRoom', createChatRoom);
router.put('/modifyChatRoomInfo/:roomId', modifyChatRoomInfo);
router.get('/getUserChats/:userId', getUserChats);

export default router;
