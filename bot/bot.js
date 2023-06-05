const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

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
      response = await getUserInfo(param);
    } else if (command === '!길드') {
      response = await getGuildInfo(param);
    } else {
      response = '잘못된 명령입니다.';
    }
    res.json({ 
      reply: {
        nickname: character,
        level: levelData,
        job: jobData,
        world: worldData
      }
    });
  } else {
    res.json({ reply: '잘못된 명령입니다.' });
  }
});

// 유저데이터를 가져오는 함수
async function getUserInfo(character) {
  try {
    const websiteUrl = `https://maple.gg/u/${character}`;

    const response = await axios.get(websiteUrl);
    const html = response.data;

    const $ = cheerio.load(html);

    // 원하는 데이터를 추출하는 로직을 구현합니다.
    const levelData = $('#user-profile > section > div.row.row-normal > div.col-lg-8 > div > div.user-summary > ul > li:nth-child(1)').text().trim();
    const jobData = $('#user-profile > section > div.row.row-normal > div.col-lg-8 > div > div.user-summary > ul > li:nth-child(2)').text().trim();
    const mureung = $('#app > div.card.border-bottom-0 > div > section > div.row.text-center > div:nth-child(1) > section > div > div.pt-4.pt-sm-3.pb-4 > div > h1').text().trim();

    return `닉네임: ${character}\n레벨: ${levelData}\n직업: ${jobData}\n무릉: ${mureung}`;
  } catch (error) {
    console.log('Error:', error);
    return '웹 스크래핑 실패';
  }
}

// 웹 서버 시작
app.listen(port, () => {
  console.log(`Chatbot listening at http://localhost:${port}`);
});
