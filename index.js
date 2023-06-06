const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');

const admin = require('firebase-admin');
const bodyParser = require('body-parser');
const serviceAccount = require('./config/serviceAccountKey.json'); // 서비스 계정 키 파일 경로

// Firebase Admin SDK 초기화
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Firestore 인스턴스 생성
const firestore = admin.firestore();

// Express 앱 생성
const app = express();
app.use(bodyParser.json());

// GET API 엔드포인트 - 사용자 목록 가져오기
app.get('/api/users', async (req, res) => {
  try {
    // Firestore 'users' 컬렉션에서 모든 문서 가져오기
    const snapshot = await firestore.collection('user').get();

    // 문서 데이터 추출
    const users = [];
    snapshot.forEach((doc) => {
      const userData = doc.data();
      users.push(userData);
    });

    res.json(users);
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({ success: false, message: 'Error fetching user data' });
  }
});

// GET API 엔드포인트 - 사용자 존재 여부 확인
app.get('/api/checkUser/:id', async (req, res) => {
  try {
    // 파라미터에서 사용자 ID 가져오기
    const { id } = req.params;

    // Firestore 'users' 컬렉션에서 사용자 ID에 해당하는 문서 가져오기
    const snapshot = await firestore.collection('user').where('id', '==', id).get();

    if (snapshot.empty) {
      res.json({ success: false, message: 'User does not exist' });
    } else {
      res.json({ success: true, message: 'User exists' });
    }
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({ success: false, message: 'Error fetching user data' });
  }
});



// POST API 엔드포인트 - 사용자 정보 저장
app.post('/api/register', async (req, res) => {
  try {
    const { id, email, name } = req.body;

    // Firestore 'users' 컬렉션에 새로운 문서 생성
    const docRef = await firestore.collection('users').add({
      id,
      email,
      name,
    });

    console.log('User data saved with ID:', docRef.id);
    res.json({ success: true, message: 'User data saved' });
  } catch (error) {
    console.error('Error saving user data:', error);
    res.status(500).json({ success: false, message: 'Error saving user data' });
  }
});

// 서버 시작
const port = 3000;
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});