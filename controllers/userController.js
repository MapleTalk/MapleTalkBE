// firebase.js 파일에서 Firestore 인스턴스를 반환하는 함수를 가져옵니다.
const { getFirestore } = require('../firebase.js');
// Firestore 인스턴스를 가져옵니다.
const firestore = getFirestore();
const crypto = require('crypto');

// 이제 'firestore.collection'을 호출하면 함수를 반환해야 합니다.

const getUsers = async (req, res) => {
  try {
    console.log("Fetching users from Firestore");
    const snapshot = await firestore.collection('user').get();
    const users = [];
    snapshot.forEach((doc) => {
      users.push(doc.data());
    });
    console.log("Users fetched:", users);
    res.json(users);
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({ success: false, message: 'Error fetching user data' });
  }
};

const checkUser = async (req, res) => { 
  try {
    const { id } = req.params;
    const hash = crypto.createHash('sha256');
    hash.update(id);
    const hashedId = hash.digest('hex');

    const snapshot = await firestore.collection('user').where('hashedId', '==', hashedId).get();
    if (snapshot.empty) {
      res.json({ success: false, message: 'User does not exist' });

    } else {
      res.json({ success: true, message: 'User exists' });
    }
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({ success: false, message: 'Error fetching user data' });
  }
};

async function registerUser(req, res) {
  try {
    const { id, email, name } = req.body;

    // 사용자 ID를 해시 코드로 변환
    const hash = crypto.createHash('sha256');
    hash.update(id);
    const hashedId = hash.digest('hex');

    // 문서가 이미 존재하는지 확인
    const docRef = firestore.collection('user').doc(hashedId);
    const doc = await docRef.get();

    if (!doc.exists) {
      // 문서가 존재하지 않으면 새 문서를 생성
      await docRef.set({ hashedId,id, email, name });
      res.json({ success: true, message: 'User data saved' });
    } else {
      // 문서가 이미 존재하면 이름만 업데이트
      await docRef.update({ name });
      res.json({ success: true, message: 'User name updated' });
    }
  } catch (error) {
    console.error('Error saving user data:', error);
    res.status(500).json({ success: false, message: 'Error saving user data' });
  }
}

module.exports = {
  getUsers,
  checkUser,
  registerUser,
};