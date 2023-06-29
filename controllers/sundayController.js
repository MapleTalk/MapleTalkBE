const { createHash } = require('crypto');
const { getFirestore } = require('../firebase.js');

const firestore = getFirestore();

async function getSundayInfo(sunday) { 
    const hash = crypto.createHash('sha256');
    hash.update(sunday);
    const docId = hash.digest('hex');
  
    let doc = await db.collection('sundayInfo').doc(docId).get();
    if (doc.exists) {
      console.log("문서가 존재하여 파이어베이스에서 받아옴");
      return doc.data();
    } else {
      const sundayInfo = await scrapeSundayMaple(sunday);
      if (!sundayInfo) {
        console.log("해당 정보를 찾을 수 없습니다.");
        return null;
      }
      await db.collection('sundayInfo').doc(docId).set(sundayInfo);
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

async function scrapeSundayMaple(sunday) {
    const websiteUrl = `https://maplestory.nexon.com/News/Event/Ongoing`;
  
    const response1 = await axios.get(websiteUrl);
    const $ = cheerio.load(response1.data);
  
    let listItems = $('#container div.contents_wrap div.today_event div div ul li');
  
    let sundayMapleItems = listItems.filter((i, el) => {
      return $(el).text().includes(sunday);
    });
  
    if (sundayMapleItems.length === 0) {
      return null;
    }
  
    let hyperlink = $(sundayMapleItems[0]).find('a').attr('href');
    hyperlink = url.resolve(websiteUrl, hyperlink);
  
    const response2 = await axios.get(hyperlink);
    const $$ = cheerio.load(response2.data);
  
    const imageSrc = $$('#container div.contents_wrap div.qs_text div div:nth-child(1) div img').attr('src');
  
    const sundayMapleInfo = {
      image: null
    };
  
    try {
      const uploadedImageURL = await uploadImageToFirebase(imageSrc, sunday);
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
    const hash = crypto.createHash('sha256');
    hash.update(sunday);
    const fileName = hash.digest('hex');
    const bucket = storage.bucket('mapletalk-c0c99.appspot.com');
    const file = bucket.file(`sundayInfo/${fileName}`);
    const writeStream = file.createWriteStream();

    axios.get(imageUrl, { responseType: 'stream' })
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

module.exports = {
    getInfo,
};