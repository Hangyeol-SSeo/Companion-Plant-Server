const axios = require('axios');

const SERVER_URL = 'http://52.79.76.194:3000/inbound';

async function sendData(username, plantname) {
    try {
        const response = await axios.post(SERVER_URL, {
            username: username,
            //plantname: plantname
        });

        console.log('Data sent successfully:', response.data);
    } catch (error) {
        console.error('Error sending data:', error);
    }
}

// 테스트 데이터로 서버에 전송
sendData('hangyeol', 'skin');
