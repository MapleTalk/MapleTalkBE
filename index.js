const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');
const bodyParser = require('body-parser');
const errorHandler = require('./errorHandler.js');
const { initFirebase } = require('./firebase.js');

const app = express();
app.use(bodyParser.json());

const port = 3000;

async function startApp() {
  await initFirebase();
  
  // 라우터 생성
  const chatRouter = express.Router();
  const userRouter = express.Router();

  // 라우터에 미들웨어 연결
  const chatController = require('./controllers/chatController.js');
  const userController = require('./controllers/userController.js');
  chatRouter.get('/getChat/:roomId', chatController.getChat);
  chatRouter.post('/sendChat', chatController.sendChat);
  chatRouter.post('/getOrCreateChatRoom', chatController.getOrCreateChatRoom);
  chatRouter.put('/modifyChatRoomInfo/:roomId', chatController.modifyChatRoomInfo);
  chatRouter.get('/getUserChats/:userId', chatController.getUserChats);

  userRouter.get('/', userController.getUsers);
  userRouter.get('/checkUser/:id', userController.checkUser);
  userRouter.post('/register', userController.registerUser);

  app.use('/api/chats', chatRouter);
  app.use('/api/users', userRouter);
  app.use(errorHandler); // Use errorHandler

  app.listen(port, () => {
    console.log(`Server started on port ${port}`);
  });
}

startApp();
