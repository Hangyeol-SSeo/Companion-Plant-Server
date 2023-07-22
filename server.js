/*
 * 접속방법
 * cd ~
 * chmod 600 .ssh/Com~.pem
 * ssh -i .ssh/Com~.pem ubuntu@52.79.76.194
 */

const express = require('express');
const mysql = require('mysql');
const path = require('path');
const app = express();
const port = 3000;

// MySQL 데이터베이스 연결 정보 설정
const connection = mysql.createConnection({
    host: 'localhost',    // MySQL 서버 주소
    user: 'root',     // 사용자 이름
    password: 'dltprPdkdlehf', // 비밀번호
    database: 'Plant_Database'     // 데이터베이스 이름
});

app.get('/inbound', (req, res, next) => {
    /*
     * request type: JSON
     * request instance: 이름, 시간, 온도, 습도, 토양습도, 조도
     */

    // 연결 시작
    connection.connect((err) => {
        if (err) { next(err); }
        console.log('Connected to database.');
    });

    // 유저와 식물 정보 가져오기
    console.log(req);
    //ver username =
    //ver plantname =

    // 데이터 저장
    connection.query('SELECT * ' +
        'FROM plant_environment_data ped ' +
        'JOIN plants p ON ped.plant_id = p.plant_id ' +
        'JOIN users u ON p.user_id = u.user_id ' +
        `WHERE u.username = ${username} AND p.plant_name = ${plantname} ` +
        'ORDER BY ped.recorded_time DESC LIMIT 100;', (error, results, fields) => {
        if (error) { next(err); }
        console.log('Results: ', results);

        // 연결 종료
        connection.end();
    });

    res.status(200).send('Database save complete!');
});

app.post('/outbound', (req, res, next) => {
    onnection.connect((err) => {
        if (err) { next(err); }
        console.log('Connected to database.');
    });

    res.status(200).send('outbound success!');
});

app.use((req, res, next) => {
    res.status(404).send("404 Something broke!");
});

app.use(function (err, req, res, next) {
    console.error(err.stack);
    res.status(500).send("500 Something broke!");
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Server is running on port ${port}`);
});
