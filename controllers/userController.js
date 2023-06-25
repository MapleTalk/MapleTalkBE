// firebase.js 파일에서 Firestore 인스턴스를 반환하는 함수를 가져옵니다.
const { getFirestore } = require('../firebase.js');
// Firestore 인스턴스를 가져옵니다.
const firestore = getFirestore();

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
};

const registerUser = async (req, res) => {
  try {
    const { id, email, name } = req.body;
    const docRef = await firestore.collection('user').add({
      id,
      email,
      name,
    });
    res.json({ success: true, message: 'User data saved' });
  } catch (error) {
    console.error('Error saving user data:', error);
    res.status(500).json({ success: false, message: 'Error saving user data' });
  }
};

module.exports = {
  getUsers,
  checkUser,
  registerUser,
};