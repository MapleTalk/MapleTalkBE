const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');
const url = require('url'); // 'url' 모듈 불러오기 추가

const app = express();
const port = 3002;

app.use(cors()); // CORS 설정

// GET 요청 처리
app.get('/chat', async (req, res) => {
  const message = req.query.message;

  if (message.startsWith('!')) {
    const command = message.split(' ')[0];
    const param = message.substring(command.length + 1);

    let response;
    if (command === '!정보') {
      // character 정보 가져오기
      response = await getUserInfo(param);
    } else if (command === '!길드') {
      response = '길드 정보 요청';
    } else {
      response = '잘못된 명령입니다.';
    }

    // 결과 반환
    res.json({ reply: response }); // response를 직접 반환
  } else {
    res.json({ reply: '잘못된 명령입니다.' });
  }
});

// 유저데이터를 가져오는 함수
async function getUserInfo(character) {
  const websiteUrl = `https://maplestory.nexon.com/N23Ranking/World/Total?c=${encodeURIComponent(character)}`;

  try {
    // 첫 번째 요청으로 페이지 접근
    const response1 = await axios.get(websiteUrl);
    const $ = cheerio.load(response1.data);

    // 해당 테이블 구조에서 a 태그의 href 속성을 찾습니다.
    let hyperlink = $('tr.search_com_chk dl dt a').attr('href');

    // 절대 URL을 보장하기 위해 url.resolve 사용
    hyperlink = url.resolve(websiteUrl, hyperlink);

    // 찾은 하이퍼링크로 두 번째 요청 보내기
    const response2 = await axios.get(hyperlink);
    const $$ = cheerio.load(response2.data);

    // 두 번째 요청의 결과에서 'dd' 태그를 통해 필요한 정보 추출
    const levelData = $$('div.char_info dl:nth-child(1) dd').text().trim();
    const jobData = $$('div.char_info dl:nth-child(2) dd').text().trim();
    const worldData = $$('div.char_info dl:nth-child(3) dd').text().trim();

    // 추출한 정보를 객체로 반환
    return {
      nickname: character,
      level: levelData,
      job: jobData,
      world: worldData
    };
  } catch (error) {
    console.error('Error:', error);
    return '웹 스크래핑 실패';
  }
}

// 웹 서버 시작
app.listen(port, () => {
  console.log(`Chatbot listening at http://localhost:${port}`);
});
