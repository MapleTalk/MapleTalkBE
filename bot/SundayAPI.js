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

app.get('/sunday', async (req, res) => {
    const message = req.query.message;
  
    // 'message'가 '!썬데이'인지 확인
    if (message === '!썬데이') {
      // 캐릭터 정보 가져오기
      const sundayInfo = await getSundayInfo('캐릭터명'); 
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
  });

async function getSundayInfo(sunday) { 
  const hash = createHash('sha256');
  hash.update(sunday);
  const docId = hash.digest('hex');

  let doc = await db.collection('sundayInfo').doc(docId).get();
  if (doc.exists) {
    console.log("문서가 존재하여 파이어베이스에서 받아옴");
    return doc.data();
  } else {
    const sundayInfo = await scrapeSundayInfo(sunday);
    if (!sundayInfo) {
      console.log("해당 정보를 찾을 수 없습니다.");
      return null;
    }
    await db.collection('sundayInfo').doc(docId).set(sundayInfo);
    console.log("문서가 없어서 스크래핑 후 파이어베이스에 저장");
    return sundayInfo;
  }
}

async function scrapeSundayMaple() {
    const websiteUrl = `https://maplestory.nexon.com/News/Event/Ongoing`;
  
    const response1 = await get(websiteUrl);
    const $ = load(response1.data);
  
    // 'ul' 요소 내에 있는 'li' 요소를 선택
    let listItems = $('#container div.contents_wrap div.today_event div div ul li');
  
    // 'li' 요소 중 '썬데이 메이플' 텍스트를 포함하는 요소만 선택
    let sundayMapleItems = listItems.filter((i, el) => {
      return $(el).text().includes('썬데이 메이플');
    });
  
    // '썬데이 메이플' 항목이 없으면 null을 반환
    if (sundayMapleItems.length === 0) {
      return null;
    }
  
    // 첫 번째 '썬데이 메이플' 항목의 링크를 가져옴
    let hyperlink = $(sundayMapleItems[0]).find('a').attr('href');
    hyperlink = _resolve(websiteUrl, hyperlink);
  
    const response2 = await get(hyperlink);
    const $$ = load(response2.data);
  
    // 경로를 업데이트합니다
    const imageSrc = $$('#container div.contents_wrap div.qs_text div div:nth-child(1) div img').attr('src');
  
    const sundayMapleInfo = {
      image: null
    };
  
    try {
      const uploadedImageURL = await uploadImageToFirebase(imageSrc, "sundayInfo");
      if (uploadedImageURL !== null) {
        sundayMapleInfo.image = uploadedImageURL;
        console.log('이미지가 저장되었습니다.');
      } else {
        console.log('이미지 저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('이미지 업로드 중 오류가 발생했습니다:', error);
    }
  
    return sundayMapleInfo;
  }
  
  

async function uploadImageToFirebase(imageUrl, sunday) {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha256');
    hash.update(sunday);
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

app.listen(port, () => {
  console.log(`App is listening at http://localhost:${port}`);
});
