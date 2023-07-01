const { createHash } = require('crypto');
const axios = require('axios');
const cheerio = require('cheerio');
const url = require('url');
const { getFirestore } = require('../firebase.js');
const {Storage} = require('@google-cloud/storage');

const firestore = getFirestore();
const storage = new Storage({
  projectId: 'mapletalk-c0c99',
  keyFilename: '../config/serviceAccountKey.json'
});

async function getSundayInfo(sunday) { 
    const hash = createHash('sha256');
    hash.update(sunday);
    const docId = hash.digest('hex');
  
    let doc = await firestore.collection('sundayInfo').doc(docId).get();
    if (doc.exists) {
      console.log("문서가 존재하여 파이어베이스에서 받아옴");
      return doc.data();
    } else {
      const sundayInfo = await scrapeSundayMaple(sunday);
      if (!sundayInfo) {
        console.log("해당 정보를 찾을 수 없습니다.");
        return null;
      }
      await firestore.collection('sundayInfo').doc(docId).set(sundayInfo);
      console.log("문서가 없어서 스크래핑 후 파이어베이스에 저장");
      return sundayInfo;
    }
  }
  
  const getInfo = async (req, res) => {
    const { token } = req.params;
    // 'message'가 '!썬데이'인지 확인
    if (token === '!썬데이') {
      // 캐릭터 정보 가져오기
      const sundayInfo = await getSundayInfo('하이퍼 버닝'); 
      let response;

      if (!sundayInfo) {
        response = { reply: '오류가 발생했습니다.' };
      } else {
        response = { reply: sundayInfo };
      }

      res.json(response); 
    } else {
      res.json({ reply: '잘못된 명령입니다.' });
    }
};

// ... 이하 생략 ...
// 나머지 코드는 변경사항 없음

module.exports = {
    getInfo,
};
