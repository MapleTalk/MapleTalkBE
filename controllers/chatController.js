// firebase.js 파일에서 Firestore 인스턴스를 반환하는 함수를 가져옵니다.
const { getFirestore, FieldValue } = require('../firebase.js');
// Firestore 인스턴스를 가져옵니다.
const firestore = getFirestore();

// 이제 'firestore.collection'을 호출하면 함수를 반환해야 합니다.


const getChat = async (req, res) => {
  try {
    const { roomId } = req.params;
    const snapshot = await firestore.collection('chats').doc(roomId).collection('messages')
      .orderBy('timestamp', 'asc').get();
    if (snapshot.empty) {
      res.json({ success: false, message: 'No messages in this chat room' });
    } else {
      const messages = [];
      snapshot.forEach((doc) => {
        messages.push(doc.data());
      });
      res.json({ success: true, data: messages });
    }
  } catch (error) {
    console.error('Error fetching chat room messages:', error);
    res.status(500).json({ success: false, message: 'Error fetching chat room messages' });
  }
};

const sendChat = async (req, res) => {
  try {
    const { userId, roomId, message } = req.body;
    const messageRef = await firestore.collection('chats').doc(roomId).collection('messages').add({
      userId,
      message,
      timestamp: FieldValue.serverTimestamp(),
    });
    res.json({ success: true, message: 'Message sent' });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ success: false, message: 'Error sending message' });
  }
};

const getOrCreateChatRoom = async (req, res) => {
  try {
    const { users } = req.body;

    // Sort the users array
    users.sort();

    // Query for existing chat room
    const chatRoomsSnap = await firestore.collection('chats').where('users', '==', users).get();

    if (!chatRoomsSnap.empty) {
      // If chat room exists, return the first one
      const chatRoom = chatRoomsSnap.docs[0];
      res.json({ success: true, message: 'Chat room found', roomId: chatRoom.id });
    } else {
      // If chat room does not exist, create a new one
      const chatRoomRef = await firestore.collection('chats').add({
        users,
        created: FieldValue.serverTimestamp(),
      });
      res.json({ success: true, message: 'Chat room created', roomId: chatRoomRef.id });
    }
  } catch (error) {
    console.error('Error getting or creating chat room:', error);
    res.status(500).json({ success: false, message: 'Error getting or creating chat room' });
  }
};

const modifyChatRoomInfo = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { users } = req.body;
    await firestore.collection('chats').doc(roomId).update({ users });
    res.json({ success: true, message: 'Chat room info updated' });
  } catch (error) {
    console.error('Error updating chat room info:', error);
    res.status(500).json({ success: false, message: 'Error updating chat room info' });
  }
};

const getUserChats = async (req, res) => {
  try {
    const { userId } = req.params;
    const snapshot = await firestore.collection('chats')
      .where('users', 'array-contains', userId)
      .get();
    if (snapshot.empty) {
      res.json({ success: false, message: 'No chat rooms found for this user' });
    } else {
      const chatRooms = [];
      snapshot.forEach((doc) => {
        chatRooms.push(doc.data());
      });
      res.json({ success: true, data: chatRooms });
    }
  } catch (error) {
    console.error('Error fetching user chat rooms:', error);
    res.status(500).json({ success: false, message: 'Error fetching user chat rooms' });
  }
};

module.exports = {
  getChat,
  sendChat,
  getOrCreateChatRoom,
  modifyChatRoomInfo,
  getUserChats,
};