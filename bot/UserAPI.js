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
//12

initializeApp({
  credential: _credential.cert(serviceAccount)
});

let db = firestore();

const storage = new Storage({
  projectId: 'mapletalk-c0c99',
  keyFilename: '../config/serviceAccountKey.json'
});

app.use(cors());

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
        await docRef.set({ id, email, name });
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
