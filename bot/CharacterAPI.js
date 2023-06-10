// 필요한 모듈들을 불러옵니다.
import express from 'express';
import { get } from 'axios';
import { load } from 'cheerio';
import cors from 'cors';
import { resolve as _resolve } from 'url';
import { initializeApp, credential as _credential, firestore } from 'firebase-admin';
import serviceAccount from '../config/serviceAccountKey.json';
import { createHash } from 'crypto';
import { Storage } from '@google-cloud/storage';

const app = express();
const port = 3002;

initializeApp({
  credential: _credential.cert(serviceAccount)
});

let db = firestore();

const storage = new Storage({
  projectId: 'mapletalk-c0c99',
  keyFilename: '../config/serviceAccountKey.json'
});

app.use(cors());

app.get('/chat', async (req, res) => {
  const message = req.query.message;

  if (message.startsWith('!')) {
    var msg = message.split(' ')
    const command = msg[0]
    const param = msg[1]

    const commandMapping = {
      '!정보': getOrAddUserInfo,
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
});

async function getOrAddUserInfo(character) {
  const hash = createHash('sha256');
  hash.update(character);
  const docId = hash.digest('hex');

  let doc = await db.collection('userInfo').doc(docId).get();
  if (doc.exists) {
    console.log("문서가 존재하여 파이어베이스에서 받아옴");
    return doc.data();
  } else {
    const userInfo = await scrapeUserInfo(character);
    if (!userInfo) {
      console.log("해당 캐릭터 정보를 찾을 수 없습니다.");
      return null;
    }
    await db.collection('userInfo').doc(docId).set(userInfo);
    console.log("문서가 없어서 스크래핑 후 파이어베이스에 저장");
    return userInfo;
  }
}

async function scrapeUserInfo(character) {
  const websiteUrl = `https://maplestory.nexon.com/N23Ranking/World/Total?c=${encodeURIComponent(character)}`;

  const response1 = await get(websiteUrl);
  const $ = load(response1.data);

  let hyperlink = $('tr.search_com_chk dl dt a').attr('href');
  if (!hyperlink) {
    return null;
  }
  hyperlink = _resolve(websiteUrl, hyperlink);

  const response2 = await get(hyperlink);
  const $$ = load(response2.data);

  const levelData = $$('div.char_info dl:nth-child(1) dd').text().trim();
  const jobData = $$('div.char_info dl:nth-child(2) dd').text().trim();
  const worldData = $$('div.char_info dl:nth-child(3) dd').text().trim();
  const expData = $$('div.level_data span:nth-child(1)').text().replace('경험치', '').trim();
  const imageSrc = $$('div.char_img div img').attr('src');

  const userInfo = {
    nickname: character,
    level: levelData,
    job: jobData,
    world: worldData,
    experience: expData,
    image: null
  };

  console.log(userInfo);

  try {
    const uploadedImageURL = await uploadImageToFirebase(imageSrc, character);
    if (uploadedImageURL !== null) {
      userInfo.image = uploadedImageURL;
      console.log('이미지가 저장되었습니다.');
    } else {
      console.log('이미지 저장에 실패했습니다.');
    }
  } catch (error) {
    console.error('이미지 업로드 중 오류가 발생했습니다:', error);
  }

  return userInfo;
}


async function uploadImageToFirebase(imageUrl, character) {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha256');
    hash.update(character);
    const fileName = hash.digest('hex');
    const bucket = storage.bucket('mapletalk-c0c99.appspot.com');
    const file = bucket.file(`character/${fileName}`);
    const writeStream = file.createWriteStream();

    get(imageUrl, { responseType: 'stream' })
      .then(response => {
        response.data.pipe(writeStream);

        writeStream.on('finish', async () => {
          console.log('Image uploaded to Firebase Storage.');

          const config = {
            action: 'read',
            expires: '03-17-2025'
          };

          const url = await file.getSignedUrl(config);

          resolve(url[0]);
        });

        writeStream.on('error', (error) => {
          console.error('Error occurred while uploading image to Firebase:', error);
          reject(null);
        });
      })
      .catch(error => {
        console.error('Error occurred while downloading image:', error);
        reject(null);
      });
  });
}

app.listen(port, () => {
  console.log(`App is listening at http://localhost:${port}`);
});
