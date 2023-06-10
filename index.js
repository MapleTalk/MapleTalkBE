import express from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from './swagger.json';

import { initializeApp, credential as _credential } from 'firebase-admin';
import { json } from 'body-parser';
import serviceAccount from './config/serviceAccountKey.json';
import errorHandler from './errorHandler.js'; // Import errorHandler
import * as chatController from './controllers/chatController.js';
import * as userController from './controllers/userController.js';

initializeApp({
  credential: _credential.cert(serviceAccount),
});

const app = express();
app.use(json());

// 라우터 생성
const chatRouter = express.Router();
const userRouter = express.Router();

// 라우터에 미들웨어 연결
chatRouter.get('/getChat/:roomId', chatController.getChat);
chatRouter.post('/sendChat', chatController.sendChat);
chatRouter.post('/createChatRoom', chatController.createChatRoom);
chatRouter.put('/modifyChatRoomInfo/:roomId', chatController.modifyChatRoomInfo);
chatRouter.get('/getUserChats/:userId', chatController.getUserChats);

userRouter.get('/', userController.getUsers);
userRouter.get('/checkUser/:id', userController.checkUser);
userRouter.post('/register', userController.registerUser);

app.use('/api/chats', chatRouter);
app.use('/api/users', userRouter);
app.use(errorHandler); // Use errorHandler

const port = 3000;
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
