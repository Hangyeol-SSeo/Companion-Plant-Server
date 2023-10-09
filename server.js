/*
 * 접속방법
 * cd ~
 * chmod 600 .ssh/Com~.pem
 * ssh -i .ssh/Com~.pem ubuntu@52.79.76.194
 */

const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const converter = require('./uuidConverter');
const {uuidToBytes} = require("./uuidConverter");

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Global variables
var isLightOn;

// MySQL 데이터베이스 연결 정보 설정
// const connection = mysql.createConnection({
//     host: 'localhost',    // MySQL 서버 주소
//     user: 'root',     // 사용자 이름
//     password: 'dltprPdkdlehf', // 비밀번호
//     database: 'plant_db' // 데이터베이스 이름
// });
const pool = mysql.createPool({
    connectionLimit: 10, // 동시에 사용될 최대 연결 수
    host: 'localhost',
    user: 'root',
    password: 'dltprPdkdlehf',
    database: 'plant_db'
});

/*
--------------------- Android ---------------------
 */

app.post('/newuser', (req, res, next) => {
    /*
    * request device: android
    * func: 앱에서 지정한 유저 이름을 users에 저장
    * response: 200 -> Json(id, String), error -> String
    */
    const data = req.query;
    console.log(data);
    const username = data.username;
    if(username === undefined) {
        return res.status(400).send('username is required.');
    }

    const query = 'INSERT INTO users (user_name) VALUES (?)';

    pool.query(query, [username], (err, result) => {
        if (err) {
            // 중복된 username 때문에 오류가 발생한 경우
            if (err.code === 'ER_DUP_ENTRY') {
                // 해당 user_name에 대한 user_id를 조회
                pool.query('SELECT user_id FROM users WHERE user_name = ?', [username], (error2, results2) => {
                    if (error2) {
                        console.error('Error fetching user id:', error2);
                        res.status(500).send('Error fetching user id from the database');
                    } else {
                        let userId = results2[0].user_id;
                        res.status(200).json({
                            message: 'User already exists',
                            id: userId
                        });
                    }
                });
            } else {
                // 그 외의 오류
                res.status(500).send('Error inserting username into the database');
            }
        } else {
            // INSERT 성공
            res.status(200).json({
                message: 'Username successfully added!',
                id: result.insertId
            });
        }
    });
});


app.post('/newplant', (req, res, next) => {
    /*
     * request device: android
     * func: userId와 plantname을 plants에 저장
     * response: 200 -> Json(id, String), error -> String
     */
    const data = req.query;

    const userId = data.userId;
    const plantId = data.plantId; // string format
    const plantname = data.plantname;
    if (userId === undefined || plantname === undefined) {
        return res.status(400).send('Both "userid" and "plantname" are required.');
    }

    // Convert the string format plantId to a byte array
    const plantIdBytes = converter.uuidToBytes(plantId);

    // Insert the new plant for the user
    pool.query('INSERT INTO plants (plant_id, plant_name, user_id) VALUES (?, ?, ?)', [plantIdBytes, plantname, userId], (error, results, fields) => {
        if (error) {
            console.error('Error inserting plant:', error);
            res.status(500).send('Error inserting plant into the database');
        } else {
            console.log(userId, plantId, plantname);
            res.status(200).json({
                message: 'Plant successfully added!',
                id: plantId
            });
        }
    });
});

app.post('/rmplant', (req, res, next) => {
    /*
     * request device: android
     * func: plantId를 받아 plant를 삭제
     * response: 200 -> Json(id, String), error -> String
     */
    const data = req.query;

    const plantId = data.plantId;
    if (plantId === undefined) {
        return res.status(400).send('"plantId" is required.');
    }
    const plantIdBytes = converter.uuidToBytes(plantId);

    // remove plant from database
    pool.query('DELETE FROM plants WHERE (plant_id) = ?', [plantIdBytes], (error, results, fields) => {
        if (error) {
            console.error('Error removing plant:', error);
            res.status(500).send('Error remove plant from the database');
        } else {
            console.log(plantId);
            res.status(200).json({
                message: 'Plant successfully removed!',
                id: plantId
            });
        }
    });
});

app.post('/state', (req, res, next) => {
    /*
     * request device: android
     * func: 식물 생장 빛 on, off 여부 확인 및 저장
     * response: 200 -> x, error -> String
     */
    const data = req.query;

    const isChecked = data.status;
    if (isChecked === undefined) {
        return res.status(400).send('No status');
    }
    console.log(isChecked);
    isLightOn = isChecked;
});

app.get('/data', (req, res, next) => {
    /*
     * request device: android
     * func: 지정한 식물 환경 데이터를 android device로 전달
     * response: 200 -> Json, error -> String
     */
    const data = req.query;

    // 유저와 식물 정보 가져오기
    const plantId = data.plantId;

    if (plantId === undefined) {
        return res.status(400).send('"plantId" is required.');
    }
    const plantIdBytes = converter.uuidToBytes(plantId);

    const query = `
        SELECT temperature, humidity, soil_moisture, light_intensity, recorded_time
        FROM plant_environment_data
        WHERE plant_id = ?
        ORDER BY recorded_time DESC LIMIT 1
    `;


    pool.query(query, plantIdBytes, (error, results, fields) => {
        if (error) {
            console.error("Database connection error:", error);
            return next(error);
        } else {
            const result = results[0];
            console.log(result.temperature);
            res.status(200).json({
                temperature: result.temperature,
                humidity: result.humidity,
                soil_moisture: result.soil_moisture,
                light_intensity: result.light_intensity,
                recorded_time: result.recorded_time
            });
        }
    });
});

/*
--------------------- Raspberry Pi ---------------------
 */

app.post('/data', (req, res, next) => {
    /*
     * request device: raspberry PI
     * request type: JSON
     * request instance: 이름, 시간, 온도, 습도, 토양습도, 조도
     *
     * func: instance 저장
     * response: x
     */
    const data = req.body;

    // 유저와 식물 정보 가져오기
    const plantId = data.plantId;

    if (plantId === undefined) {
        return res.status(400).send('"plantId" is required.');
    }

    const query = `
        INSERT INTO plant_environment_data
            (plant_id, temperature, humidity, soil_moisture, light_intensity, light_retention_time)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    // TODO: 라즈베리파이에서 ligtt hours 변수명 조정하기
    // TODO: emotion값 전달?
    const values = [
        uuidToBytes(plantId),
        data.temperature,
        data.humidity,
        data.soil_moisture,
        data.light_intensity,
        `${data.light_hours}:${data.light_min}:${data.light_sec}`
    ];l

    pool.query(query, values, (error, results, fields) => {
        if (error) {
            console.error("Database connection error:", error);
            return next(error);
        }

        res.status(200).send('Database save complete!');
    });
});


app.get('/state', (req, res, next) => {
    // isLightOn 값 전달
    res.send(isLightOn);
});

app.use(function (err, req, res, next) {
    console.error(err.stack);
    res.status(500).send("500 Something broke!");
});

app.use((req, res, next) => {
    res.status(404).send("404 Something broke!");
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Server is running on port ${port}`);
});
