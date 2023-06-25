// 필요한 모듈들을 불러옵니다.
import express, { json } from 'express';
import { get } from 'axios';
import { load } from 'cheerio';
import cors from 'cors';
import { resolve as _resolve } from 'url';
import { initializeApp, credential as _credential, firestore } from 'firebase-admin';
import serviceAccount from '../config/serviceAccountKey.json';
import { createHash } from 'crypto';
import { Storage } from '@google-cloud/storage';
import { scheduleJob } from 'node-schedule';

const app = express();
const port = 3002;

app.use(json());

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

app.post('/allupdate', async (req, res) => {
  // 데이터베이스에서 모든 유저 정보를 가져옴
  const snapshot = await db.collection('userInfo').get();
  
  // 각 유저에 대해 정보를 스크랩하고 데이터베이스에 저장
  snapshot.forEach(async doc => {
    const character = doc.data().nickname;
    const userInfo = await scrapeUserInfo(character);
    
    // 스크랩한 정보를 데이터베이스에 업데이트
    await db.collection('userInfo').doc(doc.id).set(userInfo);
  });

  res.status(200).send('모든 정보가 갱신되었습니다.');
});

app.post('/update/:character', async (req, res) => {
  // URL에서 캐릭터 이름을 가져옴
  const character = req.params.character;

  // 해당 캐릭터에 대한 정보를 스크래핑하고 데이터베이스에 저장
  const userInfo = await scrapeUserInfo(character);
  if (userInfo === null) {
    res.status(400).send(`Failed to update information for ${character}`);
  } else {
    const hash = createHash('sha256');
    hash.update(character);
    const docId = hash.digest('hex');
    await db.collection('userInfo').doc(docId).set(userInfo);
    res.status(200).send(`${character} has been updated.`);
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

          try {
            const url = await file.getSignedUrl(config);
            resolve(url[0]);
          } catch (error) {
            console.error('Error occurred while generating signed URL:', error);
            reject(error);
          }
        });

        writeStream.on('error', (error) => {
          console.error('Error occurred while uploading image to Firebase:', error);
          reject(error);
        });
      })
      .catch(error => {
        console.error('Error occurred while downloading image:', error);
        reject(error);
      });
  });
}


// 자정마다 실행되는 스케줄을 설정합니다.
scheduleJob('0 0 * * *', async function() {
  console.log('Updating all user info... at 00:00');

  // Firestore에서 모든 사용자 정보를 불러옵니다.
  const usersSnapshot = await db.collection('userInfo').get();

  // 각 사용자에 대해 웹 크롤링을 실행하고 결과를 Firestore에 저장합니다.
  usersSnapshot.forEach(async (doc) => {
    const character = doc.data().nickname;
    const userInfo = await scrapeUserInfo(character);

    // scrapeUserInfo가 null을 반환하면 해당 사용자의 정보를 업데이트하지 않습니다.
    if (userInfo !== null) {
      console.log(`Updating ${character}...`);
      await db.collection('userInfo').doc(doc.id).set(userInfo);
    }
  });

  console.log('Update complete.');
});

app.listen(port, () => {
  console.log(`App is listening at http://localhost:${port}`);
});
