const express = require('express');
const app = express();

// GET API 엔드포인트 설정
app.get('/api/users', (req, res) => {
  // 데이터베이스에서 사용자 목록을 가져오는 로직 또는 다른 작업을 수행합니다.
  // 예를 들어, 가상의 사용자 목록을 반환하는 경우:
  const users = [
    { id: 1, name: 'John Doe' },
    { id: 2, name: 'Jane Smith' },
    { id: 3, name: 'Bob Johnson' }
  ];

  // 사용자 목록을 JSON 형식으로 반환합니다.
  res.json(users);
});

// 서버 시작
const port = 3000;
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
