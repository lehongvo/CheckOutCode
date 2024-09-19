const axios = require('axios');

// Hàm để gọi API
async function callApi() {
    let config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: 'https://poker-admin-be-dev.esports-bet.io/api/v1/sub-admins',
        headers: {
            'accept': '*/*',
            'accept-language': 'vi-VN,vi;q=0.9,fr-FR;q=0.8,fr;q=0.7,en-US;q=0.6,en;q=0.5,ja;q=0.4',
            'authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2YjFlOGE5MmNiNTkxZThkZDExODE2NyIsImlhdCI6MTcyNjQ1NTIyOCwiZXhwIjoxNzM0MjMxMjI4fQ.Y9Yrxbej62ZTN7YXaHG4gX9Eqzqs_APoL2ObFq58I5Y',
            'cache-control': 'no-cache',
            'origin': 'http://192.168.150.57:8080',
            'pragma': 'no-cache',
            'priority': 'u=1, i',
            'referer': 'http://192.168.150.57:8080/',
            'sec-ch-ua': '"Chromium";v="128", "Not;A=Brand";v="24", "Google Chrome";v="128"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'cross-site',
            'timezone': '7',
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
            'Cookie': 'jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2ZGU1ZTZkMDk1MmVkMDAyNzI1MjkzMyIsImlhdCI6MTcyNTg1NzMyNiwiZXhwIjoxNzMzNjMzMzI2fQ.-0QxfgUR5qaMM2gwwEGkblycKPWeMIiB-QUKn9tVt8A'
        }
    };

    try {
        const response = await axios.request(config);
        console.log(JSON.stringify(response.data));
    } catch (error) {
        console.error(error);
    }
}

// Loop gọi API 10 lần
async function callApiMultipleTimes() {
    for (let i = 0; i < 100000; i++) {
        console.log(`=============> Call attempt: ${i + 1}\n`);
        console.log(`Call attempt: ${i + 1}`);
        await callApi();

        // Thêm thời gian trễ giữa các lần gọi nếu cần, ở đây là 1 giây (1000ms)
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log(`=============> Call attempt: ${i + 1}\n`);
    }
}

callApiMultipleTimes();
unlimit