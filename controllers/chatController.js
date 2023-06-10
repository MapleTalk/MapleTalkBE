import { firestore as _firestore } from 'firebase-admin';

const firestore = _firestore();

export const getChat = async (req, res) => {
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

export const sendChat = async (req, res) => {
  try {
    const { userId, roomId, message } = req.body;
    const messageRef = await firestore.collection('chats').doc(roomId).collection('messages').add({
      userId,
      message,
      timestamp: _firestore.FieldValue.serverTimestamp(),
    });
    res.json({ success: true, message: 'Message sent' });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ success: false, message: 'Error sending message' });
  }
};

export const createChatRoom = async (req, res) => {
  try {
    const { users } = req.body;
    const chatRoomRef = await firestore.collection('chats').add({
      users,
      created: _firestore.FieldValue.serverTimestamp(),
    });
    res.json({ success: true, message: 'Chat room created', roomId: chatRoomRef.id });
  } catch (error) {
    console.error('Error creating chat room:', error);
    res.status(500).json({ success: false, message: 'Error creating chat room' });
  }
};

export const modifyChatRoomInfo = async (req, res) => {
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

export const getUserChats = async (req, res) => {
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
