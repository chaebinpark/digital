const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const fs = require('fs');
const app = express();

// 환경 변수에서 포트 가져오기 (기본값 8080)
const PORT = process.env.PORT || 8080;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'web')));
app.use('/build', express.static(path.join(__dirname, 'web', 'build')));

app.listen(PORT, function() {
    console.log(`Listening on port ${PORT}`);
});

// 기본 페이지 요청을 index.html로 수정
app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname, 'web', 'index.html')); // index.html로 변경
});

// 응답 데이터를 TXT 파일에 저장하는 엔드포인트
app.post('/submit-response', (req, res) => {
    const responseData = req.body;

    const responseText = `질문: ${responseData.question}, 응답: ${responseData.response}\n`;

    fs.appendFile('responses.txt', responseText, (err) => {
        if (err) {
            return res.status(500).json({ error: '서버 오류: 응답 저장 실패' });
        }
        res.json({ message: '응답이 저장되었습니다.' });
    });
});

// 도미노 정보를 JSON 형식으로 저장하는 엔드포인트
app.post('/submit-all-responses', (req, res) => {
    const { responses, dominoes } = req.body;

    const responsePromises = responses.map(responseData => {
        const responseText = `질문: ${responseData.question}, 응답: ${responseData.response}\n`;
        return new Promise((resolve, reject) => {
            fs.appendFile('responses.txt', responseText, (err) => {
                if (err) {
                    reject('서버 오류: 응답 저장 실패');
                } else {
                    resolve();
                }
            });
        });
    });

    // 도미노 정보를 JSON 파일로 저장
    fs.writeFile('dominoes.json', JSON.stringify(dominoes, null, 2), (err) => {
        if (err) {
            return res.status(500).json({ error: '서버 오류: 도미노 저장 실패' });
        }
        Promise.all(responsePromises)
            .then(() => {
                res.json({ message: '모든 응답이 저장되었습니다.' });
            })
            .catch((error) => {
                res.status(500).json({ error: error });
            });
    });
});

// 도미노 정보를 로드하는 엔드포인트
app.get('/load-dominoes', (req, res) => {
    fs.readFile('dominoes.json', 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: '서버 오류: 도미노 로드 실패' });
        }
        try {
            const dominoes = JSON.parse(data);
            res.json(dominoes);
        } catch (parseError) {
            res.status(500).json({ error: '서버 오류: 도미노 데이터 파싱 실패' });
        }
    });
});
