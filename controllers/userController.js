import { firestore as _firestore } from 'firebase-admin';

const firestore = _firestore();

export const getUsers = async (req, res) => {
  try {
    const snapshot = await firestore.collection('user').get();
    const users = [];
    snapshot.forEach((doc) => {
      users.push(doc.data());
    });
    res.json(users);
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({ success: false, message: 'Error fetching user data' });
  }
};

export const checkUser = async (req, res) => {
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

export const registerUser = async (req, res) => {
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
