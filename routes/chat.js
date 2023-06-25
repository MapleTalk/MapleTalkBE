import express from 'express';
import {
  getChat,
  sendChat,
  getOrCreateChatRoom,
  modifyChatRoomInfo,
  getUserChats
} from '../controllers/chatController.js';

const router = express.Router();

router.get('/getChat/:roomId', getChat);
router.post('/sendChat', sendChat);
router.post('/getOrCreateChatRoom', getOrCreateChatRoom);
router.put('/modifyChatRoomInfo/:roomId', modifyChatRoomInfo);
router.get('/getUserChats/:userId', getUserChats);

export default router;
