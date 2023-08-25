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

const app = express();

const port = 3000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

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
    console.log(data);
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
            res.status(200).json({
                message: 'Plant successfully added!',
                id: plantId
            });
        }
    });
});


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
    const plantname = data.plantname;

    if (plantname === undefined) {
        return res.status(400).send('"plantname" is required.');
    }

    // 1. Fetch the plant_id based on the given plantname
    pool.query('SELECT plant_id FROM plants WHERE plant_name = ?', [plantname], (error, results, fields) => {
        if (error) {
            console.error("Database connection error:", error);
            return next(error);
        }

        // If the plant doesn't exist, send an error response.
        if (results.length === 0) {
            return res.status(400).send('Plant does not exist.');
        }

        // The plant exists, so grab the plant_id
        const plantId = results[0].plant_id;

        // 2. Insert the environment data for the plant
        const query = `
            INSERT INTO plant_environment_data 
            (plant_id, temperature, humidity, soil_moisture, light_intensity) 
            VALUES (?, ?, ?, ?, ?)
        `;

        const values = [
            plantId,
            data.temperature,
            data.humidity,
            data.soil_moisture,
            data.light_intensity,
        ];

        pool.query(query, values, (error, results, fields) => {
            if (error) {
                console.error("Database connection error:", error);
                return next(error);
            }

            res.status(200).send('Database save complete!');
        });
    });
});


app.post('/state', (req, res, next) => {

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
