const { createHash } = require('crypto');
const { getFirestore } = require('../firebase.js');

const firestore = getFirestore();

async function getCharcterInfo(character) {
  const hash = createHash('sha256');
  hash.update(character);
  const docId = hash.digest('hex');

  let doc = await firestore.collection('userInfo').doc(docId).get();
  if (doc.exists) {
      console.log("문서가 존재하여 파이어베이스에서 받아옴");
      return doc.data();
  } else {
      console.log("해당 캐릭터 정보를 찾을 수 없습니다.");
      return null;
  }
}

const getInfo = async (req, res) => {
    const { token } = req.params;

    if (token.startsWith('!')) {
      var msg = token.split(' ')
      const command = msg[0]
      const param = msg[1]
  
      const commandMapping = {
        '!정보': getCharcterInfo,
        // TODO : 무릉,
      };
  
      let response;
      if (command in commandMapping) {
        const userInfo = await commandMapping[command](param); 
        if (!userInfo) {
          response = { reply: '해당 캐릭터 정보를 찾을 수 없습니다.' };
        } else {
          response = { reply: userInfo };
        }
      } else {
        response = { reply: '잘못된 명령입니다.' };
      }
  
      res.json(response); 
    } else {
      res.json({ reply: '잘못된 명령입니다.' });
    }
};

module.exports = {
    getInfo,
};